import pytest
from app.services.allocation_service import AllocationService

@pytest.fixture
def allocation_service():
    return AllocationService()

def test_parse_natural_language_rules():
    """Test parsing natural language rules"""
    service = AllocationService()
    
    rules = [
        "Everyone shares 5 chapatis",
        "Only Alice takes paneer",
        "Carol takes 2 chapatis"
    ]
    people = ["Alice", "Bob", "Carol"]
    
    parsed_rules = service.parse_natural_language_rules(rules, people)
    
    assert len(parsed_rules) == 5  # 3 from everyone shares + 1 exclusive + 1 specific
    
    # Check everyone shares rule
    shared_rules = [r for r in parsed_rules if r['type'] == 'shared']
    assert len(shared_rules) == 3
    assert all(r['item_name'] == 'chapatis' for r in shared_rules)
    assert all(r['quantity'] == 5 for r in shared_rules)
    
    # Check exclusive rule
    exclusive_rules = [r for r in parsed_rules if r['type'] == 'exclusive']
    assert len(exclusive_rules) == 1
    assert exclusive_rules[0]['person_name'] == 'alice'
    assert exclusive_rules[0]['item_name'] == 'paneer'
    
    # Check specific rule
    specific_rules = [r for r in parsed_rules if r['type'] == 'specific']
    assert len(specific_rules) == 1
    assert specific_rules[0]['person_name'] == 'carol'
    assert specific_rules[0]['item_name'] == 'chapatis'
    assert specific_rules[0]['quantity'] == 2

def test_calculate_allocations():
    """Test allocation calculation"""
    service = AllocationService()
    
    items = [
        {'id': '1', 'name': 'Chapati', 'quantity': 5, 'price': 2.50, 'is_taxable': True},
        {'id': '2', 'name': 'Paneer', 'quantity': 1, 'price': 12.99, 'is_taxable': True}
    ]
    
    people = [
        {'id': '1', 'name': 'Alice'},
        {'id': '2', 'name': 'Bob'}
    ]
    
    rules = [
        {'type': 'exclusive', 'person_name': 'Alice', 'item_name': 'Paneer'}
    ]
    
    result = service.calculate_allocations(
        items=items,
        people=people,
        rules=rules,
        tax_rate=0.08,
        tip_rate=0.18,
        grand_total=25.49
    )
    
    assert len(result['allocations']) == 2
    
    # Alice should have the paneer
    alice_allocation = next(a for a in result['allocations'] if a['person_name'] == 'Alice')
    assert len(alice_allocation['items']) == 1
    assert alice_allocation['items'][0]['item_name'] == 'Paneer'
    
    # Bob should have the chapatis
    bob_allocation = next(a for a in result['allocations'] if a['person_name'] == 'Bob')
    assert len(bob_allocation['items']) == 1
    assert bob_allocation['items'][0]['item_name'] == 'Chapati'
