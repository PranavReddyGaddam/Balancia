from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal

class BillItem(BaseModel):
    id: str
    name: str
    quantity: float
    price: Decimal
    is_taxable: bool = True

class Person(BaseModel):
    id: str
    name: str

class AllocationRule(BaseModel):
    id: str
    rule: str
    person_id: str
    item_name: Optional[str] = None
    quantity: Optional[float] = None
    type: str = Field(..., description="Type of allocation: specific, shared, or exclusive")

class PersonAllocation(BaseModel):
    person_id: str
    person_name: str
    items: List[dict]
    subtotal: Decimal
    tax_share: Decimal
    tip_share: Decimal
    total: Decimal

class OCRRequest(BaseModel):
    image_url: Optional[str] = None

class OCRResponse(BaseModel):
    text: str
    confidence: float
    items: List[BillItem]

class AllocationRequest(BaseModel):
    items: List[BillItem]
    people: List[Person]
    rules: List[AllocationRule]
    tax_rate: float = Field(default=0.08, ge=0, le=1)
    tip_rate: float = Field(default=0.18, ge=0, le=1)
    grand_total: Decimal

class AllocationResponse(BaseModel):
    allocations: List[PersonAllocation]
    total_calculated: Decimal
    total_expected: Decimal
    difference: Decimal

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
