import { useState, useEffect } from 'react';

export default function BudgetCard({ initialBudget = 0, spent = 0, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(initialBudget);

  useEffect(() => {
    setAmount(initialBudget);
  }, [initialBudget]);

  const percentage = initialBudget > 0 ? Math.min((spent / initialBudget) * 100, 100) : 0;
  const barColor = spent > initialBudget ? 'bg-red-500' : 'bg-blue-500';
  
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
    <div className={`
      p-6 rounded-2xl shadow-sm border transition-all duration-300
      bg-white border-gray-100
      /* ✅ THEME STYLES: If parent has theme="nebula", these kick in */
      group-data-[theme=nebula]:bg-white/10 
      group-data-[theme=nebula]:backdrop-blur-md 
      group-data-[theme=nebula]:border-white/20 
      group-data-[theme=nebula]:text-white
    `}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider group-data-[theme=nebula]:text-blue-200">
            Monthly Budget
          </h3>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none group-data-[theme=nebula]:text-white"
                autoFocus
                min="0"
              />
              <button 
                type="submit"
                className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold group-data-[theme=nebula]:bg-green-600 group-data-[theme=nebula]:text-white"
              >
                ✓
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-sm font-bold group-data-[theme=nebula]:bg-white/20 group-data-[theme=nebula]:text-white"
              >
                ✕
              </button>
            </form>
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-800 group-data-[theme=nebula]:text-white">
                ₹{parseFloat(amount).toLocaleString()}
              </span>
              <span className="text-sm text-gray-400 group-data-[theme=nebula]:text-blue-200">/ month</span>
            </div>
          )}
        </div>

        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors group-data-[theme=nebula]:text-blue-200 group-data-[theme=nebula]:hover:bg-white/10 group-data-[theme=nebula]:hover:text-white"
          >
            ✏️
          </button>
        )}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden group-data-[theme=nebula]:bg-white/20">
        <div 
          className={`${barColor} h-2 rounded-full transition-all duration-500`} 
          style={{ width: `${Math.max(percentage, 2)}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-400 group-data-[theme=nebula]:text-blue-200">
            {spent > initialBudget ? '⚠️ Budget Exceeded' : percentageText}
        </p>
        <p className="text-xs font-bold text-gray-500 group-data-[theme=nebula]:text-white">
          ₹{spent.toLocaleString()} spent
        </p>
      </div>
    </div>
  );
}