from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import OCRResponse, BillItem
from app.services.ocr_service import OCRService
import uuid

router = APIRouter()
ocr_service = OCRService()

@router.post("/extract", response_model=OCRResponse)
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extract text and items from a receipt image using OCR
    """
    # Debug: Log file information
    print(f"🔍 Received file: {file.filename}")
    print(f"🔍 Content type: {file.content_type}")
    print(f"🔍 File size: {file.size if hasattr(file, 'size') else 'unknown'}")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Process the image with OCR
        result = await ocr_service.extract_text(file)
        
        # Convert items to BillItem models
        items = []
        for item in result['items']:
            items.append(BillItem(
                id=str(uuid.uuid4()),
                name=item['name'],
                quantity=item['quantity'],
                price=item['price'],
                is_taxable=item['is_taxable']
            ))
        
        return OCRResponse(
            text=result['text'],
            confidence=result['confidence'],
            items=items
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@router.get("/health")
async def ocr_health_check():
    """
    Check if OCR service is available
    """
    try:
        is_available = await ocr_service.is_available()
        return {"status": "available" if is_available else "unavailable"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
