import re
from typing import Dict, List, Any
from decimal import Decimal, ROUND_HALF_UP
try:
    from app.services.llm_service import LLMService  # type: ignore
except Exception:  # pragma: no cover
    LLMService = None  # type: ignore

class AllocationService:
    def __init__(self):
        try:
            self.llm_service = LLMService() if LLMService else None
        except Exception:
            self.llm_service = None
    async def parse_natural_language_rules(self, rules: List[str], people: List[str]) -> List[Dict[str, Any]]:
        """
        Parse natural language rules into structured format using LLM with fallback
        """
        # Try LLM service first
        if self.llm_service and rules:
            try:
                return await self.llm_service.parse_natural_language_rules(rules, people)
            except Exception as e:
                print(f"LLM parsing failed, falling back to regex: {str(e)}")
        
        # Fallback to regex patterns
        return self._parse_rules_fallback(rules, people)
    
    def _parse_rules_fallback(self, rules: List[str], people: List[str]) -> List[Dict[str, Any]]:
        """
        Fallback method using regex patterns for rule parsing
        """
        parsed_rules = []
        
        for rule in rules:
            rule_lower = rule.lower().strip()
            
            # Pattern 1: "Everyone shares X [item]"
            everyone_match = re.match(r'everyone shares (\d+)\s+([a-zA-Z\s]+)', rule_lower)
            if everyone_match:
                quantity = int(everyone_match.group(1))
                item_name = everyone_match.group(2).strip()
                for person in people:
                    parsed_rules.append({
                        'type': 'shared',
                        'person_name': person,
                        'item_name': item_name,
                        'quantity': quantity
                    })
                continue
            
            # Pattern 2: "Only [person] takes [item]"
            exclusive_match = re.match(r'only ([a-zA-Z]+)\s+takes\s+([a-zA-Z\s]+)', rule_lower)
            if exclusive_match:
                person_name = exclusive_match.group(1)
                item_name = exclusive_match.group(2).strip()
                parsed_rules.append({
                    'type': 'exclusive',
                    'person_name': person_name,
                    'item_name': item_name
                })
                continue
            
            # Pattern 3: "[person] takes X [item]"
            specific_match = re.match(r'([a-zA-Z]+)\s+takes\s+(\d+)\s+([a-zA-Z\s]+)', rule_lower)
            if specific_match:
                person_name = specific_match.group(1)
                quantity = int(specific_match.group(2))
                item_name = specific_match.group(3).strip()
                parsed_rules.append({
                    'type': 'specific',
                    'person_name': person_name,
                    'item_name': item_name,
                    'quantity': quantity
                })
                continue
            
            # Pattern 4: "[person] takes [item]"
            simple_match = re.match(r'([a-zA-Z]+)\s+takes\s+([a-zA-Z\s]+)', rule_lower)
            if simple_match:
                person_name = simple_match.group(1)
                item_name = simple_match.group(2).strip()
                parsed_rules.append({
                    'type': 'specific',
                    'person_name': person_name,
                    'item_name': item_name,
                    'quantity': 1
                })
        
        return parsed_rules
    
    def calculate_allocations(
        self,
        items: List[Dict[str, Any]],
        people: List[Dict[str, Any]],
        rules: List[Dict[str, Any]],
        tax_rate: float,
        tip_rate: float,
        grand_total: float
    ) -> Dict[str, Any]:
        """
        Calculate bill splits based on items, people, and rules
        """
        # Debug: Log input data
        print(f"🔍 Allocation Service Input:")
        print(f"  Items: {len(items)} items")
        print(f"  People: {len(people)} people")
        print(f"  Rules: {len(rules)} rules")
        print(f"  Tax Rate: {tax_rate}")
        print(f"  Tip Rate: {tip_rate}")
        print(f"  Grand Total: {grand_total}")
        
        # Validate inputs
        if not people:
            raise ValueError("At least one person is required for allocation")
        if not items:
            raise ValueError("At least one item is required for allocation")
        
        # Initialize allocations
        allocations = []
        for person in people:
            allocations.append({
                'person_id': person['id'],
                'person_name': person['name'],
                'items': [],
                'subtotal': 0.0,
                'tax_share': 0.0,
                'tip_share': 0.0,
                'total': 0.0
            })
        
        # Create item map for easy lookup
        item_map = {item['name'].lower(): item for item in items}
        
        # Track allocated quantities
        allocated_quantities = {item['name'].lower(): 0 for item in items}
        
        # Apply rules
        for rule in rules:
            # Find person by person_id (from API) or person_name (from LLM parsing)
            person = None
            if 'person_id' in rule:
                person = next((p for p in people if p['id'] == rule['person_id']), None)
            elif 'person_name' in rule:
                person = next((p for p in people if p['name'].lower() == rule['person_name'].lower()), None)
            
            if not person:
                continue
            
            allocation = next((a for a in allocations if a['person_id'] == person['id']), None)
            if not allocation:
                continue
            
            if rule['type'] == 'exclusive' and rule.get('item_name'):
                item_name = rule['item_name'].lower()
                item = item_map.get(item_name)
                if item:
                    item_allocation = {
                        'item_id': item['id'],
                        'item_name': item['name'],
                        'quantity': float(item['quantity']),
                        'price': float(item['price']),
                        'subtotal': float(item['quantity']) * float(item['price'])
                    }
                    allocation['items'].append(item_allocation)
                    allocation['subtotal'] += item_allocation['subtotal']
                    allocated_quantities[item_name] = item['quantity']
            
            elif rule['type'] == 'specific' and rule.get('item_name') and rule.get('quantity'):
                item_name = rule['item_name'].lower()
                item = item_map.get(item_name)
                if item:
                    current_allocated = allocated_quantities.get(item_name, 0)
                    available_quantity = item['quantity'] - current_allocated
                    quantity_to_allocate = min(rule['quantity'], available_quantity)
                    
                    if quantity_to_allocate > 0:
                        item_allocation = {
                            'item_id': item['id'],
                            'item_name': item['name'],
                            'quantity': float(quantity_to_allocate),
                            'price': float(item['price']),
                            'subtotal': float(quantity_to_allocate) * float(item['price'])
                        }
                        allocation['items'].append(item_allocation)
                        allocation['subtotal'] += item_allocation['subtotal']
                        allocated_quantities[item_name] = current_allocated + quantity_to_allocate
        
        # Distribute remaining items equally
        remaining_items = [
            item for item in items 
            if allocated_quantities.get(item['name'].lower(), 0) < item['quantity']
        ]
        
        if remaining_items and people:
            for item in remaining_items:
                allocated = allocated_quantities.get(item['name'].lower(), 0)
                remaining_quantity = item['quantity'] - allocated
                
                if remaining_quantity > 0:
                    quantity_per_person = remaining_quantity // len(people)
                    remainder = remaining_quantity % len(people)
                    
                    for i, person in enumerate(people):
                        allocation = next((a for a in allocations if a['person_id'] == person['id']), None)
                        if not allocation:
                            continue
                        
                        quantity_for_person = quantity_per_person + (1 if i < remainder else 0)
                        
                        if quantity_for_person > 0:
                            item_allocation = {
                                'item_id': item['id'],
                                'item_name': item['name'],
                                'quantity': float(quantity_for_person),
                                'price': float(item['price']),
                                'subtotal': float(quantity_for_person) * float(item['price'])
                            }
                            allocation['items'].append(item_allocation)
                            allocation['subtotal'] += item_allocation['subtotal']
        
        # Calculate tax and tip distribution
        total_subtotal = sum(a['subtotal'] for a in allocations)
        
        # Debug: Log subtotal calculation
        print(f"🔍 Total Subtotal: {total_subtotal}")
        print(f"🔍 Grand Total: {grand_total}")
        
        # Validate grand total
        if grand_total <= 0:
            raise ValueError("Grand total must be greater than 0")
        
        # Convert to float for calculations to avoid Decimal/float mixing
        grand_total_float = float(grand_total)
        tax_rate_float = float(tax_rate)
        tip_rate_float = float(tip_rate)
        
        total_tax = grand_total_float * tax_rate_float / (1 + tax_rate_float)
        total_tip = grand_total_float * tip_rate_float / (1 + tip_rate_float)
        
        # Distribute tax and tip proportionally
        for allocation in allocations:
            if total_subtotal > 0:
                proportion = allocation['subtotal'] / total_subtotal
                allocation['tax_share'] = round(total_tax * proportion, 2)
                allocation['tip_share'] = round(total_tip * proportion, 2)
            allocation['total'] = round(allocation['subtotal'] + allocation['tax_share'] + allocation['tip_share'], 2)
        
        # Rounding adjustment
        total_calculated = sum(a['total'] for a in allocations)
        difference = grand_total - total_calculated
        
        if abs(difference) > 0.01:
            # Find allocation with largest total to absorb rounding difference
            largest_allocation = max(allocations, key=lambda x: x['total'])
            largest_allocation['total'] = round(largest_allocation['total'] + difference, 2)
            total_calculated = sum(a['total'] for a in allocations)
        
        return {
            'allocations': allocations,
            'total_calculated': total_calculated,
            'difference': difference
        }
