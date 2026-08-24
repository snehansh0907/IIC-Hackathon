// Rule-based risk engine. No machine learning, no randomness — every score
// is calculated directly from real database values so it's always
// explainable to a human.

const { daysOverdue, outstandingAmount, clamp, round2 } = require('./calculations');

// Score is split into four weighted parts that always add up to 100:
//   - How overdue the invoice is, relative to the customer's normal delay (40 pts)
//   - How large the invoice is (20 pts)
//   - The customer's overall payment reliability (25 pts)
//   - The customer's history of late payments (15 pts)
const WEIGHTS = {
  overdue: 40,
  amount: 20,
  reliability: 25,
  lateHistory: 15,
};

// An invoice above this amount is treated as "large" for scoring purposes.
// Chosen as a round number that comfortably covers the demo data's biggest
// invoices (e.g. ABC Construction's ~₹2,40,000 invoice).
const LARGE_INVOICE_AMOUNT = 250000;

function scoreOverdue(invoice, customerAvgDelay) {
  const overdueDays = daysOverdue(invoice.due_date);
  if (overdueDays <= 0) return 0;

  // Use the customer's historical average delay as the "normal" baseline.
  // Fall back to 14 days if we don't have enough history for this customer.
  const baseline = customerAvgDelay && customerAvgDelay > 0 ? customerAvgDelay : 14;
  const ratio = overdueDays / baseline;

  return clamp(ratio * WEIGHTS.overdue, 0, WEIGHTS.overdue);
}

function scoreAmount(outstanding) {
  const ratio = outstanding / LARGE_INVOICE_AMOUNT;
  return clamp(ratio * WEIGHTS.amount, 0, WEIGHTS.amount);
}

function scoreReliability(reliability) {
  // Reliability is 0-100, where 100 = always pays on time.
  // Lower reliability should push the risk score up.
  const safeReliability = typeof reliability === 'number' ? reliability : 70;
  return clamp(((100 - safeReliability) / 100) * WEIGHTS.reliability, 0, WEIGHTS.reliability);
}

function scoreLateHistory(lateInvoiceCount) {
  // Each previous late invoice adds risk, capped at the max weight.
  return clamp((lateInvoiceCount || 0) * 3, 0, WEIGHTS.lateHistory);
}

function levelFromScore(score) {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

function buildReasons({ invoice, customer, overdueDays, customerAvgDelay, outstanding, lateInvoiceCount }) {
  const reasons = [];

  if (overdueDays > 0 && customerAvgDelay && overdueDays > customerAvgDelay) {
    reasons.push(
      `Invoice is ${overdueDays} days overdue, beyond this customer's typical ${Math.round(customerAvgDelay)}-day payment cycle`
    );
  } else if (overdueDays > 0) {
    reasons.push(`Invoice is ${overdueDays} days overdue`);
  }

  if (outstanding >= LARGE_INVOICE_AMOUNT) {
    reasons.push('Large outstanding amount relative to typical invoices');
  } else if (outstanding >= LARGE_INVOICE_AMOUNT / 2) {
    reasons.push('Above-average outstanding amount');
  }

  if (typeof customer?.payment_reliability === 'number' && customer.payment_reliability < 60) {
    reasons.push('Customer has low overall payment reliability');
  }

  if (lateInvoiceCount > 0) {
    reasons.push(
      `Customer has ${lateInvoiceCount} previous late payment${lateInvoiceCount === 1 ? '' : 's'} on record`
    );
  }

  if (reasons.length === 0) {
    reasons.push('No significant risk factors detected');
  }

  return reasons;
}

/**
 * Calculates an explainable risk score for a single invoice.
 *
 * @param {object} invoice - the invoice row (amount, due_date, etc.)
 * @param {object} customer - the customer row (average_payment_days, payment_reliability)
 * @param {array} payments - payments made against this invoice
 * @param {number} lateInvoiceCount - how many of this customer's other invoices were paid late
 */
function calculateInvoiceRisk(invoice, customer, payments = [], lateInvoiceCount = 0) {
  const overdueDays = daysOverdue(invoice.due_date);
  const outstanding = outstandingAmount(invoice.amount, payments);
  const customerAvgDelay = customer?.average_payment_days;

  const overduePts = scoreOverdue(invoice, customerAvgDelay);
  const amountPts = scoreAmount(outstanding);
  const reliabilityPts = scoreReliability(customer?.payment_reliability);
  const lateHistoryPts = scoreLateHistory(lateInvoiceCount);

  const totalScore = clamp(
    round2(overduePts + amountPts + reliabilityPts + lateHistoryPts),
    0,
    100
  );

  return {
    score: Math.round(totalScore),
    level: levelFromScore(totalScore),
    reasons: buildReasons({
      invoice,
      customer,
      overdueDays,
      customerAvgDelay,
      outstanding,
      lateInvoiceCount,
    }),
    breakdown: {
      overdue: Math.round(overduePts),
      amount: Math.round(amountPts),
      reliability: Math.round(reliabilityPts),
      lateHistory: Math.round(lateHistoryPts),
    },
  };
}

module.exports = {
  calculateInvoiceRisk,
  levelFromScore,
  LARGE_INVOICE_AMOUNT,
};
