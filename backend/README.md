# DuesOS Backend

## 1. What DuesOS does

DuesOS is a receivables intelligence platform for small and medium
businesses (MSMEs). Businesses often have money stuck in unpaid customer
invoices. DuesOS helps answer:

- Which customers should be chased first?
- Which invoices are high-risk?
- How much money is currently outstanding?
- When is that money likely to arrive?
- Will there be a cash-flow shortage, and when?
- What should be done about it — collect, negotiate, or explore financing?

DuesOS is **not** a lender. It doesn't provide financing itself — it's a
decision-support tool that surfaces the data and reasoning a business owner
needs to act.

## 2. Backend architecture

The backend is a small Node.js + Express REST API with no framework magic:

- **Routes** map an HTTP method + path to a controller function.
- **Controllers** handle the HTTP request/response and talk to Supabase.
- **Services** hold the actual "intelligence" — the risk engine, the
  cash-flow forecast, and the recommendation engine — as plain functions
  that take data in and return data out. They don't touch the database or
  HTTP directly, which makes them easy to test and reason about.
- **Utils** hold small, reusable calculations (date math, outstanding
  amounts, invoice status) used by both controllers and services.

There's no authentication yet. Since DuesOS currently supports one
business, the backend treats the oldest row in the `businesses` table as
"the" business everywhere. Adding login later means replacing
`getPrimaryBusiness()` in `src/config/supabase.js` with "the business
belonging to the logged-in user" — nothing else has to change.

## 3. Folder structure

```text
backend/
├── src/
│   ├── server.js                  # Express app entry point
│   ├── config/
│   │   └── supabase.js            # Supabase client + getPrimaryBusiness()
│   ├── routes/                    # URL -> controller wiring
│   ├── controllers/                # Request/response handling
│   ├── services/
│   │   ├── riskService.js          # Rule-based invoice risk scoring
│   │   ├── cashFlowService.js      # Rule-based cash-flow forecast
│   │   └── recommendationService.js # Turns risk + forecast into actions
│   └── utils/
│       └── calculations.js         # Shared date/money helper functions
├── database/
│   ├── schema.sql                  # Table definitions
│   └── seed.sql                    # Demo data for Sharma Engineering
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 4. Install dependencies

From inside the `backend` folder:

```bash
npm install
```

## 5. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to finish provisioning.
3. In the Supabase dashboard, go to **Project Settings → API**. You'll need:
   - **Project URL** → this is your `SUPABASE_URL`
   - **anon / publishable key** → this is your `SUPABASE_PUBLISHABLE_KEY`

Do not use the `service_role` key in this backend's `.env` — the anon key
is sufficient for this project's current scope, and the service_role key
should never be exposed outside a fully trusted server environment.

## 6. Run schema.sql

1. In the Supabase dashboard, open the **SQL Editor**.
2. Paste the full contents of `database/schema.sql`.
3. Run it. This creates all six tables (`businesses`, `customers`,
   `invoices`, `payments`, `expenses`, `actions`) plus indexes.

## 7. Run seed.sql

1. Still in the SQL Editor, open a new query.
2. Paste the full contents of `database/seed.sql`.
3. Run it. This creates one demo business, **Sharma Engineering Pvt.
   Ltd.**, with 9 customers, 34 invoices, 16 payments, and 12 expenses —
   including **ABC Construction**, a customer with a large, badly overdue
   invoice, designed to show up as the top risk in the intelligence
   endpoints.

All seed dates are calculated relative to `CURRENT_DATE`, so the data stays
realistic no matter when you run the script.

To reset the demo data later, there's a commented `truncate` statement at
the bottom of `seed.sql` — uncomment and run it, then re-run the insert
script.

## 8. Create your `.env` file

Copy the example file and fill in your real Supabase values:

```bash
cp .env.example .env
```

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

`.env` is already listed in `.gitignore`, so it will never be committed.

## 9. Start the backend

For development (auto-restarts on file changes):

```bash
npm run dev
```

For a plain run:

```bash
npm start
```

You should see:

```text
DuesOS backend running at http://localhost:5000
```

Visit `http://localhost:5000` in a browser — you should get a small JSON
health-check response confirming the server is up.

