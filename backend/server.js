const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

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
      // Allow localhost requests on any port (5173, 5174, etc.) or same-origin production requests
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Dedicated health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', message: 'DuesOS backend is operational' } });
});

// Authentication endpoints
app.use('/api/auth', authRoutes);

// Apply authMiddleware to all business data routes
app.use('/api', authMiddleware);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/actions', actionRoutes);

// Unmatched API routes handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Serve frontend static assets in production (or when dist/ is built)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA Client-Side Routing: redirect all remaining GET requests to dist/index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // If dist/ has not been built yet (e.g. running backend standalone in dev)
  app.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'DuesOS API backend is running. Run `npm run build` to generate and serve the frontend UI.',
      },
    });
  });
}

// Catch-all 404 handler for non-GET requests or unmapped paths
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Listen on 0.0.0.0 to properly bind in cloud environments like Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DuesOS server running on http://0.0.0.0:${PORT}`);
});
