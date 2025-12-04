import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, addDoc, collection, query, where, deleteDoc, writeBatch } from 'firebase/firestore'; 
import { auth, db } from './firebaseConfig'; 
import { createUserModel, createExpenseModel, COLLECTIONS } from './models'; 
import BudgetCard from './components/BudgetCard';
import AddExpenseForm from './components/AddExpenseForm';
import RecentTransactions from './components/RecentTransactions';
import CategoryChart from './components/CategoryChart';
import TransactionsView from './components/TransactionsView';
import AIChatWindow from './components/AIChatWindow';
import Toast from './components/Toast';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // ✅ DAY 28: Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

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

  // --- LISTENERS ---
  useEffect(() => {
    if (user) {
      const budgetRef = doc(db, COLLECTIONS.BUDGETS, user.uid);
      const unsubscribe = onSnapshot(budgetRef, (docSnap) => {
        if (docSnap.exists()) setBudgetLimit(docSnap.data().limit);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const [year, month] = selectedMonth.split('-');
      const startOfMonth = `${selectedMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate(); 
      const endOfMonth = `${selectedMonth}-${lastDay}`;

      const expensesRef = collection(db, COLLECTIONS.EXPENSES);
      const q = query(
        expensesRef, 
        where("userId", "==", user.uid),
        where("date", ">=", startOfMonth),
        where("date", "<=", endOfMonth)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMonthlyExpenses(fetched);
      });
      return () => unsubscribe();
    }
  }, [user, selectedMonth]);

  // --- CALCULATIONS ---
  const totalSpent = monthlyExpenses.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  const remainingBudget = budgetLimit - totalSpent;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const dailySpent = monthlyExpenses
    .filter(item => item.date === today)
    .reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const weeklySpent = monthlyExpenses
    .filter(item => item.date >= sevenDaysAgoStr && item.date <= today)
    .reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);


  // --- HANDLERS ---
  const handleSaveBudget = async (newAmount) => {
    if (!user) return;
    try {
      const budgetRef = doc(db, COLLECTIONS.BUDGETS, user.uid);
      await setDoc(budgetRef, { 
        limit: newAmount, 
        userId: user.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("Budget updated!", "success");
    } catch (error) {
      console.error("Error saving budget:", error);
      showToast("Failed to save budget.", "error");
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
      showToast("Transaction added!", "success");
    } catch (error) {
      console.error("Error adding expense:", error);
      showToast("Failed to add transaction.", "error");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.EXPENSES, expenseId));
      showToast("Transaction deleted.", "info");
    } catch (error) {
      console.error("Error deleting expense:", error);
      showToast("Failed to delete.", "error");
    }
  };

  const handleBulkDelete = async (idsToDelete) => {
    try {
        const batch = writeBatch(db);
        idsToDelete.forEach(id => {
            const docRef = doc(db, COLLECTIONS.EXPENSES, id);
            batch.delete(docRef);
        });
        await batch.commit();
        showToast(`Deleted ${idsToDelete.length} transactions.`, "info");
    } catch (error) {
        console.error("Error deleting expenses:", error);
        showToast("Bulk delete failed.", "error");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast("Welcome back!", "success");
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoggingIn(false);
      showToast("Login failed.", "error");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setBudgetLimit(0);
    setMonthlyExpenses([]);
    setCurrentView('dashboard');
    showToast("Logged out successfully.", "info");
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false); // Close menu on click
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-sm p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Expense Tracker</h1>
          <button onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 font-sans overflow-hidden">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ✅ MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          
          {/* Drawer Container */}
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-white p-4 flex flex-col shadow-2xl animate-slide-right" 
            onClick={e => e.stopPropagation()}
          >
             <div className="h-16 flex items-center px-2 mb-4 border-b border-gray-100">
                <span className="text-xl font-bold text-blue-600">💰 Tracker</span>
                <button className="ml-auto text-gray-500 hover:text-red-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
             </div>
             
             <nav className="space-y-2">
                <button onClick={() => handleNavClick('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>📊 Dashboard</button>
                <button onClick={() => handleNavClick('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${currentView === 'transactions' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>📝 Transactions</button>
                <button onClick={() => { setIsChatOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600">🤖 AI Advisor</button>
             </nav>
             
             <div className="mt-auto pt-4 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full text-red-500 font-bold py-2 hover:bg-red-50 rounded-xl transition-colors">Sign Out</button>
             </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-600">💰 Tracker</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
            <span>📊</span> Dashboard
          </button>
          <button onClick={() => setCurrentView('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'transactions' ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
            <span>📝</span> Transactions
          </button>
          <button onClick={() => setIsChatOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl font-medium transition-colors">
            <span>🤖</span> AI Advisor
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center gap-3 px-2 mb-4">
              {user.photoURL && <img src={user.photoURL} referrerPolicy="no-referrer" alt="User" className="w-8 h-8 rounded-full" />}
              <span className="text-sm font-bold text-gray-700 truncate w-32">{user.displayName}</span>
           </div>
           <button onClick={handleLogout} className="w-full text-xs text-red-500 hover:text-red-700 font-semibold text-center">Sign Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* ✅ MOBILE HEADER (With Hamburger) */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-gray-700">☰</button>
          <span className="text-lg font-bold text-blue-600">💰 Tracker</span>
          <div className="w-8"></div> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{currentView === 'dashboard' ? 'Dashboard' : 'Transactions'}</h2>
                <p className="text-gray-500">{currentView === 'dashboard' ? 'Overview of your finances' : 'Manage your expenses'}</p>
              </div>
              <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {/* ✅ UPDATED: Shows "Friday, December 5, 2025" */}
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>

            {currentView === 'dashboard' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Total Spent</p>
                            <h3 className="text-2xl font-bold text-gray-800">₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-gray-400 mt-2">This Month</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Remaining</p>
                            <h3 className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-500' : 'text-gray-800'}`}>₹{remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-gray-400 mt-2">{remainingBudget < 0 ? '⚠️ Over Budget' : 'Available'}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Today</p>
                            <h3 className="text-2xl font-bold text-gray-800">₹{dailySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-gray-400 mt-2">Daily Total</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Last 7 Days</p>
                            <h3 className="text-2xl font-bold text-gray-800">₹{weeklySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-gray-400 mt-2">Rolling Total</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <BudgetCard initialBudget={budgetLimit} spent={totalSpent} onSave={handleSaveBudget} />
                        <AddExpenseForm onSave={handleAddExpense} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2"><RecentTransactions userId={user.uid} /></div>
                        <div className="h-full"><CategoryChart expenses={monthlyExpenses} /></div>
                    </div>
                </>
            ) : (
                <TransactionsView 
                    expenses={monthlyExpenses} 
                    onDelete={handleDeleteExpense} 
                    onBulkDelete={handleBulkDelete}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                />
            )}
          </div>
        </main>

        <AIChatWindow 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          financialData={{
            budget: budgetLimit,
            totalSpent: totalSpent,
            expenses: monthlyExpenses
          }}
        />
      </div>
    </div>
  );
}