import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, addDoc, collection } from 'firebase/firestore'; 
import { auth, db } from './firebaseConfig'; 
import { createUserModel, createExpenseModel, COLLECTIONS } from './models'; 
import BudgetCard from './components/BudgetCard';
import AddExpenseForm from './components/AddExpenseForm';
import RecentTransactions from './components/RecentTransactions';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- AUTH SETUP ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await saveUserToFirestore(currentUser);
      }
      setLoading(false);
      setIsLoggingIn(false);
    });
    return () => unsubscribe();
  }, []);

  // --- BUDGET LISTENER ---
  useEffect(() => {
    if (user) {
      const budgetRef = doc(db, COLLECTIONS.BUDGETS, user.uid);
      const unsubscribe = onSnapshot(budgetRef, (docSnap) => {
        if (docSnap.exists()) {
          setBudgetLimit(docSnap.data().limit);
        } else {
          setBudgetLimit(0);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // --- DATABASE HELPERS ---
  const handleSaveBudget = async (newAmount) => {
    if (!user) return;
    try {
      const budgetRef = doc(db, COLLECTIONS.BUDGETS, user.uid);
      await setDoc(budgetRef, { 
        limit: newAmount, 
        userId: user.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      // Alert removed for smoother experience
      console.log("Budget saved silently");
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const saveUserToFirestore = async (user) => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const newProfile = createUserModel(user);
        await setDoc(userRef, newProfile);
      }
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  };

  const handleAddExpense = async (formData) => {
    if (!user) return;
    try {
      const newExpense = createExpenseModel(
        user.uid,
        formData.amount,
        formData.category,
        formData.description,
        formData.date
      );
      const expensesRef = collection(db, COLLECTIONS.EXPENSES);
      await addDoc(expensesRef, newExpense);
      // ✅ Alert Removed! The list below updates automatically, so that is enough feedback.
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("❌ Failed to save transaction"); // We keep the ERROR alert just in case
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setBudgetLimit(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-sm p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Expense Tracker</h1>
          <p className="text-gray-500 mb-8">Sign in to manage your budget</p>
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-600">💰 Tracker</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
            <span>📊</span> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl font-medium transition-colors">
            <span>📝</span> Transactions
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl font-medium transition-colors">
            <span>🤖</span> AI Advisor
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center gap-3 px-2 mb-4">
              {user.photoURL && (
                <img src={user.photoURL} referrerPolicy="no-referrer" alt="User" className="w-8 h-8 rounded-full" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700 truncate w-32">{user.displayName}</span>
                <span className="text-xs text-gray-400">Free Plan</span>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full text-xs text-red-500 hover:text-red-700 font-semibold text-center">
             Sign Out
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen relative">
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
          <span className="text-lg font-bold text-blue-600">💰 Tracker</span>
          <button onClick={handleLogout} className="text-sm text-gray-500">Log Out</button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-gray-500">Overview of your finances</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BudgetCard initialBudget={budgetLimit} onSave={handleSaveBudget} />
              <AddExpenseForm onSave={handleAddExpense} />
            </div>

            <RecentTransactions userId={user.uid} />

          </div>
        </main>
      </div>
    </div>
  );
}