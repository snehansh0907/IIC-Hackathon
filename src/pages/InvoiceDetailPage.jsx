import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { Toast } from '../components/common/Toast';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderError, setReminderError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getInvoice(id)
      .then(data => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load invoice:', err);
        setError(err.message || 'Invoice not found');
        setLoading(false);
      });
  }, [id]);

  const handleAction = async (actionName) => {
    setActionHistory(prev => [
      { action: actionName, time: 'Just now' },
      ...prev
    ]);
    if (actionName === 'Marked as Disputed') {
      await api.updateInvoiceStatus(invoice.rawId || invoice.id, 'disputed', 'Marked as disputed by user');
      setInvoice(prev => prev ? { ...prev, status: 'Disputed' } : prev);
    }
    setToastMsg(`Action recorded: ${actionName}`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSendReminder = async () => {
    if (isSendingReminder || !invoice) return;
    setIsSendingReminder(true);
    setReminderError(null);

    try {
      const result = await api.sendReminder({
        invoiceId: invoice.rawId || invoice.id,
        channel: 'email',
      });

      setIsReminderOpen(false);
      
      const actionName = `Email payment reminder sent to ${result.recipient?.email || invoice.customer}`;
      
      setActionHistory(prev => [
        { action: actionName, time: 'Just now' },
        ...prev
      ]);

      setToastMsg('Payment reminder sent successfully.');
      setTimeout(() => setToastMsg(null), 6000);
    } catch (err) {
      console.error('Reminder error:', err);
      setReminderError(err.message || 'Unable to send reminder.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-container-max mx-auto px-edge-margin py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
          <span className="material-symbols-outlined animate-spin text-brand-gold">progress_activity</span>
          Loading Invoice Intelligence...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <main className="w-full max-w-container-max mx-auto px-edge-margin py-16 text-center">
        <div className="bg-white border border-[#E0DED7] rounded p-8 max-w-md mx-auto shadow-subtle">
          <span className="material-symbols-outlined text-4xl text-error mb-3">error_outline</span>
          <h2 className="text-lg font-bold text-[#1B1C19] mb-2">Invoice Not Found</h2>
          <p className="text-xs text-gray-500 font-sans mb-6">
            {error || `Unable to locate invoice ${id} in your ledger.`}
          </p>
          <Link
            to="/receivables"
            className="px-4 py-2 bg-[#151D1C] text-white rounded text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Return to Receivables
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-container-max mx-auto px-edge-margin py-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-sans text-gray-500 mb-4 uppercase tracking-wider">
        <Link to="/receivables" className="hover:text-[#1B1C19] flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Receivables
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-semibold text-[#1B1C19]">{invoice.id}</span>
      </div>

      {/* Invoice Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E0DED7] mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B1C19] tracking-tight mb-1">
            {invoice.customer}
          </h1>
          <div className="flex items-center gap-3 text-xs text-gray-600 font-sans">
            <span className="font-mono font-bold text-[#1B1C19]">Invoice #{invoice.id}</span>
            <span className="text-gray-300">•</span>
            <span className="font-mono">GSTIN: {invoice.gstin}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleAction('Downloaded PDF copy')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E0DED7] rounded text-xs font-semibold text-[#1B1C19] bg-white hover:bg-[#F5F3EE] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">download</span>
            Download PDF
          </button>
          
          <button 
            onClick={() => {
              setIsReminderOpen(true);
              setReminderError(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#151D1C] text-white rounded text-xs font-semibold hover:bg-[#253231] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-gold">send</span>
            Send Reminder
          </button>
        </div>
      </div>

      {/* 3 Core Metric Strips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E0DED7] rounded bg-white mb-8 shadow-subtle">
        {/* Outstanding Amount */}
        <div className="p-6 md:border-r border-[#E0DED7]">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Outstanding Amount
          </span>
          <div className="font-mono text-3xl font-bold text-[#1B1C19] mb-1">
            {invoice.outstanding}
          </div>
          <div className="text-xs text-gray-500 font-sans">
            Issued {invoice.issued} • Due {invoice.due}
          </div>
        </div>

        {/* Overdue Duration */}
        <div className="p-6 md:border-r border-[#E0DED7]">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Payment Status & Delay
          </span>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-2xl font-bold text-error">
              {invoice.delayText}
            </span>
          </div>
          <div className="text-xs text-gray-500 font-sans">
            Status: <span className="font-semibold text-gray-700">{invoice.status}</span>
          </div>
        </div>

        {/* Dynamic Risk Score */}
        <div className="p-6">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Risk Assessment
          </span>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-3xl font-bold text-error">
              {invoice.riskScore}/100
            </span>
            <RiskBadge risk={invoice.risk} />
          </div>
          <div className="text-xs text-gray-500 font-sans">
            Calculated from customer history & overdue ratio
          </div>
        </div>
      </div>

      {/* 2-Column Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Intelligence Analysis & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Why This Matters Box */}
          <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-600 text-lg">psychology</span>
              <h3 className="text-sm font-bold text-[#1B1C19]">Why This Matters (Risk Context)</h3>
            </div>
            <p className="text-xs font-sans text-gray-700 leading-relaxed mb-4">
              {invoice.riskExplanation || (
                <>
                  <span className="font-bold text-[#1B1C19]">{invoice.customer}</span> currently holds an outstanding balance of <span className="font-mono font-semibold">{invoice.outstanding}</span>. 
                  This overdue balance represents a critical working capital concentration and threatens projected cash runway.
                </>
              )}
            </p>
            {invoice.riskFactors && invoice.riskFactors.length > 0 ? (
              <div className="p-3.5 bg-[#FBF9F4] border border-[#E0DED7] rounded text-xs space-y-1.5">
                <span className="font-bold text-gray-800 block mb-1">Identified Risk Drivers:</span>
                {invoice.riskFactors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600">
                    <span className="material-symbols-outlined text-sm text-error">warning</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 bg-[#FBF9F4] border border-[#E0DED7] rounded text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="material-symbols-outlined text-sm text-error">warning</span>
                  <span>Invoice delay ({invoice.daysOverdue || 0} days) exceeds typical credit terms.</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="material-symbols-outlined text-sm text-amber-600">trending_down</span>
                  <span>Customer payment reliability score reflects increased risk of continued delinquency.</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Delay History Comparison */}
          <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-[#1B1C19] mb-4">Payment Behavior & Delay Multiples</h3>
            <div className="space-y-4 text-xs font-sans">
              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Current Invoice Overdue Duration</span>
                  <span className="font-mono font-bold text-error">{invoice.daysOverdue || 0} Days</span>
                </div>
                <div className="w-full bg-[#E0DED7] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-error h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(10, ((invoice.daysOverdue || 0) / 90) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Customer Historical Average Delay</span>
                  <span className="font-mono font-semibold text-gray-700">{invoice.averageDelay || 14} Days</span>
                </div>
                <div className="w-full bg-[#E0DED7] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gray-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((invoice.averageDelay || 14) / 90) * 100)}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-gray-500 pt-2 border-t border-[#E0DED7]">
                Customer is currently delaying payment at <span className="font-bold text-[#1B1C19]">{((invoice.daysOverdue || 0) / Math.max(1, invoice.averageDelay || 14)).toFixed(1)}x</span> their historical baseline.
              </p>
            </div>
          </div>

          {/* Action Log / Audit Trail */}
          <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-[#1B1C19] mb-4">Action History & Timeline</h3>
            <div className="space-y-3 font-sans text-xs">
              {actionHistory.length > 0 && actionHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200/60 rounded">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-brand-gold">check_circle</span>
                    <span className="font-semibold text-brand-dark">{item.action}</span>
                  </div>
                  <span className="font-mono text-gray-400 text-[10px]">{item.time}</span>
                </div>
              ))}

              {invoice.history && invoice.history.map((hist) => (
                <div key={hist.id} className="flex items-center justify-between p-2.5 bg-[#FBF9F4] border border-[#E0DED7] rounded">
                  <div>
                    <div className="font-semibold text-gray-800">{hist.text}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{hist.date}</div>
                  </div>
                  <span className="font-mono font-bold text-gray-700">{hist.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Next Best Actions & Invoice Items */}
        <div className="space-y-8">
          {/* Recommended Next Actions Box */}
          <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-gold font-bold block mb-1">
              AI Action Recommendation
            </span>
            <h3 className="text-sm font-bold text-[#1B1C19] mb-3">Next Best Action</h3>
            <p className="text-xs text-gray-600 font-sans mb-4">
              Based on credit risk and payment delay multiple, execute the following structured recovery workflow:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setIsReminderOpen(true);
                  setReminderError(null);
                }}
                className="w-full text-left p-3 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#1B1C19] group-hover:text-brand-dark">
                    1. Send Payment Reminder
                  </span>
                  <span className="material-symbols-outlined text-sm text-gray-400 group-hover:text-brand-dark">
                    send
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Deliver formal email statement with RTGS / NEFT bank instructions.
                </p>
              </button>

              <button
                onClick={() => handleAction('Offered 2% Instant Settlement Discount')}
                className="w-full text-left p-3 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#1B1C19] group-hover:text-brand-dark">
                    2. Offer 2% Early Settlement
                  </span>
                  <span className="material-symbols-outlined text-sm text-gray-400 group-hover:text-brand-dark">
                    percent
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Recover immediate cash flow by offering spot settlement incentive.
                </p>
              </button>

              <button
                onClick={() => handleAction('Marked as Disputed')}
                className="w-full text-left p-3 border border-[#E0DED7] hover:border-red-400 hover:bg-red-50/30 rounded transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-error">
                    3. Flag Billing Dispute
                  </span>
                  <span className="material-symbols-outlined text-sm text-error">
                    report_problem
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Pause automated collection and open internal reconciliation ticket.
                </p>
              </button>
            </div>
          </div>

          {/* Invoice Summary Card */}
          <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-[#1B1C19] mb-4">Invoice Deliverables</h3>
            <div className="space-y-3 text-xs font-sans">
              {invoice.items && invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between pb-2 border-b border-[#E0DED7]">
                  <div>
                    <div className="font-semibold text-gray-800">{item.description}</div>
                    <div className="text-gray-400 text-[10px]">Qty: {item.qty} × ₹{Number(item.rate || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <span className="font-mono font-bold text-[#1B1C19]">
                    ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="pt-3 flex justify-between font-bold text-sm">
                <span>Total Amount:</span>
                <span className="font-mono">{invoice.amount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reminder Modal */}
      {isReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-md bg-white border border-[#E0DED7] rounded shadow-xl p-6 animate-in fade-in">
            <h3 className="text-base font-bold text-[#1B1C19] mb-1">Send Payment Reminder</h3>
            <p className="text-xs text-gray-500 mb-4">Select delivery channel for {invoice.customer}:</p>

            {reminderError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{reminderError}</span>
              </div>
            )}

            <div className="space-y-3 mb-6 text-xs">
              <label className="flex items-center gap-3 p-3 border border-[#E0DED7] rounded cursor-pointer bg-[#FBF9F4]">
                <input
                  type="radio"
                  name="channel"
                  value="email"
                  checked={true}
                  readOnly
                  disabled={isSendingReminder}
                />
                <div>
                  <span className="font-bold block">Formal Email with Statement</span>
                  <span className="text-gray-500 text-[11px]">Direct copy to Accounts & CFO with RTGS bank instructions</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsReminderOpen(false);
                  setReminderError(null);
                }}
                disabled={isSendingReminder}
                className="px-4 py-2 border border-[#E0DED7] rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReminder}
                disabled={isSendingReminder}
                className="px-4 py-2 bg-[#151D1C] hover:bg-[#253231] text-white text-xs font-bold rounded flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {isSendingReminder ? (
                  <span className="material-symbols-outlined text-sm animate-spin text-brand-gold">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-brand-gold">send</span>
                )}
                {isSendingReminder ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </main>
  );
}

export default InvoiceDetailPage;
