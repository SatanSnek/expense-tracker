import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Colors based on type
  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-500',
    info: 'bg-blue-600'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div className="fixed top-6 right-6 z-[100] animate-slide-in">
      <div className={`${bgColors[type]} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <span className="text-xl">{icons[type]}</span>
        <div>
          <h4 className="font-bold text-sm capitalize">{type}</h4>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="ml-auto text-white/50 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}