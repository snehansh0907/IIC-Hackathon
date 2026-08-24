require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { authMiddleware } = require('./authMiddleware');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const customerRoutes = require('./customerRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const paymentRoutes = require('./paymentRoutes');
const expenseRoutes = require('./expenseRoutes');
const intelligenceRoutes = require('./intelligenceRoutes');
const reminderRoutes = require('./reminderRoutes');
const actionRoutes = require('./actionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost requests on any port (5173, 5174, etc.) or no origin (e.g. mobile/curl)
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Simple health check so you can quickly confirm the server is running.
app.get('/', (req, res) => {
  res.json({ success: true, data: { message: 'DuesOS backend is running' } });
});

// Authentication endpoints
app.use('/api/auth', authRoutes);

// Apply authMiddleware globally to all business data routes
app.use('/api', authMiddleware);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/actions', actionRoutes);

// Catch-all for unknown routes.
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Basic centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`DuesOS backend running at http://localhost:${PORT}`);
});
