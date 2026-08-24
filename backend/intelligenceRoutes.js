const express = require('express');
const router = express.Router();
const {
  getInvoiceRisk,
  getCustomerIntelligence,
  getCashFlowForecast,
  getRecommendations,
} = require('./intelligenceController');

router.get('/risk/:invoiceId', getInvoiceRisk);
router.get('/customer/:customerId', getCustomerIntelligence);
router.get('/cashflow', getCashFlowForecast);
router.get('/recommendations', getRecommendations);

module.exports = router;
