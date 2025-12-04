import { useState, useEffect } from 'react';

export default function BudgetCard({ initialBudget = 0, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(initialBudget);

  // ✅ THE FIX: Listen for changes from the database
  // When the parent component passes the real number (e.g., 2500),
  // this updates the internal state immediately.
  useEffect(() => {
    setAmount(initialBudget);
  }, [initialBudget]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(parseFloat(amount));
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Monthly Budget</h3>
          
          {/* TOGGLE: View vs Edit Mode */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 text-2xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none"
                autoFocus
                min="0"
              />
              <button 
                type="submit"
                className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-200"
              >
                ✓
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                ✕
              </button>
            </form>
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-800">
                ${parseFloat(amount).toLocaleString()}
              </span>
              <span className="text-sm text-gray-400">/ month</span>
            </div>
          )}
        </div>

        {/* Edit Icon Button */}
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            ✏️
          </button>
        )}
      </div>

      {/* Progress Bar Placeholder */}
      <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
        <div className="bg-blue-500 h-2 rounded-full w-0 transition-all duration-500"></div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">0% used</p>
    </div>
  );
}