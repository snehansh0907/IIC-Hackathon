-- DuesOS demo seed data
-- Run this AFTER schema.sql. Safe to re-run on a fresh database; it does
-- not check for existing rows, so if you want to reset the demo data,
-- truncate the tables first (see the commented block at the bottom).
--
-- All dates are calculated relative to CURRENT_DATE so the demo always
-- looks realistic, no matter when you run this script.

do $$
declare
  business_id uuid;

  -- customers
  c_abc uuid;   -- ABC Construction: chronic late payer, biggest customer
  c_verma uuid; -- reliable, always on time
  c_kumar uuid; -- reliable
  c_singh uuid; -- moderately late
  c_patel uuid; -- very reliable
  c_reddy uuid; -- frequently late, large invoices
  c_mehta uuid; -- reliable
  c_gupta uuid; -- chronic late payer
  c_nair uuid;  -- reliable

  -- invoice ids we need to reference again when inserting their payments
  i_abc_002 uuid;
  i_abc_003 uuid;
  i_ver_001 uuid;
  i_ver_002 uuid;
  i_kum_001 uuid;
  i_sin_001 uuid;
  i_sin_002 uuid;
  i_pat_001 uuid;
  i_red_001 uuid;
  i_red_002 uuid;
  i_meh_001 uuid;
  i_gup_001 uuid;
  i_gup_002 uuid;
  i_nai_001 uuid;
  i_nai_002 uuid;