## 10. API endpoints

All responses follow the same shape:

```json
{ "success": true, "data": { } }
```

or, on error:

```json
{ "success": false, "error": "message here" }
```

**Dashboard**
```text
GET /api/dashboard
```

**Customers**
```text
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

**Invoices**
```text
GET    /api/invoices
GET    /api/invoices/:id
GET    /api/invoices/overdue
GET    /api/invoices/due-soon
POST   /api/invoices
PUT    /api/invoices/:id
DELETE /api/invoices/:id
```

Every invoice returned includes calculated fields — `outstanding_amount`,
`days_overdue`, `days_until_due`, `total_paid`, and `customer_name` — so
the frontend never has to compute these itself.

**Payments**
```text
GET  /api/invoices/:invoiceId/payments
POST /api/payments
```

Creating a payment automatically recalculates and updates the parent
invoice's status (`paid`, `partially_paid`, `overdue`, etc.) based on the
total of all payments made against it.

**Expenses**
```text
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

**Intelligence**
```text
GET /api/intelligence/risk/:invoiceId
GET /api/intelligence/customer/:customerId
GET /api/intelligence/cashflow
GET /api/intelligence/recommendations
```

## 11. Risk calculation

`src/services/riskService.js` scores each invoice out of 100 using four
weighted, fully explainable factors:

| Factor | Max points | Idea |
|---|---|---|
| Days overdue vs. customer's normal delay | 40 | Being overdue relative to what's *normal for this customer* matters more than a fixed day count |
| Invoice amount | 20 | Larger invoices carry more risk exposure |
| Customer payment reliability | 25 | A 0-100 score already tracked on the customer |
| Customer's history of late payments | 15 | Repeated past lateness raises future risk |

Scores map to levels:

```text
0-30    LOW
31-60   MEDIUM
61-80   HIGH
81-100  CRITICAL
```

Every score comes with a `reasons` array explaining exactly why — no
machine learning, no randomness, everything traceable back to real rows in
the database.

## 12. Cash-flow calculation

`src/services/cashFlowService.js` projects cash at 7/14/30/45/60/90-day
checkpoints:

```text
Projected Cash = Current Cash + Expected Collections - Expected Expenses
```

- **Expected collections**: for each open invoice due on or before the
  checkpoint date, its outstanding balance is multiplied by the
  customer's payment reliability (as a 0–1 probability) to estimate how
  much will realistically come in.
- **Expected expenses**: any unpaid expense due on or before the
  checkpoint date.

If projected cash dips below the business's `minimum_cash_threshold` at
any checkpoint, the forecast flags `cashWarning: true` along with
`daysUntilShortfall` and `shortfallAmount`.

## 13. Recommendation engine

`src/services/recommendationService.js` turns the risk scores and
cash-flow forecast into concrete next actions, such as:

- **COLLECT** — an overdue invoice with a meaningful risk score
- **REQUEST_PAYMENT_DATE** — a customer paying far later than their own
  history suggests is normal
- **NEGOTIATE** — a customer with consistently low payment reliability
- **FINANCING** — suggested only when a cash-flow shortfall is predicted
  and there's enough overdue receivable value to realistically help

Each recommendation includes an `action`, `priority`, the related
`invoiceId`/`customerId`, a plain-language `reason`, and an
`expectedImpact` amount.

## 14. How the frontend should call the backend

The backend allows CORS requests from `http://localhost:5173` (the
default Vite dev server port) by default — see `src/server.js`. If your
frontend runs on a different port or URL, set `FRONTEND_ORIGIN` in `.env`.

All endpoints return JSON. A typical frontend call looks like:

```js
const response = await fetch('http://localhost:5000/api/dashboard');
const { success, data, error } = await response.json();

if (!success) {
  // handle error
}
```

No authentication headers are required yet — every request is treated as
belonging to the single seeded business.
