import { useMemo } from 'react';

// A nice palette of colors to cycle through for the slices
const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export default function CategoryChart({ expenses = [] }) {
  
  // 1. Group Data by Category
  const { categories, totalValue } = useMemo(() => {
    if (expenses.length === 0) return { categories: [], totalValue: 0 };

    const totals = {};
    let sum = 0;

    expenses.forEach(item => {
      const amount = parseFloat(item.amount) || 0;
      if (totals[item.category]) {
        totals[item.category] += amount;
      } else {
        totals[item.category] = amount;
      }
      sum += amount;
    });

    const sortedCats = Object.entries(totals)
      .map(([name, value], index) => ({ 
        name, 
        value,
        color: CHART_COLORS[index % CHART_COLORS.length] // Assign a color
      }))
      .sort((a, b) => b.value - a.value);

    return { categories: sortedCats, totalValue: sum };
  }, [expenses]);

  // 2. Build the CSS Conic Gradient String
  // This creates the "Pie" segments
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


  if (expenses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-gray-400">
        <span className="text-4xl mb-2">📊</span>
        <p>No data to visualize yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-6">Spending Breakdown</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        
        {/* THE DONUT CHART */}
        <div className="relative w-48 h-48 mb-6">
          {/* The Pie/Donut (Background Gradient) */}
          <div 
            className="w-full h-full rounded-full transition-all duration-1000"
            style={{ background: gradientString }}
          ></div>
          
          {/* The White Hole in the middle (Makes it a donut) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-inner">
             <div className="text-center">
               <span className="block text-xs text-gray-400 font-bold uppercase">Total</span>
               <span className="text-xl font-bold text-gray-800">${totalValue.toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* THE LEGEND */}
        <div className="w-full space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          {categories.map((cat) => (
            <div key={cat.name} className="flex justify-between items-center text-sm group">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: cat.color }}
                ></div>
                <span className="text-gray-600 font-medium">{cat.name}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-800">${cat.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400 ml-2">
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