import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * 90-Day Cash Position Financial Chart
 * High-fidelity responsive SVG visualization showing projected cash vs minimum safe balance.
 * Seamlessly supports both dashboard cashPosition and intelligence cashflow data.
 * Renders a clean empty state when no financial data is present.
 */
export function MiniCashFlowChart({ data, showFullDetails = false }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data) return null;

  // Extract raw numbers
  const currentCash = data.currentCashNum !== undefined
    ? data.currentCashNum * 100000
    : Number(data.currentCash || 0);

  const minSafe = data.minimumSafeBalanceNum !== undefined
    ? data.minimumSafeBalanceNum * 100000
    : Number(data.minimumCashThreshold || 0);

  // Normalize points from timeSeries or forecast
  let points = [];
  if (Array.isArray(data.timeSeries) && data.timeSeries.length > 0) {
    points = data.timeSeries;
  } else if (Array.isArray(data.forecast) && data.forecast.length > 0) {
    points = [
      {
        day: 'Today',
        projectedCash: Number((currentCash / 100000).toFixed(2)),
        safeBalance: Number((minSafe / 100000).toFixed(2)),
        collections: 0,
        expenses: 0,
      },
      ...data.forecast.map((pt) => ({
        day: `+${pt.days}d`,
        projectedCash: Number((pt.projectedCash / 100000).toFixed(2)),
        safeBalance: Number((minSafe / 100000).toFixed(2)),
        collections: Number(((pt.expectedCollections || 0) / 100000).toFixed(2)),
        expenses: Number(((pt.expectedExpenses || 0) / 100000).toFixed(2)),
      })),
    ];
  }

  // Check if business has actual financial data
  const hasValidData = data.hasData !== false && points.length > 0 && (
    currentCash > 0 ||
    points.some((p) => (p.projectedCash || 0) > 0 || (p.collections || 0) > 0 || (p.expenses || 0) > 0)
  );

  if (!hasValidData) {
    return (
      <div className="bg-white border border-[#E0DED7] rounded p-8 shadow-subtle text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#F5F3EE] flex items-center justify-center text-gray-500 mb-3">
          <span className="material-symbols-outlined text-2xl text-brand-gold">monitoring</span>
        </div>
        <h3 className="text-sm font-bold text-[#151D1C] mb-1">Cash-flow forecast unavailable</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4 font-sans leading-relaxed">
          Add invoices, expenses, and your current cash balance to generate a real-time cash-flow forecast.
        </p>
        <Link
          to="/receivables"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#151D1C] text-white rounded text-xs font-semibold hover:bg-[#253231] transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-brand-gold">add</span>
          Add First Invoice
        </Link>
      </div>
    );
  }

  const safeBalance = minSafe > 0 ? Number((minSafe / 100000).toFixed(2)) : 0;
  const safeBalanceText = data.minimumSafeBalance || (safeBalance > 0 ? `₹${safeBalance.toFixed(2)}L` : '₹0');

  // Dimensions & bounds for SVG
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const maxValInSeries = Math.max(...points.map((p) => p.projectedCash || 0), safeBalance, 1.0);
  const minVal = 0;
  const maxVal = Math.max(2.0, Math.ceil(maxValInSeries * 1.2)); // Dynamic upper ceiling

  const getX = (index) => {
    return padding.left + (index / (points.length - 1)) * (width - padding.left - padding.right);
  };

  const getY = (val) => {
    return height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
  };

  // Safe balance Y position
  const safeY = getY(safeBalance);

  // Generate SVG path for projected cash
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.projectedCash)}`).join(' ');

  // Gap polygon area where projected cash < safe balance
  const startGapIdx = safeBalance > 0 ? points.findIndex((p) => p.projectedCash < safeBalance) : -1;
  const endGapIdx = safeBalance > 0 ? points.length - 1 - [...points].reverse().findIndex((p) => p.projectedCash < safeBalance) : -1;

  // Generate 4 dynamic horizontal grid tick values
  const gridTicks = [0.25, 0.5, 0.75, 1.0].map((pct) => Number((maxVal * pct).toFixed(1)));

  // Cash gap details
  const cashWarning = Boolean(data.cashWarning || data.cashFlowWarning);
  const gapDays = data.gapDays ?? data.daysUntilShortfall ?? 0;
  const shortfallAmt = data.gapAmount || (data.shortfallAmount ? `₹${(data.shortfallAmount / 100000).toFixed(2)}L` : '₹0');
  const projectedLowFormatted = data.projectedLow || `₹${Math.min(...points.map(p => p.projectedCash)).toFixed(2)}L`;

  return (
    <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle flex flex-col justify-between">
      <div>
        {/* Header with legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#E0DED7] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-gray-700">
                Cash Position (Next 90 Days)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-sans flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#16A34A] inline-block"></span>
              <span className="text-gray-600">Projected Cash</span>
            </div>
            {safeBalance > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-red-400 inline-block"></span>
                <span className="text-gray-600">Min. Safe Balance ({safeBalanceText})</span>
              </div>
            )}
            <Link to="/cash-flow" className="text-xs text-brand-gold hover:underline font-medium">
              Full analysis →
            </Link>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative w-full h-[220px]">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full overflow-visible select-none"
          >
            {/* Grid horizontal lines */}
            {gridTicks.map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-gray-400 font-mono font-medium"
                  >
                    ₹{val}L
                  </text>
                </g>
              );
            })}

            {/* Min Safe Balance Line */}
            {safeBalance > 0 && (
              <g>
                <line
                  x1={padding.left}
                  y1={safeY}
                  x2={width - padding.right}
                  y2={safeY}
                  stroke="#EF4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.8"
                />
                <text
                  x={width - padding.right}
                  y={safeY - 6}
                  textAnchor="end"
                  className="text-[10px] fill-red-600 font-mono font-semibold"
                >
                  Min Safe ({safeBalanceText})
                </text>
              </g>
            )}

            {/* Shaded Gap Danger Zone */}
            {startGapIdx !== -1 && endGapIdx !== -1 && startGapIdx <= endGapIdx && (
              <polygon
                points={`
                  ${getX(startGapIdx)},${safeY}
                  ${points.slice(startGapIdx, endGapIdx + 1).map((p, idx) => `${getX(startGapIdx + idx)},${getY(p.projectedCash)}`).join(' ')}
                  ${getX(endGapIdx)},${safeY}
                `}
                fill="#FEE2E2"
                opacity="0.6"
              />
            )}

            {/* Projected Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#15803D"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points */}
            {points.map((p, i) => {
              const cx = getX(i);
              const cy = getY(p.projectedCash);
              const isDeficit = safeBalance > 0 && p.projectedCash < safeBalance;

              return (
                <g key={i}>
                  {/* Point Circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hoveredPoint === i ? 6 : 3.5}
                    fill={isDeficit ? '#DC2626' : '#15803D'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* X Axis Label */}
                  <text
                    x={cx}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-mono ${hoveredPoint === i ? 'fill-black font-bold' : 'fill-gray-500'}`}
                  >
                    {p.day}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredPoint !== null && points[hoveredPoint] && (
            <div 
              className="absolute pointer-events-none bg-[#151D1C] text-white p-2.5 rounded shadow-lg text-xs font-mono z-30 border border-gray-700"
              style={{
                left: `${(getX(hoveredPoint) / width) * 100}%`,
                top: `${(getY(points[hoveredPoint].projectedCash) / height) * 100 - 30}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="font-bold text-brand-gold mb-0.5">{points[hoveredPoint].day}</div>
              <div>Projected: <span className="font-bold">₹{points[hoveredPoint].projectedCash.toFixed(2)}L</span></div>
              <div className="text-[11px] text-gray-300">
                {safeBalance > 0 && points[hoveredPoint].projectedCash < safeBalance 
                  ? <span className="text-red-400 font-bold">⚠️ Deficit ₹{(safeBalance - points[hoveredPoint].projectedCash).toFixed(2)}L</span> 
                  : <span className="text-green-400 font-medium">✓ Safe Reserve</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cash Gap Alert Highlight Banner (Shown ONLY if real deficit is calculated) */}
      {cashWarning && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-lg">warning</span>
            <div>
              <span className="text-xs font-bold text-red-900 font-mono tracking-wide uppercase mr-2">
                CASH GAP: {gapDays ? `${gapDays} DAYS` : 'DEFICIT ALERT'}
              </span>
              <span className="text-xs text-red-700">
                Projected low {projectedLowFormatted} {gapDays ? `in ~${gapDays} days` : ''} ({shortfallAmt} below safe balance)
              </span>
            </div>
          </div>

          <Link
            to="/cash-flow"
            className="text-xs font-semibold text-red-800 hover:text-red-950 underline whitespace-nowrap self-end sm:self-auto"
          >
            View 3 Ways to Close →
          </Link>
        </div>
      )}
    </div>
  );
}

export default MiniCashFlowChart;
