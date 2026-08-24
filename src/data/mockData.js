// DuesOS Financial Operating System Mock Data Layer
// Modeled for Indian MSMEs (Sharma Engineering)

export const companyProfile = {
  name: "Sharma Engineering",
  legalName: "Sharma Precision Engineering Pvt. Ltd.",
  initials: "SE",
  gstin: "27AAACS1234F1Z8",
  city: "Pune, Maharashtra",
  date: "20 Oct 2023, Friday",
  currency: "₹",
};

export const overviewSummary = {
  totalReceivables: {
    amount: "₹8.25L",
    numeric: 825000,
    count: 34,
    subtitle: "across 34 invoices"
  },
  overdue: {
    amount: "₹5.85L",
    numeric: 585000,
    percentage: "71%",
    subtitle: "71% of total",
    status: "critical"
  },
  dueSoon: {
    amount: "₹2.40L",
    numeric: 240000,
    subtitle: "Next 30 days",
    status: "warning"
  },
  availableCash: {
    amount: "₹4.20L",
    numeric: 420000,
    subtitle: "As of today",
    status: "healthy"
  }
};

export const collectionQueue = [
  {
    id: "INV-2048",
    customer: "ABC Construction",
    amount: "₹2,40,000",
    numericAmount: 240000,
    delay: "63 days overdue",
    risk: "CRITICAL",
    riskColor: "error",
    rank: "01",
    customerTier: "Tier 1 Client"
  },
  {
    id: "INV-2047",
    customer: "XYZ Builders",
    amount: "₹1,80,000",
    numericAmount: 180000,
    delay: "41 days overdue",
    risk: "HIGH",
    riskColor: "warning",
    rank: "02",
    customerTier: "Tier 2 Client"
  },
  {
    id: "INV-2046",
    customer: "Metro Projects",
    amount: "₹3,20,000",
    numericAmount: 320000,
    delay: "Due in 18 days",
    risk: "WATCH",
    riskColor: "brand-gold",
    rank: "03",
    customerTier: "Key Account"
  }
];

export const largestOverdueAccounts = [
  {
    customer: "Global Tech Hub",
    amount: "₹4,50,000",
    delay: "112 days overdue",
    invoicesCount: 2,
    risk: "CRITICAL"
  },
  {
    customer: "Secure Logistics",
    amount: "₹1,25,000",
    delay: "23 days overdue",
    invoicesCount: 1,
    risk: "HIGH"
  },
  {
    customer: "ABC Construction",
    amount: "₹2,40,000",
    delay: "63 days overdue",
    invoicesCount: 1,
    risk: "CRITICAL"
  },
  {
    customer: "XYZ Builders",
    amount: "₹1,80,000",
    delay: "41 days overdue",
    invoicesCount: 1,
    risk: "HIGH"
  }
];

