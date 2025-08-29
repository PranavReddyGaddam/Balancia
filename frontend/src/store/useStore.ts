import { create } from 'zustand';
import { BillItem, Person, AllocationRule, PersonAllocation } from '../types';
import { apiService } from '../services/api';

interface SmartSplitStore {
  // State
  items: BillItem[];
  people: Person[];
  rules: AllocationRule[];
  taxRate: number;
  tipRate: number;
  tipCash?: number;
  grandTotal: number;
  allocations: PersonAllocation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: BillItem[]) => void;
  addItem: (item: BillItem) => void;
  updateItem: (id: string, updates: Partial<BillItem>) => void;
  removeItem: (id: string) => void;

  setPeople: (people: Person[]) => void;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;

  setRules: (rules: AllocationRule[]) => void;
  addRule: (rule: string) => void;
  removeRule: (id: string) => void;

  setTaxRate: (rate: number) => void;
  setTipRate: (rate: number) => void;
  setTipCash?: (amount: number) => void;
  setGrandTotal: (total: number) => void;

  setLoading: (loading: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  calculateSplits: () => void;
  reset: () => void;

  // Demo data
  loadDemoData: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<SmartSplitStore>((set, get) => ({
  // Initial state
  items: [],
  people: [],
  rules: [],
  taxRate: 0, // default 0%
  tipRate: 0, // default 0%
  tipCash: 0,
  grandTotal: 0,
  allocations: [],
  isLoading: false,
  error: null,

  // Actions
  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({
    items: [...state.items, { ...item, id: generateId() }]
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  setPeople: (people) => set({ people }),

  addPerson: (name) => set((state) => ({
    people: [...state.people, { id: generateId(), name }]
  })),

  removePerson: (id) => set((state) => ({
    people: state.people.filter(person => person.id !== id)
  })),

  setRules: (rules) => set({ rules }),

  addRule: (rule) => set((state) => ({
    rules: [...state.rules, { 
      id: generateId(), 
      rule, 
      personId: '', 
      type: 'specific' 
    }]
  })),

  removeRule: (id) => set((state) => ({
    rules: state.rules.filter(rule => rule.id !== id)
  })),

  setTaxRate: (rate) => set({ taxRate: rate }),
  setTipRate: (rate) => set({ tipRate: rate }),
  setTipCash: (amount) => set({ tipCash: amount }),
  setGrandTotal: (total) => set({ grandTotal: total }),

  setLoading: (loading) => set({ isLoading: loading }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  calculateSplits: async () => {
    const state = get();
    if (state.items.length === 0 || state.people.length === 0) {
      set({ error: 'Please add items and people first' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Calculate grand total from items
      const calculatedGrandTotal = state.items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const price = Number(item.price);
        console.log(`🔍 Item: ${item.name}, Quantity: ${quantity}, Price: ${price}, Subtotal: ${quantity * price}`);
        return sum + (quantity * price);
      }, 0);

      console.log('🔍 Calculated Grand Total:', calculatedGrandTotal);
      console.log('🔍 Items for calculation:', state.items);

      const request = {
        items: state.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price),
          is_taxable: item.isTaxable
        })),
        people: state.people,
        rules: state.rules.map(rule => ({
          id: rule.id,
          rule: rule.rule,
          person_id: rule.personId,
          item_name: rule.itemName,
          quantity: rule.quantity,
          type: rule.type
        })),
        tax_rate: state.taxRate,
        tip_rate: state.tipRate,
        grand_total: calculatedGrandTotal
      };

      const response = await apiService.allocation.calculate(request);

      // Base allocations from API
      let allocations = response.allocations.map(allocation => ({
          personId: allocation.person_id,
          personName: allocation.person_name,
          items: allocation.items.map(item => ({
            itemId: item.item_id,
            itemName: item.item_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          })),
          subtotal: allocation.subtotal,
          taxShare: allocation.tax_share,
          tipShare: allocation.tip_share,
          total: allocation.total
        }));

      // If user specified cash tips, distribute proportionally to subtotals
      const cashTip = state.tipCash || 0;
      if (cashTip > 0 && allocations.length > 0) {
        const baseSubtotal = allocations.reduce((sum, a) => sum + Number(a.subtotal || 0), 0) || 1;
        allocations = allocations.map(a => {
          const share = cashTip * (Number(a.subtotal || 0) / baseSubtotal);
          return {
            ...a,
            tipShare: Number(a.tipShare || 0) + share,
            total: Number(a.total || 0) + share
          } as PersonAllocation;
        });
      }

      set({ 
        allocations,
        grandTotal: calculatedGrandTotal + cashTip
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to calculate splits' });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({
    items: [],
    people: [],
    rules: [],
    taxRate: 0,
    tipRate: 0,
    tipCash: 0,
    grandTotal: 0,
    allocations: [],
    error: null
  }),

  loadDemoData: () => {
    const demoItems: BillItem[] = [
      { id: '1', name: 'Chapati', quantity: 5, price: 2.50, isTaxable: true },
      { id: '2', name: 'Paneer Tikka', quantity: 1, price: 12.99, isTaxable: true },
      { id: '3', name: 'Dal Makhani', quantity: 1, price: 8.99, isTaxable: true },
      { id: '4', name: 'Rice', quantity: 1, price: 3.99, isTaxable: true }
    ];

    const demoPeople: Person[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Carol' }
    ];

    const demoRules: AllocationRule[] = [
      { id: '1', rule: 'Everyone shares 5 chapatis', personId: '1', type: 'shared' },
      { id: '2', rule: 'Only Alice takes paneer', personId: '1', type: 'exclusive' },
      { id: '3', rule: 'Carol takes 2 chapatis', personId: '3', type: 'specific' }
    ];

    set({
      items: demoItems,
      people: demoPeople,
      rules: demoRules,
      grandTotal: 35.46,
      error: null
    });
  }
}));
