import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Toast } from '../components/common/Toast';

export function ActionCenterPage() {
  const navigate = useNavigate();
  const [actions, setActions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState(null);
  const [activeModalAction, setActiveModalAction] = useState(null);

  const fetchActions = () => {
    api.getActions().then(res => {
      setActions(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCompleteAction = async (actionId, title) => {
    await api.completeAction(actionId);
    setToastMsg(`Action completed: "${title}"`);
    fetchActions();
    setActiveModalAction(null);
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1000px] mx-auto px-edge-margin py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
          <span className="material-symbols-outlined animate-spin text-brand-gold">progress_activity</span>
          Loading Action Priorities...
        </div>
      </div>
    );
  }

  const filterActionList = (list) => {
    if (!list) return [];
    if (selectedFilter === 'All') return list;
    if (selectedFilter === 'Critical') return list.filter(i => (i.priority || '').toLowerCase() === 'critical');
    if (selectedFilter === 'High') return list.filter(i => (i.priority || '').toLowerCase() === 'high');
    return list;
  };

  const todayList = filterActionList(actions?.today);
  const thisWeekList = filterActionList(actions?.thisWeek);
  const completedList = actions?.completed || [];

  return (
    <main className="w-full max-w-[1000px] mx-auto px-edge-margin pt-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#E0DED7] mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B1C19] tracking-tight mb-1">
            Action Center
          </h1>
          <p className="text-sm text-gray-600 font-sans">
            High-impact financial actions worth taking today.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2">
          {['All', 'Critical', 'High'].map((flt) => (
            <button
              key={flt}
              onClick={() => setSelectedFilter(flt)}
              className={`px-3 py-1.5 rounded text-xs font-sans font-medium transition-all ${
                selectedFilter === flt
                  ? 'bg-[#151D1C] text-white font-semibold'
                  : 'bg-white border border-[#E0DED7] text-gray-600 hover:bg-[#F5F3EE]'
              }`}
            >
              {flt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {/* GROUP 1: TODAY */}
        <div>
          <div className="flex items-center justify-between border-b border-[#E0DED7] pb-2 mb-4">
            <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500">
              TODAY
            </h2>
            <span className="text-[11px] font-mono text-error font-semibold">
              {todayList.length} Actionable
            </span>
          </div>

          <div className="space-y-3">
            {todayList.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 font-sans border border-dashed border-[#E0DED7] rounded bg-[#FDFCF9]">
                No pending actions for today matching "{selectedFilter}".
              </div>
            ) : (
              todayList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-[#E0DED7] rounded bg-white hover:bg-[#FBF9F4] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#F5F3EE] rounded text-brand-dark group-hover:bg-amber-100 transition-colors">
                      <span className="material-symbols-outlined text-lg text-[#151D1C]">
                        {item.priority === 'CRITICAL' ? 'priority_high' : 'schedule'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1B1C19]">
                          {item.title}
                        </h4>
                        <StatusBadge status={item.priority} />
                      </div>
                      <p className="text-xs text-gray-600 font-sans mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {item.invoiceId && (
                      <button
                        onClick={() => navigate(`/invoice/${item.invoiceId}`)}
                        className="px-3 py-1.5 border border-[#E0DED7] hover:bg-white text-[#1B1C19] text-xs font-semibold rounded"
                      >
                        View invoice
                      </button>
                    )}
                    <button
                      onClick={() => setActiveModalAction(item)}
                      className="px-3 py-1.5 bg-[#151D1C] hover:bg-[#253231] text-white text-xs font-semibold rounded flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm text-brand-gold">bolt</span>
                      Act Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* GROUP 2: THIS WEEK */}
        <div>
          <div className="flex items-center justify-between border-b border-[#E0DED7] pb-2 mb-4">
            <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500">
              THIS WEEK
            </h2>
            <span className="text-[11px] font-mono text-gray-500">
              {thisWeekList.length} Scheduled
            </span>
          </div>

          <div className="space-y-3">
            {thisWeekList.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 font-sans border border-dashed border-[#E0DED7] rounded bg-[#FDFCF9]">
                No scheduled actions for this week.
              </div>
            ) : (
              thisWeekList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-[#E0DED7] rounded bg-white hover:bg-[#FBF9F4] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#F5F3EE] rounded text-gray-600">
                      <span className="material-symbols-outlined text-lg">
                        calendar_today
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#1B1C19]">
                          {item.title}
                        </h4>
                        <StatusBadge status={item.priority} />
                      </div>
                      <p className="text-xs text-gray-600 font-sans mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {item.invoiceId && (
                      <button
                        onClick={() => navigate(`/invoice/${item.invoiceId}`)}
                        className="px-3 py-1.5 border border-[#E0DED7] hover:bg-white text-[#1B1C19] text-xs font-semibold rounded"
                      >
                        View invoice
                      </button>
                    )}
                    <button
                      onClick={() => setActiveModalAction(item)}
                      className="px-3 py-1.5 border border-[#E0DED7] hover:bg-white text-[#1B1C19] text-xs font-semibold rounded"
                    >
                      Details & Execute
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* GROUP 3: COMPLETED */}
        <div>
          <div className="flex items-center justify-between border-b border-[#E0DED7] pb-2 mb-4">
            <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500">
              COMPLETED
            </h2>
            <span className="text-[11px] font-mono text-green-700 font-semibold">
              {completedList.length} Resolved
            </span>
          </div>

          <div className="space-y-3">
            {completedList.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 font-sans border border-dashed border-[#E0DED7] rounded bg-[#FDFCF9]">
                Completed action history will appear here.
              </div>
            ) : (
              completedList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-[#E0DED7] rounded bg-[#F9F8F5] opacity-80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 text-green-800 rounded">
                      <span className="material-symbols-outlined text-lg text-green-700">
                        check_circle
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#1B1C19] line-through">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-sans mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-gray-500">
                    {item.timestamp || 'Just now'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Execution Modal */}
      {activeModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-lg bg-white border border-[#E0DED7] rounded shadow-xl p-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E0DED7] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Action Detail</span>
                <h3 className="text-base font-bold text-[#1B1C19]">{activeModalAction.title}</h3>
              </div>
              <button onClick={() => setActiveModalAction(null)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans mb-6">
              <div className="p-3 bg-[#FBF9F4] border border-[#E0DED7] rounded">
                <span className="font-bold text-gray-700 block mb-1">Recommended Execution:</span>
                <p className="text-gray-600">{activeModalAction.reason || activeModalAction.subtitle}</p>
              </div>

              {activeModalAction.customer && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded">
                  <span className="font-bold text-amber-900 block mb-1">Target Account & Expected Recovery:</span>
                  <p className="text-amber-800 font-mono font-semibold">{activeModalAction.customer} · {activeModalAction.amount}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E0DED7]">
              {activeModalAction.invoiceId ? (
                <button
                  onClick={() => {
                    navigate(`/invoice/${activeModalAction.invoiceId}`);
                    setActiveModalAction(null);
                  }}
                  className="px-3 py-1.5 border border-[#E0DED7] rounded text-xs font-semibold text-[#1B1C19]"
                >
                  Open Invoice
                </button>
              ) : <div></div>}

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveModalAction(null)}
                  className="px-3 py-1.5 border border-[#E0DED7] rounded text-xs text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteAction(activeModalAction.id, activeModalAction.title)}
                  className="px-4 py-1.5 bg-[#151D1C] hover:bg-[#253231] text-white text-xs font-bold rounded flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm text-brand-gold">check_circle</span>
                  Mark Done & Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </main>
  );
}

export default ActionCenterPage;
