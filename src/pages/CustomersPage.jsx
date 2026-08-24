import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { RiskBadge } from '../components/common/StatusBadge';

export function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = () => {
    api.getCustomers(search).then(res => {
      setCustomers(Array.isArray(res) ? res : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <main className="w-full max-w-container-max mx-auto px-edge-margin py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B1C19] tracking-tight mb-1">
          Customers
        </h1>
        <p className="text-sm text-gray-600 font-sans">
          Customer intelligence at a glance.
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#E0DED7] rounded shadow-subtle overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-[#E0DED7] bg-[#FDFCF9] flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search customers by name, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F5F3EE] border-none text-xs text-[#1B1C19] rounded pl-9 pr-4 py-2 focus:ring-1 focus:ring-[#737877] outline-none font-sans placeholder:text-gray-400"
            />
          </div>

          <div className="text-xs font-mono text-gray-500">
            {customers.length} Accounts Monitored
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E0DED7] bg-[#F5F3EE]/50 text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-right">Avg. Payment Time</th>
                <th className="py-3 px-4 text-right">Reliability</th>
                <th className="py-3 px-4 text-center">Current Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DED7] text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 font-mono">
                    <span className="material-symbols-outlined animate-spin text-brand-gold text-lg align-middle mr-2">progress_activity</span>
                    Loading customer intelligence...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 font-sans">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const name = c.name || 'Unnamed Customer';
                  const city = c.city || 'Pune, MH';
                  const totalInvoices = c.totalInvoices ?? 0;
                  const outstanding = c.outstanding || '₹0';
                  const avgPaymentTime = c.avgPaymentTime || `${c.average_payment_days || 14} days`;
                  const reliabilityNum = Number(c.reliabilityNum ?? c.payment_reliability ?? 75);
                  const reliability = c.reliability || `${reliabilityNum}%`;
                  const currentRisk = c.currentRisk || 'Low';
                  const riskScore = c.riskScore || 25;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-[#FBF9F4] cursor-pointer transition-colors group"
                    >
                      {/* Customer Name & City */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-[#1B1C19] group-hover:text-amber-900">
                          {name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {city} • {totalInvoices} Invoices Billed
                        </div>
                      </td>

                      {/* Outstanding */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1B1C19]">
                        {outstanding}
                      </td>

                      {/* Avg Payment Time */}
                      <td className="py-3.5 px-4 text-right font-mono text-gray-700">
                        {avgPaymentTime}
                      </td>

                      {/* Reliability Score with progress bar */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-[#F5F3EE] rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${
                                reliabilityNum >= 80 ? 'bg-green-600' :
                                reliabilityNum >= 60 ? 'bg-amber-500' : 'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, reliabilityNum))}%` }}
                            ></div>
                          </div>
                          <span>{reliability}</span>
                        </div>
                      </td>

                      {/* Current Risk Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <RiskBadge risk={currentRisk} score={riskScore} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-lg bg-white border border-[#E0DED7] rounded shadow-xl overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DED7] bg-[#FBF9F4]">
              <div>
                <h3 className="text-base font-bold text-[#1B1C19]">{selectedCustomer.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{selectedCustomer.city || 'Pune, MH'} • ID: {selectedCustomer.id}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#FBF9F4] border border-[#E0DED7] rounded text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Outstanding</span>
                  <span className="font-mono text-base font-bold text-[#1B1C19]">{selectedCustomer.outstanding || '₹0'}</span>
                </div>
                <div className="border-x border-[#E0DED7]">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Avg. Delay</span>
                  <span className="font-mono text-base font-bold text-gray-800">{selectedCustomer.avgPaymentTime || `${selectedCustomer.average_payment_days || 14} days`}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Reliability</span>
                  <span className="font-mono text-base font-bold text-green-700">{selectedCustomer.reliability || `${selectedCustomer.payment_reliability || 75}%`}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-gray-700 block">Contact Information:</span>
                <div className="p-3 border border-[#E0DED7] rounded space-y-1 text-gray-600">
                  <div><strong>Primary Contact:</strong> {selectedCustomer.contactPerson || `${selectedCustomer.name?.split(' ')[0]} Accounts Lead`}</div>
                  <div><strong>Phone:</strong> <span className="font-mono">{selectedCustomer.phone || '+91-98765-43210'}</span></div>
                  <div><strong>Email:</strong> <span className="font-mono">{selectedCustomer.email || 'finance@customer.example'}</span></div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded">
                  <span className="font-bold text-amber-900 block mb-0.5">Credit & Payment Intelligence:</span>
                  <p className="text-amber-800">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#E0DED7] bg-[#FDFCF9] flex items-center justify-between">
              <button
                onClick={() => {
                  navigate(`/receivables`);
                  setSelectedCustomer(null);
                }}
                className="text-xs font-semibold text-brand-dark hover:underline flex items-center gap-1"
              >
                View open invoices in Receivables →
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 bg-[#151D1C] text-white text-xs font-bold rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CustomersPage;
