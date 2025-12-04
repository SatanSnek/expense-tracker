import { useState } from 'react';

export default function TransactionsView({ 
  expenses = [], 
  onDelete, 
  onBulkDelete, 
  selectedMonth, 
  onMonthChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());

  // --- FILTER & SORT ---
  const filteredExpenses = expenses.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- BULK SELECTION ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(sortedExpenses.map(item => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const executeBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} transactions?`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set()); // Clear selection
    }
  };

  // Generate last 12 months for dropdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7); // "2024-03"
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* TOOLBAR */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Transactions</h2>
          
          {/* ✅ MONTH SELECTOR */}
          <select 
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
          >
            {months.map(m => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            {/* ✅ BULK DELETE BUTTON */}
            {selectedIds.size > 0 && (
                <button 
                onClick={executeBulkDelete}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors flex items-center gap-2"
                >
                <span>🗑️</span> Delete ({selectedIds.size})
                </button>
            )}

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
                <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {/* CHECKBOX HEADER */}
              <th className="px-6 py-4 w-4">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedIds.size > 0 && selectedIds.size === sortedExpenses.length}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th onClick={() => handleSort('date')} className="px-6 py-4 cursor-pointer hover:bg-gray-100">
                Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('category')} className="px-6 py-4 cursor-pointer hover:bg-gray-100">
                Category
              </th>
              <th className="px-6 py-4">Description</th>
              <th onClick={() => handleSort('amount')} className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100">
                Amount
              </th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedExpenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                  No transactions found for this month.
                </td>
              </tr>
            ) : (
              sortedExpenses.map((expense) => (
                <tr key={expense.id} className={`hover:bg-blue-50 transition-colors ${selectedIds.has(expense.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(expense.id)}
                      onChange={() => handleSelectOne(expense.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {expense.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                    ₹{parseFloat(expense.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onDelete(expense.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}