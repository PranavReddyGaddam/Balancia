import { useStore } from '../store/useStore';
import { ArrowLeft, ArrowRight, Calculator } from 'lucide-react';

interface BillSettingsProps {
  onNext: () => void;
  onBack: () => void;
}

export default function BillSettings({ onNext, onBack }: BillSettingsProps) {
  const { 
    items, 
    taxRate, 
    tipRate, 
    grandTotal, 
    // @ts-ignore optional in store typing
    tipCash = 0,
    setTaxRate, 
    setTipRate, 
    setGrandTotal,
    // @ts-ignore optional in store typing
    setTipCash
  } = useStore();

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * taxRate;
  const tipPercentAmount = subtotal * tipRate;
  const tipAmount = tipPercentAmount + Number(tipCash || 0);
  const calculatedTotal = subtotal + taxAmount + tipAmount;

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-slate-900/20 via-slate-900/35 to-slate-950/60" />
      <div className="relative z-10 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Bill Settings</h2>
        <p className="text-white/80">Configure tax, tip, and verify the total amount</p>
      </div>

      {/* Bill Summary */}
      <div className="bg-white/20 border border-white/30 rounded-lg p-6 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-medium text-white mb-4">Bill Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-white">
            <span className="text-white/80">Subtotal:</span>
            <span className="font-medium text-white">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-white/80">Tax ({(taxRate * 100).toFixed(1)}%):</span>
            <span className="font-medium text-white">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-white/80">Tip ({(tipRate * 100).toFixed(1)}% + ${Number(tipCash || 0).toFixed(2)} cash):</span>
            <span className="font-medium text-white">${tipAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-white">
              <span className="text-lg font-medium text-white">Calculated Total:</span>
              <span className="text-lg font-bold text-green-300">${calculatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Rate */}
      <div className="bg-white/20 border border-white/30 rounded-lg p-6 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-medium text-white mb-4">Tax Rate</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="taxRate" className="block text-sm font-medium text-white/80 mb-2">
              Tax Rate ({(taxRate * 100).toFixed(1)}%)
            </label>
            <input
              type="range"
              id="taxRate"
              min="0"
              max="0.25"
              step="0.001"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>0%</span>
              <span>25%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 0.05, 0.08, 0.1, 0.15, 0.2].map((rate) => (
              <button
                key={rate}
                onClick={() => setTaxRate(rate)}
                className={`px-3 py-2 text-sm rounded-md border ${
                  taxRate === rate
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {(rate * 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tip Rate */}
      <div className="bg-white/20 border border-white/30 rounded-lg p-6 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-medium text-white mb-4">Tip</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="tipRate" className="block text-sm font-medium text-white/80 mb-2">
              Tip Percentage ({(tipRate * 100).toFixed(1)}%)
            </label>
            <input
              type="range"
              id="tipRate"
              min="0"
              max="0.3"
              step="0.001"
              value={tipRate}
              onChange={(e) => setTipRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>0%</span>
              <span>30%</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 0.15, 0.18, 0.2, 0.25].map((rate) => (
              <button
                key={rate}
                onClick={() => setTipRate(rate)}
                className={`px-3 py-2 text-sm rounded-md border ${
                  tipRate === rate
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {(rate * 100).toFixed(0)}%
              </button>
            ))}
          </div>

          {/* Cash tip */}
          <div>
            <label htmlFor="tipCash" className="block text-sm font-medium text-white/80 mb-2">
              Cash Tip Amount
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/60">$</span>
              <input
                type="number"
                id="tipCash"
                min="0"
                step="0.01"
                value={Number(tipCash || 0)}
                onChange={(e) => setTipCash && setTipCash(parseFloat(e.target.value) || 0)}
                className="block w-full pl-7 pr-12 bg-white/10 border border-white/20 text-white rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400 placeholder-white/40"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-white/60 mt-1">Cash tip is added on top of percentage tip and split proportionally.</p>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="bg-white/10 border border-white/20 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Grand Total</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="grandTotal" className="block text-sm font-medium text-white/80 mb-2">
              Actual Total from Receipt
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/60">$</span>
              <input
                type="number"
                id="grandTotal"
                min="0"
                step="0.01"
                value={grandTotal}
                onChange={(e) => setGrandTotal(parseFloat(e.target.value) || 0)}
                className="block w-full pl-7 pr-12 bg-white/10 border border-white/20 text-white rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400 placeholder-white/40"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {grandTotal > 0 && (
            <div className={`p-4 rounded-lg ${
              Math.abs(grandTotal - calculatedTotal) < 0.01
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center">
                <Calculator className={`h-5 w-5 mr-2 ${
                  Math.abs(grandTotal - calculatedTotal) < 0.01
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`} />
                <span className={`text-sm font-medium ${
                  Math.abs(grandTotal - calculatedTotal) < 0.01
                    ? 'text-green-800'
                    : 'text-yellow-800'
                }`}>
                  {Math.abs(grandTotal - calculatedTotal) < 0.01
                    ? 'Totals match!'
                    : `Difference: $${Math.abs(grandTotal - calculatedTotal).toFixed(2)}`
                  }
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                Math.abs(grandTotal - calculatedTotal) < 0.01
                  ? 'text-green-700'
                  : 'text-yellow-700'
              }`}>
                Calculated: ${calculatedTotal.toFixed(2)} | Actual: ${grandTotal.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the actual total from your receipt for accurate splitting</li>
          <li>• Tax and tip rates can be adjusted to match your local rates</li>
          <li>• The difference between calculated and actual total will be distributed proportionally</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Calculate Split
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
      </div>
    </>
  );
}
