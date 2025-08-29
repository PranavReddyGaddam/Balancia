import { useState } from 'react';
import { useStore } from '../store/useStore';
import { BillItem } from '../types';
import { Edit2, Trash2, Plus, ArrowLeft, ArrowRight } from 'lucide-react';

interface ItemsTableProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ItemsTable({ onNext, onBack }: ItemsTableProps) {
  const { items, updateItem, removeItem, addItem } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<BillItem>>({
    name: '',
    quantity: 1,
    price: 0,
    isTaxable: true
  });

  const handleEdit = (item: BillItem) => {
    setEditingId(item.id);
  };

  const handleSave = (id: string, updates: Partial<BillItem>) => {
    updateItem(id, updates);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.price) {
      addItem({
        id: '',
        name: newItem.name,
        quantity: newItem.quantity || 1,
        price: newItem.price,
        isTaxable: newItem.isTaxable || true
      });
      setNewItem({ name: '', quantity: 1, price: 0, isTaxable: true });
    }
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Review Items</h2>
          <p className="text-white/80">Review and edit the extracted items from your receipt</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/60">Total</p>
          <p className="text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white/20 border border-white/30 rounded-lg backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <table className="min-w-full divide-y divide-white/30">
          <thead className="bg-white/10">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Item</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Quantity</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Price</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Subtotal</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Taxable</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white/5 divide-y divide-white/20">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleSave(item.id, { name: e.target.value })}
                      className="w-full bg-white/20 border border-white/30 rounded-md px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <div className="text-sm font-medium text-white">{item.name}</div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleSave(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-16 sm:w-20 bg-white/20 border border-white/30 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <div className="text-sm text-white">{item.quantity}</div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleSave(item.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-20 sm:w-24 bg-white/20 border border-white/30 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <div className="text-sm text-white">${item.price.toFixed(2)}</div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">${(item.quantity * item.price).toFixed(2)}</div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  {editingId === item.id ? (
                    <input
                      type="checkbox"
                      checked={item.isTaxable}
                      onChange={(e) => handleSave(item.id, { isTaxable: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-white/30 rounded bg-white/20"
                    />
                  ) : (
                    <div className="text-sm text-white">{item.isTaxable ? "Yes" : "No"}</div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === item.id ? (
                    <button
                      onClick={handleCancel}
                      className="text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                  ) : (
                    <div className="flex space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Item Form */}
      <div className="border-t border-white/20 pt-6">
        <h3 className="text-lg font-medium text-white mb-4">Add New Item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
            className="bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
            className="bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newItem.isTaxable}
              onChange={(e) => setNewItem({ ...newItem, isTaxable: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-white/30 rounded bg-white/20 mr-2"
            />
            <label className="text-sm text-white">Taxable</label>
          </div>
          <button
            onClick={handleAddItem}
            disabled={!newItem.name || !newItem.price}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
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
          onClick={onNext}
          disabled={items.length === 0}
          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