export const cashPositionData = {
  currentCash: "₹4.20L",
  currentCashNum: 4.20,
  projectedLow: "₹1.10L",
  projectedLowNum: 1.10,
  minimumSafeBalance: "₹2.00L",
  minimumSafeBalanceNum: 2.00,
  gapDays: 24,
  gapAmount: "₹1.1L",
  gapDescription: "₹1.1L below safe balance",
  breakdown: {
    expectedCollections: "+₹4.8L",
    expectedExpenses: "-₹5.9L",
    netGap: "-₹1.1L"
  },
  timeSeries: [
    { day: "Today", projectedCash: 4.20, safeBalance: 2.00, collections: 0.20, expenses: 0.10, status: "healthy" },
    { day: "+10d", projectedCash: 4.10, safeBalance: 2.00, collections: 0.50, expenses: 0.60, status: "healthy" },
    { day: "+20d", projectedCash: 3.80, safeBalance: 2.00, collections: 0.80, expenses: 1.10, status: "healthy" },
    { day: "+30d", projectedCash: 3.00, safeBalance: 2.00, collections: 0.40, expenses: 1.20, status: "healthy" },
    { day: "+40d", projectedCash: 2.30, safeBalance: 2.00, collections: 0.60, expenses: 1.30, status: "healthy" },
    { day: "+50d", projectedCash: 1.65, safeBalance: 2.00, collections: 0.45, expenses: 1.10, status: "gap" },
    { day: "+60d", projectedCash: 1.10, safeBalance: 2.00, collections: 0.65, expenses: 1.20, status: "gap" },
    { day: "+70d", projectedCash: 1.35, safeBalance: 2.00, collections: 0.85, expenses: 0.60, status: "gap" },
    { day: "+80d", projectedCash: 1.80, safeBalance: 2.00, collections: 1.10, expenses: 0.65, status: "gap" },
    { day: "+90d", projectedCash: 2.45, safeBalance: 2.00, collections: 1.25, expenses: 0.60, status: "healthy" }
  ],
  gapStrategies: [
    {
      id: 1,
      title: "Collect ABC Construction",
      amount: "₹2.4L",
      tag: "Highest impact",
      tagColor: "error",
      description: "Immediate follow-up on 63-day overdue invoice #INV-2048 clears the entire deficit."
    },
    {
      id: 2,
      title: "Review supplier payment",
      amount: "₹60K",
      tag: "Immediate relief",
      tagColor: "warning",
      description: "Request 15-day credit extension on pending raw material PO #PO-882."
    },
    {
      id: 3,
      title: "Explore receivables financing",
      amount: "₹3.5L",
      tag: "Potential liquidity",
      tagColor: "brand-gold",
      description: "Instant invoice discounting against verified GST invoices with Partner Bank."
    }
  ]
};

