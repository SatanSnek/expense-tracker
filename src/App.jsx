import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
// 👇 IMPORTING AUTH FROM YOUR CONFIG FILE
import { auth, db } from './firebaseConfig'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 1. SETUP: Listen for login state changes
  useEffect(() => {
    // This runs automatically when you refresh the page
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); 
      setIsLoggingIn(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. ACTION: Log in with Google
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

  // 3. ACTION: Log out
  const handleLogout = () => {
    signOut(auth);
  };

  // --- VIEW 1: LOGIN SCREEN (If no user) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-500 mb-8">Sign in to track your expenses</p>
          
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD (If user is logged in) ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
        
        {/* Header with User Info */}
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">My Expenses</h1>
            <p className="text-blue-100 text-xs">Welcome, {user.displayName}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-blue-500 hover:bg-blue-400 text-xs py-1 px-3 rounded-full transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
            {user.photoURL && (
                <img 
                src={user.photoURL} 
                alt="User" 
                className="w-12 h-12 rounded-full mb-2 border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
                />
            )}
            <span className="text-sm">You are logged in!</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-md">
            + Add Transaction
          </button>
        </div>

      </div>
    </div>
  );
}