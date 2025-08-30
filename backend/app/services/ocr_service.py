import io
import re
import json
import base64
from openai import OpenAI
from typing import Dict, List, Any
from app.core.config import settings

class OCRService:
    def __init__(self):
        # Initialize OpenAI client
        self.openai_client = None
        try:
            api_key = settings.OPENAI_API_KEY
            if api_key and api_key != "OPENAI_API_KEY":
                self.openai_client = OpenAI(api_key=api_key)
                print("✅ OpenAI client initialized successfully")
            else:
                print("⚠️ OpenAI API key not configured")
        except Exception as e:
            print(f"⚠️ Failed to initialize OpenAI client: {str(e)}")
    
    async def extract_text(self, file) -> Dict[str, Any]:
        """
        Extract text and items from an uploaded image file using GPT-4 Vision
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
            
            # Extract text and items using GPT-4 Vision
            result = await self._extract_with_vision_model(image_data)
            
            return result
        
        except Exception as e:
            print(f"❌ Vision model processing error: {str(e)}")
            raise Exception(f"Vision model processing failed: {str(e)}")

    async def _extract_with_vision_model(self, image_data: bytes) -> Dict[str, Any]:
        """
        Extract text and items using GPT-4 Vision
        """
        if not self.openai_client:
            print("❌ OpenAI client not initialized")
            return {
                'text': '',
                'confidence': 0.0,
                'items': []
            }
        
        try:
            # Encode image to base64
            base64_image = base64.b64encode(image_data).decode("utf-8")
            print(f"🔍 Image encoded to base64: {len(base64_image)} characters")
            
            # Call GPT-4 Vision
            response = self.openai_client.chat.completions.create(
                model="gpt-5",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Extract all items from this receipt. For each item, provide: name, quantity, and price. 
                                Return the result as a JSON array with this exact structure: 
                                [{"name": "item name", "quantity": 1, "price": 10.99, "is_taxable": true}]
                                
                                Rules:
                                - Only return the JSON array, no other text
                                - Use exact item names from the receipt
                                - Set quantity to 1 if not specified
                                - Extract price as a number (no currency symbols)
                                - Set is_taxable to true for all items
                                - Skip non-item lines like totals, taxes, etc."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            # Extract the response
            response_text = response.choices[0].message.content
            print(f"🔍 Vision model response: {len(response_text)} characters")
            
            # Parse JSON response
            try:
                items = json.loads(response_text)
                print(f"✅ Successfully parsed {len(items)} items from vision model")
                
                return {
                    'text': 'Receipt processed by GPT-4 Vision',
                    'confidence': 0.95,
                    'items': items
                }
                
            except json.JSONDecodeError as json_error:
                print(f"⚠️ JSON parsing error: {json_error}")
                print(f"🔍 Raw response: {response_text}")
                
                # Fallback to regex parsing if JSON fails
                items = self._parse_receipt_text_fallback(response_text)
                return {
                    'text': response_text,
                    'confidence': 0.7,
                    'items': items
                }
            
        except Exception as e:
            print(f"❌ Vision model error: {str(e)}")
            return {
                'text': '',
                'confidence': 0.0,
                'items': []
            }
    
    def _parse_receipt_text_fallback(self, text: str) -> List[Dict[str, Any]]:
        """
        Fallback method using regex patterns to extract bill items
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
    
    async def is_available(self) -> bool:
        """
        Check if vision model service is available
        """
        return self.openai_client is not None
