const { supabase, getPrimaryBusiness } = require('./supabase');
const { fetchEnrichedInvoices } = require('./invoiceController');
const { levelFromScore } = require('./riskService');

function moneyShort(value) {
  const num = Number(value || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString('en-IN')}`;
}

// GET /api/customers
async function getCustomers(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { query } = req.query;

    let custQuery = supabase
      .from('customers')
      .select('*')
      .eq('business_id', business.id)
      .order('name', { ascending: true });

    if (query && query.trim()) {
      custQuery = custQuery.ilike('name', `%${query.trim()}%`);
    }

    const { data: customers, error: customersError } = await custQuery;

    if (customersError) throw customersError;

    // Fetch invoices to enrich each customer with real live figures
    const invoices = await fetchEnrichedInvoices(business.id);

    // Group invoices by customer
    const invoicesByCustomer = {};
    for (const inv of invoices) {
      if (!invoicesByCustomer[inv.customer_id]) {
        invoicesByCustomer[inv.customer_id] = [];
      }
      invoicesByCustomer[inv.customer_id].push(inv);
    }

    const enrichedCustomers = (customers || []).map((customer) => {
      const custInvoices = invoicesByCustomer[customer.id] || [];
      const totalInvoices = custInvoices.length;
      
      const totalBilled = custInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
      const totalOutstanding = custInvoices.reduce((sum, inv) => sum + Number(inv.outstanding_amount || 0), 0);
      const totalOverdue = custInvoices
        .filter((inv) => Number(inv.days_overdue || 0) > 0)
        .reduce((sum, inv) => sum + Number(inv.outstanding_amount || 0), 0);

      const overdueInvoicesCount = custInvoices.filter((inv) => Number(inv.days_overdue || 0) > 0).length;

      // Determine risk score & level based on overdue ratio and reliability
      let riskScore = 0;
      if (totalOutstanding > 0 && overdueInvoicesCount > 0) {
        const overdueRatio = totalOverdue / totalOutstanding;
        riskScore = Math.min(100, Math.round(overdueRatio * 60 + (100 - customer.payment_reliability) * 0.4));
      } else if (customer.payment_reliability < 60) {
        riskScore = Math.round(100 - customer.payment_reliability);
      } else {
        riskScore = 20;
      }

      const riskLevel = levelFromScore(riskScore);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        city: customer.city || 'Pune, MH',
        contactPerson: customer.primary_contact || `${customer.name.split(' ')[0]} Accounts Lead`,
        average_payment_days: customer.average_payment_days,
        payment_reliability: customer.payment_reliability,
        avgPaymentTime: `${customer.average_payment_days} days`,
        reliability: `${customer.payment_reliability}%`,
        reliabilityNum: customer.payment_reliability,
        totalInvoices,
        totalBilled: moneyShort(totalBilled),
        totalBilledNum: totalBilled,
        outstanding: moneyShort(totalOutstanding),
        outstandingNum: totalOutstanding,
        overdue: moneyShort(totalOverdue),
        overdueNum: totalOverdue,
        overdueInvoicesCount,
        currentRisk: riskLevel,
        riskScore,
      };
    });

    res.json({
      success: true,
      data: enrichedCustomers,
      totalCount: enrichedCustomers.length,
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/customers/:id
async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();

    let query = supabase.from('customers').select('*');
    if (business) {
      query = query.eq('business_id', business.id);
    }

    const { data: customer, error } = await query
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/customers
async function createCustomer(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { name, email, phone, average_payment_days, payment_reliability } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    const trimmedName = name.trim();

    // Check if customer with same name already exists for this business (case-insensitive)
    const { data: existingCustomer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', business.id)
      .ilike('name', trimmedName)
      .maybeSingle();

    if (findError) throw findError;

    if (existingCustomer) {
      return res.status(200).json({
        success: true,
        data: existingCustomer,
        message: 'Customer already exists'
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: business.id,
        name: trimmedName,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        average_payment_days: average_payment_days ?? 14,
        payment_reliability: payment_reliability ?? 75,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('createCustomer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { name, email, phone, average_payment_days, payment_reliability } = req.body;

    const { data, error } = await supabase
      .from('customers')
      .update({
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(average_payment_days !== undefined && { average_payment_days }),
        ...(payment_reliability !== undefined && { payment_reliability }),
      })
      .eq('id', id)
      .eq('business_id', business.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE /api/customers/:id
async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { error } = await supabase
      .from('customers')
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
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
