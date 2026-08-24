import React from 'react';

/**
 * StatusBadge Component
 * Styles for financial status tags: Overdue, Due soon, Paid, Disputed, Completed
 */
export function StatusBadge({ status, className = '' }) {
  const normalized = (status || '').toLowerCase();

  if (normalized.includes('critical') || normalized === 'overdue') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mr-1.5 inline-block"></span>
        {status}
      </span>
    );
  }

  if (normalized.includes('due soon') || normalized.includes('watch') || normalized.includes('medium')) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mr-1.5 inline-block"></span>
        {status}
      </span>
    );
  }

  if (normalized.includes('paid') || normalized.includes('completed') || normalized.includes('low') || normalized.includes('healthy')) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5 inline-block"></span>
        {status}
      </span>
    );
  }

  if (normalized.includes('disputed')) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mr-1.5 inline-block"></span>
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] ${className}`}>
      {status}
    </span>
  );
}

/**
 * RiskBadge Component
 * Specific for Risk levels: Critical, High, Watch, Low
 */
export function RiskBadge({ risk, score, className = '' }) {
  const norm = (risk || '').toLowerCase();

  let badgeColor = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotColor = 'bg-gray-400';

  if (norm.includes('critical')) {
    badgeColor = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-600';
  } else if (norm.includes('high')) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-600';
  } else if (norm.includes('watch') || norm.includes('medium')) {
    badgeColor = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    dotColor = 'bg-yellow-500';
  } else if (norm.includes('low')) {
    badgeColor = 'bg-green-50 text-green-700 border-green-200';
    dotColor = 'bg-green-600';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${badgeColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span className="capitalize">{risk}</span>
      {score !== undefined && (
        <span className="text-[10px] opacity-75 font-mono">({score})</span>
      )}
    </span>
  );
}

export default StatusBadge;
