import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, ArrowRight, CheckCircle, Check, Users } from 'lucide-react';

interface ItemAllocationPageProps {
  onNext: () => void;
  onBack: () => void;
}

interface ItemAllocation {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  assignedTo: string[]; // Array of person IDs
  splitParts: number; // Number of parts to split into (0 = no split)
  isSplit: boolean; // Whether this item has been split
  originalItemId?: string; // Reference to original item if this is a split item
}

export default function ItemAllocationPage({ onNext, onBack }: ItemAllocationPageProps) {
  const { items, people, setRules } = useStore();
  const [allocations, setAllocations] = useState<ItemAllocation[]>(
    items.map(item => ({
      itemId: item.id,
      itemName: item.name,
      quantity: item.quantity,
      price: item.price,
      assignedTo: [],
      splitParts: 0,
      isSplit: false
    }))
  );

  const handleToggleEveryone = (itemId: string) => {
    setAllocations(prev => prev.map(allocation => {
      if (allocation.itemId === itemId) {
        const isEveryoneSelected = allocation.assignedTo.length === people.length;
        if (isEveryoneSelected) {
          // Clear all assignments
          return {
            ...allocation,
            assignedTo: [],
            splitParts: 0
          };
        } else {
          // Assign to everyone equally
          return {
            ...allocation,
            assignedTo: people.map(p => p.id),
            splitParts: 0
          };
        }
      }
      return allocation;
    }));
  };

  const handleTogglePerson = (itemId: string, personId: string) => {
    setAllocations(prev => prev.map(allocation => {
      if (allocation.itemId === itemId) {
        const isAssigned = allocation.assignedTo.includes(personId);
        let newAssignedTo: string[];

        if (isAssigned) {
          // Remove person
          newAssignedTo = allocation.assignedTo.filter(id => id !== personId);
        } else {
          // Add person
          newAssignedTo = [...allocation.assignedTo, personId];
        }

        return {
          ...allocation,
          assignedTo: newAssignedTo
        };
      }
      return allocation;
    }));
  };

  const handleSplitChange = (itemId: string, splitParts: number) => {
    setAllocations(prev => prev.map(allocation => {
      if (allocation.itemId === itemId) {
        return {
          ...allocation,
          splitParts: Math.max(0, Math.min(splitParts, allocation.quantity))
        };
      }
      return allocation;
    }));
  };

  const handleConfirmSplit = (itemId: string) => {
    setAllocations(prev => {
      const allocation = prev.find(a => a.itemId === itemId);
      if (!allocation || allocation.splitParts <= 1 || allocation.isSplit) {
        return prev;
      }

      const newAllocations = [...prev];
      const originalIndex = newAllocations.findIndex(a => a.itemId === itemId);
      
      // Update original item
      newAllocations[originalIndex] = {
        ...allocation,
        quantity: allocation.quantity / allocation.splitParts,
        splitParts: 1,
        isSplit: true
      };

      // Add new split items
      const newItems: ItemAllocation[] = [];
      for (let i = 1; i < allocation.splitParts; i++) {
        newItems.push({
          itemId: `${allocation.itemId}-split-${i}`,
          itemName: allocation.itemName,
          quantity: allocation.quantity / allocation.splitParts,
          price: allocation.price,
          assignedTo: [],
          splitParts: 1,
          isSplit: true,
          originalItemId: allocation.itemId
        });
      }

      // Insert new items after the original item
      newAllocations.splice(originalIndex + 1, 0, ...newItems);

      return newAllocations;
    });
  };

  const handleNext = () => {
    // Convert allocations to rules format
    const rules = allocations.flatMap(allocation => {
      if (allocation.assignedTo.length === 0) {
        // If no one is assigned, create a rule for equal distribution
        return people.map(person => ({
          id: `${allocation.itemId}-${person.id}`,
          rule: `${person.name} takes ${allocation.quantity / people.length} ${allocation.itemName}`,
          personId: person.id,
          itemName: allocation.itemName,
          quantity: allocation.quantity / people.length,
          type: 'specific' as const
        }));
      } else {
        // Normal mode - equal distribution among assigned people
        const quantityPerPerson = allocation.quantity / allocation.assignedTo.length;
        return allocation.assignedTo.map(personId => {
          const person = people.find(p => p.id === personId);
          return {
            id: `${allocation.itemId}-${personId}`,
            rule: `${person?.name} takes ${quantityPerPerson} ${allocation.itemName}`,
            personId,
            itemName: allocation.itemName,
            quantity: quantityPerPerson,
            type: 'specific' as const
          };
        });
      }
    });

    setRules(rules);
    onNext();
  };

  const getItemSubtotal = (allocation: ItemAllocation) => {
    return allocation.quantity * allocation.price;
  };

  const getAssignedPeopleNames = (allocation: ItemAllocation) => {
    if (allocation.assignedTo.length === 0) {
      return 'Unassigned';
    } else if (allocation.assignedTo.length === people.length) {
      return 'Everyone';
    } else {
      return allocation.assignedTo
        .map(personId => people.find(p => p.id === personId)?.name)
        .filter(Boolean)
        .join(', ');
    }
  };

  const isEveryoneSelected = (allocation: ItemAllocation) => {
    return allocation.assignedTo.length === people.length;
  };

  const canSplit = (allocation: ItemAllocation) => {
    return allocation.quantity > 1 && !allocation.isSplit;
  };

  const canConfirmSplit = (allocation: ItemAllocation) => {
    return allocation.splitParts > 1 && !allocation.isSplit;
  };

  return (
    <>
      {/* Darker gradient overlay for better contrast on long pages */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-slate-900/20 via-slate-900/35 to-slate-950/60" />
      <div className="relative z-10 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Allocate Items</h2>
        <p className="text-white/80">Select who should pay for each item. For items with quantity &gt; 1, you can split them into multiple parts.</p>
      </div>

      {/* Items List - Card Layout */}
      <div className="space-y-3 sm:space-y-4">
        {allocations.map((allocation) => (
          <div key={allocation.itemId} className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-3 sm:p-4 lg:p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            {/* Item Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">{allocation.itemName}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-white/70">Qty: <span className="text-white font-medium">{allocation.quantity}</span></span>
                    <span className="text-white/70">Price: <span className="text-white font-medium">${Number(allocation.price).toFixed(2)}</span></span>
                    <span className="text-white/70">Total: <span className="text-white font-medium">${getItemSubtotal(allocation).toFixed(2)}</span></span>
                  </div>
                  {allocation.isSplit && (
                    <div className="flex items-center text-green-400 text-sm">
                      <Check className="h-4 w-4 mr-1" />
                      Split item
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Status */}
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/10 border border-white/20 rounded-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="text-sm text-white/70 mb-1 sm:mb-2">Assigned to:</div>
              <div className="text-white font-medium">
                {getAssignedPeopleNames(allocation)}
              </div>
            </div>

            {/* Split Controls */}
            {canSplit(allocation) && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/10 border border-white/20 rounded-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70">Split into:</span>
                    <input
                      type="number"
                      min="0"
                      max={allocation.quantity}
                      value={allocation.splitParts}
                      onChange={(e) => handleSplitChange(allocation.itemId, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-sm bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="0"
                    />
                    <span className="text-xs text-white/50">parts</span>
                  </div>
                  {canConfirmSplit(allocation) && (
                    <button
                      onClick={() => handleConfirmSplit(allocation.itemId)}
                      className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      Confirm Split
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* People Selection */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Assign to:</span>
                <button
                  onClick={() => handleToggleEveryone(allocation.itemId)}
                  className={`flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${
                    isEveryoneSelected(allocation)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Everyone
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {people.map((person) => {
                  const isAssigned = allocation.assignedTo.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      onClick={() => handleTogglePerson(allocation.itemId, person.id)}
                      className={`flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-sm font-medium transition-colors ${
                        isAssigned
                          ? 'bg-green-600 text-white'
                          : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                      }`}
                    >
                      {person.name}
                      {isAssigned && <CheckCircle className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-200 mb-2">Allocation Summary</h3>
        <div className="text-sm text-blue-100 space-y-1">
          <div>• Items: {allocations.length}</div>
          <div>• People: {people.length}</div>
          <div>• Total Value: ${allocations.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center px-4 py-2 border border-white/30 rounded-md shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
      </div>
    </>
  );
}
