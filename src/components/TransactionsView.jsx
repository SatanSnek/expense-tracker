import { useState } from 'react';

export default function TransactionsView({ 
  expenses = [], onDelete, onBulkDelete, selectedMonth, onMonthChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filter & Sort
  const filteredExpenses = expenses.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(new Set(sortedExpenses.map(item => item.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const executeBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} transactions?`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7);
  });

  return (
    <div className={`
      rounded-2xl shadow-sm border overflow-hidden transition-all duration-300
      bg-white border-gray-100
      group-data-[theme=nebula]:bg-white/10 
      group-data-[theme=nebula]:backdrop-blur-md 
      group-data-[theme=nebula]:border-white/20
    `}>
      
      {/* TOOLBAR */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center 
        bg-gray-50 group-data-[theme=nebula]:bg-white/5 group-data-[theme=nebula]:border-white/10">
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap group-data-[theme=nebula]:text-white">Transactions</h2>
          <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-auto p-2
            group-data-[theme=nebula]:bg-white/10 group-data-[theme=nebula]:border-white/20 group-data-[theme=nebula]:text-white group-data-[theme=nebula]:*:bg-slate-800"
          >
            {months.map(m => (
              <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {selectedIds.size > 0 && (
                <button onClick={executeBulkDelete} className="w-full sm:w-auto bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
                <span>🗑️</span> Delete ({selectedIds.size})
                </button>
            )}
            <div className="relative w-full md:w-64">
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm
                group-data-[theme=nebula]:bg-white/10 group-data-[theme=nebula]:border-white/20 group-data-[theme=nebula]:text-white group-data-[theme=nebula]:placeholder-white/30"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 group-data-[theme=nebula]:text-white/50">🔍</span>
            </div>
        </div>
      </div>

      {/* ✅ DESKTOP VIEW (Table) - Hidden on Mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider
              group-data-[theme=nebula]:bg-white/5 group-data-[theme=nebula]:text-blue-200">
              <th className="px-6 py-4 w-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === sortedExpenses.length} className="rounded border-gray-300 text-blue-600" /></th>
              <th onClick={() => handleSort('date')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 group-data-[theme=nebula]:hover:bg-white/5">Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('category')} className="px-6 py-4 cursor-pointer hover:bg-gray-100 group-data-[theme=nebula]:hover:bg-white/5">Category</th>
              <th className="px-6 py-4">Description</th>
              <th onClick={() => handleSort('amount')} className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 group-data-[theme=nebula]:hover:bg-white/5">Amount</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 group-data-[theme=nebula]:divide-white/10">
            {sortedExpenses.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400 group-data-[theme=nebula]:text-blue-200">No transactions found.</td></tr>
            ) : (
              sortedExpenses.map((expense) => (
                <tr key={expense.id} className={`hover:bg-blue-50 transition-colors group-data-[theme=nebula]:hover:bg-white/5 ${selectedIds.has(expense.id) ? 'bg-blue-50 group-data-[theme=nebula]:bg-indigo-900/50' : ''}`}>
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(expense.id)} onChange={() => handleSelectOne(expense.id)} className="rounded border-gray-300 text-blue-600" /></td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium group-data-[theme=nebula]:text-gray-300">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-data-[theme=nebula]:bg-indigo-500/30 group-data-[theme=nebula]:text-indigo-100">{expense.category}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 group-data-[theme=nebula]:text-gray-400">{expense.description || '-'}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800 group-data-[theme=nebula]:text-white">₹{parseFloat(expense.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center"><button onClick={() => onDelete(expense.id)} className="text-gray-400 hover:text-red-500 transition-colors">🗑️</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MOBILE VIEW (Cards) - Hidden on Desktop */}
      <div className="md:hidden p-4 space-y-4">
        {sortedExpenses.length === 0 ? (
          <div className="text-center text-gray-400 group-data-[theme=nebula]:text-blue-200 py-8">No transactions found.</div>
        ) : (
          sortedExpenses.map((expense) => (
            <div 
              key={expense.id} 
              className={`p-4 rounded-xl border transition-colors 
                ${selectedIds.has(expense.id) 
                  ? 'bg-blue-50 border-blue-200 group-data-[theme=nebula]:bg-white/10 group-data-[theme=nebula]:border-white/30' 
                  : 'bg-white border-gray-100 group-data-[theme=nebula]:bg-transparent group-data-[theme=nebula]:border-white/10'}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedIds.has(expense.id)} onChange={() => handleSelectOne(expense.id)} className="rounded border-gray-300 text-blue-600" />
                  <div>
                    <span className="block text-sm font-bold text-gray-700 group-data-[theme=nebula]:text-white">{expense.category}</span>
                    <span className="text-xs text-gray-400 group-data-[theme=nebula]:text-blue-200">{new Date(expense.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-800 group-data-[theme=nebula]:text-white">₹{parseFloat(expense.amount).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 group-data-[theme=nebula]:border-white/10">
                <span className="text-sm text-gray-500 group-data-[theme=nebula]:text-gray-400 truncate max-w-[200px]">
                  {expense.description || 'No description'}
                </span>
                <button onClick={() => onDelete(expense.id)} className="text-gray-400 hover:text-red-500 p-1">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}