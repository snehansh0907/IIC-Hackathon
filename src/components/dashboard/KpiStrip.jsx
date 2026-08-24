import React from 'react';

export function KpiStrip({ summary }) {
  if (!summary) return null;

  const formatMoney = (value) => {
    if (value === undefined || value === null) return '₹0';
    if (typeof value === 'object') {
      if (value.amount) return value.amount;
      value = value.value || 0;
    }
    if (typeof value === 'string') return value;

    const num = Number(value || 0);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)}Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)}L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)}K`;
    }

    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getMetric = (key1, key2, defaultSub) => {
    const v = summary[key1] !== undefined ? summary[key1] : summary[key2];
    if (v && typeof v === 'object') {
      return {
        amount: v.amount || formatMoney(v.value),
        subtitle: v.subtitle || defaultSub
      };
    }
    return {
      amount: formatMoney(v),
      subtitle: defaultSub
    };
  };

  const receivables = getMetric('totalReceivables', 'totalReceivables', 'Outstanding invoices');
  const overdue = getMetric('overdue', 'totalOverdue', 'Past due invoices');
  const dueSoon = getMetric('dueSoon', 'totalDueSoon', 'Due within 7 days');
  const cash = getMetric('availableCash', 'currentCash', 'Current cash balance');

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-y border-[#E0DED7] py-6 mb-8 gap-y-6 bg-white/40">
      {/* Total Receivables */}
      <div className="flex flex-col pr-6 md:border-r border-[#E0DED7]">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2">
          Total Receivables
        </span>
        <span className="font-mono text-3xl font-medium text-[#1B1C19] leading-none mb-1.5">
          {receivables.amount}
        </span>
        <span className="text-xs text-gray-500 font-sans">
          {receivables.subtitle}
        </span>
      </div>

      {/* Overdue */}
      <div className="flex flex-col px-4 md:px-6 md:border-r border-[#E0DED7] border-l md:border-l-0">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2">
          Overdue
        </span>
        <span className="font-mono text-3xl font-medium text-error leading-none mb-1.5">
          {overdue.amount}
        </span>
        <span className="text-xs text-gray-500 font-sans">
          {overdue.subtitle}
        </span>
      </div>

      {/* Due Soon */}
      <div className="flex flex-col pr-6 md:px-6 md:border-r border-[#E0DED7]">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2">
          Due Soon
        </span>
        <span className="font-mono text-3xl font-medium text-warning leading-none mb-1.5">
          {dueSoon.amount}
        </span>
        <span className="text-xs text-gray-500 font-sans">
          {dueSoon.subtitle}
        </span>
      </div>

      {/* Available Cash */}
      <div className="flex flex-col px-4 md:pl-6 border-l md:border-l-0">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2">
          Available Cash
        </span>
        <span className="font-mono text-3xl font-medium text-[#1B1C19] leading-none mb-1.5">
          {cash.amount}
        </span>
        <span className="text-xs text-gray-500 font-sans">
          {cash.subtitle}
        </span>
      </div>
    </div>
  );
}

export default KpiStrip;