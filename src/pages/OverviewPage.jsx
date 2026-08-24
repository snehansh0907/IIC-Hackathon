import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { KpiStrip } from '../components/dashboard/KpiStrip';
import { CollectionQueue } from '../components/dashboard/CollectionQueue';
import { MiniCashFlowChart } from '../components/dashboard/MiniCashFlowChart';
import { TodayActionsWidget } from '../components/dashboard/TodayActionsWidget';
import { OverdueAccountsList } from '../components/dashboard/OverdueAccountsList';

export function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-container-max mx-auto px-edge-margin py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
          <span className="material-symbols-outlined animate-spin text-brand-gold">progress_activity</span>
          Loading Receivables Intelligence...
        </div>
      </div>
    );
  }

  if (data?.empty) {
    return (
      <main className="w-full max-w-container-max mx-auto px-edge-margin pt-8 pb-16">
        <div className="bg-white border border-[#E0DED7] rounded p-8 text-center max-w-xl mx-auto my-12 shadow-subtle">
          <span className="material-symbols-outlined text-4xl text-brand-gold mb-3">database</span>
          <h2 className="text-xl font-bold text-[#1B1C19] mb-2">No Business Data Found</h2>
          <p className="text-sm text-gray-600 mb-6 font-sans">
            {data.message || 'No business records found in Supabase. Run the seed script to load data.'}
          </p>
        </div>
      </main>
    );
  }

  const businessName = data?.company?.name || 'Business';
  const currentDate = data?.company?.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' });
  const isWorkspaceEmpty = data?.summary?.totalInvoices === 0;

  return (
    <main className="w-full max-w-container-max mx-auto px-edge-margin pt-8 pb-16">
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B1C19] tracking-tight mb-1">
            Good morning, {businessName}.
          </h1>
          <p className="text-sm text-gray-600 font-sans">
            {isWorkspaceEmpty ? 'Welcome to your private financial workspace.' : "Here's where your money stands today."}
          </p>
        </div>
        <div className="text-xs font-mono text-gray-500 bg-white px-3 py-1.5 border border-[#E0DED7] rounded self-start md:self-auto">
          {currentDate}
        </div>
      </div>

      {/* Onboarding Empty State Banner for New Workspaces */}
      {isWorkspaceEmpty && (
        <div className="bg-white border border-[#E0DED7] rounded-lg p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined text-xl">receipt_long</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#151D1C]">Your workspace is ready!</h3>
              <p className="text-xs text-gray-500 font-sans">
                You have no invoices tracked yet. Add your first invoice to calculate credit risk, track receivables, and predict cash flow.
              </p>
            </div>
          </div>
          <Link
            to="/receivables"
            className="px-4 py-2 bg-[#151D1C] hover:bg-[#253231] text-white text-xs font-bold rounded flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-brand-gold">add</span>
            Add First Invoice
          </Link>
        </div>
      )}

      {/* KPI Strip */}
      <KpiStrip summary={data?.summary || data} />

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-8">
          <CollectionQueue
            items={data?.collectionQueue || []}
            target={
              data?.summary?.overdue?.amount ||
              (data?.totalOverdue ? `₹${(data.totalOverdue / 100000).toFixed(2)}L` : '₹0')
            }
          />
          <OverdueAccountsList accounts={data?.largestOverdueAccounts || []} />
        </div>

        {/* Right Column (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-8">
          <MiniCashFlowChart data={data?.cashPosition || {}} />
          <TodayActionsWidget actions={data?.todayActions || []} />
        </div>
      </div>
    </main>
  );
}

export default OverviewPage;
