// Small, focused math/date helpers used across controllers and services.
// Keeping these in one place means every part of the app calculates
// "days overdue" or "outstanding amount" the exact same way.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returns the number of whole days between two dates.
 * A positive number means `laterDate` is after `earlierDate`.
 */
function daysBetween(earlierDate, laterDate) {
  const start = new Date(earlierDate);
  const end = new Date(laterDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

/**
 * How many days overdue an invoice is, as of today.
 * Returns 0 if the invoice is not yet overdue.
 */
function daysOverdue(dueDate, today = new Date()) {
  const diff = daysBetween(dueDate, today);
  return diff > 0 ? diff : 0;
}

/**
 * How many days remain until an invoice is due.
 * Returns 0 or negative if the due date has already passed.
 */
function daysUntilDue(dueDate, today = new Date()) {
  return daysBetween(today, dueDate);
}

/**
 * Sums a list of payment amounts.
 */
function sumPayments(payments = []) {
  return payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
}

/**
 * Outstanding amount on an invoice = invoice amount - total payments made.
 * Never returns a negative number.
 */
function outstandingAmount(invoiceAmount, payments = []) {
  const paid = sumPayments(payments);
  const remaining = Number(invoiceAmount) - paid;
  return remaining > 0 ? Number(remaining.toFixed(2)) : 0;
}

/**
 * Works out what an invoice's status SHOULD be, given its due date and
 * the payments made against it. This is the single source of truth for
 * invoice status so it stays consistent everywhere it's calculated.
 */
function calculateInvoiceStatus(invoice, payments = []) {
  // Disputed status is set manually and should never be overridden here.
  if (invoice.status === 'disputed') {
    return 'disputed';
  }

  const paid = sumPayments(payments);
  const amount = Number(invoice.amount);

  if (paid >= amount && amount > 0) {
    return 'paid';
  }

  if (paid > 0 && paid < amount) {
    return 'partially_paid';
  }

  const today = new Date();
  const overdueDays = daysOverdue(invoice.due_date, today);
  const untilDue = daysUntilDue(invoice.due_date, today);

  if (overdueDays > 0) {
    return 'overdue';
  }

  if (untilDue <= 7) {
    return 'due_soon';
  }

  return 'pending';
}

/**
 * Clamps a number between a minimum and maximum value.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a number to 2 decimal places (useful for currency values).
 */
function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

module.exports = {
  daysBetween,
  daysOverdue,
  calculateDaysOverdue: daysOverdue,
  daysUntilDue,
  calculateDaysUntilDue: daysUntilDue,
  sumPayments,
  outstandingAmount,
  calculateInvoiceStatus,
  clamp,
  round2,
};
