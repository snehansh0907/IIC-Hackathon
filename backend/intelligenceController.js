const { supabase, getPrimaryBusiness } = require('./supabase');
const { fetchEnrichedInvoices } = require('./invoiceController');
const { calculateInvoiceRisk, levelFromScore } = require('./riskService');
const { calculateCashFlowForecast } = require('./cashFlowService');
const { generateRecommendations } = require('./recommendationService');
const { outstandingAmount, sumPayments, round2 } = require('./calculations');

// Loads everything needed by the intelligence endpoints in one place, scoped to business
async function loadBusinessData(targetBusiness = null) {
  const business = targetBusiness || await getPrimaryBusiness();
  if (!business) return null;

  const invoices = await fetchEnrichedInvoices(business.id);

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id);
  if (customersError) throw customersError;

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', business.id);
  if (expensesError) throw expensesError;

  const invoiceIds = invoices.map((inv) => inv.id);
  const { data: allPayments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .in('invoice_id', invoiceIds.length ? invoiceIds : ['00000000-0000-0000-0000-000000000000']);
  if (paymentsError) throw paymentsError;

  const customersById = {};
  for (const customer of customers || []) {
    customersById[customer.id] = customer;
  }

  const paymentsByInvoiceId = {};
  for (const payment of allPayments || []) {
    if (!paymentsByInvoiceId[payment.invoice_id]) paymentsByInvoiceId[payment.invoice_id] = [];
    paymentsByInvoiceId[payment.invoice_id].push(payment);
  }

  const lateCountByCustomerId = {};
  for (const invoice of invoices) {
    if (invoice.status === 'paid' && invoice.paid_date && invoice.paid_date > invoice.due_date) {
      lateCountByCustomerId[invoice.customer_id] = (lateCountByCustomerId[invoice.customer_id] || 0) + 1;
    }
  }

  return {
    business,
    invoices,
    customers: customers || [],
    expenses: expenses || [],
    customersById,
    paymentsByInvoiceId,
    lateCountByCustomerId,
  };
}

