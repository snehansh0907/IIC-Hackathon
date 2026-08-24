import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { InvoiceTable } from '../components/receivables/InvoiceTable';
import { AddInvoiceModal, ImportInvoicesModal } from '../components/receivables/AddInvoiceModal';
import { Toast } from '../components/common/Toast';

export function ReceivablesPage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ totalOutstanding: '₹0', invoiceCount: 0 });
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchInvoices = () => {
    api.getInvoices(filter, search).then(res => {
      setInvoices(res.invoices || []);
      setStats({
        totalOutstanding: res.totalOutstanding || '₹0',
        invoiceCount: res.invoiceCount || 0,
      });
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter, search]);

  const handleAddInvoice = async (newInvoiceData) => {
    try {
      const created = await api.createInvoice(newInvoiceData);
      setToastMsg(`Invoice ${created.id} created successfully for ${created.customer}`);
      fetchInvoices();
    } catch (err) {
      setToastMsg(`Error creating invoice: ${err.message}`);
    }
  };

  const handleImportSuccess = (source) => {
    setToastMsg(`Successfully synced latest invoices from ${source}`);
    fetchInvoices();
  };

  return (
    <main className="w-full max-w-container-max mx-auto px-edge-margin py-8">
      {/* Receivables Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B1C19] tracking-tight mb-1">
            Receivables
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 font-sans">
            <span className="font-mono font-bold text-[#1B1C19] text-base">{stats.totalOutstanding}</span>
            <span>outstanding across {stats.invoiceCount} invoices</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E0DED7] rounded text-xs font-sans font-semibold text-[#1B1C19] bg-white hover:bg-[#F5F3EE] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">download</span>
            Import invoices
          </button>
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#151D1C] text-white rounded text-xs font-sans font-semibold hover:bg-[#253231] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-gold">add</span>
            + Add invoice
          </button>
        </div>
      </div>

      {/* Invoice Data Table */}
      <InvoiceTable
        invoices={invoices}
        activeFilter={filter}
        onFilterChange={setFilter}
        searchQuery={search}
        onSearchChange={setSearch}
      />

      {/* Modals */}
      <AddInvoiceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddInvoice}
      />

      <ImportInvoicesModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Toast Feedback */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </main>
  );
}

export default ReceivablesPage;
