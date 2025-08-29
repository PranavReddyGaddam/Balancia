import { useState } from 'react';
import { useStore } from '../store/useStore';
import { User, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

interface PeopleManagerProps {
  onNext: () => void;
  onBack: () => void;
}

export default function PeopleManager({ onNext, onBack }: PeopleManagerProps) {
  const { people, addPerson, removePerson } = useStore();
  const [newPersonName, setNewPersonName] = useState('');

  // Removed predefined quick-add names; reserved for future group presets
  

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPerson();
    }
  };



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Add People</h2>
        <p className="text-white/80">Add everyone who will be splitting the bill</p>
      </div>

      {/* Quick Add Section removed for now (reserved for future groups) */}

      <div className="bg-white/10 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-medium text-white mb-4">Add New Person</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Enter person's name"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAddPerson}
            disabled={!newPersonName.trim()}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">
          Participants ({people.length})
        </h3>
        {people.length === 0 ? (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-white/40" />
            <h3 className="mt-2 text-sm font-medium text-white">No people added</h3>
            <p className="mt-1 text-sm text-white/60">Add people above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-white/10 border border-white/20 rounded-lg shadow-sm"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{person.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => removePerson(person.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-200 mb-2">Tips for adding people:</h3>
        <ul className="text-sm text-blue-100 space-y-1">
          <li>• Use first names or nicknames for easy identification</li>
          <li>• You can add people at any time during the process</li>
          <li>• Everyone will be included in the final split calculation</li>
        </ul>
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
          disabled={people.length === 0}
          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
