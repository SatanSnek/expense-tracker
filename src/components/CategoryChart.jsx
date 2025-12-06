import { useMemo } from 'react';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function CategoryChart({ expenses = [] }) {
  
  const { categories, totalValue } = useMemo(() => {
    if (expenses.length === 0) return { categories: [], totalValue: 0 };
    const totals = {};
    let sum = 0;
    expenses.forEach(item => {
      const amount = parseFloat(item.amount) || 0;
      totals[item.category] = (totals[item.category] || 0) + amount;
      sum += amount;
    });
    const sortedCats = Object.entries(totals)
      .map(([name, value], index) => ({ name, value, color: CHART_COLORS[index % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
    return { categories: sortedCats, totalValue: sum };
  }, [expenses]);

  const gradientString = useMemo(() => {
    let currentPercentage = 0;
    const parts = categories.map(cat => {
      const start = currentPercentage;
      const pct = (cat.value / totalValue) * 100;
      currentPercentage += pct;
      return `${cat.color} ${start}% ${currentPercentage}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [categories, totalValue]);

  const containerClass = `
    p-6 rounded-2xl shadow-sm border h-full flex flex-col transition-all duration-300
    bg-white border-gray-100
    group-data-[theme=nebula]:bg-white/10 
    group-data-[theme=nebula]:backdrop-blur-md 
    group-data-[theme=nebula]:border-white/20
  `;

  if (expenses.length === 0) {
    return (
      <div className={`${containerClass} items-center justify-center text-gray-400 group-data-[theme=nebula]:text-blue-200`}>
        <span className="text-4xl mb-2">📊</span>
        <p>No data to visualize yet.</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-6 group-data-[theme=nebula]:text-blue-200">Spending Breakdown</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        
        <div className="relative w-48 h-48 mb-6">
          <div className="w-full h-full rounded-full transition-all duration-1000" style={{ background: gradientString }}></div>
          
          {/* Hole color needs to match container background */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full flex items-center justify-center shadow-inner
            bg-white group-data-[theme=nebula]:bg-[#2e1065] group-data-[theme=nebula]:bg-opacity-50">
             <div className="text-center">
               <span className="block text-xs text-gray-400 font-bold uppercase group-data-[theme=nebula]:text-blue-200">Total</span>
               <span className="text-xl font-bold text-gray-800 group-data-[theme=nebula]:text-white">₹{totalValue.toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="w-full space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          {categories.map((cat) => (
            <div key={cat.name} className="flex justify-between items-center text-sm group">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-gray-600 font-medium group-data-[theme=nebula]:text-gray-200">{cat.name}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-800 group-data-[theme=nebula]:text-white">₹{cat.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400 ml-2 group-data-[theme=nebula]:text-blue-200">
                  {((cat.value / totalValue) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}