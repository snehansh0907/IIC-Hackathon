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

  // Payment Recording State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('NEFT');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const fetchInvoice = () => {
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
  };

  useEffect(() => {
    fetchInvoice();
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

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (isSubmittingPayment || !invoice) return;
    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      await api.createPayment({
        invoiceId: invoice.rawId || invoice.id,
        amount: Number(paymentAmount || invoice.outstandingAmount),
        paymentDate,
        paymentMethod,
        reference: paymentRef,
      });

      setIsRecordPaymentOpen(false);
      setToastMsg('Payment recorded successfully.');
      setTimeout(() => setToastMsg(null), 4000);

      // Refresh invoice data
      const updated = await api.getInvoice(id);
      setInvoice(updated);
    } catch (err) {
      console.error('Record payment error:', err);
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-container-max mx-auto px-edge-margin py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
          <span className="material-symbols-outlined animate-spin text-brand-gold">progress_activity</span>
          Loading Invoice Dossier #{id}...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <main className="w-full max-w-container-max mx-auto px-edge-margin py-16 text-center">
        <div className="bg-white border border-[#E0DED7] rounded p-8 max-w-md mx-auto shadow-subtle">
          <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">error</span>
          <h2 className="text-base font-bold text-[#1B1C19] mb-1">Invoice Record Unavailable</h2>
          <p className="text-xs text-gray-500 mb-6 font-sans">
            {error || `Unable to locate invoice #${id} in the database.`}
          </p>
          <Link
            to="/receivables"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#151D1C] text-white rounded text-xs font-bold hover:bg-[#253231]"
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
        <div className="flex items-center gap-3 flex-wrap">
          {invoice.status !== 'Paid' && (
            <button 
              onClick={() => {
                setPaymentAmount(invoice.outstandingAmount || invoice.numericAmount);
                setPaymentDate(new Date().toISOString().slice(0, 10));
                setPaymentRef('');
                setPaymentError(null);
                setIsRecordPaymentOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-emerald-600/40 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-700">payments</span>
              Record Payment
            </button>
          )}

          <button 
            onClick={() => handleAction('Downloaded PDF copy')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E0DED7] rounded text-xs font-semibold text-[#1B1C19] bg-white hover:bg-[#F5F3EE] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">download</span>
            Download PDF
          </button>
          
          {invoice.status !== 'Paid' && (
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
          )}
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
            <span className={`font-mono text-2xl font-bold ${invoice.status === 'Paid' ? 'text-emerald-700' : 'text-error'}`}>
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
            <span className={`font-mono text-3xl font-bold ${invoice.status === 'Paid' ? 'text-emerald-700' : 'text-error'}`}>
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
                  {invoice.status === 'Paid' 
                    ? ' This invoice is settled in full with zero active risk.'
                    : ' This overdue balance represents working capital concentration and affects projected cash runway.'}
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
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>Invoice tracking is active and grounded in verified ledger records.</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment History & Ledger */}
          <div className="bg-white border border-[#E0DED7] rounded p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-[#1B1C19] mb-4">Payment History & Ledger</h3>
            <div className="space-y-4 text-xs font-sans">
              <div className="divide-y divide-[#E0DED7]">
                {invoice.history && invoice.history.map((hist, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-[#1B1C19]">{hist.text}</div>
                      <div className="text-gray-400 font-mono text-[11px]">{hist.date}</div>
                    </div>
                    <span className="font-mono font-bold text-gray-700">{hist.amount}</span>
                  </div>
                ))}
              </div>
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
              {invoice.status === 'Paid' 
                ? 'Invoice is settled in full. No collection actions required.'
                : 'Based on credit risk and payment delay, execute the following recovery workflow:'}
            </p>

            {invoice.status !== 'Paid' && (
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
            )}
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

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-md bg-white border border-[#E0DED7] rounded shadow-xl p-6 animate-in fade-in">
            <h3 className="text-base font-bold text-[#1B1C19] mb-1">Record Payment Received</h3>
            <p className="text-xs text-gray-500 mb-4">
              Apply payment for Invoice <span className="font-mono font-bold text-gray-700">{invoice.id}</span> ({invoice.customer}):
            </p>

            {paymentError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={invoice.numericAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border border-[#E0DED7] rounded font-mono font-bold text-sm outline-none focus:border-[#151D1C]"
                />
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Outstanding: {invoice.outstanding}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2 border border-[#E0DED7] rounded font-mono outline-none focus:border-[#151D1C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-[#E0DED7] rounded font-sans outline-none focus:border-[#151D1C]"
                  >
                    <option value="NEFT">NEFT Transfer</option>
                    <option value="RTGS">RTGS Transfer</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Cheque">Cheque Deposit</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-982348123"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full p-2 border border-[#E0DED7] rounded font-mono outline-none focus:border-[#151D1C]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E0DED7]">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 border border-[#E0DED7] rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingPayment ? (
                    <span className="material-symbols-outlined text-sm animate-spin text-white">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                  {isSubmittingPayment ? 'Saving...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
