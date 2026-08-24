// Rule-based cash-flow forecast. No ML — just a straightforward
// projection: currentCash + expected collections - expected expenses,
// calculated for a handful of future checkpoints (7/14/30/45/60/90 days).

const { outstandingAmount, round2 } = require('./calculations');

const FORECAST_HORIZONS_DAYS = [7, 14, 30, 45, 60, 90];

/**
 * Estimates how much of an invoice's outstanding balance will realistically
 * be collected by a given date, weighted by the customer's payment
 * reliability (0-100 treated as a probability).
 */
function expectedCollectionForInvoice(invoice, payments, customer, cutoffDate) {
  const dueDate = new Date(invoice.due_date);
  if (dueDate > cutoffDate) {
    // Not due within this window yet, so we don't count on collecting it.
    return 0;
  }

  const outstanding = outstandingAmount(invoice.amount, payments);
  if (outstanding <= 0) return 0;

  const reliability = typeof customer?.payment_reliability === 'number'
    ? customer.payment_reliability
    : 70; // sensible default if a customer has no history yet

  const probability = reliability / 100;
  return outstanding * probability;
}

/**
 * Estimates expenses that will come due within a given window.
 */
function expectedExpensesByDate(expenses, cutoffDate) {
  return expenses
    .filter((expense) => expense.status !== 'paid')
    .filter((expense) => new Date(expense.due_date) <= cutoffDate)
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

/**
 * Builds a full cash-flow forecast for a business.
 *
 * @param {object} business - must include current_cash and minimum_cash_threshold
 * @param {array} invoices - all non-paid invoices for the business
 * @param {object} paymentsByInvoiceId - map of invoiceId -> array of payments
 * @param {object} customersById - map of customerId -> customer row
 * @param {array} expenses - all expenses for the business
 */
function calculateCashFlowForecast({ business, invoices, paymentsByInvoiceId, customersById, expenses }) {
  const currentCash = Number(business.current_cash || 0);
  const minimumCashThreshold = Number(business.minimum_cash_threshold || 0);
  const today = new Date();

  const forecast = FORECAST_HORIZONS_DAYS.map((days) => {
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const expectedCollections = invoices.reduce((total, invoice) => {
      const payments = paymentsByInvoiceId[invoice.id] || [];
      const customer = customersById[invoice.customer_id];
      return total + expectedCollectionForInvoice(invoice, payments, customer, cutoffDate);
    }, 0);

    const expectedExpenses = expectedExpensesByDate(expenses, cutoffDate);

    const projectedCash = round2(currentCash + expectedCollections - expectedExpenses);

    return {
      days,
      projectedCash,
      expectedCollections: round2(expectedCollections),
      expectedExpenses: round2(expectedExpenses),
    };
  });

  // Find the first checkpoint where projected cash dips below the
  // business's minimum threshold, if any.
  const shortfallPoint = forecast.find((point) => point.projectedCash < minimumCashThreshold);

  return {
    currentCash: round2(currentCash),
    minimumCashThreshold: round2(minimumCashThreshold),
    forecast,
    cashWarning: Boolean(shortfallPoint),
    daysUntilShortfall: shortfallPoint ? shortfallPoint.days : null,
    shortfallAmount: shortfallPoint
      ? round2(minimumCashThreshold - shortfallPoint.projectedCash)
      : 0,
  };
}

module.exports = {
  calculateCashFlowForecast,
  FORECAST_HORIZONS_DAYS,
};
