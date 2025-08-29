import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, Download, Share2, CheckCircle, AlertCircle } from 'lucide-react';

interface ResultsPageProps {
  onBack: () => void;
  onNewBill: () => void;
}

export default function ResultsPage({ onBack, onNewBill }: ResultsPageProps) {
  const { 
    items, 
    people, 
    rules, 
    taxRate, 
    tipRate, 
    grandTotal, 
    allocations, 
    calculateSplits, 
    isLoading, 
    error,
    reset
  } = useStore();

  useEffect(() => {
    if (allocations.length === 0) {
      calculateSplits();
    }
  }, [calculateSplits, allocations.length]);

  const handleExport = () => {
    const data = {
      items,
      people,
      rules,
      taxRate,
      tipRate,
      grandTotal,
      allocations,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-split-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Smart Split Results',
          text: `Bill split results: ${allocations.map(a => `${a.personName}: $${a.total.toFixed(2)}`).join(', ')}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `Smart Split Results:\n${allocations.map(a => `${a.personName}: $${a.total.toFixed(2)}`).join('\n')}`;
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  const handleNewBill = () => {
    reset(); // Reset all store state
    onNewBill(); // Navigate to step 1
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Calculating splits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 flex items-center mx-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-slate-900/20 via-slate-900/35 to-slate-950/60" />
      <div className="relative z-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Split Results</h2>
          <p className="text-white/80">Here's how the bill should be split</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 border border-white/30 rounded-md shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleShare}
            className="flex items-center px-3 py-2 border border-white/30 rounded-md shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
          <span className="text-sm font-medium text-green-200">
            Split calculation completed successfully!
          </span>
        </div>
        <p className="text-sm text-green-100 mt-1">
          Total: ${grandTotal.toFixed(2)} | People: {people.length} | Items: {items.length}
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allocations.map((allocation) => (
          <div key={allocation.personId} className="bg-white/10 border border-white/20 rounded-lg shadow-sm overflow-hidden backdrop-blur-sm">
            <div className="bg-white/10 px-4 py-3 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">{allocation.personName}</h3>
              <p className="text-2xl font-bold text-white">${Number(allocation.total).toFixed(2)}</p>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Items:</h4>
                <div className="space-y-1">
                  {allocation.items.map((item) => (
                    <div key={item.itemId} className="flex justify-between text-sm">
                      <span className="text-white/80">
                        {item.itemName}
                      </span>
                      <span className="font-medium text-white">${Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown */}
              <div className="border-t border-white/20 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Subtotal:</span>
                  <span className="text-white">${Number(allocation.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Tax:</span>
                  <span className="text-white">${Number(allocation.taxShare).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Tip:</span>
                  <span className="text-white">${Number(allocation.tipShare).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-white border-t border-white/20 pt-1">
                  <span className="text-white">Total:</span>
                  <span className="text-white">${Number(allocation.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Summary */}
      <div className="bg-white/20 border border-white/30 rounded-lg p-6 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-medium text-white mb-4">Bill Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Items Ordered:</h4>
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-white/80">
                    {item.name}
                  </span>
                  <span className="text-white">${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Totals:</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Subtotal:</span>
                <span className="text-white">${allocations.reduce((sum, a) => sum + Number(a.subtotal), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Tax ({taxRate * 100}%):</span>
                <span className="text-white">${allocations.reduce((sum, a) => sum + Number(a.taxShare), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Tip ({tipRate * 100}%):</span>
                <span className="text-white">${allocations.reduce((sum, a) => sum + Number(a.tipShare), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-white border-t pt-1">
                <span className="text-white">Grand Total:</span>
                <span className="text-white">${(grandTotal || allocations.reduce((sum, a) => sum + Number(a.total), 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center space-x-4 pt-6">
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 border border-white/30 rounded-md shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </button>
        <button
          onClick={handleNewBill}
          className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Start New Bill
        </button>
      </div>
      </div>
    </>
  );
}
