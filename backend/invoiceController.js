const { supabase, getPrimaryBusiness } = require('./supabase');
const { outstandingAmount, calculateDaysOverdue, calculateDaysUntilDue } = require('./calculations');

function enrichInvoice(invoice, payments = [], customer = null) {
  const outstanding = outstandingAmount(invoice.amount, payments);
  const daysOverdue = calculateDaysOverdue(invoice.due_date);
  const daysUntilDue = calculateDaysUntilDue(invoice.due_date);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    ...invoice,
    customer_name: customer ? customer.name : invoice.customer_name || 'Unknown',
    customer: customer || { name: invoice.customer_name || 'Unknown' },
    outstanding_amount: outstanding,
    days_overdue: daysOverdue,
    days_until_due: daysUntilDue,
    total_paid: totalPaid,
    payments: payments || [],
  };
}

async function fetchEnrichedInvoices(businessId, filterFn = null) {
  const [{ data: invoices, error: invoicesError }, { data: customers, error: customersError }] =
    await Promise.all([
      supabase.from('invoices').select('*').eq('business_id', businessId).order('due_date', { ascending: false }),
      supabase.from('customers').select('*').eq('business_id', businessId),
    ]);

  if (invoicesError) throw invoicesError;
  if (customersError) throw customersError;

  const invoiceIds = (invoices || []).map((inv) => inv.id);
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .in('invoice_id', invoiceIds.length ? invoiceIds : ['00000000-0000-0000-0000-000000000000']);

  if (paymentsError) throw paymentsError;

  const paymentsByInvoiceId = {};
  for (const payment of payments || []) {
    if (!paymentsByInvoiceId[payment.invoice_id]) paymentsByInvoiceId[payment.invoice_id] = [];
    paymentsByInvoiceId[payment.invoice_id].push(payment);
  }

  const customersById = {};
  for (const customer of customers || []) {
    customersById[customer.id] = customer;
  }

  let enriched = (invoices || []).map((invoice) =>
    enrichInvoice(invoice, paymentsByInvoiceId[invoice.id] || [], customersById[invoice.customer_id])
  );

  if (filterFn) {
    enriched = enriched.filter(filterFn);
  }

  return enriched;
}

// GET /api/invoices
async function getInvoices(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const data = await fetchEnrichedInvoices(business.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/invoices/overdue
async function getOverdueInvoices(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const data = await fetchEnrichedInvoices(business.id, (inv) => inv.days_overdue > 0 && inv.outstanding_amount > 0);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/invoices/due-soon
async function getDueSoonInvoices(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const data = await fetchEnrichedInvoices(
      business.id,
      (inv) => inv.days_overdue === 0 && inv.days_until_due <= 7 && inv.outstanding_amount > 0
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/invoices/:id
async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('invoices').select('*');
    if (business) {
      query = query.eq('business_id', business.id);
    }

    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('invoice_number', id);
    }

    const { data: invoice, error: invoiceError } = await query.maybeSingle();

    if (invoiceError) throw invoiceError;
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const [{ data: payments, error: paymentsError }, { data: customer, error: customerError }] =
      await Promise.all([
        supabase.from('payments').select('*').eq('invoice_id', invoice.id),
        supabase.from('customers').select('*').eq('id', invoice.customer_id).maybeSingle(),
      ]);

    if (paymentsError) throw paymentsError;
    if (customerError) throw customerError;

    res.json({ success: true, data: enrichInvoice(invoice, payments || [], customer) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/invoices
async function createInvoice(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    let { customer_id, customer, invoice_number, amount, issue_date, due_date } = req.body;

    // Support either customer_id or customer name string
    if (!customer_id && customer) {
      const { data: existingCust } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', business.id)
        .ilike('name', customer)
        .maybeSingle();

      if (existingCust) {
        customer_id = existingCust.id;
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({
            business_id: business.id,
            name: customer.trim(),
            average_payment_days: 14,
            payment_reliability: 75,
          })
          .select()
          .single();

        if (custErr) throw custErr;
        customer_id = newCust.id;
      }
    }

    if (!customer_id) {
      return res.status(400).json({ success: false, error: 'customer_id or customer name is required' });
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'A valid amount is required' });
    }

    // Auto-generate invoice number if missing
    if (!invoice_number) {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id);

      const nextNum = (count || 0) + 1001;
      invoice_number = `INV-${nextNum}`;
    }

    const { data: newInvoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        business_id: business.id,
        customer_id,
        invoice_number,
        amount: Number(amount),
        issue_date: issue_date || new Date().toISOString().slice(0, 10),
        due_date: due_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'pending',
      })
      .select()
      .single();

    if (invError) throw invError;

    const { data: custRecord } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .maybeSingle();

    res.status(201).json({
      success: true,
      data: enrichInvoice(newInvoice, [], custRecord),
    });
  } catch (error) {
    console.error('createInvoice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// PUT /api/invoices/:id
async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { status, notes, due_date, amount } = req.body;

    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(due_date !== undefined && { due_date }),
        ...(amount !== undefined && { amount }),
      })
      .eq('id', id)
      .eq('business_id', business.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE /api/invoices/:id
async function deleteInvoice(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('business_id', business.id);

    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  enrichInvoice,
  fetchEnrichedInvoices,
  getInvoices,
  getOverdueInvoices,
  getDueSoonInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
