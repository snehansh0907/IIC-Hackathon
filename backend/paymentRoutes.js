const express = require('express');
const router = express.Router();
const { createPayment } = require('./paymentController');

router.post('/', createPayment);

module.exports = router;