// GET /api/intelligence/risk
async function getRiskScores(req, res) {
  try {
    const data = await loadBusinessData(req.business);
    if (!data) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { invoices, customersById, paymentsByInvoiceId, lateCountByCustomerId } = data;

    const openInvoices = invoices.filter((inv) => Number(inv.outstanding_amount || 0) > 0);

    const scores = openInvoices.map((inv) => {
      const customer = customersById[inv.customer_id];
      const payments = paymentsByInvoiceId[inv.id] || [];
      const lateCount = lateCountByCustomerId[inv.customer_id] || 0;

      const risk = calculateInvoiceRisk(inv, customer, payments, lateCount);

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        customerId: inv.customer_id,
        customerName: customer ? customer.name : 'Unknown Customer',
        outstandingAmount: inv.outstanding_amount,
        daysOverdue: inv.days_overdue,
        daysUntilDue: inv.days_until_due,
        riskScore: risk.score,
        riskLevel: risk.level,
        breakdown: risk.breakdown,
        factors: risk.factors,
        recommendations: risk.recommendations,
      };
    });

    scores.sort((a, b) => b.riskScore - a.riskScore);

    res.json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/intelligence/risk/:invoiceId
async function getInvoiceRisk(req, res) {
  try {
    const { invoiceId } = req.params;
    const data = await loadBusinessData(req.business);
    if (!data) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { invoices, customersById, paymentsByInvoiceId, lateCountByCustomerId } = data;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId);
    const invoice = invoices.find((inv) => (isUuid ? inv.id === invoiceId : inv.invoice_number === invoiceId));

    if (!invoice) {
      return res.status(404).json({ success: false, error: `Invoice "${invoiceId}" not found.` });
    }

    const customer = customersById[invoice.customer_id];
    const payments = paymentsByInvoiceId[invoice.id] || [];
    const lateCount = lateCountByCustomerId[invoice.customer_id] || 0;

    const risk = calculateInvoiceRisk(invoice, customer, payments, lateCount);

    res.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerName: customer ? customer.name : 'Unknown Customer',
        score: risk.score,
        level: risk.level,
        explanation: risk.explanation,
        breakdown: risk.breakdown,
        factors: risk.factors,
        recommendations: risk.recommendations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/intelligence/customer/:customerId
async function getCustomerIntelligence(req, res) {
  try {
    const { customerId } = req.params;
    const data = await loadBusinessData(req.business);
    if (!data) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { invoices, customersById, paymentsByInvoiceId } = data;
    const customer = customersById[customerId];

    if (!customer) {
      return res.status(404).json({ success: false, error: `Customer "${customerId}" not found.` });
    }

    const customerInvoices = invoices.filter((inv) => inv.customer_id === customerId);
    const paidInvoices = customerInvoices.filter((inv) => inv.status === 'paid');
    const openInvoices = customerInvoices.filter((inv) => Number(inv.outstanding_amount || 0) > 0);
    const overdueInvoices = openInvoices.filter((inv) => Number(inv.days_overdue || 0) > 0);

    const totalBilled = customerInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalOutstanding = openInvoices.reduce((sum, inv) => sum + Number(inv.outstanding_amount), 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.outstanding_amount), 0);

    let latePayments = 0;
    for (const inv of paidInvoices) {
      if (inv.paid_date && inv.due_date && inv.paid_date > inv.due_date) {
        latePayments += 1;
      }
    }

    const historicalDelay = Number(customer.average_payment_days || 14);
    const worstOverdue = overdueInvoices.reduce((max, inv) => Math.max(max, inv.days_overdue), 0);
    const delayMultiple = historicalDelay > 0 && worstOverdue > 0 ? round2(worstOverdue / historicalDelay) : 1;

    let customerRiskScore = 0;
    if (totalOutstanding > 0 && overdueInvoices.length > 0) {
      const overdueRatio = totalOverdue / totalOutstanding;
      customerRiskScore = Math.min(100, Math.round(overdueRatio * 60 + (100 - customer.payment_reliability) * 0.4));
    } else if (customer.payment_reliability < 60) {
      customerRiskScore = Math.round(100 - customer.payment_reliability);
    } else {
      customerRiskScore = 20;
    }

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        customerName: customer.name,
        paymentReliabilityScore: customer.payment_reliability,
        historicalAveragePaymentDays: historicalDelay,
        totalInvoices: customerInvoices.length,
        paidInvoicesCount: paidInvoices.length,
        openInvoicesCount: openInvoices.length,
        overdueInvoicesCount: overdueInvoices.length,
        totalBilled: round2(totalBilled),
        totalOutstanding: round2(totalOutstanding),
        totalOverdue: round2(totalOverdue),
        numberOfLatePayments: latePayments,
        worstCurrentDelayDays: worstOverdue,
        delayMultiple,
        overallRiskScore: customerRiskScore,
        overallRiskLevel: levelFromScore(customerRiskScore),
        recommendations:
          customerRiskScore >= 70
            ? ['Hold future shipments until overdue invoices are settled.', 'Require 50% advance for next PO.']
            : customerRiskScore >= 40
            ? ['Follow up on overdue invoices.', 'Lock in a confirmed payment date via email.']
            : ['Customer is in good standing.'],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/intelligence/cashflow
async function getCashFlowForecast(req, res) {
  try {
    const data = await loadBusinessData(req.business);
    if (!data) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { business, invoices, expenses, customersById, paymentsByInvoiceId } = data;

    const forecast = calculateCashFlowForecast({
      business,
      invoices,
      paymentsByInvoiceId,
      customersById,
      expenses,
    });

    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/intelligence/recommendations
async function getRecommendations(req, res) {
  try {
    const data = await loadBusinessData(req.business);
    if (!data) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { business, invoices, expenses, customersById, paymentsByInvoiceId, lateCountByCustomerId } = data;

    const recommendations = generateRecommendations({
      business,
      invoices,
      expenses,
      customersById,
      paymentsByInvoiceId,
      lateCountByCustomerId,
    });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getRiskScores,
  getInvoiceRisk,
  getCustomerIntelligence,
  getCashFlowForecast,
  getRecommendations,
};
