const { supabase } = require('./supabase');
const { calculateInvoiceStatus } = require('./calculations');

// GET /api/invoices/:invoiceId/payments
async function getPaymentsForInvoice(req, res) {
  try {
    const { invoiceId } = req.params;

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/payments
// Records a new payment, then recalculates and updates the parent
// invoice's status so it never shows "paid" unless the full amount has
// actually been received.
async function createPayment(req, res) {
  try {
    const { invoice_id, amount, payment_date, payment_method, reference } = req.body;

    if (!invoice_id || !amount) {
      return res.status(400).json({ success: false, error: 'invoice_id and amount are required' });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .maybeSingle();

    if (invoiceError) throw invoiceError;
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { data: newPayment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id,
        amount,
        payment_date: payment_date || new Date().toISOString().slice(0, 10),
        payment_method: payment_method || null,
        reference: reference || null,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Recalculate status from ALL payments on this invoice, not just the
    // new one, so partial payments accumulate correctly.
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoice_id);

    if (allPaymentsError) throw allPaymentsError;

    const newStatus = calculateInvoiceStatus(invoice, allPayments || []);

    const paidDate = newStatus === 'paid' ? new Date().toISOString().slice(0, 10) : invoice.paid_date;

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({ status: newStatus, paid_date: paidDate })
      .eq('id', invoice_id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(201).json({
      success: true,
      data: { payment: newPayment, invoice: updatedInvoice },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getPaymentsForInvoice,
  createPayment,
};
