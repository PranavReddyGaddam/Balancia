import io
import re
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, List, Any
from app.core.config import settings

class OCRService:
    def __init__(self):
        # Initialize Amazon Textract client
        self.textract_client = None
        try:
            # Debug: Check if AWS credentials are loaded
            aws_key = settings.AWS_ACCESS_KEY_ID
            aws_secret = settings.AWS_SECRET_ACCESS_KEY
            print(f"🔍 AWS Key loaded: {'Yes' if aws_key and aws_key.strip() else 'No'}")
            print(f"🔍 AWS Secret loaded: {'Yes' if aws_secret and aws_secret.strip() else 'No'}")
            
            if aws_key and aws_key.strip():
                self.textract_client = boto3.client(
                    'textract',
                    aws_access_key_id=aws_key,
                    aws_secret_access_key=aws_secret,
                    region_name=settings.AWS_REGION
                )
                print("✅ Amazon Textract client initialized")
            else:
                print("⚠️ AWS credentials not configured")
        except Exception as e:
            print(f"⚠️ Failed to initialize Textract client: {str(e)}")
    
    async def extract_text(self, file) -> Dict[str, Any]:
        """
        Extract text from an uploaded image file using Amazon Textract
        """
        try:
            # Read the uploaded file properly
            print(f"🔍 Processing file: {file.filename}, type: {file.content_type}")
            
            # Read file content
            image_data = await file.read()
            print(f"🔍 File size: {len(image_data)} bytes")
            
            # Validate that we have data
            if not image_data:
                raise Exception("No image data received")
            
            # Skip PIL validation - let AWS Textract handle the image format
            print("🔍 Sending raw image data to AWS Textract")
            
            # Extract text using Amazon Textract
            text = await self._extract_text_with_textract(image_data)
            if text:
                print("✅ Text extracted using Amazon Textract")
                print(f"🔍 Extracted text length: {len(text)} characters")
            else:
                print("⚠️ No text extracted from image")
                text = ""
            
            # Parse the text to find items using regex
            items = self._parse_receipt_text_fallback(text)
            print(f"🔍 Parsed {len(items)} items from text")
            
            # Calculate confidence (simplified)
            confidence = 0.85 if text else 0.0
            
            return {
                'text': text,
                'confidence': confidence,
                'items': items
            }
        
        except Exception as e:
            print(f"❌ OCR processing error: {str(e)}")
            raise Exception(f"OCR processing failed: {str(e)}")

    def _parse_receipt_text_fallback(self, text: str) -> List[Dict[str, Any]]:
        """
        Parse receipt text using regex patterns to extract bill items
        """
        lines = text.split('\n')
        items = []
        item_dict = {}  # To combine duplicate items
        
        # Skip common non-item lines
        skip_words = ['total', 'subtotal', 'tax', 'tip', 'amount', 'change', 'cash', 'card', 
                     'store', 'cashier', 'order', 'free', 'delivery', 'number', 'savings', 
                     'points', 'trx', 'term', 'rtns', 'exch', 'final', 'days']
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue
            
            # Skip header lines and non-item lines
            if any(word in line.lower() for word in skip_words):
                i += 1
                continue
            
            # Look for item name followed by price on next line
            item_name = line
            price = 0
            quantity = 1
            
            # Check if next line has price
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                # Pattern: "16.99 F" or "6.49 F"
                price_match = re.match(r'^(\d+\.?\d*)\s*F?$', next_line)
                if price_match:
                    price = float(price_match.group(1))
                    i += 2  # Skip both lines
                else:
                    i += 1
            else:
                i += 1
            
            # Skip if no valid price found
            if price <= 0:
                continue
            
            # Clean up item name
            item_name = ' '.join(item_name.split())
            
            # Skip if item name is too short or contains skip words
            if len(item_name) < 3 or any(word in item_name.lower() for word in skip_words):
                continue
            
            # Combine duplicate items
            if item_name in item_dict:
                item_dict[item_name]['quantity'] += quantity
            else:
                item_dict[item_name] = {
                    'name': item_name,
                    'quantity': quantity,
                    'price': price,
                    'is_taxable': True
                }
        
        return list(item_dict.values())
    
    async def _extract_text_with_textract(self, image_data: bytes) -> str:
        """
        Extract text using Amazon Textract
        """
        if not self.textract_client:
            print("❌ Textract client not initialized")
            return ""
        
        try:
            print(f"🔍 Sending {len(image_data)} bytes to AWS Textract")
            
            # Call Amazon Textract
            response = self.textract_client.detect_document_text(
                Document={'Bytes': image_data}
            )
            
            print(f"🔍 Textract response received: {len(response.get('Blocks', []))} blocks")
            
            # Extract text from response
            text_blocks = []
            for block in response['Blocks']:
                if block['BlockType'] == 'LINE':
                    text_blocks.append(block['Text'])
            
            extracted_text = '\n'.join(text_blocks)
            print(f"🔍 Extracted {len(text_blocks)} text lines")
            
            return extracted_text
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            print(f"❌ AWS Textract ClientError: {error_code} - {error_message}")
            
            if error_code == 'InvalidParameterException':
                return ""
            elif error_code == 'AccessDeniedException':
                print("❌ AWS credentials or permissions issue")
                return ""
            else:
                print(f"❌ AWS Textract error: {error_code}")
                return ""
        except NoCredentialsError:
            print("❌ AWS credentials not found")
            return ""
        except Exception as e:
            print(f"❌ Unexpected Textract error: {str(e)}")
            return ""
    
    async def is_available(self) -> bool:
        """
        Check if OCR service is available
        """
        return self.textract_client is not None
