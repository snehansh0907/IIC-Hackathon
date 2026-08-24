import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      api.getInvoices('All', '').then(res => setInvoices(res.invoices || []));
      api.getCustomers('').then(res => setCustomers(Array.isArray(res) ? res : []));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();

  const filteredInvoices = invoices.filter(inv => 
    (inv.id && inv.id.toLowerCase().includes(q)) || 
    (inv.customer && inv.customer.toLowerCase().includes(q))
  ).slice(0, 4);

  const filteredCustomers = customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.city && c.city.toLowerCase().includes(q))
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-[1px] p-4">
      <div 
        className="w-full max-w-xl bg-white border border-[#E0DED7] rounded shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3 border-b border-[#E0DED7] gap-3 bg-[#FBF9F4]">
          <span className="material-symbols-outlined text-gray-500 text-lg">search</span>
          <input
            type="text"
            placeholder="Search invoices, customers, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-sm text-[#1B1C19] placeholder:text-gray-400 font-sans"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-300 rounded text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() === '' && (
            <div className="px-3 py-2 text-xs text-gray-400 font-sans">
              Quick suggestions: Type an invoice number (e.g. <span className="font-mono text-gray-600">INV-ABC-1001</span>) or customer name (e.g. <span className="font-mono text-gray-600">ABC Construction</span>).
            </div>
          )}

          {filteredInvoices.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Invoices
              </div>
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => {
                    navigate(`/invoice/${inv.id}`);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-[#F5F3EE] rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-gray-400">receipt_long</span>
                    <span className="font-mono text-xs font-semibold text-[#1B1C19]">{inv.id}</span>
                    <span className="text-xs text-gray-600">— {inv.customer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-[#1B1C19]">{inv.amount}</span>
                    <span className="text-[11px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-mono">{inv.delayText}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredCustomers.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Customers
              </div>
              {filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => {
                    navigate(`/customers`);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-[#F5F3EE] rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-gray-400">business</span>
                    <span className="text-xs font-medium text-[#1B1C19]">{cust.name}</span>
                    <span className="text-[11px] text-gray-400 font-mono">({cust.city || 'Pune, MH'})</span>
                  </div>
                  <span className="font-mono text-xs text-gray-700">Owed: {cust.outstanding || '₹0'}</span>
                </div>
              ))}
            </div>
          )}

          {filteredInvoices.length === 0 && filteredCustomers.length === 0 && query.trim() !== '' && (
            <div className="py-6 text-center text-xs text-gray-500">
              No matching invoices or customers found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#151D1C] text-white text-xs font-sans rounded shadow-lg border border-gray-700 animate-in slide-in-from-bottom-5">
      <span className="material-symbols-outlined text-brand-gold text-base">
        {type === 'success' ? 'check_circle' : 'info'}
      </span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}

export default SearchModal;
