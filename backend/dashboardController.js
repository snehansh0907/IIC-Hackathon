const { supabase, getPrimaryBusiness } = require('./supabase');
const { fetchEnrichedInvoices } = require('./invoiceController');
const { calculateInvoiceRisk } = require('./riskService');
const { calculateCashFlowForecast } = require('./cashFlowService');

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function moneyShort(value) {
  const num = Number(value || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return money(num);
}

// GET /api/dashboard
async function getDashboard(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No business found.'
      });
    }

    // --------------------------------------------------
    // 1. FETCH DATABASE DATA
    // --------------------------------------------------

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

    const invoiceIds = invoices.map(inv => inv.id);

    const { data: allPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .in(
        'invoice_id',
        invoiceIds.length
          ? invoiceIds
          : ['00000000-0000-0000-0000-000000000000']
      );

    if (paymentsError) throw paymentsError;

    // --------------------------------------------------
    // 2. CREATE LOOKUP TABLES
    // --------------------------------------------------

    const customersById = {};
    for (const customer of customers || []) {
      customersById[customer.id] = customer;
    }

    const paymentsByInvoiceId = {};
    for (const payment of allPayments || []) {
      if (!paymentsByInvoiceId[payment.invoice_id]) {
        paymentsByInvoiceId[payment.invoice_id] = [];
      }
      paymentsByInvoiceId[payment.invoice_id].push(payment);
    }

    // --------------------------------------------------
    // 3. LATE PAYMENT HISTORY
    // --------------------------------------------------

    const lateCountByCustomerId = {};
    for (const invoice of invoices) {
      if (
        invoice.status === 'paid' &&
        invoice.paid_date &&
        invoice.due_date &&
        invoice.paid_date > invoice.due_date
      ) {
        lateCountByCustomerId[invoice.customer_id] =
          (lateCountByCustomerId[invoice.customer_id] || 0) + 1;
      }
    }

    // --------------------------------------------------
    // 4. CLASSIFY INVOICES
    // --------------------------------------------------

    const openInvoices = invoices.filter(
      inv => Number(inv.outstanding_amount || 0) > 0
    );

    const overdueInvoices = openInvoices.filter(
      inv => Number(inv.days_overdue || 0) > 0
    );

    const dueSoonInvoices = openInvoices.filter(
      inv =>
        Number(inv.days_overdue || 0) <= 0 &&
        Number(inv.days_until_due || 999) <= 7
    );

    const paidInvoices = invoices.filter(
      inv => inv.status === 'paid'
    );

    // --------------------------------------------------
    // 5. CALCULATE TOTALS
    // --------------------------------------------------

    const totalReceivables = openInvoices.reduce(
      (sum, inv) => sum + Number(inv.outstanding_amount || 0),
      0
    );

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.outstanding_amount || 0),
      0
    );

    const totalDueSoon = dueSoonInvoices.reduce(
      (sum, inv) => sum + Number(inv.outstanding_amount || 0),
      0
    );

    const totalPaid = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.amount || 0),
      0
    );

    // --------------------------------------------------
    // 6. CALCULATE RISK FOR EVERY OPEN INVOICE
    // --------------------------------------------------

    const enrichedOpenInvoices = openInvoices.map(invoice => {
      const customer = customersById[invoice.customer_id];
      const payments = paymentsByInvoiceId[invoice.id] || [];
      const lateCount = lateCountByCustomerId[invoice.customer_id] || 0;

      const risk = calculateInvoiceRisk(
        invoice,
        customer,
        payments,
        lateCount
      );

      return {
        ...invoice,
        customer_name: customer?.name || 'Unknown Customer',
        customer,
        risk
      };
    });

    // --------------------------------------------------
    // 7. COLLECTION QUEUE
    // Highest-risk overdue invoices first
    // --------------------------------------------------

    const collectionQueue = enrichedOpenInvoices
      .filter(inv => Number(inv.days_overdue || 0) > 0)
      .sort((a, b) => {
        return (b.risk?.score || 0) - (a.risk?.score || 0);
      })
      .slice(0, 5)
      .map((invoice, index) => ({
        id: invoice.id,
        rank: `0${index + 1}`,
        customer:
          invoice.customer_name ||
          invoice.customer?.name ||
          'Unknown Customer',
        amount: moneyShort(invoice.outstanding_amount),
        delay:
          Number(invoice.days_overdue || 0) === 1
            ? '1 day overdue'
            : `${Number(invoice.days_overdue || 0)} days overdue`,
        risk:
          invoice.risk?.level ||
          'Medium',
        riskScore:
          invoice.risk?.score || 0
      }));

    // --------------------------------------------------
    // 8. LARGEST OVERDUE ACCOUNTS
    // --------------------------------------------------

    const overdueByCustomer = {};
    for (const invoice of enrichedOpenInvoices) {
      if (Number(invoice.days_overdue || 0) <= 0) {
        continue;
      }

      const customerId = invoice.customer_id;

      if (!overdueByCustomer[customerId]) {
        overdueByCustomer[customerId] = {
          id: customerId,
          name: invoice.customer_name,
          amount: 0,
          invoiceCount: 0,
          maxDaysOverdue: 0
        };
      }

      overdueByCustomer[customerId].amount +=
        Number(invoice.outstanding_amount || 0);
      overdueByCustomer[customerId].invoiceCount += 1;
      overdueByCustomer[customerId].maxDaysOverdue =
        Math.max(
          overdueByCustomer[customerId].maxDaysOverdue,
          Number(invoice.days_overdue || 0)
        );
    }

    const largestOverdueAccounts =
      Object.values(overdueByCustomer)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(account => ({
          ...account,
          amount: moneyShort(account.amount),
          daysOverdue: account.maxDaysOverdue
        }));

    // --------------------------------------------------
    // 9. TODAY'S ACTIONS
    // --------------------------------------------------

    const todayActions = enrichedOpenInvoices
      .filter(inv =>
        Number(inv.days_overdue || 0) > 0
      )
      .sort(
        (a, b) =>
          (b.risk?.score || 0) -
          (a.risk?.score || 0)
      )
      .slice(0, 5)
      .map(invoice => ({
        id: invoice.id,
        title: `Follow up with ${invoice.customer_name}`,
        customer: invoice.customer_name,
        amount: moneyShort(invoice.outstanding_amount),
        priority: invoice.risk?.level || 'Medium',
        daysOverdue: Number(invoice.days_overdue || 0),
        type: 'collection'
      }));

    // --------------------------------------------------
    // 10. CASH FLOW
    // --------------------------------------------------

    const cashFlow = calculateCashFlowForecast({
      business,
      invoices: openInvoices,
      paymentsByInvoiceId,
      customersById,
      expenses: expenses || []
    });

    // --------------------------------------------------
    // 11. HIGHEST PRIORITY INVOICE
    // --------------------------------------------------

    let highestPriorityInvoice = null;
    let highestScore = -1;

    for (const invoice of enrichedOpenInvoices) {
      const score = invoice.risk?.score || 0;
      if (score > highestScore) {
        highestScore = score;
        highestPriorityInvoice = invoice;
      }
    }

    // --------------------------------------------------
    // 12. DYNAMIC ALERTS & NOTIFICATIONS
    // --------------------------------------------------
    const alerts = [];

    // Alert 1: Critical Cash Gap Warning
    if (cashFlow.cashWarning) {
      const days = cashFlow.daysUntilShortfall;
      const msg = days
        ? `Projected balance drops below safe limit within ${days} days.`
        : `Projected cash balance drops below safe threshold.`;
      alerts.push({
        id: 'alert-cash-gap',
        type: 'cash_warning',
        severity: 'critical',
        title: 'Critical Cash Gap Alert',
        message: msg,
        source: 'Live AI Watch',
        link: '/cash-flow',
        isRead: false,
      });
    }

    // Alert 2: High Risk Overdue Invoices
    const highRiskOverdueInvoices = enrichedOpenInvoices.filter(
      inv => Number(inv.days_overdue || 0) > 0 &&
        (inv.risk?.level === 'Critical' || inv.risk?.level === 'High' || (inv.risk?.score || 0) >= 60)
    );

    if (highRiskOverdueInvoices.length > 0) {
      const count = highRiskOverdueInvoices.length;
      alerts.push({
        id: 'alert-high-risk-overdue',
        type: 'high_risk_overdue',
        severity: 'high',
        title: 'High Risk Overdue Invoices',
        message: `${count} high-risk overdue account${count > 1 ? 's' : ''} require${count === 1 ? 's' : ''} follow-up in Action Center.`,
        source: 'Receivables Engine',
        link: '/action-center',
        isRead: false,
      });
    }

    // --------------------------------------------------
    // 13. RESPONSE FOR FRONTEND
    // --------------------------------------------------

    res.json({
      success: true,
      data: {
        company: {
          id: business.id,
          name: business.name,
          industry: business.industry,
          email: business.email,
          phone: business.phone,
          date: new Date().toLocaleDateString(
            'en-IN',
            {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }
          )
        },
        summary: {
          totalReceivables: {
            amount: moneyShort(totalReceivables),
            subtitle: 'Outstanding invoices',
            value: totalReceivables
          },
          overdue: {
            amount: moneyShort(totalOverdue),
            subtitle: 'Past due invoices',
            value: totalOverdue
          },
          dueSoon: {
            amount: moneyShort(totalDueSoon),
            subtitle: 'Due within 7 days',
            value: totalDueSoon
          },
          availableCash: {
            amount: moneyShort(
              Number(business.current_cash || 0)
            ),
            subtitle: 'Current cash balance',
            value: Number(business.current_cash || 0)
          },
          totalInvoices: invoices.length,
          openInvoiceCount: openInvoices.length,
          paidInvoiceCount: paidInvoices.length,
          dueSoonInvoiceCount: dueSoonInvoices.length
        },
        collectionQueue,
        largestOverdueAccounts,
        todayActions,
        cashPosition: cashFlow,
        totalReceivables: Math.round(totalReceivables),
        totalOverdue: Math.round(totalOverdue),
        totalDueSoon: Math.round(totalDueSoon),
        totalPaid: Math.round(totalPaid),
        overdueInvoiceCount: overdueInvoices.length,
        customerCount: (customers || []).length,
        currentCash: Number(business.current_cash || 0),
        cashFlowWarning: cashFlow.cashWarning,
        daysUntilShortfall: cashFlow.daysUntilShortfall,
        highestPriorityInvoice,
        alerts,
        alertCount: alerts.length,
        isDemo: Boolean(req.isDemo),
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getDashboard
};