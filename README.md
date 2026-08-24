# DuesOS

### Receivables & Risk Intelligence Operating System

> **DuesOS helps businesses understand who owes them money, what needs
> attention first, and how delayed payments can affect their cash
> position.**

------------------------------------------------------------------------

## The Problem

For many small and growing businesses, unpaid invoices are not just an
accounting problem --- they directly affect day-to-day cash flow.

Businesses often have to:

-   Track invoices manually across spreadsheets or accounting software.
-   Remember which customers are overdue.
-   Decide which outstanding invoice should be followed up first.
-   Look through customer payment history before taking action.
-   Contact customers manually for payment reminders.
-   Estimate whether delayed collections could create a cash-flow
    problem.

The result is that important collection decisions can become reactive
instead of data-driven.

### Our Goal

**Turn receivables data into clear, actionable decisions.**

Instead of simply showing a list of unpaid invoices, DuesOS combines
invoice data, customer information, payment history, and risk analysis
to tell the business **what deserves attention first and why.**

------------------------------------------------------------------------

## What We Built

DuesOS is a web-based receivables intelligence platform with a
centralized dashboard for managing outstanding payments.

### 1. Receivables Dashboard

The Overview dashboard gives the business an immediate picture of its
financial position:

-   Total receivables
-   Total overdue amount
-   Amount due soon
-   Available cash
-   Collection priority
-   Today's required actions
-   Largest overdue accounts
-   Cash-flow information

The dashboard is powered by application data rather than hardcoded UI
values.

### 2. Invoice Management

Users can create and track invoices with:

-   Customer / client
-   Invoice amount
-   Issue date
-   Due date
-   Item / scope
-   Outstanding amount
-   Payment status

Invoices are stored in the backend and connected to the corresponding
customer and business.

### 3. Customer Intelligence

Each customer has a dedicated intelligence view containing:

-   Contact details
-   Outstanding amount
-   Average payment delay
-   Payment reliability
-   Payment history
-   Open invoices
-   Credit & payment intelligence

This lets a business understand the customer behind an overdue invoice
rather than treating every unpaid invoice equally.

### 4. Risk-Based Collection Priority

DuesOS uses a risk engine to evaluate open invoices.

The system considers factors such as:

-   How overdue an invoice is
-   Invoice amount
-   Customer payment behaviour
-   Previous late payments
-   Payment history

The result is a risk score that helps identify the invoice or customer
that deserves attention first.

This changes the workflow from:

> **"Which invoice should I look at?"**

to:

> **"Which outstanding payment is the biggest collection priority?"**

### 5. Cash-Flow Forecasting

Outstanding invoices are connected to the business's cash position.

DuesOS uses:

-   Current cash
-   Outstanding invoices
-   Expected collections
-   Customer payment behaviour
-   Business expenses

to estimate future cash-flow pressure and identify potential shortfall
situations.

This connects **accounts receivable** with the bigger question:

> **"Will delayed collections affect our ability to operate?"**

### 6. Payment Reminders

Users can send a formal payment reminder directly from the application.

The reminder flow uses customer contact information stored with the
customer record and sends the email through the **Resend API**.

The system also records the reminder in the Action History / Timeline so
the business has a record of the collection action.

### 7. Action History

Important collection actions are recorded in the application, including:

-   Payment reminders
-   Collection actions
-   Customer payment activity
-   Relevant payment-history events

------------------------------------------------------------------------

## How It Works

``` text
                    ┌──────────────────┐
                    │     Business     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Customers    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Invoices     │
                    └────────┬─────────┘
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
          ┌──────────────┐      ┌──────────────┐
          │   Payments   │      │   Expenses   │
          └──────┬───────┘      └──────┬───────┘
                 │                     │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │  Risk & Cash-Flow   │
                 │      Services       │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │      DuesOS         │
                 │     Dashboard       │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │  Recommended Action │
                 │  + Email Reminder   │
                 └─────────────────────┘
```

------------------------------------------------------------------------

## Architecture

### Frontend

Built with:

-   **React**
-   **Vite**
-   **React Router**
-   **Tailwind CSS**

The frontend handles:

-   Dashboard UI
-   Customer views
-   Invoice views
-   Receivables
-   Cash-flow screens
-   Action Center
-   Reminder dialogs
-   API communication

### Backend

Built with:

-   **Node.js**
-   **Express**
-   **Supabase**
-   **Resend**

The backend handles:

-   Business data
-   Customers
-   Invoices
-   Payments
-   Expenses
-   Risk calculations
-   Cash-flow calculations
-   Reminder sending
-   Database communication

### Database

