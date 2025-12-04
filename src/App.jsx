import { useState, useEffect } from 'react';
// 👇 This imports the specific connection we set up in Step 5
import { auth, db } from './firebaseConfig'; 

export default function App() {
  const [status, setStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // We check if the imports are valid
    if (auth && db) {
      setStatus("Firebase App Initialized successfully! ✅");
      setIsConnected(true);
      console.log("Auth object:", auth); // Logs to Chrome Console (F12)
    } else {
      setStatus("Failed to initialize Firebase ❌");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      
      {/* Main Card */}
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-1">Expense Tracker</h1>
          <p className="text-blue-100 text-sm">Manage your money wisely</p>
        </div>

        {/* Status Section */}
        <div className="p-6">
          <div className={`p-4 rounded-lg border-l-4 mb-6 ${isConnected ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
            <h3 className="font-bold text-lg mb-1">System Status</h3>
            <p className="text-sm">{status}</p>
          </div>

          <div className="space-y-4">
            <div className="h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
              <span className="text-2xl mb-1">📊</span>
              <span className="text-sm">Chart Placeholder</span>
            </div>
            
            <div className="h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">G</div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-700">Groceries</span>
                  <span className="text-xs text-gray-500">Today, 10:23 AM</span>
                </div>
              </div>
              <span className="font-bold text-red-500">-$45.00</span>
            </div>
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
