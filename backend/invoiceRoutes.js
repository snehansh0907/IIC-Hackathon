const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getOverdueInvoices,
  getDueSoonInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require('./invoiceController');
const { getPaymentsForInvoice } = require('./paymentController');

// IMPORTANT: these specific routes must be declared BEFORE the "/:id"
// route below, otherwise Express would treat "overdue" or "due-soon" as
// an :id value and never reach the intended handler.
router.get('/overdue', getOverdueInvoices);
router.get('/due-soon', getDueSoonInvoices);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

// Nested route for reading payments that belong to a specific invoice.
router.get('/:invoiceId/payments', getPaymentsForInvoice);

module.exports = router;