export const invoices = [
  {
    id: "INV-2048",
    customer: "ABC Construction",
    customerId: "CUST-001",
    amount: "₹2,40,000",
    numericAmount: 240000,
    issued: "12 Oct 2023",
    due: "12 Sep 2023",
    outstanding: "₹2,40,000",
    status: "Overdue",
    delayText: "63 days overdue",
    daysOverdue: 63,
    risk: "Critical",
    riskScore: 87,
    gstin: "27AABCA4321A1Z9",
    items: [
      { description: "Precision Machined Steel Shafts (Grade 304)", qty: 120, rate: 1500, amount: 180000 },
      { description: "CNC Milling & Surface Heat Treatment", qty: 1, rate: 60000, amount: 60000 }
    ],
    notes: "3 previous follow-ups made. Promises given by Accounts lead on Oct 5 but payment failed to clear.",
    history: [
      { id: "INV-1820", date: "Jan 2023", amount: "₹1,80,000", delay: 18, text: "Paid after 18 days" },
      { id: "INV-1904", date: "Apr 2023", amount: "₹2,10,000", delay: 21, text: "Paid after 21 days" },
      { id: "INV-1988", date: "Jul 2023", amount: "₹2,00,000", delay: 24, text: "Paid after 24 days" }
    ],
    averageDelay: 21,
    currentDelay: 63
  },
  {
    id: "INV-2047",
    customer: "XYZ Builders",
    customerId: "CUST-002",
    amount: "₹1,80,000",
    numericAmount: 180000,
    issued: "28 Sep 2023",
    due: "18 Sep 2023",
    outstanding: "₹1,80,000",
    status: "Overdue",
    delayText: "41 days overdue",
    daysOverdue: 41,
    risk: "High",
    riskScore: 74,
    gstin: "27AABCX9988B1Z2",
    items: [
      { description: "Structural Flange Adapters", qty: 60, rate: 2000, amount: 120000 },
      { description: "Hardening & Electroplating", qty: 60, rate: 1000, amount: 60000 }
    ],
    notes: "Customer awaiting milestone release from prime contractor.",
    history: [
      { id: "INV-1811", date: "Feb 2023", amount: "₹1,50,000", delay: 30, text: "Paid after 30 days" },
      { id: "INV-1890", date: "May 2023", amount: "₹1,75,000", delay: 36, text: "Paid after 36 days" },
      { id: "INV-1960", date: "Aug 2023", amount: "₹1,60,000", delay: 35, text: "Paid after 35 days" }
    ],
    averageDelay: 34,
    currentDelay: 41
  },
  {
    id: "INV-2046",
    customer: "Metro Projects",
    customerId: "CUST-003",
    amount: "₹3,20,000",
    numericAmount: 320000,
    issued: "05 Oct 2023",
    due: "02 Nov 2023",
    outstanding: "₹3,20,000",
    status: "Due soon",
    delayText: "Due in 18 days",
    daysOverdue: -18,
    risk: "Watch",
    riskScore: 52,
    gstin: "27AABCM7766C1Z4",
    items: [
      { description: "Hydraulic Cylinder Sleeves", qty: 40, rate: 8000, amount: 320000 }
    ],
    notes: "Payment is on schedule for standard 30-day corporate credit cycle.",
    history: [
      { id: "INV-1830", date: "Mar 2023", amount: "₹2,80,000", delay: 15, text: "Paid after 15 days" },
      { id: "INV-1910", date: "Jun 2023", amount: "₹3,00,000", delay: 20, text: "Paid after 20 days" }
    ],
    averageDelay: 18,
    currentDelay: 0
  },
  {
    id: "INV-2045",
    customer: "Secure Logistics",
    customerId: "CUST-005",
    amount: "₹1,25,000",
    numericAmount: 125000,
    issued: "22 Sep 2023",
    due: "30 Sep 2023",
    outstanding: "₹1,25,000",
    status: "Overdue",
    delayText: "23 days overdue",
    daysOverdue: 23,
    risk: "High",
    riskScore: 68,
    gstin: "27AABCS3344D1Z1",
    items: [
      { description: "Heavy Duty Conveyor Roller Axles", qty: 250, rate: 500, amount: 125000 }
    ],
    notes: "Follow up completed on WhatsApp; awaiting finance manager sign-off.",
    history: [
      { id: "INV-1845", date: "Apr 2023", amount: "₹95,000", delay: 14, text: "Paid after 14 days" },
      { id: "INV-1925", date: "Jul 2023", amount: "₹1,15,000", delay: 18, text: "Paid after 18 days" }
    ],
    averageDelay: 16,
    currentDelay: 23
  },
  {
    id: "INV-2044",
    customer: "Raj Enterprises",
    customerId: "CUST-006",
    amount: "₹85,000",
    numericAmount: 85000,
    issued: "10 Sep 2023",
    due: "30 Sep 2023",
    outstanding: "₹0",
    status: "Paid",
    delayText: "Paid",
    daysOverdue: 0,
    risk: "Low",
    riskScore: 12,
    gstin: "27AABCR1122E1Z5",
    items: [
      { description: "Custom Fasteners & Gaskets Set", qty: 10, rate: 8500, amount: 85000 }
    ],
    notes: "Payment cleared early via RTGS on 25 Sep 2023.",
    history: [
      { id: "INV-1780", date: "Dec 2022", amount: "₹65,000", delay: 6, text: "Paid after 6 days" },
      { id: "INV-1860", date: "Apr 2023", amount: "₹80,000", delay: 9, text: "Paid after 9 days" }
    ],
    averageDelay: 8,
    currentDelay: 0
  },
  {
    id: "INV-2043",
    customer: "Sunview Traders",
    customerId: "CUST-007",
    amount: "₹1,10,000",
    numericAmount: 110000,
    issued: "15 Sep 2023",
    due: "15 Sep 2023",
    outstanding: "₹0",
    status: "Paid",
    delayText: "Paid",
    daysOverdue: 0,
    risk: "Low",
    riskScore: 18,
    gstin: "27AABCS5566F1Z3",
    items: [
      { description: "Gearbox Housing Castings", qty: 10, rate: 11000, amount: 110000 }
    ],
    notes: "Payment settled on 18 Sep 2023.",
    history: [
      { id: "INV-1815", date: "Feb 2023", amount: "₹90,000", delay: 10, text: "Paid after 10 days" },
      { id: "INV-1895", date: "May 2023", amount: "₹1,05,000", delay: 12, text: "Paid after 12 days" }
    ],
    averageDelay: 11,
    currentDelay: 0
  },
  {
    id: "INV-2042",
    customer: "Global Tech Hub",
    customerId: "CUST-004",
    amount: "₹4,50,000",
    numericAmount: 450000,
    issued: "15 Jun 2023",
    due: "01 Jul 2023",
    outstanding: "₹4,50,000",
    status: "Overdue",
    delayText: "112 days overdue",
    daysOverdue: 112,
    risk: "Critical",
    riskScore: 95,
    gstin: "27AABCG6677G1Z7",
    items: [
      { description: "Cleanroom Ventilation Mounts", qty: 15, rate: 30000, amount: 450000 }
    ],
    notes: "High exposure. Legal notice draft prepared. Escalated to MSME Samadhaan portal checklist.",
    history: [
      { id: "INV-1710", date: "Oct 2022", amount: "₹3,50,000", delay: 38, text: "Paid after 38 days" },
      { id: "INV-1790", date: "Jan 2023", amount: "₹4,00,000", delay: 46, text: "Paid after 46 days" }
    ],
    averageDelay: 42,
    currentDelay: 112
  },
  {
    id: "INV-2041",
    customer: "Apex Infrastructures",
    customerId: "CUST-008",
    amount: "₹95,000",
    numericAmount: 95000,
    issued: "01 Oct 2023",
    due: "15 Oct 2023",
    outstanding: "₹95,000",
    status: "Disputed",
    delayText: "8 days overdue",
    daysOverdue: 8,
    risk: "High",
    riskScore: 70,
    gstin: "27AABCA8899H1Z0",
    items: [
      { description: "High Pressure Flange Bearings", qty: 50, rate: 1900, amount: 95000 }
    ],
    notes: "Dispute raised regarding dimensional tolerance on 5 items; replacement inspection pending.",
    history: [
      { id: "INV-1835", date: "Mar 2023", amount: "₹1,20,000", delay: 25, text: "Paid after 25 days" },
      { id: "INV-1915", date: "Jun 2023", amount: "₹1,10,000", delay: 31, text: "Paid after 31 days" }
    ],
    averageDelay: 28,
    currentDelay: 8
  }
];

