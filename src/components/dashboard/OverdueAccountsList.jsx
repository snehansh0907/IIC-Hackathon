import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';

export function OverdueAccountsList({ accounts }) {
  return (
    <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
      <div className="flex items-center justify-between mb-4 border-b border-[#E0DED7] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-gray-700">
            Largest Overdue Accounts
          </span>
        </div>
        <Link to="/customers" className="text-xs font-sans text-gray-500 hover:text-[#1B1C19] flex items-center gap-0.5">
          Customer Intelligence <span className="material-symbols-outlined text-sm">chevron_right</span>
        </Link>
      </div>

      <div className="divide-y divide-[#F5F3EE]">
        {(!accounts || accounts.length === 0) ? (
          <div className="py-6 text-center text-xs text-gray-400 font-sans">
            No overdue accounts detected.
          </div>
        ) : (
          accounts.map((acc, i) => {
            const customerName = acc.customer || acc.name || 'Account';
            const delayText = acc.delay || (acc.daysOverdue ? `${acc.daysOverdue} days overdue` : 'Overdue');
            const count = acc.invoicesCount || acc.invoiceCount || 1;
            const risk = acc.risk || (acc.daysOverdue > 45 ? 'Critical' : 'High');

            return (
              <div key={i} className="py-3 flex items-center justify-between hover:bg-[#FBF9F4] px-2 rounded transition-colors">
                <div>
                  <h5 className="text-sm font-semibold text-[#1B1C19]">{customerName}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-error font-mono">{delayText}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500 font-sans">{count} open invoice{count > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[#1B1C19]">{acc.amount}</span>
                  <StatusBadge status={risk} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OverdueAccountsList;
