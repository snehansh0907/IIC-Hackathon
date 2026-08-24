import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function AddInvoiceModal({ isOpen, onClose, onAdd }) {
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustCity, setNewCustCity] = useState('Pune, MH');
  const [newCustContact, setNewCustContact] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [custLoading, setCustLoading] = useState(false);

  // Invoice Form State
  const [amount, setAmount] = useState('');
  const [issued, setIssued] = useState('');
  const [due, setDue] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default dates
      const today = new Date().toISOString().slice(0, 10);
      const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      setIssued(today);
      setDue(thirtyDays);
      setErrorMessage(null);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setIsCreatingCustomer(false);

      // Load existing customers
      api.getCustomers('').then((list) => {
        setCustomers(Array.isArray(list) ? list : []);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCustomers = (customers || []).filter((c) => {
    const q = (customerSearch || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerSearch('');
    setIsDropdownOpen(false);
    setErrorMessage(null);
  };

  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      setErrorMessage('Customer / Company Name is required.');
      return;
    }

    setCustLoading(true);
    setErrorMessage(null);
    try {
      const created = await api.createCustomer({
        name: newCustName.trim(),
        city: newCustCity.trim() || 'Pune, MH',
        primaryContact: newCustContact.trim() || `${newCustName.trim().split(' ')[0]} Accounts Lead`,
        phone: newCustPhone.trim() || null,
        email: newCustEmail.trim() || null,
      });

      // Update local customers list
      setCustomers((prev) => {
        const exists = prev.some((c) => c.id === created.id);
        return exists ? prev : [created, ...prev];
      });

      // Automatically select newly created customer
      setSelectedCustomer(created);
      setIsCreatingCustomer(false);

      // Reset new customer inputs
      setNewCustName('');
      setNewCustContact('');
      setNewCustPhone('');
      setNewCustEmail('');
    } catch (err) {
      console.error('Error creating customer:', err);
      setErrorMessage(err.message || 'Failed to create customer record');
    } finally {
      setCustLoading(false);
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomer || !selectedCustomer.id) {
      setErrorMessage('Please search and select an existing customer or create a new customer.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid invoice amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        customerId: selectedCustomer.id,
        customer_id: selectedCustomer.id,
        customer: selectedCustomer.name,
        amount: numericAmount,
        issued: issued || new Date().toISOString().slice(0, 10),
        due: due || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        itemDescription: itemDescription || 'Fabrication & Engineering Deliverables',
      });
      onClose();
    } catch (err) {
      console.error('Error in invoice creation:', err);
      setErrorMessage(err.message || 'Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div
        className="w-full max-w-lg bg-white border border-[#E0DED7] rounded shadow-xl overflow-hidden animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DED7] bg-[#FBF9F4]">
          <div>
            <h3 className="text-base font-bold text-[#1B1C19]">
              {isCreatingCustomer ? 'Create New Customer' : 'Add New Invoice'}
            </h3>
            <p className="text-xs text-gray-500">
              {isCreatingCustomer
                ? 'Add a new client account to your verified receivables ledger.'
                : 'Record a new receivables invoice linked directly to a customer account.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* VIEW 1: CREATE NEW CUSTOMER FORM */}
        {isCreatingCustomer ? (
          <form onSubmit={handleCreateCustomerSubmit} className="p-6 space-y-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Customer / Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Industrial Works"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Pune, MH"
                  value={newCustCity}
                  onChange={(e) => setNewCustCity(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Primary Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={newCustContact}
                  onChange={(e) => setNewCustContact(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91-98765-43210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Billing Email</label>
                <input
                  type="email"
                  placeholder="e.g. accounts@apex.example"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0DED7] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCustomer(false);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 border border-[#E0DED7] rounded text-gray-700 hover:bg-gray-50 font-medium"
              >
                ← Back to Invoice Form
              </button>

              <button
                type="submit"
                disabled={custLoading}
                className="px-4 py-2 bg-[#151D1C] hover:bg-[#253231] text-white font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {custLoading ? (
                  <span className="material-symbols-outlined text-sm animate-spin text-brand-gold">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-brand-gold">check_circle</span>
                )}
                Save & Select Customer
              </button>
            </div>
          </form>
        ) : (
          /* VIEW 2: ADD INVOICE FORM */
          <form onSubmit={handleInvoiceSubmit} className="p-6 space-y-4 text-xs font-sans">
            {/* Customer Selector Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-gray-700">Customer / Client *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCustomer(true);
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-brand-dark hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-sm text-brand-gold">person_add</span>
                  + Create New Customer
                </button>
              </div>

              {selectedCustomer ? (
                /* Selected Customer Card */
                <div className="p-3 border border-[#E0DED7] rounded bg-[#FBF9F4] flex items-center justify-between shadow-xs">
                  <div>
                    <div className="font-bold text-sm text-[#1B1C19] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-green-700">verified</span>
                      {selectedCustomer.name}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {selectedCustomer.city || 'Pune, MH'} • {selectedCustomer.phone || selectedCustomer.email || 'Customer Account'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                    }}
                    className="text-xs font-semibold text-gray-700 hover:text-[#1B1C19] px-2.5 py-1 border border-[#E0DED7] rounded bg-white hover:bg-[#F5F3EE] transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                /* Customer Search Dropdown */
                <div className="relative">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search existing customers by name, city..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full pl-9 pr-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm"
                    />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0DED7] rounded shadow-lg max-h-48 overflow-y-auto z-20 divide-y divide-[#F5F3EE]">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-2.5 hover:bg-[#FBF9F4] cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-xs text-[#1B1C19]">{cust.name}</div>
                              <div className="text-[11px] text-gray-400 font-mono">
                                {cust.city || 'Pune, MH'} • {cust.phone || cust.email || 'Account'}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-gray-400">
                          No matching customer found.
                        </div>
                      )}

                      <div
                        onClick={() => {
                          setIsCreatingCustomer(true);
                          setNewCustName(customerSearch);
                          setIsDropdownOpen(false);
                        }}
                        className="p-2.5 bg-[#FDFCF9] hover:bg-amber-50/70 text-brand-dark font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-brand-gold">add_circle</span>
                        Create "{customerSearch || 'New Customer'}"
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount and Item Scope */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Invoice Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="150000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Item / Scope</label>
                <input
                  type="text"
                  placeholder="Machining & Parts"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm"
                />
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issued}
                  onChange={(e) => setIssued(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0DED7] rounded bg-[#FBF9F4] focus:bg-white focus:outline-none focus:border-brand-gold text-sm font-mono"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#E0DED7] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E0DED7] rounded text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#151D1C] hover:bg-[#253231] text-white font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-sm animate-spin text-brand-gold">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-brand-gold">add_circle</span>
                )}
                Save & Track Invoice
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function ImportInvoicesModal({ isOpen, onClose, onImportSuccess }) {
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleSimulateImport = (source) => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      onImportSuccess(source);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div 
        className="w-full max-w-lg bg-white border border-[#E0DED7] rounded shadow-xl overflow-hidden animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DED7] bg-[#FBF9F4]">
          <div>
            <h3 className="text-base font-bold text-[#1B1C19]">Import Invoices</h3>
            <p className="text-xs text-gray-500">Sync with your ERP, accounting software or upload CSV.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-sans">
          {importing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-3xl animate-spin text-brand-gold mb-3">
                sync
              </span>
              <p className="font-semibold text-sm text-[#1B1C19]">Syncing with accounting source...</p>
              <p className="text-xs text-gray-500 mt-1">Validating GSTIN records and computing risk scores.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div 
                onClick={() => handleSimulateImport('Tally Prime')}
                className="p-4 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded cursor-pointer text-center transition-all group"
              >
                <span className="material-symbols-outlined text-2xl text-amber-700 group-hover:scale-110 transition-transform mb-2">
                  account_balance_wallet
                </span>
                <div className="font-bold text-xs text-[#1B1C19]">Tally Prime</div>
                <div className="text-[10px] text-gray-500 mt-1">Direct XML Sync</div>
              </div>

              <div 
                onClick={() => handleSimulateImport('Zoho Books')}
                className="p-4 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded cursor-pointer text-center transition-all group"
              >
                <span className="material-symbols-outlined text-2xl text-blue-700 group-hover:scale-110 transition-transform mb-2">
                  cloud_sync
                </span>
                <div className="font-bold text-xs text-[#1B1C19]">Zoho Books</div>
                <div className="text-[10px] text-gray-500 mt-1">OAuth API Connect</div>
              </div>

              <div 
                onClick={() => handleSimulateImport('GSTR-1 Portal')}
                className="p-4 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded cursor-pointer text-center transition-all group"
              >
                <span className="material-symbols-outlined text-2xl text-green-700 group-hover:scale-110 transition-transform mb-2">
                  file_upload
                </span>
                <div className="font-bold text-xs text-[#1B1C19]">GSTR-1 / CSV</div>
                <div className="text-[10px] text-gray-500 mt-1">Upload JSON/Excel</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddInvoiceModal;
