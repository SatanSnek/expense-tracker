import { useState } from 'react';
import { EXPENSE_CATEGORIES } from '../models';

export default function AddExpenseForm({ onSave }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave({ amount, category, date, description });
    setAmount('');
    setDescription('');
    setIsSubmitting(false);
  };

  return (
    <div className={`
      p-6 rounded-2xl shadow-sm border transition-all duration-300
      bg-white border-gray-100
      /* ✅ THEME STYLES */
      group-data-[theme=nebula]:bg-white/10 
      group-data-[theme=nebula]:backdrop-blur-md 
      group-data-[theme=nebula]:border-white/20
    `}>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4 group-data-[theme=nebula]:text-blue-200">
        Add New Expense
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 group-data-[theme=nebula]:text-gray-300">Amount (₹)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold 
                group-data-[theme=nebula]:bg-white/5 
                group-data-[theme=nebula]:border-white/10 
                group-data-[theme=nebula]:text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 group-data-[theme=nebula]:text-gray-300">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm
                group-data-[theme=nebula]:bg-white/5 
                group-data-[theme=nebula]:border-white/10 
                group-data-[theme=nebula]:text-white
                group-data-[theme=nebula]:[color-scheme:dark]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 group-data-[theme=nebula]:text-gray-300">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm
              group-data-[theme=nebula]:bg-white/5 
              group-data-[theme=nebula]:border-white/10 
              group-data-[theme=nebula]:text-white
              group-data-[theme=nebula]:*:bg-slate-800"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 group-data-[theme=nebula]:text-gray-300">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm
              group-data-[theme=nebula]:bg-white/5 
              group-data-[theme=nebula]:border-white/10 
              group-data-[theme=nebula]:text-white
              group-data-[theme=nebula]:placeholder-white/30"
            placeholder="e.g. Lunch with team"
          />
        </div>

        <button
          type="submit"
          disabled={!amount || isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center
            group-data-[theme=nebula]:bg-indigo-500 group-data-[theme=nebula]:hover:bg-indigo-400"
        >
          {isSubmitting ? 'Adding...' : '+ Add Transaction'}
        </button>

      </form>
    </div>
  );
}