import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, RiskBadge } from '../common/StatusBadge';

export function InvoiceTable({ invoices, onFilterChange, activeFilter, searchQuery, onSearchChange }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filters = ['All', 'Overdue', 'Due soon', 'Paid', 'Disputed'];

  // Pagination calculation
  const totalPages = Math.ceil((invoices?.length || 0) / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = invoices?.slice(startIndex, startIndex + itemsPerPage) || [];

  return (
    <div className="bg-white border border-[#E0DED7] rounded shadow-subtle overflow-hidden">
      {/* Table Toolbar & Filters */}
      <div className="p-4 border-b border-[#E0DED7] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FDFCF9]">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#F5F3EE] border-none text-xs text-[#1B1C19] rounded pl-9 pr-4 py-2 focus:ring-1 focus:ring-[#737877] outline-none font-sans placeholder:text-gray-400"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => {
                onFilterChange(f);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded text-xs font-sans font-medium transition-all whitespace-nowrap ${
                activeFilter === f
                  ? 'bg-[#151D1C] text-white font-semibold shadow-sm'
                  : 'bg-white border border-[#E0DED7] text-gray-600 hover:bg-[#F5F3EE]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E0DED7] bg-[#F5F3EE]/50 text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500">
              <th className="py-3 px-4">Invoice</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Issued</th>
              <th className="py-3 px-4">Due</th>
              <th className="py-3 px-4 text-right">Outstanding</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0DED7] text-xs">
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/invoice/${inv.id}`)}
                  className="hover:bg-[#FBF9F4] cursor-pointer transition-colors group"
                >
                  {/* Invoice ID */}
                  <td className="py-3.5 px-4 font-mono font-medium text-[#1B1C19] group-hover:text-amber-900">
                    {inv.id}
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4 font-sans font-semibold text-[#1B1C19]">
                    {inv.customer}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-[#1B1C19]">
                    {inv.amount}
                  </td>

                  {/* Issued */}
                  <td className="py-3.5 px-4 font-mono text-gray-500">
                    {inv.issued}
                  </td>

                  {/* Due */}
                  <td className="py-3.5 px-4 font-mono text-gray-500">
                    {inv.due}
                  </td>

                  {/* Outstanding */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1B1C19]">
                    {inv.outstanding}
                  </td>

                  {/* Status Delay Text */}
                  <td className="py-3.5 px-4">
                    <span className={`font-mono text-xs font-semibold ${
                      inv.status === 'Paid' 
                        ? 'text-green-700' 
                        : inv.status === 'Due soon' 
                        ? 'text-amber-700' 
                        : 'text-error'
                    }`}>
                      {inv.delayText}
                    </span>
                  </td>

                  {/* Risk Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <RiskBadge risk={inv.risk} score={inv.riskScore} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-12 text-center text-gray-500 font-sans text-xs">
                  No invoices found matching current filter or search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[#E0DED7] bg-[#FDFCF9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-gray-500">
        <div>
          Showing <span className="font-mono font-semibold text-[#1B1C19]">{Math.min(startIndex + 1, invoices.length)}</span> to{' '}
          <span className="font-mono font-semibold text-[#1B1C19]">
            {Math.min(startIndex + itemsPerPage, invoices.length)}
          </span>{' '}
          of <span className="font-mono font-semibold text-[#1B1C19]">{invoices.length}</span> invoices
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-2.5 py-1 border border-[#E0DED7] rounded disabled:opacity-40 hover:bg-white text-xs font-mono"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-7 h-7 rounded text-xs font-mono flex items-center justify-center transition-colors ${
                currentPage === page
                  ? 'bg-[#151D1C] text-white font-bold'
                  : 'border border-[#E0DED7] bg-white text-gray-700 hover:bg-[#F5F3EE]'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 border border-[#E0DED7] rounded disabled:opacity-40 hover:bg-white text-xs font-mono"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTable;
