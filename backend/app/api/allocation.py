from fastapi import APIRouter, HTTPException
from app.models.schemas import AllocationRequest, AllocationResponse, PersonAllocation
from app.services.allocation_service import AllocationService
from decimal import Decimal

router = APIRouter()
allocation_service = AllocationService()

@router.post("/calculate", response_model=AllocationResponse)
async def calculate_allocation(request: AllocationRequest):
    """
    Calculate bill splits based on items, people, and allocation rules
    """
    try:
        # Debug: Log the request data
        print(f"🔍 Allocation Request:")
        print(f"  Items: {len(request.items)} items")
        print(f"  People: {len(request.people)} people")
        print(f"  Rules: {len(request.rules)} rules")
        print(f"  Tax Rate: {request.tax_rate}")
        print(f"  Tip Rate: {request.tip_rate}")
        print(f"  Grand Total: {request.grand_total}")
        
        # Convert Pydantic models to service format
        items = [item.dict() for item in request.items]
        people = [person.dict() for person in request.people]
        rules = [rule.dict() for rule in request.rules]
        
        # Calculate allocations
        result = allocation_service.calculate_allocations(
            items=items,
            people=people,
            rules=rules,
            tax_rate=request.tax_rate,
            tip_rate=request.tip_rate,
            grand_total=float(request.grand_total)
        )
        
        # Convert results to response format
        allocations = []
        for allocation in result['allocations']:
            allocations.append(PersonAllocation(
                person_id=allocation['person_id'],
                person_name=allocation['person_name'],
                items=allocation['items'],
                subtotal=Decimal(str(allocation['subtotal'])),
                tax_share=Decimal(str(allocation['tax_share'])),
                tip_share=Decimal(str(allocation['tip_share'])),
                total=Decimal(str(allocation['total']))
            ))
        
        return AllocationResponse(
            allocations=allocations,
            total_calculated=Decimal(str(result['total_calculated'])),
            total_expected=request.grand_total,
            difference=Decimal(str(result['difference']))
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allocation calculation failed: {str(e)}")

@router.post("/parse-rules")
async def parse_natural_language_rules(rules: list[str], people: list[str]):
    """
    Parse natural language rules into structured format
    """
    try:
        parsed_rules = await allocation_service.parse_natural_language_rules(rules, people)
        return {"parsed_rules": parsed_rules}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Rule parsing failed: {str(e)}")
