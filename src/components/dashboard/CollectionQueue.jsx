import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';

export function CollectionQueue({ items, target }) {
  const navigate = useNavigate();

  const hasItems = items && items.length > 0;

  return (
    <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-[#E0DED7] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-gray-700">
              Collection Queue
            </span>

            <span className="text-[11px] font-mono text-gray-400">
              ({items?.length || 0} Priority)
            </span>
          </div>

          <Link
            to="/receivables"
            className="text-xs font-sans text-gray-500 hover:text-[#1B1C19] flex items-center gap-0.5"
          >
            View all
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </Link>
        </div>

        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                onClick={() => navigate(`/invoice/${item.id}`)}
                className="p-3.5 border border-[#E0DED7] rounded hover:border-[#737877] hover:bg-[#FBF9F4] transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-gray-400 pt-0.5">
                    {`0${index + 1}`}
                  </span>

                  <div>
                    <h4 className="text-sm font-semibold text-[#1B1C19] group-hover:text-amber-900 transition-colors">
                      {item.customer}
                    </h4>

                    <p className="font-mono text-xs text-error font-medium mt-0.5">
                      {item.delay}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[#1B1C19]">
                    {item.amount}
                  </span>

                  <StatusBadge status={item.risk} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <span className="material-symbols-outlined text-2xl text-gray-400 mb-1">task_alt</span>
            <p className="text-xs font-semibold text-gray-700">No collection actions required</p>
            <p className="text-[11px] text-gray-400">All invoices are settled or on schedule.</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-dashed border-[#E0DED7] flex items-center justify-between text-xs text-gray-500">
        <span>Immediate collections target:</span>

        <span className="font-mono font-bold text-[#1B1C19]">
          {target || '₹0'}
        </span>
      </div>
    </div>
  );
}

export default CollectionQueue;