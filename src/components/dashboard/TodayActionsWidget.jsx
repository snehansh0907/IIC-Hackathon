import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { Toast } from '../common/Toast';
import { api } from '../../services/api';

export function TodayActionsWidget({ actions }) {
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);

  const handleQuickAction = async (e, item) => {
    e.stopPropagation();
    setCompletedIds(prev => [...prev, item.id]);
    await api.completeAction(item.id);
    setToastMsg(`Action logged: ${item.action || item.title} for ${item.customer || 'Customer'}`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const pendingActions = (actions || []).filter(a => !completedIds.includes(a.id));

  return (
    <div className="bg-[#151D1C] text-white border border-[#2D3736] rounded p-6 shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-[#2D3736] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-white">
              Today's Actions
            </span>
            <span className="text-[11px] font-mono text-brand-gold">
              ({pendingActions.length} Required)
            </span>
          </div>
          <Link 
            to="/action-center" 
            className="text-xs font-sans text-gray-400 hover:text-brand-gold flex items-center gap-0.5 transition-colors"
          >
            Action Center <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        <div className="space-y-3">
          {(!actions || actions.length === 0) ? (
            <div className="py-6 text-center text-xs text-gray-400 font-sans">
              No immediate collection actions pending.
            </div>
          ) : (
            actions.map((item) => {
              const isDone = completedIds.includes(item.id);
              const subtitle = item.subtitle || (item.amount ? `${item.amount} ${item.daysOverdue ? `· ${item.daysOverdue}d overdue` : ''}` : 'Recommended Action');
              
              return (
                <div
                  key={item.id}
                  onClick={() => item.invoiceId ? navigate(`/invoice/${item.invoiceId}`) : navigate('/action-center')}
                  className={`p-3.5 border rounded transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isDone 
                      ? 'border-gray-800 bg-[#1F2928]/40 opacity-60' 
                      : 'border-[#354342] bg-[#1F2928] hover:border-brand-gold/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-brand-gold text-lg pt-0.5">
                      {isDone ? 'check_circle' : 'bolt'}
                    </span>
                    <div>
                      <h4 className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5 font-sans">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.priority} />
                    {!isDone && (
                      <button
                        onClick={(e) => handleQuickAction(e, item)}
                        className="px-2.5 py-1 bg-brand-gold hover:bg-amber-400 text-[#151D1C] font-semibold text-xs rounded transition-colors"
                      >
                        Act
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#2D3736] flex items-center justify-between text-xs text-gray-400">
        <span>Prompt action improves recovery by:</span>
        <span className="font-mono font-semibold text-brand-gold">+38% within 7 days</span>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
}

export default TodayActionsWidget;
