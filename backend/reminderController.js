const { supabase, getPrimaryBusiness } = require('./supabase');
const { sumPayments } = require('./calculations');
const { Resend } = require('resend');

function formatInr(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

// POST /api/reminders
// Body: { invoiceId, channel }
async function sendPaymentReminder(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found in database.' });
    }

    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'invoiceId is required.' });
    }

    // 1. Look up invoice (by UUID or invoice_number)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId);
    let invQuery = supabase.from('invoices').select('*').eq('business_id', business.id);
    if (isUuid) {
      invQuery = invQuery.eq('id', invoiceId);
    } else {
      invQuery = invQuery.eq('invoice_number', invoiceId);
    }

    const { data: invoice, error: invError } = await invQuery.maybeSingle();
    if (invError) throw invError;
    if (!invoice) {
      return res.status(404).json({ success: false, error: `Invoice "${invoiceId}" not found.` });
    }

    // 2. Look up customer record
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', invoice.customer_id)
      .maybeSingle();

    if (custError) throw custError;
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer record for this invoice not found.' });
    }

    // 3. Compute live financial balance & overdue duration
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoice.id);
    if (paymentsError) throw paymentsError;

    const totalPaid = sumPayments(payments || []);
    const outstanding = Math.max(0, Number(invoice.amount || 0) - totalPaid);

    const now = new Date();
    const dueDate = new Date(invoice.due_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / msPerDay));
    const invoiceNum = invoice.invoice_number || `INV-${invoice.id.slice(0, 6).toUpperCase()}`;

    // 4. Contact validation
    if (!customer.email || !customer.email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Customer email address is missing.',
      });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'RESEND_API_KEY is not configured in backend environment.',
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailSubject = `Payment Reminder — Invoice ${invoiceNum}`;
    const textContent = `Hello ${customer.name},\n\nThis is a payment reminder regarding your outstanding invoice.\n\nInvoice: ${invoiceNum}\nOutstanding Amount: ${formatInr(outstanding)}\nDue Date: ${invoice.due_date}\n\nPlease arrange the payment at your earliest convenience.\n\nThank you,\n${business.name}\nDuesOS`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1B1C19; background-color: #FBF9F4; margin: 0; padding: 24px; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #E0DED7; border-radius: 8px; overflow: hidden; }
            .header { background-color: #151D1C; color: #ffffff; padding: 24px; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF; }
            .header p { margin: 4px 0 0 0; color: #D1CFBF; font-size: 12px; }
            .content { padding: 28px 24px; font-size: 14px; color: #2C2D29; }
            .card { background-color: #FBF9F4; border: 1px solid #E0DED7; border-radius: 6px; padding: 18px; margin: 20px 0; }
            .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .card-row:last-child { margin-bottom: 0; }
            .card-label { color: #6B7280; font-weight: 500; font-size: 13px; }
            .card-value { font-weight: 700; color: #1B1C19; font-family: monospace; font-size: 14px; }
            .amount-highlight { color: #DC2626; font-size: 16px; font-weight: 800; }
            .footer { padding: 16px 24px; background-color: #F5F3EE; border-top: 1px solid #E0DED7; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${business.name}</h1>
              <p>Receivables & Accounts Department</p>
            </div>
            <div class="content">
              <p>Hello <strong>${customer.name}</strong>,</p>
              <p>This is a payment reminder regarding your outstanding invoice.</p>
              
              <div class="card">
                <div class="card-row">
                  <span class="card-label">Invoice:</span>
                  <span class="card-value">${invoiceNum}</span>
                </div>
                <div class="card-row">
                  <span class="card-label">Outstanding Amount:</span>
                  <span class="card-value amount-highlight">${formatInr(outstanding)}</span>
                </div>
                <div class="card-row">
                  <span class="card-label">Due Date:</span>
                  <span class="card-value">${invoice.due_date} ${daysOverdue > 0 ? `(${daysOverdue} days overdue)` : ''}</span>
                </div>
              </div>

              <p>Please arrange the payment at your earliest convenience.</p>
              
              <p style="margin-top: 24px; margin-bottom: 4px;">Thank you,</p>
              <p style="margin: 0; font-weight: 700; color: #151D1C;">${business.name}</p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">DuesOS</p>
            </div>
            <div class="footer">
              This reminder was sent on behalf of ${business.name} via DuesOS.
            </div>
          </div>
        </body>
      </html>
    `;

    // 5. Dispatch via Resend
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: 'DuesOS <onboarding@resend.dev>',
      to: [customer.email.trim()],
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    });

    if (resendError) {
      console.error('Resend delivery failed:', resendError.message || resendError);
      return res.status(400).json({
        success: false,
        error: resendError.message || 'Failed to send email through Resend.',
      });
    }

    // 6. Log completed action in Supabase
    const actionDesc = `Email reminder sent to ${customer.email} (Invoice #${invoiceNum} — ${formatInr(outstanding)})`;
    
    const { data: existingAction } = await supabase
      .from('actions')
      .select('*')
      .eq('business_id', business.id)
      .eq('invoice_id', invoice.id)
      .maybeSingle();

    let actionRecord = null;
    if (existingAction) {
      const { data: updatedAction } = await supabase
        .from('actions')
        .update({
          status: 'completed',
          description: actionDesc,
          type: 'payment_reminder',
        })
        .eq('id', existingAction.id)
        .select()
        .single();
      actionRecord = updatedAction;
    } else {
      const { data: newAction } = await supabase
        .from('actions')
        .insert({
          business_id: business.id,
          invoice_id: invoice.id,
          type: 'payment_reminder',
          priority: daysOverdue > 30 ? 'CRITICAL' : 'HIGH',
          description: actionDesc,
          status: 'completed',
        })
        .select()
        .single();
      actionRecord = newAction;
    }

    return res.status(200).json({
      success: true,
      data: {
        id: resendData.id,
        actionId: actionRecord?.id || null,
        invoiceId: invoice.id,
        invoiceNumber: invoiceNum,
        customerId: customer.id,
        customerName: customer.name,
        channel: 'email',
        recipient: {
          name: customer.name,
          email: customer.email,
        },
        outstandingAmount: outstanding,
        outstandingFormatted: formatInr(outstanding),
        daysOverdue,
        subject: emailSubject,
        delivered: true,
        mode: 'live_delivered',
        message: 'Payment reminder sent successfully.',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('sendPaymentReminder error:', error.message || error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/reminders/history
async function getReminderHistory(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { data: completedActions, error } = await supabase
      .from('actions')
      .select('*, invoices(*, customers(*))')
      .eq('business_id', business.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: completedActions || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  sendPaymentReminder,
  getReminderHistory,
};
