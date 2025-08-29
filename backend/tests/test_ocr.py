import pytest
from app.services.ocr_service import OCRService

@pytest.fixture
def ocr_service():
    return OCRService()

def test_parse_receipt_text():
    """Test parsing receipt text"""
    service = OCRService()
    
    # Test text with items
    text = """
    Chapati    5  $2.50
    Paneer Tikka    1  $12.99
    Dal Makhani    1  $8.99
    Rice    1  $3.99
    Total: $35.46
    """
    
    items = service._parse_receipt_text(text)
    
    assert len(items) == 4
    assert items[0]['name'] == 'Chapati'
    assert items[0]['quantity'] == 5
    assert items[0]['price'] == 2.50

def test_parse_receipt_text_with_skip_words():
    """Test that skip words are properly filtered"""
    service = OCRService()
    
    text = """
    Chapati    5  $2.50
    Total: $35.46
    Tax: $2.84
    Tip: $6.38
    """
    
    items = service._parse_receipt_text(text)
    
    assert len(items) == 1
    assert items[0]['name'] == 'Chapati'
    # Total, Tax, Tip should be skipped
