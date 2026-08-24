// Turns risk scores and the cash-flow forecast into concrete, human-readable
// next actions. Every recommendation is derived from real numbers — nothing
// here is guessed or randomly generated.

const { outstandingAmount, daysOverdue, round2 } = require('./calculations');
const { calculateInvoiceRisk } = require('./riskService');

/**
 * Builds the full list of recommendations for a business.
 *
 * @param {array} invoices - all non-paid invoices
 * @param {object} paymentsByInvoiceId - map of invoiceId -> payments[]
 * @param {object} customersById - map of customerId -> customer row
 * @param {object} lateCountByCustomerId - map of customerId -> count of late invoices
 * @param {object} cashFlowForecast - result of calculateCashFlowForecast()
 */
function generateRecommendations({
  invoices,
  paymentsByInvoiceId,
  customersById,
  lateCountByCustomerId,
  cashFlowForecast,
}) {
  const recommendations = [];

  // Score every open invoice once, so we can reuse the results below.
  const scoredInvoices = invoices.map((invoice) => {
    const payments = paymentsByInvoiceId[invoice.id] || [];
    const customer = customersById[invoice.customer_id];
    const lateCount = lateCountByCustomerId[invoice.customer_id] || 0;
    const risk = calculateInvoiceRisk(invoice, customer, payments, lateCount);
    const outstanding = outstandingAmount(invoice.amount, payments);
    const overdueDays = daysOverdue(invoice.due_date);

    return { invoice, customer, risk, outstanding, overdueDays };
  });

  for (const { invoice, customer, risk, outstanding, overdueDays } of scoredInvoices) {
    if (outstanding <= 0) continue;

    const avgDelay = customer?.average_payment_days || 14;

    // Rule: significantly overdue invoice -> recommend collecting it.
    if (overdueDays > 0 && risk.level !== 'LOW') {
      recommendations.push({
        action: 'COLLECT',
        priority: risk.level,
        invoiceId: invoice.id,
        customerId: invoice.customer_id,
        reason: `Invoice ${invoice.invoice_number || invoice.id} is ${overdueDays} days overdue with a risk score of ${risk.score}.`,
        expectedImpact: round2(outstanding),
      });
    }

    // Rule: customer is currently far more overdue than their own history
    // suggests is normal -> recommend requesting a firm payment date.
    if (overdueDays > 0 && overdueDays > avgDelay * 2) {
      recommendations.push({
        action: 'REQUEST_PAYMENT_DATE',
        priority: overdueDays > avgDelay * 3 ? 'HIGH' : 'MEDIUM',
        invoiceId: invoice.id,
        customerId: invoice.customer_id,
        reason: `${customer?.name || 'This customer'} usually pays within about ${Math.round(avgDelay)} days, but this invoice is ${overdueDays} days overdue.`,
        expectedImpact: round2(outstanding),
      });
    }

    // Rule: customer has a poor reliability track record on a meaningful
    // balance -> recommend negotiating terms rather than just chasing.
    if (typeof customer?.payment_reliability === 'number' && customer.payment_reliability < 50 && outstanding > 0) {
      recommendations.push({
        action: 'NEGOTIATE',
        priority: 'MEDIUM',
        invoiceId: invoice.id,
        customerId: invoice.customer_id,
        reason: `${customer?.name || 'This customer'} has a low payment reliability score (${customer.payment_reliability}/100). Consider negotiating a revised payment plan.`,
        expectedImpact: round2(outstanding),
      });
    }
  }

  // Rule: if a cash-flow shortage is predicted, prioritize the single
  // largest overdue receivable and, separately, suggest exploring
  // receivables financing if enough outstanding value exists to help.
  if (cashFlowForecast?.cashWarning) {
    const overdueOnly = scoredInvoices
      .filter((item) => item.overdueDays > 0 && item.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);

    const biggest = overdueOnly[0];
    if (biggest) {
      recommendations.push({
        action: 'COLLECT',
        priority: 'CRITICAL',
        invoiceId: biggest.invoice.id,
        customerId: biggest.invoice.customer_id,
        reason: `A cash-flow shortfall of about ₹${cashFlowForecast.shortfallAmount.toLocaleString('en-IN')} is projected within ${cashFlowForecast.daysUntilShortfall} days. Collecting this invoice would meaningfully reduce it.`,
        expectedImpact: round2(biggest.outstanding),
      });
    }

    const totalOverdueOutstanding = overdueOnly.reduce((sum, item) => sum + item.outstanding, 0);
    if (totalOverdueOutstanding >= cashFlowForecast.shortfallAmount && totalOverdueOutstanding > 0) {
      recommendations.push({
        action: 'FINANCING',
        priority: 'HIGH',
        invoiceId: null,
        customerId: null,
        reason: `A projected cash shortfall exists, and there is ₹${round2(totalOverdueOutstanding).toLocaleString('en-IN')} in overdue receivables that could be candidates for receivables financing.`,
        expectedImpact: round2(Math.min(totalOverdueOutstanding, cashFlowForecast.shortfallAmount)),
      });
    }
  }

  // Sort so the most urgent recommendations appear first.
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  recommendations.sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

  return recommendations;
}

module.exports = { generateRecommendations };
