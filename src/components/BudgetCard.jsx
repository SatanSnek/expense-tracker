import { useState, useEffect } from 'react';

export default function BudgetCard({ initialBudget = 0, spent = 0, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(initialBudget);

  useEffect(() => {
    setAmount(initialBudget);
  }, [initialBudget]);

  // CALCULATE PERCENTAGE
  const percentage = initialBudget > 0 ? Math.min((spent / initialBudget) * 100, 100) : 0;
  
  // Color logic
  const barColor = spent > initialBudget ? 'bg-red-500' : 'bg-blue-500';

  // ✅ NEW: Smart Percentage Text
  // If it's 0.3%, show "< 1%". If it's 0%, show "0%". Otherwise round normally.
  let percentageText = `${percentage.toFixed(0)}% used`;
  if (percentage > 0 && percentage < 1) {
    percentageText = "< 1% used";
  }

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
              <button type="submit" className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">✓</button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-sm font-bold">✕</button>
            </form>
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-800">
                ₹{parseFloat(amount).toLocaleString()}
              </span>
              <span className="text-sm text-gray-400">/ month</span>
            </div>
          )}
        </div>

        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">✏️</button>
        )}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
        <div 
          className={`${barColor} h-2 rounded-full transition-all duration-500`} 
          style={{ width: `${Math.max(percentage, 2)}%` }} // Force at least 2% width so you can see the color even if tiny
        ></div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        {/* ✅ USE THE NEW VARIABLE HERE */}
        <p className="text-xs text-gray-400">
            {spent > initialBudget ? '⚠️ Budget Exceeded' : percentageText}
        </p>
        <p className="text-xs font-bold text-gray-500">₹{spent.toLocaleString()} spent</p>
      </div>
    </div>
  );
}