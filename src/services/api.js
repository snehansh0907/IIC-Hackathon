// API Service Layer for DuesOS
// Connects to Express + Supabase backend via VITE_API_URL (e.g. http://localhost:5000)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function formatMoney(val) {
  const num = Number(val || 0);
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatMoneyShort(val) {
  const num = Number(val || 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}K`;
  }
  return formatMoney(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Local in-memory store for completed action tracking during session
const sessionCompletedActions = new Set();

// Authenticated fetch wrapper injecting tenant headers
async function authFetch(endpoint, options = {}) {
  const token = localStorage.getItem('duesos_token');
  const isDemo = localStorage.getItem('duesos_is_demo') === 'true';

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !isDemo) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isDemo) {
    headers['x-demo-mode'] = 'true';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  return fetch(url, { ...options, headers });
}

export const api = {
  // 0. Authentication Methods
  async login({ email, password }) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Login failed.');
    }
    return json.data;
  },

  async signup({ name, email, password, businessName }) {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, businessName }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Account creation failed.');
    }
    return json.data;
  },

  async getMe() {
    try {
      const res = await authFetch('/api/auth/me');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  },

  async getDemoSession() {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/demo`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  },

  // 1. Dashboard Overview
  async getDashboard() {
    try {
      const res = await authFetch('/api/dashboard');
      if (!res.ok) {
        if (res.status === 404) {
          return { empty: true, message: 'No business data found in database.' };
        }
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        return { empty: true, message: json.error || 'No business found' };
      }
      return json.data;
    } catch (err) {
      console.error('api.getDashboard error:', err);
      return { empty: true, error: err.message };
    }
  },

  // 2. Invoices List & Filtering
  async getInvoices(filter = 'All', search = '') {
    try {
      const res = await authFetch('/api/invoices');
      if (!res.ok) {
        if (res.status === 404) return { invoices: [], totalCount: 0, totalOutstanding: '₹0', invoiceCount: 0 };
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      const rawInvoices = json.data || [];

      // Map raw invoices from Supabase into UI-ready models
      const mappedInvoices = rawInvoices.map((inv) => {
        const amount = Number(inv.amount || 0);
        const outstanding = Number(inv.outstanding_amount ?? (inv.status === 'paid' ? 0 : amount));
        const daysOverdue = Number(inv.days_overdue || 0);
        const daysUntilDue = Number(inv.days_until_due || 0);

        let displayStatus = 'Pending';
        let delayText = 'Pending';
        let risk = 'Low';
        let riskScore = 15;

        if (inv.status === 'paid' || (inv.paid_date && outstanding === 0)) {
          displayStatus = 'Paid';
          delayText = 'Paid on time';
          risk = 'Low';
          riskScore = 5;
        } else if (inv.status === 'disputed') {
          displayStatus = 'Disputed';
          delayText = 'Payment on hold';
          risk = 'High';
          riskScore = 80;
        } else if (daysOverdue > 0) {
          displayStatus = 'Overdue';
          delayText = daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`;
          if (daysOverdue > 60) {
            risk = 'Critical';
            riskScore = Math.min(95, 70 + Math.round(daysOverdue / 5));
          } else if (daysOverdue > 30) {
            risk = 'High';
            riskScore = 65;
          } else if (daysOverdue > 14) {
            risk = 'Watch';
            riskScore = 45;
          } else {
            risk = 'Watch';
            riskScore = 35;
          }
        } else if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          displayStatus = 'Due soon';
          delayText = daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} days`;
          risk = daysUntilDue <= 3 ? 'Watch' : 'Low';
          riskScore = 30;
        } else {
          displayStatus = 'Pending';
          delayText = `Due in ${daysUntilDue} days`;
          risk = 'Low';
          riskScore = 20;
        }

        return {
          id: inv.invoice_number || `INV-${inv.id.slice(0, 6).toUpperCase()}`,
          rawId: inv.id,
          customer: inv.customer_name || inv.customer?.name || 'Unknown Customer',
          customerId: inv.customer_id,
          amount: formatMoney(amount),
          numericAmount: amount,
          issued: formatDate(inv.issue_date),
          due: formatDate(inv.due_date),
          outstanding: formatMoney(outstanding),
          outstandingAmount: outstanding,
          status: displayStatus,
          delayText,
          daysOverdue,
          daysUntilDue,
          risk,
          riskScore,
          notes: inv.status === 'paid' ? 'Payment received in full.' : undefined,
        };
      });

      const totalOutstandingNum = mappedInvoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);

      let filtered = [...mappedInvoices];
      if (filter && filter !== 'All') {
        filtered = filtered.filter((inv) => inv.status.toLowerCase() === filter.toLowerCase());
      }

      if (search && search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (inv) =>
            (inv.id && inv.id.toLowerCase().includes(q)) ||
            (inv.customer && inv.customer.toLowerCase().includes(q)) ||
            (inv.amount && inv.amount.toLowerCase().includes(q)) ||
            (inv.outstanding && inv.outstanding.toLowerCase().includes(q))
        );
      }

      return {
        invoices: filtered,
        totalCount: filtered.length,
        totalOutstanding: formatMoneyShort(totalOutstandingNum),
        invoiceCount: mappedInvoices.length,
      };
    } catch (err) {
      console.error('api.getInvoices error:', err);
      return { invoices: [], totalCount: 0, totalOutstanding: '₹0', invoiceCount: 0 };
    }
  },

  // 3. Single Invoice Detail
  async getInvoice(id) {
    try {
      const res = await authFetch(`/api/invoices/${id}`);
      if (!res.ok) {
        throw new Error(`Invoice ${id} not found`);
      }
      const json = await res.json();
      const raw = json.data;

      const amount = Number(raw.amount || 0);
      const outstanding = Number(raw.outstanding_amount ?? (raw.status === 'paid' ? 0 : amount));
      const daysOverdue = Number(raw.days_overdue || 0);
      const daysUntilDue = Number(raw.days_until_due || 0);

      // Fetch intelligence risk if available
      let riskInfo = { score: 25, level: 'Low', factors: [] };
      try {
        const riskRes = await authFetch(`/api/intelligence/risk/${raw.id}`);
        if (riskRes.ok) {
          const riskJson = await riskRes.json();
          if (riskJson.data) riskInfo = riskJson.data;
        }
      } catch (e) {
        if (daysOverdue > 60) riskInfo = { score: 75, level: 'Critical' };
        else if (daysOverdue > 30) riskInfo = { score: 60, level: 'High' };
        else if (daysOverdue > 10) riskInfo = { score: 40, level: 'Watch' };
      }

      // Fetch customer intelligence for history
      let customerIntel = null;
      try {
        const custRes = await authFetch(`/api/intelligence/customer/${raw.customer_id}`);
        if (custRes.ok) {
          const custJson = await custRes.json();
          customerIntel = custJson.data;
        }
      } catch (e) {}

      let status = 'Pending';
      let delayText = 'Pending';
      if (raw.status === 'paid') {
        status = 'Paid';
        delayText = 'Paid on time';
      } else if (daysOverdue > 0) {
        status = 'Overdue';
        delayText = `${daysOverdue} days overdue`;
      } else if (daysUntilDue <= 7) {
        status = 'Due soon';
        delayText = `Due in ${daysUntilDue} days`;
      }

      return {
        id: raw.invoice_number || `INV-${raw.id.slice(0, 6).toUpperCase()}`,
        rawId: raw.id,
        customer: raw.customer_name || raw.customer?.name || 'Customer',
        customerId: raw.customer_id,
        amount: formatMoney(amount),
        numericAmount: amount,
        issued: formatDate(raw.issue_date),
        due: formatDate(raw.due_date),
        outstanding: formatMoney(outstanding),
        outstandingAmount: outstanding,
        status,
        delayText,
        daysOverdue,
        risk: riskInfo.level || (daysOverdue > 60 ? 'Critical' : daysOverdue > 30 ? 'High' : 'Low'),
        riskScore: riskInfo.score || (daysOverdue > 60 ? 73 : 25),
        riskExplanation: riskInfo.explanation,
        riskFactors: riskInfo.factors,
        gstin: raw.customer?.gstin || '27AABCU9603R1ZM',
        items: [
          {
            description: `${raw.customer_name || 'Industrial'} Order Deliverables`,
            qty: 1,
            rate: amount,
            amount: amount,
          },
        ],
        history: raw.payments && raw.payments.length > 0 
          ? raw.payments.map((p, idx) => ({
              id: `PMT-${idx + 1}`,
              date: formatDate(p.payment_date),
              amount: formatMoney(p.amount),
              delay: 0,
              text: `Payment received via ${p.payment_method || 'NEFT'} (Ref: ${p.reference || 'REF-' + idx})`,
            }))
          : [
              {
                id: 'HIST-1',
                date: formatDate(raw.issue_date),
                amount: formatMoney(amount),
                delay: customerIntel?.averagePaymentDelay || 12,
                text: customerIntel?.numberOfLatePayments > 0
                  ? `Customer historically averages ${customerIntel.averagePaymentDelay} days delay.`
                  : 'Customer historically pays on time.',
              },
            ],
        averageDelay: customerIntel?.averagePaymentDelay || customerIntel?.historicalAveragePaymentDays || 12,
        currentDelay: daysOverdue,
      };
    } catch (err) {
      console.error('api.getInvoice error:', err);
      throw err;
    }
  },

  // 4. Create Invoice
  async createInvoice(invoiceData) {
    try {
      const customerId = invoiceData.customerId || invoiceData.customer_id;
      if (!customerId) {
        throw new Error('A customer must be selected before saving the invoice.');
      }

      const issueDate = invoiceData.issued || invoiceData.issue_date || new Date().toISOString().slice(0, 10);
      const dueDate = invoiceData.due || invoiceData.due_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      const res = await authFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          customer: invoiceData.customer,
          amount: Number(invoiceData.amount || 0),
          issue_date: issueDate,
          due_date: dueDate,
          invoice_number: invoiceData.invoice_number || `INV-${Math.floor(2050 + Math.random() * 100)}`,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create invoice');
      const inv = json.data;
      return {
        id: inv.invoice_number || inv.id,
        rawId: inv.id,
        customerId: inv.customer_id,
        customer: inv.customer_name || invoiceData.customer || 'Customer',
        amount: formatMoney(inv.amount),
        outstanding: formatMoney(inv.amount),
        status: 'Pending',
        issued: formatDate(inv.issue_date),
        due: formatDate(inv.due_date),
      };
    } catch (err) {
      console.error('api.createInvoice error:', err);
      throw err;
    }
  },

  // 5. Update Invoice Status
  async updateInvoiceStatus(id, newStatus, note = '') {
    try {
      const res = await authFetch(`/api/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus.toLowerCase(), notes: note }),
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('api.updateInvoiceStatus error:', err);
      return null;
    }
  },

  // 5b. Record Payment
  async createPayment({ invoiceId, amount, paymentDate, paymentMethod = 'NEFT', reference = '' }) {
    try {
      const res = await authFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: Number(amount),
          payment_date: paymentDate || new Date().toISOString().slice(0, 10),
          payment_method: paymentMethod,
          reference: reference || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to record payment');
      return json.data;
    } catch (err) {
      console.error('api.createPayment error:', err);
      throw err;
    }
  },

  // 6. Customers List
  async getCustomers(query = '') {
    try {
      const res = await authFetch(`/api/customers?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Failed to fetch customers: ${res.statusText}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error('api.getCustomers error:', err);
      return [];
    }
  },

  // 7. Single Customer Detail
  async getCustomer(id) {
    try {
      const res = await authFetch(`/api/intelligence/customer/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
      const rawRes = await authFetch(`/api/customers/${id}`);
      const rawJson = await rawRes.json();
      return rawJson.data;
    } catch (err) {
      console.error('api.getCustomer error:', err);
      return null;
    }
  },

  // 8. Create Customer
  async createCustomer(customerData) {
    try {
      const res = await authFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          city: customerData.city,
          primaryContact: customerData.primaryContact || customerData.contactPerson,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create customer');
      const c = json.data;
      return {
        id: c.id,
        name: c.name,
        email: c.email || '',
        phone: c.phone || '',
        city: customerData.city || 'Pune, MH',
        contactPerson: customerData.primaryContact || `${c.name.split(' ')[0]} Accounts Lead`,
        average_payment_days: c.average_payment_days || 14,
        payment_reliability: c.payment_reliability || 75,
        avgPaymentTime: `${c.average_payment_days || 14} days`,
        reliability: `${c.payment_reliability || 75}%`,
        reliabilityNum: c.payment_reliability || 75,
        outstanding: '₹0',
        totalInvoices: 0,
        currentRisk: 'Low',
        riskScore: 25,
      };
    } catch (err) {
      console.error('api.createCustomer error:', err);
      throw err;
    }
  },

  // 9. Send Payment Reminder (Email via Resend)
  async sendReminder({ invoiceId, channel = 'email' }) {
    try {
      const res = await authFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({ invoiceId, channel }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send payment reminder');
      }
      return json.data;
    } catch (err) {
      console.error('api.sendReminder error:', err);
      throw err;
    }
  },

  // 10. Cash Flow Forecast Data
  async getCashFlow() {
    try {
      const [cfRes, dbRes] = await Promise.all([
        authFetch('/api/intelligence/cashflow'),
        authFetch('/api/dashboard'),
      ]);

      let forecastData = null;
      if (cfRes.ok) {
        const cfJson = await cfRes.json();
        forecastData = cfJson.data;
      }

      let dashboardData = null;
      if (dbRes.ok) {
        const dbJson = await dbRes.json();
        dashboardData = dbJson.data;
      }

      const currentCash = forecastData?.currentCash ?? dashboardData?.currentCash ?? 0;
      const minSafe = forecastData?.minimumCashThreshold ?? 0;
      const forecastArr = forecastData?.forecast || [];

      let minProjected = currentCash;
      for (const pt of forecastArr) {
        if (pt.projectedCash < minProjected) minProjected = pt.projectedCash;
      }

      const timeSeries = [
        {
          day: 'Today',
          projectedCash: Number((currentCash / 100000).toFixed(2)),
          safeBalance: Number((minSafe / 100000).toFixed(2)),
          collections: 0,
          expenses: 0,
          status: 'safe',
        },
      ];

      for (const pt of forecastArr) {
        timeSeries.push({
          day: `+${pt.days}d`,
          projectedCash: Number((pt.projectedCash / 100000).toFixed(2)),
          safeBalance: Number((minSafe / 100000).toFixed(2)),
          collections: Number(((pt.expectedCollections || 0) / 100000).toFixed(2)),
          expenses: Number(((pt.expectedExpenses || 0) / 100000).toFixed(2)),
          status: pt.projectedCash < minSafe ? 'deficit' : 'safe',
        });
      }

      const daysUntilShortfall = forecastData?.daysUntilShortfall;
      const gapAmount = forecastData?.cashWarning ? Math.max(0, minSafe - minProjected) : 0;

      return {
        currentCash: formatMoneyShort(currentCash),
        currentCashNum: currentCash / 100000,
        projectedLow: formatMoneyShort(minProjected),
        projectedLowNum: minProjected / 100000,
        minimumSafeBalance: formatMoneyShort(minSafe),
        minimumSafeBalanceNum: minSafe / 100000,
        cashWarning: forecastData?.cashWarning || false,
        gapDays: daysUntilShortfall || 0,
        gapAmount: gapAmount > 0 ? formatMoneyShort(gapAmount) : '₹0',
        breakdown: {
          expectedCollections: formatMoneyShort(forecastArr[forecastArr.length - 1]?.expectedCollections || 0),
          expectedExpenses: formatMoneyShort(forecastArr[forecastArr.length - 1]?.expectedExpenses || 0),
          netGap: gapAmount > 0 ? formatMoneyShort(gapAmount) : '₹0',
        },
        timeSeries,
        gapStrategies: forecastArr.length > 0 ? [
          {
            title: 'Accelerate Top Overdue Invoices',
            impact: 'Liquidity Recovery',
            risk: 'Low Effort',
            desc: 'Offering a 2% spot discount for immediate settlement recovers key liquidity.',
          },
          {
            title: 'Invoice Discounting / TReDS Facility',
            impact: 'Immediate Liquidity',
            risk: '2.5% Cost of Capital',
            desc: 'Discount verified customer invoices to bridge working capital.',
          },
          {
            title: 'Reschedule Non-Critical Vendor Payables',
            impact: 'Cash Preserved',
            risk: 'Supplier Relationship',
            desc: 'Negotiate 15-day extended payment terms on vendor contracts.',
          },
        ] : [],
      };
    } catch (err) {
      console.error('api.getCashFlow error:', err);
      return {
        currentCash: '₹0',
        projectedLow: '₹0',
        minimumSafeBalance: '₹0',
        gapDays: 0,
        gapAmount: '₹0',
        timeSeries: [],
        breakdown: { expectedCollections: '₹0', expectedExpenses: '₹0', netGap: '₹0' },
        gapStrategies: [],
      };
    }
  },

  // 11. Action Center Items
  async getActions() {
    try {
      const [recsRes, invRes, actRes] = await Promise.all([
        authFetch('/api/intelligence/recommendations'),
        authFetch('/api/invoices'),
        authFetch('/api/actions'),
      ]);

      const recsJson = recsRes.ok ? await recsRes.json() : { data: [] };
      const recs = recsJson.data || [];

      const invJson = invRes.ok ? await invRes.json() : { data: [] };
      const invs = invJson.data || [];
      const invsById = {};
      for (const inv of invs) invsById[inv.id] = inv;

      const actJson = actRes.ok ? await actRes.json() : { data: [] };
      const dbActions = actJson.data || [];
      const completedInvoiceIds = new Set(
        dbActions.filter((a) => a.status === 'completed' && a.invoice_id).map((a) => a.invoice_id)
      );

      const todayList = [];
      const thisWeekList = [];
      const completedList = [];

      // Add database-persisted completed actions to completedList
      dbActions
        .filter((a) => a.status === 'completed')
        .forEach((a) => {
          const inv = a.invoice_id ? invsById[a.invoice_id] : null;
          completedList.push({
            id: a.id,
            invoiceId: a.invoice_id,
            title: a.description || `Payment reminder action executed`,
            subtitle: inv ? `${inv.customer_name} • ${formatMoney(inv.outstanding_amount || inv.amount)}` : 'Completed',
            timestamp: formatDate(a.created_at) || 'Recently',
            priority: a.priority || 'HIGH',
            completed: true,
          });
        });

      recs.forEach((rec, idx) => {
        const actionId = `ACT-${rec.invoiceId ? rec.invoiceId.slice(0, 8) : idx + 1}`;
        const invoice = invsById[rec.invoiceId];
        const isCompletedInDb = rec.invoiceId && completedInvoiceIds.has(rec.invoiceId);
        const isDone = sessionCompletedActions.has(actionId) || isCompletedInDb;

        // If already in completedList from DB, skip duplicate from recommendations
        if (isCompletedInDb) return;

        let actionType = 'Call';
        let icon = 'phone_in_talk';
        if (rec.action === 'REQUEST_PAYMENT_DATE') {
          actionType = 'Email Payment Reminder';
          icon = 'mail';
        } else if (rec.action === 'OFFER_EARLY_PAYMENT_DISCOUNT') {
          actionType = 'Offer 2% Early Discount';
          icon = 'percent';
        } else if (rec.action === 'HOLD_SHIPMENTS') {
          actionType = 'Hold Delivery';
          icon = 'block';
        }

        const item = {
          id: actionId,
          invoiceId: rec.invoiceId,
          customerId: rec.customerId,
          customer: invoice?.customer_name || 'Customer Account',
          invoiceNumber: invoice?.invoice_number || `INV-${idx + 1001}`,
          amount: formatMoney(rec.expectedImpact || invoice?.outstanding_amount || 0),
          action: `${actionType} — ${invoice?.customer_name || 'Customer'}`,
          reason: rec.reason || `Overdue invoice requiring proactive collection.`,
          priority: rec.priority || 'HIGH',
          priorityColor: rec.priority === 'HIGH' ? 'error' : rec.priority === 'MEDIUM' ? 'warning' : 'neutral',
          icon,
          dueIn: rec.priority === 'HIGH' ? 'Urgent (Today)' : 'Within 3 days',
          title: `Follow up with ${invoice?.customer_name || 'Customer'}`,
          subtitle: `${formatMoney(rec.expectedImpact || invoice?.outstanding_amount || 0)} · ${invoice?.days_overdue || 0}d overdue`,
          completed: isDone,
        };

        if (isDone) {
          completedList.push(item);
        } else if (rec.priority === 'CRITICAL' || rec.priority === 'HIGH' || idx < 3) {
          todayList.push(item);
        } else {
          thisWeekList.push(item);
        }
      });

      return {
        today: todayList,
        thisWeek: thisWeekList,
        completed: completedList,
      };
    } catch (err) {
      console.error('api.getActions error:', err);
      return { today: [], thisWeek: [], completed: [] };
    }
  },

  // 12. Execute / Complete an Action
  async completeAction(actionId) {
    sessionCompletedActions.add(actionId);
    try {
      await authFetch(`/api/actions/${actionId}/complete`, { method: 'POST' });
    } catch (e) {}
    return { success: true, id: actionId };
  },
};

export default api;