**Supabase / PostgreSQL** is used as the persistent data layer.

``` text
Business
   │
   ├── Customers
   │      │
   │      └── Invoices
   │              │
   │              └── Payments
   │
   ├── Expenses
   │
   └── Collection / Action data
```

------------------------------------------------------------------------

## Risk Intelligence

One of the core ideas behind DuesOS is that **not every overdue invoice
represents the same level of risk.**

A customer who is one day late and historically pays on time should not
necessarily receive the same collection priority as a customer who:

-   Has repeatedly paid late
-   Has a large outstanding balance
-   Has been overdue for a long period

DuesOS therefore combines invoice-level and customer-level information
before determining collection priority.

This moves beyond:

**Overdue = Yes / No**

toward:

**How risky is this receivable, and what should we do about it?**

------------------------------------------------------------------------

## Email Reminder System

The application uses **Resend** for transactional email delivery.

``` text
DuesOS
   │
   ▼
Backend API
   │
   ▼
Resend API
   │
   ▼
Customer Email
```

The email contains relevant invoice information and acts as a formal
payment reminder.

### Environment Variables

Create a `.env` file in the backend:

``` env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=DuesOS <reminders@yourverifieddomain.com>
```

**Never commit real API keys or secrets to GitHub.**

------------------------------------------------------------------------

## Demo Account

DuesOS includes a demo environment so judges and reviewers can explore
the application without configuring an account from scratch.

The demo demonstrates the complete workflow:

``` text
Customer
   ↓
Invoice
   ↓
Payment history
   ↓
Risk analysis
   ↓
Collection priority
   ↓
Payment reminder
   ↓
Action history
```

The application can also be extended to support businesses creating and
using their own accounts and data.

------------------------------------------------------------------------

## Project Structure

``` text
IIC-Hackathon/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── supabase.js
│   ├── server.js
│   └── ...
│
└── README.md
```

------------------------------------------------------------------------

## Running Locally

### Prerequisites

-   Node.js
-   npm
-   A Supabase project
-   Resend account/API key for email functionality

### 1. Clone the repository

``` bash
git clone <repository-url>
cd IIC-Hackathon
```

### 2. Install frontend dependencies

``` bash
cd frontend
npm install
```

### 3. Configure frontend environment

Create `frontend/.env`:

``` env
VITE_API_URL=http://localhost:5000
```

### 4. Install backend dependencies

``` bash
cd ../backend
npm install
```

### 5. Configure backend environment

Create `backend/.env` and add your Supabase and Resend credentials.

### 6. Start the backend

``` bash
npm run dev
```

Backend:

``` text
http://localhost:5000
```

### 7. Start the frontend

Open another terminal:

``` bash
cd frontend
npm run dev
```

Frontend:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

## API Overview

The frontend communicates with the backend through REST APIs.

Examples include:

``` text
GET    /api/dashboard
GET    /api/customers
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id
POST   /api/reminders
```

The available endpoints may evolve as the project develops.

------------------------------------------------------------------------

## Security Notes

Sensitive credentials should remain on the backend.

Do **not** expose:

-   Supabase service-role keys
-   Resend API keys
-   Other private credentials

through frontend environment variables.

Frontend variables beginning with `VITE_` are bundled into the client
application and should therefore never contain secrets.

------------------------------------------------------------------------

## Why DuesOS?

Most receivables tools focus on recording what happened.

DuesOS focuses on helping the business decide **what to do next**.

### From

**Invoice tracking**

### To

**Receivables intelligence**

### From

**"This customer is overdue."**

### To

**"This customer is overdue, has a history of delayed payments,
represents a significant outstanding amount, and should be prioritized
for collection."**

That is the core idea behind DuesOS.

------------------------------------------------------------------------

## Current Status

  Area                    Status
  ----------------------- --------
  Dashboard               ✅
  Customer management     ✅
  Invoice management      ✅
  Supabase data storage   ✅
  Payment tracking        ✅
  Risk analysis           ✅
  Cash-flow forecasting   ✅
  Collection priority     ✅
  Customer intelligence   ✅
  Email reminders         ✅
  Action history          ✅
  Demo environment        ✅
  Production deployment   🚧

------------------------------------------------------------------------

## Built For

**IIC Hackathon**

DuesOS was built as a practical prototype for improving cash-flow
visibility and receivables management for businesses.

------------------------------------------------------------------------

## Team

### Code Genesis

Built with a focus on solving a real operational problem through:

-   Financial data
-   Risk intelligence
-   Automation
-   Customer insights
-   Action-oriented dashboards

------------------------------------------------------------------------

## License

This project was developed as a hackathon project.