export const customers = [
  {
    id: "CUST-001",
    name: "ABC Construction",
    outstanding: "₹2.4L",
    outstandingNum: 240000,
    avgPaymentTime: "21 days",
    avgPaymentDays: 21,
    reliability: "62%",
    reliabilityNum: 62,
    currentRisk: "Critical",
    riskScore: 87,
    contactPerson: "Rajesh Varma (VP Procurement)",
    phone: "+91 98230 11223",
    email: "accounts@abcconstructions.in",
    city: "Mumbai, MH",
    totalInvoices: 12,
    totalBilled: "₹28.5L",
    overdueInvoices: 1,
    notes: "Large commercial builder. Slow corporate approval flow but consistently pays when escalated."
  },
  {
    id: "CUST-002",
    name: "XYZ Builders",
    outstanding: "₹1.8L",
    outstandingNum: 180000,
    avgPaymentTime: "34 days",
    avgPaymentDays: 34,
    reliability: "71%",
    reliabilityNum: 71,
    currentRisk: "High",
    riskScore: 74,
    contactPerson: "Deepak Shinde (Director)",
    phone: "+91 94220 55667",
    email: "finance@xyzbuilders.co.in",
    city: "Pune, MH",
    totalInvoices: 8,
    totalBilled: "₹19.2L",
    overdueInvoices: 1,
    notes: "Subject to seasonal project milestone disbursements."
  },
  {
    id: "CUST-003",
    name: "Metro Projects",
    outstanding: "₹3.2L",
    outstandingNum: 320000,
    avgPaymentTime: "18 days",
    avgPaymentDays: 18,
    reliability: "68%",
    reliabilityNum: 68,
    currentRisk: "Watch",
    riskScore: 52,
    contactPerson: "Sunil Kulkarni (Finance Head)",
    phone: "+91 98900 88771",
    email: "payments@metroprojects.org",
    city: "Navi Mumbai, MH",
    totalInvoices: 15,
    totalBilled: "₹45.0L",
    overdueInvoices: 0,
    notes: "High volume regular client with steady recurring purchase orders."
  },
  {
    id: "CUST-004",
    name: "Global Tech Hub",
    outstanding: "₹4.5L",
    outstandingNum: 450000,
    avgPaymentTime: "42 days",
    avgPaymentDays: 42,
    reliability: "54%",
    reliabilityNum: 54,
    currentRisk: "Critical",
    riskScore: 95,
    contactPerson: "Amitabh Sen (CFO)",
    phone: "+91 97110 33445",
    email: "ap@globaltechhub.com",
    city: "Bengaluru, KA",
    totalInvoices: 6,
    totalBilled: "₹22.0L",
    overdueInvoices: 1,
    notes: "Severely delayed accounts payable cycle. Recommended for strict 50% advance terms."
  },
  {
    id: "CUST-005",
    name: "Secure Logistics",
    outstanding: "₹2.15L",
    outstandingNum: 215000,
    avgPaymentTime: "16 days",
    avgPaymentDays: 16,
    reliability: "82%",
    reliabilityNum: 82,
    currentRisk: "High",
    riskScore: 68,
    contactPerson: "Pooja Hegde (Logistics Ops)",
    phone: "+91 99300 44556",
    email: "billing@securelogistics.in",
    city: "Thane, MH",
    totalInvoices: 10,
    totalBilled: "₹18.5L",
    overdueInvoices: 1,
    notes: "Generally reliable; current delay due to internal ERP migration."
  },
  {
    id: "CUST-006",
    name: "Raj Enterprises",
    outstanding: "₹0",
    outstandingNum: 0,
    avgPaymentTime: "8 days",
    avgPaymentDays: 8,
    reliability: "94%",
    reliabilityNum: 94,
    currentRisk: "Low",
    riskScore: 12,
    contactPerson: "Rajesh Parekh (Proprietor)",
    phone: "+91 98200 99887",
    email: "rajesh@rajenterprises.net",
    city: "Nashik, MH",
    totalInvoices: 14,
    totalBilled: "₹14.8L",
    overdueInvoices: 0,
    notes: "Gold-tier prompt payer. Eligible for 2% early payment cash discounts."
  },
  {
    id: "CUST-007",
    name: "Sunview Traders",
    outstanding: "₹0",
    outstandingNum: 0,
    avgPaymentTime: "11 days",
    avgPaymentDays: 11,
    reliability: "91%",
    reliabilityNum: 91,
    currentRisk: "Low",
    riskScore: 18,
    contactPerson: "Vikram Mehta",
    phone: "+91 98190 22334",
    email: "mehta@sunviewtraders.com",
    city: "Surat, GJ",
    totalInvoices: 9,
    totalBilled: "₹11.2L",
    overdueInvoices: 0,
    notes: "Disciplined MSME buyer with clean credit discipline."
  },
  {
    id: "CUST-008",
    name: "Apex Infrastructures",
    outstanding: "₹95K",
    outstandingNum: 95000,
    avgPaymentTime: "28 days",
    avgPaymentDays: 28,
    reliability: "58%",
    reliabilityNum: 58,
    currentRisk: "High",
    riskScore: 70,
    contactPerson: "Nikhil Joshi",
    phone: "+91 98222 33110",
    email: "nikhil@apexinfras.com",
    city: "Aurangabad, MH",
    totalInvoices: 5,
    totalBilled: "₹8.4L",
    overdueInvoices: 1,
    notes: "Active quality dispute on INV-2041 under joint inspection review."
  }
];

