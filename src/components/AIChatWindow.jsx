import { useState, useEffect, useRef } from 'react';
import { fetchGeminiResponse } from '../gemini'; 

// ✅ ACCEPT NEW PROP: financialData
export default function AIChatWindow({ isOpen, onClose, onToggle, financialData }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Financial Advisor. Ask me anything about your spending!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ✅ HELPER: Turn raw data into a text story for the AI
  const generateContextString = () => {
    if (!financialData) return "No financial data available.";

    const { budget, totalSpent, expenses } = financialData;
    
    // Group expenses by category for summary
    const catTotals = {};
    expenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount);
    });
    
    const categoryText = Object.entries(catTotals)
      .map(([cat, val]) => `${cat}: ₹${val.toFixed(2)}`)
      .join(', ');

    return `
      Current Month Budget: ₹${budget}
      Total Spent So Far: ₹${totalSpent.toFixed(2)}
      Remaining: ₹${(budget - totalSpent).toFixed(2)}
      Spending Breakdown by Category: ${categoryText}
      Recent Transactions Count: ${expenses.length}
    `;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const userMsg = { role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // ✅ DAY 26: Generate the REAL context right before sending
      const realContext = generateContextString();
      
      console.log("📤 Sending to Gemini with Context:", realContext); // Debug log

      const aiResponseText = await fetchGeminiResponse(userText, realContext);
      
      const aiMsg = { role: 'assistant', text: aiResponseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Connection error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50"
      >
        <span className="text-2xl">🤖</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-96 sm:h-[500px] bg-white sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-[60] overflow-hidden animate-fade-in-up">
      <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">🤖</div>
          <div>
            <h3 className="font-bold text-sm">Financial Advisor</h3>
            <p className="text-xs text-blue-100">Powered by Gemini</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-gray-200 text-gray-500 text-xs px-3 py-2 rounded-xl rounded-tl-none animate-pulse">Thinking...</div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about finances..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        />
        <button type="submit" disabled={!input.trim() || isTyping} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors">➤</button>
      </form>
    </div>
  );
}