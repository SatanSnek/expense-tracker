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
import ThemesView from './components/ThemesView';

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
  const handleSaveBudget = async (newAmount) => { try { await setDoc(doc(db, COLLECTIONS.BUDGETS, user.uid), { limit: newAmount, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true }); showToast("Budget updated!", "success"); } catch (error) { showToast("Failed.", "error"); } };
  const saveUserToFirestore = async (user) => { try { const userRef = doc(db, COLLECTIONS.USERS, user.uid); const snap = await getDoc(userRef); if (!snap.exists()) await setDoc(userRef, createUserModel(user)); } catch (error) { console.error(error); } };
  const handleAddExpense = async (formData) => { if (!user) return; try { await addDoc(collection(db, COLLECTIONS.EXPENSES), createExpenseModel(user.uid, formData.amount, formData.category, formData.description, formData.date)); showToast("Added!", "success"); } catch (error) { showToast("Failed.", "error"); } };
  const handleDeleteExpense = async (id) => { if (confirm("Delete?")) { try { await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id)); showToast("Deleted.", "info"); } catch (error) { showToast("Failed.", "error"); } } };
  const handleBulkDelete = async (ids) => { try { const batch = writeBatch(db); ids.forEach(id => batch.delete(doc(db, COLLECTIONS.EXPENSES, id))); await batch.commit(); showToast(`Deleted ${ids.length}.`, "info"); } catch (error) { showToast("Failed.", "error"); } };
  const handleGoogleLogin = async () => { setIsLoggingIn(true); try { await signInWithPopup(auth, new GoogleAuthProvider()); showToast("Welcome!", "success"); } catch (error) { setIsLoggingIn(false); showToast("Login failed.", "error"); } };
  const handleLogout = () => { signOut(auth); setBudgetLimit(0); setMonthlyExpenses([]); setCurrentView('dashboard'); showToast("Logged out.", "info"); };
  const handleNavClick = (view) => { setCurrentView(view); setIsMobileMenuOpen(false); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><button onClick={handleGoogleLogin} className="bg-blue-600 text-white px-6 py-3 rounded-xl">Sign in with Google</button></div>;

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