begin

  -- =========================================================
  -- BUSINESS
  -- current_cash and minimum_cash_threshold are set so that, combined
  -- with the expenses below, the cash-flow forecast realistically
  -- projects a shortfall in the next 30-60 days.
  -- =========================================================
  insert into businesses (name, industry, email, phone, current_cash, minimum_cash_threshold)
  values ('Sharma Engineering Pvt. Ltd.', 'Industrial Manufacturing', 'accounts@sharmaengineering.example', '+91-98765-43210', 450000, 150000)
  returning id into business_id;

  -- =========================================================
  -- CUSTOMERS
  -- =========================================================
  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'ABC Construction', 'accounts@abcconstruction.example', '+91-90000-11111', 21, 45)
  returning id into c_abc;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Verma Traders', 'finance@vermatraders.example', '+91-90000-22222', 8, 92)
  returning id into c_verma;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Kumar Steel Works', 'billing@kumarsteel.example', '+91-90000-33333', 12, 85)
  returning id into c_kumar;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Singh Automotive', 'accounts@singhauto.example', '+91-90000-44444', 25, 60)
  returning id into c_singh;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Patel Industries', 'finance@patelindustries.example', '+91-90000-55555', 7, 95)
  returning id into c_patel;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Reddy Fabrication', 'accounts@reddyfab.example', '+91-90000-66666', 30, 55)
  returning id into c_reddy;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Mehta Enterprises', 'billing@mehtaenterprises.example', '+91-90000-77777', 15, 75)
  returning id into c_mehta;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Gupta & Sons', 'accounts@guptasons.example', '+91-90000-88888', 35, 40)
  returning id into c_gupta;

  insert into customers (business_id, name, email, phone, average_payment_days, payment_reliability)
  values (business_id, 'Nair Manufacturing', 'finance@nairmfg.example', '+91-90000-99999', 10, 88)
  returning id into c_nair;

  -- =========================================================
  -- INVOICES + PAYMENTS
  -- =========================================================

  -- ---- ABC Construction (the flagship high-risk demo customer) ----

  -- The big, badly overdue invoice the whole risk engine demo revolves around.
  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_abc, 'INV-ABC-1001', 240000, current_date - interval '95 days', current_date - interval '65 days', 'overdue');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_abc, 'INV-ABC-1002', 85000, current_date - interval '150 days', current_date - interval '120 days', 'paid')
  returning id into i_abc_002;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_abc_002, 85000, current_date - interval '95 days', 'bank_transfer', 'PAY-ABC-1002');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_abc, 'INV-ABC-1003', 60000, current_date - interval '60 days', current_date - interval '30 days', 'paid')
  returning id into i_abc_003;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_abc_003, 60000, current_date - interval '5 days', 'bank_transfer', 'PAY-ABC-1003');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_abc, 'INV-ABC-1004', 45000, current_date - interval '20 days', current_date + interval '10 days', 'pending');

  -- ---- Verma Traders (reliable, on time) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_verma, 'INV-VER-2001', 30000, current_date - interval '60 days', current_date - interval '45 days', 'paid')
  returning id into i_ver_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_ver_001, 30000, current_date - interval '46 days', 'upi', 'PAY-VER-2001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_verma, 'INV-VER-2002', 42000, current_date - interval '40 days', current_date - interval '25 days', 'paid')
  returning id into i_ver_002;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_ver_002, 42000, current_date - interval '25 days', 'upi', 'PAY-VER-2002');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_verma, 'INV-VER-2003', 28000, current_date - interval '10 days', current_date + interval '5 days', 'due_soon');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_verma, 'INV-VER-2004', 36000, current_date - interval '5 days', current_date + interval '20 days', 'pending');

  -- ---- Kumar Steel Works (reliable) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_kumar, 'INV-KUM-3001', 55000, current_date - interval '70 days', current_date - interval '55 days', 'paid')
  returning id into i_kum_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_kum_001, 55000, current_date - interval '54 days', 'bank_transfer', 'PAY-KUM-3001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_kumar, 'INV-KUM-3002', 47000, current_date - interval '30 days', current_date - interval '15 days', 'overdue');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_kumar, 'INV-KUM-3003', 33000, current_date - interval '8 days', current_date + interval '6 days', 'due_soon');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_kumar, 'INV-KUM-3004', 61000, current_date - interval '3 days', current_date + interval '25 days', 'pending');

  -- ---- Singh Automotive (moderately late) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_singh, 'INV-SIN-4001', 52000, current_date - interval '90 days', current_date - interval '65 days', 'paid')
  returning id into i_sin_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_sin_001, 52000, current_date - interval '35 days', 'cheque', 'PAY-SIN-4001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_singh, 'INV-SIN-4002', 38000, current_date - interval '50 days', current_date - interval '25 days', 'partially_paid')
  returning id into i_sin_002;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_sin_002, 20000, current_date - interval '10 days', 'bank_transfer', 'PAY-SIN-4002-A');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_singh, 'INV-SIN-4003', 44000, current_date - interval '20 days', current_date + interval '2 days', 'due_soon');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_singh, 'INV-SIN-4004', 29000, current_date - interval '2 days', current_date + interval '30 days', 'pending');

  -- ---- Patel Industries (very reliable) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_patel, 'INV-PAT-5001', 70000, current_date - interval '40 days', current_date - interval '25 days', 'paid')
  returning id into i_pat_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_pat_001, 70000, current_date - interval '26 days', 'bank_transfer', 'PAY-PAT-5001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_patel, 'INV-PAT-5002', 65000, current_date - interval '15 days', current_date + interval '1 days', 'due_soon');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_patel, 'INV-PAT-5003', 50000, current_date - interval '1 days', current_date + interval '40 days', 'pending');

  -- ---- Reddy Fabrication (frequently late, large invoices) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_reddy, 'INV-RED-6001', 95000, current_date - interval '100 days', current_date - interval '70 days', 'paid')
  returning id into i_red_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_red_001, 95000, current_date - interval '30 days', 'bank_transfer', 'PAY-RED-6001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_reddy, 'INV-RED-6002', 110000, current_date - interval '80 days', current_date - interval '50 days', 'paid')
  returning id into i_red_002;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_red_002, 110000, current_date - interval '10 days', 'bank_transfer', 'PAY-RED-6002');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_reddy, 'INV-RED-6003', 88000, current_date - interval '45 days', current_date - interval '20 days', 'overdue');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_reddy, 'INV-RED-6004', 40000, current_date - interval '10 days', current_date + interval '15 days', 'pending');

  -- ---- Mehta Enterprises (reliable) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_mehta, 'INV-MEH-7001', 33000, current_date - interval '35 days', current_date - interval '20 days', 'paid')
  returning id into i_meh_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_meh_001, 33000, current_date - interval '19 days', 'upi', 'PAY-MEH-7001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_mehta, 'INV-MEH-7002', 27000, current_date - interval '12 days', current_date + interval '3 days', 'due_soon');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_mehta, 'INV-MEH-7003', 41000, current_date - interval '4 days', current_date + interval '18 days', 'pending');

  -- ---- Gupta & Sons (chronic late payer) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_gupta, 'INV-GUP-8001', 62000, current_date - interval '120 days', current_date - interval '85 days', 'paid')
  returning id into i_gup_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_gup_001, 62000, current_date - interval '40 days', 'cash', 'PAY-GUP-8001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_gupta, 'INV-GUP-8002', 58000, current_date - interval '90 days', current_date - interval '55 days', 'paid')
  returning id into i_gup_002;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_gup_002, 58000, current_date - interval '15 days', 'cash', 'PAY-GUP-8002');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_gupta, 'INV-GUP-8003', 71000, current_date - interval '50 days', current_date - interval '18 days', 'overdue');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_gupta, 'INV-GUP-8004', 25000, current_date - interval '6 days', current_date + interval '22 days', 'pending');

  -- ---- Nair Manufacturing (reliable) ----

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_nair, 'INV-NAI-9001', 39000, current_date - interval '55 days', current_date - interval '40 days', 'paid')
  returning id into i_nai_001;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_nai_001, 39000, current_date - interval '41 days', 'upi', 'PAY-NAI-9001');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_nair, 'INV-NAI-9002', 44000, current_date - interval '25 days', current_date - interval '10 days', 'partially_paid')
  returning id into i_nai_002;
  insert into payments (invoice_id, amount, payment_date, payment_method, reference)
  values (i_nai_002, 25000, current_date - interval '9 days', 'bank_transfer', 'PAY-NAI-9002-A');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_nair, 'INV-NAI-9003', 31000, current_date - interval '9 days', current_date + interval '4 days', 'due_soon');

  insert into invoices (business_id, customer_id, invoice_number, amount, issue_date, due_date, status)
  values (business_id, c_nair, 'INV-NAI-9004', 48000, current_date - interval '2 days', current_date + interval '35 days', 'pending');

  -- =========================================================
  -- EXPENSES
  -- Sized so that, combined with current_cash and expected collection
  -- probabilities, the cash-flow forecast shows a realistic shortfall
  -- within the next 30-60 days.
  -- =========================================================
  insert into expenses (business_id, category, description, amount, due_date, recurring, status)
  values
    (business_id, 'Salaries', 'Monthly staff salaries', 180000, current_date + interval '10 days', true, 'pending'),
    (business_id, 'Rent', 'Factory and office rent', 60000, current_date + interval '5 days', true, 'pending'),
    (business_id, 'Raw Materials', 'Steel and component purchase', 95000, current_date + interval '15 days', false, 'pending'),
    (business_id, 'Utilities', 'Electricity bill', 18000, current_date + interval '8 days', true, 'pending'),
    (business_id, 'Maintenance', 'Equipment servicing', 35000, current_date + interval '20 days', false, 'pending'),
    (business_id, 'Loan EMI', 'Equipment loan installment', 50000, current_date + interval '12 days', true, 'pending'),
    (business_id, 'Insurance', 'Annual factory insurance premium', 22000, current_date + interval '40 days', false, 'pending'),
    (business_id, 'Office Supplies', 'Stationery and consumables', 8000, current_date + interval '6 days', false, 'pending'),
    (business_id, 'Logistics', 'Freight and transport costs', 27000, current_date + interval '18 days', false, 'pending'),
    (business_id, 'Taxes', 'GST payment', 65000, current_date + interval '25 days', false, 'pending'),
    (business_id, 'Utilities', 'Internet and phone', 6000, current_date + interval '4 days', true, 'pending'),
    (business_id, 'Software', 'Annual accounting software subscription', 15000, current_date + interval '55 days', false, 'pending');

  -- =========================================================
  -- ACTIONS (a couple of example follow-ups; the API generates these
  -- dynamically too, but a few seeded rows help the /actions-style UI
  -- have something to show immediately)
  -- =========================================================
  insert into actions (business_id, invoice_id, type, priority, description, status)
  values
    (business_id, null, 'review', 'HIGH', 'Review ABC Construction relationship due to repeated late payments', 'pending');

end $$;

-- To reset the demo data and re-run this script, uncomment and run:
-- truncate table actions, payments, invoices, expenses, customers, businesses restart identity cascade;
