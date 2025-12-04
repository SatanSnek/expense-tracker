import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { auth, db } from './firebaseConfig'; 
import { createUserModel, COLLECTIONS } from './models'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- AUTH & PERSISTENCE LOGIC (Day 6) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoggingIn(false);
      if (currentUser) {
        await saveUserToFirestore(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

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
  };

  // --- VIEW 1: LOGIN SCREEN (Unchanged) ---
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

  // --- VIEW 2: APP SHELL (Day 7 Layout) ---
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* SIDEBAR (Desktop only - hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-600">💰 Tracker</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {/* Active Link */}
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
            <span>📊</span> Dashboard
          </button>
          
          {/* Inactive Links (Placeholders for future weeks) */}
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
            <span>📝</span> Transactions
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen relative">
        
        {/* MOBILE HEADER (Visible only on small screens) */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
          <span className="text-lg font-bold text-blue-600">💰 Tracker</span>
          <button onClick={handleLogout} className="text-sm text-gray-500">Log Out</button>
        </header>

        {/* SCROLLABLE CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-gray-500">Overview of your finances</p>
            </div>

            {/* Week 1 Completion Badge */}
            <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="font-bold">Week 1 Complete!</h3>
                <p className="text-sm">You have set up the Environment, Authentication, Database, and Layout.</p>
              </div>
            </div>

            {/* Placeholders for Week 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
              <div className="h-32 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                Budget Card (Coming Soon)
              </div>
              <div className="h-32 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                Add Expense (Coming Soon)
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}