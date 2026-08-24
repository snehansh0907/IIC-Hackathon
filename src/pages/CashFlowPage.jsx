import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { MiniCashFlowChart } from '../components/dashboard/MiniCashFlowChart';
import { Toast } from '../components/common/Toast';

export function CashFlowPage() {
  const [cashData, setCashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [appliedStrategy, setAppliedStrategy] = useState(null);

  useEffect(() => {
    api.getCashFlow().then(res => {
      setCashData(res);
      setLoading(false);
    });
  }, []);

  const handleApplyStrategy = (strategy) => {
    setAppliedStrategy(strategy.id || strategy.title);
    setToastMsg(`Strategy activated: ${strategy.title} (${strategy.amount || strategy.impact}). Recalculating runway...`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-container-max mx-auto px-edge-margin py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
          <span className="material-symbols-outlined animate-spin text-brand-gold">progress_activity</span>
          Analyzing Cash Runway & Forecasting...
        </div>
      </div>
    );
  }

  const hasData = cashData?.hasData !== false && (
    (cashData?.currentCashNum && cashData.currentCashNum > 0) ||
    (cashData?.timeSeries && cashData.timeSeries.some(p => p.projectedCash > 0 || p.collections > 0))
  );

  return (
    <main className="w-full max-w-container-max mx-auto px-edge-margin py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B1C19] tracking-tight mb-1">
          Cash Flow
        </h1>
        <p className="text-sm text-gray-600 font-sans">
          Will I have enough cash to operate over the next 90 days?
        </p>
      </div>

      {/* 3 Core Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E0DED7] rounded bg-white mb-8 shadow-subtle">
        {/* Current Cash */}
        <div className="p-6 md:border-r border-[#E0DED7]">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Current Cash
          </span>
          <div className="font-mono text-3xl font-bold text-[#1B1C19] mb-1">
            {cashData?.currentCash || '₹0'}
          </div>
          <div className="text-xs text-gray-500 font-sans">
            Live balance in verified bank accounts
          </div>
        </div>

        {/* Projected Low */}
        <div className="p-6 md:border-r border-[#E0DED7]">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-error mb-2 flex items-center gap-1">
            Projected Low
            <span className="material-symbols-outlined text-sm">trending_down</span>
          </span>
          <div className="font-mono text-3xl font-bold text-error mb-1">
            {cashData?.projectedLow || '₹0'}
          </div>
          <div className="text-xs text-gray-500 font-sans">
            {cashData?.cashWarning
              ? `Expected in ~${cashData?.gapDays || 0} days without interventions`
              : 'Projected runway baseline'}
          </div>
        </div>

        {/* Minimum Safe Balance */}
        <div className="p-6">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Minimum Safe Balance
          </span>
          <div className="font-mono text-3xl font-bold text-[#1B1C19] mb-1">
            {cashData?.minimumSafeBalance || '₹0'}
          </div>
          <div className="text-xs text-gray-500 font-sans">
            Required 30-day payroll & vendor reserve
          </div>
        </div>
      </div>

      {/* Large 90-Day Projection Chart */}
      <div className="mb-8">
        <MiniCashFlowChart data={cashData} showFullDetails={true} />
      </div>

      {/* Two-Column Deep-Dive: Cash Gap Explanation & Closing Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Why There Is A Gap (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-gray-700 mb-4 pb-3 border-b border-[#E0DED7] flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-base">analytics</span>
            Why Does The Gap Occur?
          </h3>

          {hasData ? (
            <div className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-[#FBF9F4] border border-[#E0DED7] rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-700">Expected Collections (90d)</span>
                  <span className="font-mono font-bold text-green-700 text-sm">
                    {cashData?.breakdown?.expectedCollections || '₹0'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Calculated by applying weighted probability based on customer payment reliability.
                </p>
              </div>

              <div className="p-3 bg-[#FBF9F4] border border-[#E0DED7] rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-700">Expected Expenses (90d)</span>
                  <span className="font-mono font-bold text-error text-sm">
                    {cashData?.breakdown?.expectedExpenses || '₹0'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Comprises fixed monthly payroll, raw material suppliers, rent & utility dues.
                </p>
              </div>

              <div className={`p-4 rounded border ${cashData?.cashWarning ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold ${cashData?.cashWarning ? 'text-red-900' : 'text-green-900'}`}>
                    {cashData?.cashWarning ? 'Net Forecasted Gap' : 'Runway Status'}
                  </span>
                  <span className={`font-mono font-bold text-base ${cashData?.cashWarning ? 'text-red-700' : 'text-green-700'}`}>
                    {cashData?.gapAmount || '₹0'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${cashData?.cashWarning ? 'text-red-700' : 'text-green-700'}`}>
                  {cashData?.cashWarning
                    ? `Cash drops below the ${cashData.minimumSafeBalance} safety threshold within ${cashData.gapDays} days.`
                    : 'Cash remains above the minimum safety threshold throughout the 90-day window.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <span className="material-symbols-outlined text-2xl text-gray-400 mb-1">receipt_long</span>
              <p className="text-xs font-semibold text-gray-700">No runway deficit detected</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Add invoices and recurring expenses to model expected monthly collections and cash projections.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Ways To Close The Gap (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-gray-700 mb-4 pb-3 border-b border-[#E0DED7] flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-gold text-base">shield</span>
            Ways To Close The Gap
          </h3>

          {cashData?.gapStrategies && cashData.gapStrategies.length > 0 ? (
            <div className="space-y-4">
              {cashData.gapStrategies.map((strat, index) => {
                const stratId = strat.id || `0${index + 1}`;
                const isApplied = appliedStrategy === stratId || appliedStrategy === strat.title;
                const impact = strat.amount || strat.impact;
                const tag = strat.tag || strat.risk || 'Recommended';

                return (
                  <div
                    key={stratId}
                    className={`p-4 border rounded transition-all ${
                      isApplied 
                        ? 'border-green-600 bg-green-50/50' 
                        : 'border-[#E0DED7] bg-[#FDFCF9] hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#151D1C] text-white flex items-center justify-center font-mono text-xs font-bold">
                          {stratId}
                        </span>
                        <h4 className="font-bold text-sm text-[#1B1C19]">
                          {strat.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-brand-gold/15 text-brand-dark border border-brand-gold/30 rounded text-[10px] font-bold uppercase font-mono">
                          {impact}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-sans">
                          {tag}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 font-sans leading-relaxed">
                      {strat.desc}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E0DED7]/60">
                      <span className="text-[11px] text-gray-500 font-mono">
                        {isApplied ? '✓ Strategy applied to model' : 'Simulate in cash forecast'}
                      </span>
                      <button
                        onClick={() => handleApplyStrategy(strat)}
                        disabled={isApplied}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                          isApplied
                            ? 'bg-green-700 text-white cursor-default'
                            : 'bg-[#151D1C] hover:bg-[#253231] text-white'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <span className="material-symbols-outlined text-xs">check</span>
                            Applied
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xs text-brand-gold">play_arrow</span>
                            Apply Strategy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <span className="material-symbols-outlined text-2xl text-gray-400 mb-1">lightbulb</span>
              <p className="text-xs font-semibold text-gray-700">No recovery strategies needed</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Strategies will dynamically appear if a projected deficit is detected.
              </p>
            </div>
          )}
        </div>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </main>
  );
}

export default CashFlowPage;
