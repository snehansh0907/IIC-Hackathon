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

// Date & Amount normalizers for file imports
function parseDateString(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'number') {
    // Excel serial date: days since 1899-12-30
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateStr * 86400000);
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  const str = String(dateStr).trim();
  if (!str) return null;

  // 1. Tally format YYYYMMDD (e.g. 20260825)
  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    return `${y}-${m}-${d}`;
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(str)) {
    const parts = str.split(/[-/.]/);
    const y = parts[0];
    const m = String(parts[1]).padStart(2, '0');
    const d = String(parts[2]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(str)) {
    const parts = str.split(/[-/.]/);
    const d = String(parts[0]).padStart(2, '0');
    const m = String(parts[1]).padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }

  // 4. Standard Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function parseAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.abs(val);
  if (!val) return 0;
  let str = String(val)
    .replace(/[₹$,\s]/g, '')
    .replace(/(dr|cr)$/i, '')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

function parseStatus(val) {
  const str = String(val || '').toLowerCase().trim();
  if (['paid', 'closed', 'settled', 'cleared', 'completed'].includes(str)) {
    return 'paid';
  }
  if (str === 'disputed') {
    return 'disputed';
  }
  return 'pending';
}

// POST /api/invoices/import
async function importInvoices(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No authenticated business found.' });
    }

    const { invoices, source } = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ success: false, error: 'No invoice records provided for import.' });
    }

    // 1. Fetch existing customers for this business
    const { data: existingCustomers, error: custFetchErr } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', business.id);

    if (custFetchErr) throw custFetchErr;

    const customerMapByName = {};
    for (const cust of existingCustomers || []) {
      customerMapByName[cust.name.trim().toLowerCase()] = cust;
    }

    // 2. Fetch existing invoices for duplicate detection
    const { data: existingInvoices, error: invFetchErr } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('business_id', business.id);

    if (invFetchErr) throw invFetchErr;

    const existingInvoiceNumbers = new Set(
      (existingInvoices || []).map((inv) => String(inv.invoice_number || '').trim().toLowerCase())
    );

    const imported = [];
    const skipped = [];
    const errors = [];
    let newCustomersCount = 0;

    for (let i = 0; i < invoices.length; i++) {
      const row = invoices[i];
      const rowNum = i + 1;

      // Extract & sanitize invoice number
      const invoiceNumber = String(row.invoice_number || row.invoiceNo || row.voucherNumber || row.billNumber || '').trim();
      if (!invoiceNumber) {
        errors.push({ row: rowNum, reason: 'Missing invoice number' });
        continue;
      }

      // Check duplicate
      const invNumKey = invoiceNumber.toLowerCase();
      if (existingInvoiceNumbers.has(invNumKey)) {
        skipped.push({
          row: rowNum,
          invoiceNumber,
          customer: row.customer_name || row.customer || 'Unknown',
          reason: 'Invoice already exists in database',
        });
        continue;
      }

      // Extract & sanitize customer name
      const customerName = String(row.customer_name || row.customer || row.partyName || row.client || '').trim();
      if (!customerName) {
        errors.push({ row: rowNum, invoiceNumber, reason: 'Missing customer/client name' });
        continue;
      }

      // Extract & sanitize amount
      const rawAmt = row.amount !== undefined ? row.amount : (row.total || row.grandTotal || row.netAmount);
      const amountNum = parseAmount(rawAmt);
      if (amountNum <= 0) {
        errors.push({ row: rowNum, invoiceNumber, reason: 'Invalid or non-positive invoice amount' });
        continue;
      }

      // Extract & normalize dates
      const issueDate = parseDateString(row.issue_date || row.invoiceDate || row.date) || new Date().toISOString().slice(0, 10);
      let dueDate = parseDateString(row.due_date || row.dueDate || row.expiryDate);
      if (!dueDate) {
        // Fallback: issue_date + 30 days
        const d = new Date(issueDate);
        d.setDate(d.getDate() + 30);
        dueDate = d.toISOString().slice(0, 10);
      }

      // Normalize status
      const normalizedStatus = parseStatus(row.status);

      // Customer Matching / Creation
      const custKey = customerName.toLowerCase();
      let customer = customerMapByName[custKey];

      if (!customer) {
        const { data: newCust, error: createCustErr } = await supabase
          .from('customers')
          .insert({
            business_id: business.id,
            name: customerName,
            email: row.customer_email || row.email || null,
            phone: row.customer_phone || row.phone || null,
            average_payment_days: 14,
            payment_reliability: 75,
          })
          .select()
          .single();

        if (createCustErr) {
          errors.push({ row: rowNum, invoiceNumber, reason: `Failed to create customer record: ${createCustErr.message}` });
          continue;
        }

        customer = newCust;
        customerMapByName[custKey] = newCust;
        newCustomersCount++;
      }

      // Insert Invoice
      const { data: newInvoice, error: createInvErr } = await supabase
        .from('invoices')
        .insert({
          business_id: business.id,
          customer_id: customer.id,
          invoice_number: invoiceNumber,
          amount: amountNum,
          issue_date: issueDate,
          due_date: dueDate,
          status: normalizedStatus,
          paid_date: normalizedStatus === 'paid' ? (parseDateString(row.paid_date) || issueDate) : null,
        })
        .select()
        .single();

      if (createInvErr) {
        errors.push({ row: rowNum, invoiceNumber, reason: `Database insertion error: ${createInvErr.message}` });
        continue;
      }

      // Track newly inserted invoice number to prevent duplicates within the same batch
      existingInvoiceNumbers.add(invNumKey);

      imported.push({
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoice_number,
        customer: customer.name,
        amount: newInvoice.amount,
        issueDate: newInvoice.issue_date,
        dueDate: newInvoice.due_date,
        status: newInvoice.status,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalProcessed: invoices.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
        errorCount: errors.length,
        newCustomersCount,
        imported,
        skipped,
        errors,
        source: source || 'File Import',
      },
    });
  } catch (error) {
    console.error('importInvoices error:', error);
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
  importInvoices,
  parseDateString,
  parseAmount,
  parseStatus,
};