export const actionCenterItems = {
  today: [
    {
      id: "ACT-001",
      title: "Collect ₹2.4L from ABC Construction",
      subtitle: "63 days overdue · Potential risk ₹2.4L exposure",
      priority: "CRITICAL",
      priorityColor: "error",
      invoiceId: "INV-2048",
      customer: "ABC Construction",
      amount: "₹2,40,000",
      recommendedAction: "Call CFO / Accounts Lead",
      details: "Customer payment delay is 3x standard terms (21d avg vs 63d current). High impact on next month payroll liquidity."
    },
    {
      id: "ACT-002",
      title: "Follow up with Global Tech Hub",
      subtitle: "112 days overdue · Invoice #INV-2042",
      priority: "HIGH",
      priorityColor: "warning",
      invoiceId: "INV-2042",
      customer: "Global Tech Hub",
      amount: "₹4,50,000",
      recommendedAction: "Issue MSME Samadhaan Formal Notice",
      details: "Statutory 45-day MSMED Act threshold exceeded. Send formal reminder citing Section 15 interest liability."
    },
    {
      id: "ACT-003",
      title: "Review Metro Projects payment",
      subtitle: "₹3.2L expected in 18 days · Pre-due confirmation",
      priority: "MEDIUM",
      priorityColor: "brand-gold",
      invoiceId: "INV-2046",
      customer: "Metro Projects",
      amount: "₹3,20,000",
      recommendedAction: "Send courtesy statement of account",
      details: "Gentle automated reminder to ensure invoice is processed in their upcoming fortnightly payment run."
    }
  ],
  thisWeek: [
    {
      id: "ACT-004",
      title: "Request payment commitment from XYZ Builders",
      subtitle: "41 days overdue · Milestone released by contractor",
      priority: "HIGH",
      priorityColor: "warning",
      invoiceId: "INV-2047",
      customer: "XYZ Builders",
      amount: "₹1,80,000",
      recommendedAction: "Lock payment date via WhatsApp",
      details: "Contractor confirmed milestone release on Oct 14. Follow up for immediate NEFT transfer."
    },
    {
      id: "ACT-005",
      title: "Review upcoming supplier payment",
      subtitle: "₹60K due to Apex Vendors · Re-negotiate 15d buffer",
      priority: "MEDIUM",
      priorityColor: "brand-gold",
      invoiceId: null,
      customer: "Apex Vendors",
      amount: "₹60,000",
      recommendedAction: "Request 15-day extension",
      details: "Align raw material supplier payment with expected Metro Projects collection to preserve ₹2.0L safe balance."
    },
    {
      id: "ACT-006",
      title: "Issue statement of accounts to Secure Logistics",
      subtitle: "23 days overdue on INV-2045",
      priority: "MEDIUM",
      priorityColor: "brand-gold",
      invoiceId: "INV-2045",
      customer: "Secure Logistics",
      amount: "₹1,25,000",
      recommendedAction: "Send statement summary",
      details: "Accounts department request received for updated TDS certificate credit confirmation."
    }
  ],
  completed: [
    {
      id: "ACT-007",
      title: "Payment received from Raj Enterprises",
      subtitle: "₹85,000 cleared on 25 Sep via RTGS",
      priority: "COMPLETED",
      priorityColor: "success",
      invoiceId: "INV-2044",
      customer: "Raj Enterprises",
      amount: "₹85,000",
      timestamp: "25 Sep 2023, 11:42 AM"
    },
    {
      id: "ACT-008",
      title: "Reminder sent to Secure Logistics",
      subtitle: "Follow-up logged on 18 Oct via Email & WhatsApp",
      priority: "COMPLETED",
      priorityColor: "success",
      invoiceId: "INV-2045",
      customer: "Secure Logistics",
      amount: "₹1,25,000",
      timestamp: "18 Oct 2023, 04:15 PM"
    },
    {
      id: "ACT-009",
      title: "Reconciled bank feed for Q3 receivables",
      subtitle: "18 transactions matched automatically",
      priority: "COMPLETED",
      priorityColor: "success",
      invoiceId: null,
      customer: "All Customers",
      amount: "₹14.2L",
      timestamp: "15 Oct 2023, 06:30 PM"
    }
  ]
};
