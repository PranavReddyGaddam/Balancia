export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  isTaxable: boolean;
}

export interface Person {
  id: string;
  name: string;
}

export interface AllocationRule {
  id: string;
  rule: string;
  personId: string;
  itemName?: string;
  quantity?: number;
  type: 'specific' | 'shared' | 'exclusive';
}

export interface PersonAllocation {
  personId: string;
  personName: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
}

export interface BillData {
  items: BillItem[];
  people: Person[];
  rules: AllocationRule[];
  taxRate: number;
  tipRate: number;
  grandTotal: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  items: BillItem[];
}

export interface ParsedRule {
  type: 'specific' | 'shared' | 'exclusive';
  personName: string;
  itemName?: string;
  quantity?: number;
  totalQuantity?: number;
}
