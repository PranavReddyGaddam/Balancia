import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, ArrowRight, Plus, Trash2, Lightbulb } from 'lucide-react';

interface NLPromptInputProps {
  onNext: () => void;
  onBack: () => void;
}

export default function NLPromptInput({ onNext, onBack }: NLPromptInputProps) {
  const { people, items, rules, addRule, removeRule } = useStore();
  const [newRule, setNewRule] = useState('');

  const handleAddRule = () => {
    if (newRule.trim()) {
      addRule(newRule.trim());
      setNewRule('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddRule();
    }
  };

  const examples = [
    "Everyone shares 5 chapatis",
    "Only Alice takes paneer",
    "Carol takes 2 chapatis",
    "Bob and Alice split the rice",
    "Everyone pays equally for the dal"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Allocation Rules</h2>
        <p className="text-gray-600">Use natural language to specify how items should be split</p>
      </div>

      {/* Add New Rule */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Rule</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="e.g., Everyone shares 5 chapatis"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddRule}
            disabled={!newRule.trim()}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Current Rules ({rules.length})
        </h3>
        
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rules added</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add rules above or skip to split equally
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{rule.rule}</p>
                </div>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-red-600 hover:text-red-900 ml-4"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Examples */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Example rules:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examples.map((example, index) => (
            <div key={index} className="text-sm text-blue-800 bg-blue-100 px-3 py-2 rounded">
              "{example}"
            </div>
          ))}
        </div>
      </div>

      {/* Available People and Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Available People:</h3>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <span
                key={person.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {person.name}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Available Items:</h3>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">How to write rules:</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• <strong>"Everyone shares X [item]"</strong> - Distributes equally among all people</li>
          <li>• <strong>"Only [person] takes [item]"</strong> - Gives the entire item to one person</li>
          <li>• <strong>"[person] takes X [item]"</strong> - Gives specific quantity to one person</li>
          <li>• <strong>"[person] and [person] split [item]"</strong> - Splits between specific people</li>
          <li>• Items not mentioned in rules will be split equally among all people</li>
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
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
