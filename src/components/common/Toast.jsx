import React from 'react';

/**
 * Global Toast Notification Component
 */
export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#151D1C] text-white text-xs font-sans rounded shadow-xl border border-[#354342] animate-in slide-in-from-bottom-5">
      <span className="material-symbols-outlined text-brand-gold text-base">
        {type === 'success' ? 'check_circle' : 'info'}
      </span>
      <span>{message}</span>
      <button 
        onClick={onClose} 
        className="ml-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}

export default Toast;
