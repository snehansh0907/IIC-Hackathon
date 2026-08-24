const express = require('express');
const router = express.Router();
const { sendPaymentReminder, getReminderHistory } = require('./reminderController');

// POST /api/reminders
router.post('/', sendPaymentReminder);

// GET /api/reminders/history
router.get('/history', getReminderHistory);

module.exports = router;
