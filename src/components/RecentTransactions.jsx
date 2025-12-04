import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLLECTIONS } from '../models';

export default function RecentTransactions({ userId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const expensesRef = collection(db, COLLECTIONS.EXPENSES);
    const q = query(expensesRef, where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort & Slice
      fetchedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recentOnes = fetchedExpenses.slice(0, 5);

      setExpenses(recentOnes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">Recent Transactions</h3>
        {/* SKELETON LOADER UI */}
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="h-2 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-gray-400">
        <span className="text-4xl mb-2">💸</span>
        <p>No expenses yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">Recent Transactions</h3>
      
      <div className="space-y-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {expense.category.charAt(0)}
              </div>
              
              <div className="flex flex-col">
                <span className="font-bold text-gray-700 text-sm">{expense.category}</span>
                <span className="text-xs text-gray-400">{expense.description}</span>
              </div>
            </div>
            
            <div className="text-right">
              <span className="font-bold text-gray-800 block">-${parseFloat(expense.amount).toFixed(2)}</span>
              <span className="text-xs text-gray-400">{expense.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}