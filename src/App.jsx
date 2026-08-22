import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, signInWithRedirect, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
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
import ThemesView from './components/ThemesView';
import { Capacitor } from '@capacitor/core';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState('default');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // --- AUTH & LISTENERS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) await saveUserToFirestore(currentUser);
      setLoading(false);
      setIsLoggingIn(false);
    });
    return () => unsubscribe();
  }, []);

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
  const dailySpent = monthlyExpenses.filter(item => item.date === today).reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const weeklySpent = monthlyExpenses.filter(item => item.date >= sevenDaysAgoStr && item.date <= today).reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);

  // --- HANDLERS ---
  const handleSaveBudget = async (newAmount) => { try { await setDoc(doc(db, COLLECTIONS.BUDGETS, user.uid), { limit: newAmount, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true }); showToast("Budget updated!", "success"); } catch (error) { console.error("Save budget failed:", error.code, error.message); showToast(`Failed: ${error.code || error.message}`, "error"); } };
  const saveUserToFirestore = async (user) => { try { const userRef = doc(db, COLLECTIONS.USERS, user.uid); const snap = await getDoc(userRef); if (!snap.exists()) await setDoc(userRef, createUserModel(user)); } catch (error) { console.error(error); } };
  const handleAddExpense = async (formData) => { if (!user) return; try { await addDoc(collection(db, COLLECTIONS.EXPENSES), createExpenseModel(user.uid, formData.amount, formData.category, formData.description, formData.date)); showToast("Added!", "success"); } catch (error) { console.error("Add expense failed:", error.code, error.message); showToast(`Failed: ${error.code || error.message}`, "error"); } };
  const handleDeleteExpense = async (id) => { if (confirm("Delete?")) { try { await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id)); showToast("Deleted.", "info"); } catch (error) { showToast("Failed.", "error"); } } };
  const handleBulkDelete = async (ids) => { try { const batch = writeBatch(db); ids.forEach(id => batch.delete(doc(db, COLLECTIONS.EXPENSES, id))); await batch.commit(); showToast(`Deleted ${ids.length}.`, "info"); } catch (error) { showToast("Failed.", "error"); } };
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      // ✅ SMART CHECK: 
      // If we are on a Phone (Native), use Redirect.
      // If we are on a PC (Web), use Popup.
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
        showToast("Welcome back!", "success");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoggingIn(false);
      showToast("Login failed. Try again.", "error");
    }
  };
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          showToast("Welcome back!", "success");
          // The main onAuthStateChanged listener will handle the rest
        }
      } catch (error) {
        console.error("Redirect login error:", error);
        setIsLoggingIn(false);
      }
    };
    checkRedirect();
  }, []);
  const handleLogout = () => { signOut(auth); setBudgetLimit(0); setMonthlyExpenses([]); setCurrentView('dashboard'); showToast("Logged out.", "info"); };
  const handleNavClick = (view) => { setCurrentView(view); setIsMobileMenuOpen(false); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        
        {/* Optional: Decorative Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        {/* Toast Notification */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* LOGIN CARD */}
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-md p-10 text-center border border-white/50 relative z-10">
          
          {/* Logo / Icon */}
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-4xl">💰</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Good to see you again</h1>
          <p className="text-gray-500 mb-8">Track your expenses, analyze your spending, and save more with AI.</p>
          
          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-6 rounded-xl border border-gray-200 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {isLoggingIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <>
                {/* Google "G" Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 4.61c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <p className="mt-8 text-xs text-gray-400">
            By signing in, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  // --- 🎨 THEME LOGIC ---
  // Any of these themes trigger "Dark Mode" behavior in children
  const isDarkTheme = theme === 'nebula' || theme === 'cherry' || theme === 'midnight';

  // Background Gradients
  let appBgClass = 'bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800'; // Default
  if (theme === 'nebula') appBgClass = 'bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 text-white';
  if (theme === 'cherry') appBgClass = 'bg-gradient-to-br from-pink-600 via-purple-600 to-yellow-400 text-white';
  if (theme === 'midnight') appBgClass = 'bg-gradient-to-br from-gray-900 via-emerald-950 to-black text-white'; // ✅ Midnight Green

  const sidebarClass = isDarkTheme ? 'bg-black/20 border-white/10 backdrop-blur-lg' : 'bg-white border-gray-200';
  
  // Reusable card style
  const cardClass = `p-6 rounded-2xl shadow-sm border transition-all duration-300 ${isDarkTheme ? 'bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl' : 'bg-white border-gray-100 text-gray-800'}`;
  const textMuted = isDarkTheme ? 'text-white/60' : 'text-gray-400';
  const textHeading = isDarkTheme ? 'text-white' : 'text-gray-800';

  return (
    // We pass 'nebula' to data-theme if it's ANY dark theme, so children use the glass styles
    <div data-theme={isDarkTheme ? 'nebula' : 'default'} className={`group flex h-screen font-sans overflow-hidden transition-colors duration-500 ${appBgClass}`}>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className={`fixed inset-y-0 left-0 w-64 p-4 flex flex-col shadow-2xl animate-slide-right ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
             <div className="h-16 flex items-center px-2 mb-4 border-b border-white/10">
                <span className="text-xl font-bold">💰 Tracker</span>
                <button className="ml-auto opacity-70" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
             </div>
             <nav className="space-y-2">
                {['dashboard', 'transactions', 'themes'].map(id => (
                  <button key={id} onClick={() => handleNavClick(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${currentView === id ? 'bg-white/20' : 'opacity-70'}`}>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </button>
                ))}
             </nav>
          </div>
        </div>
      )}

      <aside className={`hidden md:flex w-64 flex-col z-10 border-r transition-colors duration-300 ${sidebarClass}`}>
        <div className={`h-16 flex items-center px-6 border-b ${isDarkTheme ? 'border-white/10' : 'border-gray-100'}`}>
          <span className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-blue-600'}`}>💰 Tracker</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'transactions', label: 'Transactions', icon: '📝' },
            { id: 'themes', label: 'Themes', icon: '🎨' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                ${currentView === item.id 
                  ? (isDarkTheme ? 'bg-white/20 text-white shadow-lg' : 'bg-blue-50 text-blue-700') 
                  : (isDarkTheme ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600')
                }
              `}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <button onClick={() => setIsChatOpen(true)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isDarkTheme ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
            <span>🤖</span> AI Advisor
          </button>
        </nav>
        <div className={`p-4 border-t ${isDarkTheme ? 'border-white/10' : 'border-gray-100'}`}>
           <div className="flex items-center gap-3 px-2 mb-4">
              {user.photoURL && <img src={user.photoURL} referrerPolicy="no-referrer" alt="User" className="w-8 h-8 rounded-full border-2 border-white/50" />}
              <span className={`text-sm font-bold truncate w-32 ${isDarkTheme ? 'text-white' : 'text-gray-700'}`}>{user.displayName}</span>
           </div>
           <button onClick={handleLogout} className="w-full text-xs text-red-400 hover:text-red-300 font-semibold text-center">Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen relative">
        <header className={`md:hidden h-16 border-b flex items-center justify-between px-4 z-20 ${isDarkTheme ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200'}`}>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl">☰</button>
          <span className="text-lg font-bold">💰 Tracker</span>
          <div className="w-8"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div className="ml-4">
                <h2 className={`text-2xl font-bold ${textHeading}`}>
                  {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                </h2>
                <p className={`${textMuted}`}>Overview of your finances</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${isDarkTheme ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {currentView === 'dashboard' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className={cardClass}>
                            <p className={`${textMuted} text-xs uppercase font-bold tracking-wider mb-1`}>Total Spent</p>
                            <h3 className="text-2xl font-bold">₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className={`${textMuted} text-xs mt-2`}>This Month</p>
                        </div>
                        <div className={cardClass}>
                            <p className={`${textMuted} text-xs uppercase font-bold tracking-wider mb-1`}>Remaining</p>
                            <h3 className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-400' : ''}`}>₹{remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className={`${textMuted} text-xs mt-2`}>{remainingBudget < 0 ? '⚠️ Over Budget' : 'Available'}</p>
                        </div>
                        <div className={cardClass}>
                            <p className={`${textMuted} text-xs uppercase font-bold tracking-wider mb-1`}>Today</p>
                            <h3 className="text-2xl font-bold">₹{dailySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className={`${textMuted} text-xs mt-2`}>Daily Total</p>
                        </div>
                        <div className={cardClass}>
                            <p className={`${textMuted} text-xs uppercase font-bold tracking-wider mb-1`}>Last 7 Days</p>
                            <h3 className="text-2xl font-bold">₹{weeklySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className={`${textMuted} text-xs mt-2`}>Rolling Total</p>
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
            )}

            {currentView === 'transactions' && (
                <TransactionsView 
                    expenses={monthlyExpenses} 
                    onDelete={handleDeleteExpense} 
                    onBulkDelete={handleBulkDelete}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                />
            )}

            {currentView === 'themes' && (
               <ThemesView currentTheme={theme} onThemeChange={setTheme} />
            )}
          </div>
        </main>

        <AIChatWindow 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          financialData={{ budget: budgetLimit, totalSpent, expenses: monthlyExpenses, dailySpent }}
        />
      </div>
    </div>
  );
}