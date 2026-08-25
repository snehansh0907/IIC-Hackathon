import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';

/**
 * Normalizes common date strings into YYYY-MM-DD
 */
function normalizeDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (!str) return null;

  // YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  // YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(str)) {
    const parts = str.split(/[-/.]/);
    return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(str)) {
    const parts = str.split(/[-/.]/);
    return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

/**
 * Normalizes amount values
 */
function normalizeAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.abs(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[₹$,\s]/g, '').replace(/(dr|cr)$/i, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Parses XML text from Tally Prime exports
 */
function parseTallyXml(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const vouchers = xmlDoc.getElementsByTagName('VOUCHER');
  const rows = [];

  for (let i = 0; i < vouchers.length; i++) {
    const v = vouchers[i];
    const vchType = v.getAttribute('VCHTYPE') || '';
    
    // Extract elements
    const dateElem = v.getElementsByTagName('DATE')[0];
    const vchNumElem = v.getElementsByTagName('VOUCHERNUMBER')[0];
    const partyElem = v.getElementsByTagName('PARTYLEDGERNAME')[0] || v.getElementsByTagName('PARTYNAME')[0];
    const amountElem = v.getElementsByTagName('AMOUNT')[0];
    const narrationElem = v.getElementsByTagName('NARRATION')[0];
    
    // Try bill allocation for due date/credit period
    const billAlloc = v.getElementsByTagName('BILLALLOCATIONS.LIST')[0];
    let billCreditPeriod = '';
    if (billAlloc) {
      const periodElem = billAlloc.getElementsByTagName('BILLCREDITPERIOD')[0];
      if (periodElem) billCreditPeriod = periodElem.textContent;
    }

    const rawDate = dateElem ? dateElem.textContent : '';
    const rawVchNum = vchNumElem ? vchNumElem.textContent : `TALLY-INV-${i + 1001}`;
    const rawParty = partyElem ? partyElem.textContent : '';
    const rawAmt = amountElem ? amountElem.textContent : '0';
    const rawNarration = narrationElem ? narrationElem.textContent : vchType;

    if (rawParty || rawVchNum) {
      rows.push({
        'Invoice Number': rawVchNum,
        'Customer Name': rawParty || 'Tally Client',
        'Invoice Date': rawDate,
        'Due Date': '',
        'Amount': Math.abs(parseFloat(rawAmt) || 0),
        'Description': rawNarration,
        'Status': 'Pending',
      });
    }
  }

  return rows;
}

/**
 * Auto-detect column mappings based on common column naming conventions
 */
function autoDetectMapping(columns) {
  const map = {
    invoice_number: '',
    customer_name: '',
    issue_date: '',
    due_date: '',
    amount: '',
    status: '',
    customer_email: '',
    customer_phone: '',
    city: '',
    description: '',
  };

  const lowerCols = columns.map(c => ({ original: c, lower: String(c).toLowerCase().trim() }));

  for (const col of lowerCols) {
    const l = col.lower;
    // Invoice Number
    if (!map.invoice_number && (l.includes('invoice') && (l.includes('num') || l.includes('no') || l.includes('#')) || l.includes('voucherno') || l.includes('voucher number') || l.includes('bill no') || l.includes('bill_no') || l === 'id' || l === 'inv_no')) {
      map.invoice_number = col.original;
    }
    // Customer Name
    else if (!map.customer_name && (l.includes('customer') || l.includes('party') || l.includes('client') || l.includes('buyer') || l.includes('company') || l === 'name' || l === 'ledger')) {
      map.customer_name = col.original;
    }
    // Issue Date
    else if (!map.issue_date && (l.includes('issue') || (l.includes('invoice') && l.includes('date')) || l.includes('bill date') || l.includes('voucher date') || l === 'date')) {
      map.issue_date = col.original;
    }
    // Due Date
    else if (!map.due_date && (l.includes('due') || l.includes('expiry') || l.includes('payment date') || l.includes('terms'))) {
      map.due_date = col.original;
    }
    // Amount
    else if (!map.amount && (l.includes('amount') || l.includes('total') || l.includes('grand') || l.includes('net') || l.includes('balance') || l.includes('value') || l.includes('price'))) {
      map.amount = col.original;
    }
    // Status
    else if (!map.status && (l.includes('status') || l.includes('state') || l.includes('paid'))) {
      map.status = col.original;
    }
    // Email
    else if (!map.customer_email && (l.includes('email') || l.includes('mail'))) {
      map.customer_email = col.original;
    }
    // Phone
    else if (!map.customer_phone && (l.includes('phone') || l.includes('mobile') || l.includes('contact'))) {
      map.customer_phone = col.original;
    }
    // City
    else if (!map.city && (l.includes('city') || l.includes('location') || l.includes('address'))) {
      map.city = col.original;
    }
    // Description
    else if (!map.description && (l.includes('desc') || l.includes('item') || l.includes('narration') || l.includes('scope') || l.includes('remark'))) {
      map.description = col.original;
    }
  }

  // Fallbacks if not matched
  if (!map.invoice_number && columns.length > 0) map.invoice_number = columns[0];
  if (!map.customer_name && columns.length > 1) map.customer_name = columns[1];
  if (!map.amount && columns.length > 2) map.amount = columns[2];
  if (!map.issue_date && columns.length > 3) map.issue_date = columns[3];

  return map;
}

export function ImportInvoicesModal({ isOpen, onClose, onImportSuccess }) {
  // Wizard step: 'source' | 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'
  const [step, setStep] = useState('source');
  const [source, setSource] = useState('CSV');
  const [file, setFile] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [detectedColumns, setDetectedColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('source');
    setSource('CSV');
    setFile(null);
    setRawRows([]);
    setDetectedColumns([]);
    setMapping({});
    setErrorMsg(null);
    setImportSummary(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSelectSource = (src) => {
    setSource(src);
    setStep('upload');
    setErrorMsg(null);
  };

  // Handle File Selection and Parsing
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    parseUploadedFile(selectedFile);
  };

  const parseUploadedFile = (uploadedFile) => {
    const fileName = uploadedFile.name.toLowerCase();
    const isXml = fileName.endsWith('.xml');
    const isJson = fileName.endsWith('.json');

    const reader = new FileReader();

    if (isXml) {
      reader.onload = (evt) => {
        try {
          const xmlText = evt.target.result;
          const rows = parseTallyXml(xmlText);
          if (!rows || rows.length === 0) {
            setErrorMsg('No valid voucher or invoice elements detected in XML file.');
            return;
          }
          const cols = Object.keys(rows[0]);
          setRawRows(rows);
          setDetectedColumns(cols);
          setMapping(autoDetectMapping(cols));
          setStep('preview'); // Tally XML directly maps
        } catch (err) {
          setErrorMsg('Failed to parse Tally XML file: ' + err.message);
        }
      };
      reader.readAsText(uploadedFile);
    } else if (isJson) {
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          const rows = Array.isArray(parsed) ? parsed : (parsed.invoices || parsed.vouchers || parsed.data || []);
          if (!rows || rows.length === 0) {
            setErrorMsg('No invoice records array found in JSON file.');
            return;
          }
          const cols = Object.keys(rows[0]);
          setRawRows(rows);
          setDetectedColumns(cols);
          setMapping(autoDetectMapping(cols));
          setStep('mapping');
        } catch (err) {
          setErrorMsg('Invalid JSON format: ' + err.message);
        }
      };
      reader.readAsText(uploadedFile);
    } else {
      // CSV or Excel
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!jsonRows || jsonRows.length === 0) {
            setErrorMsg('Uploaded spreadsheet contains no data rows.');
            return;
          }

          const cols = Object.keys(jsonRows[0]);
          setRawRows(jsonRows);
          setDetectedColumns(cols);
          setMapping(autoDetectMapping(cols));
          setStep('mapping');
        } catch (err) {
          setErrorMsg('Failed to read spreadsheet: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  // Build transformed rows based on current mapping
  const getMappedInvoices = () => {
    return rawRows.map((row, idx) => {
      const invNum = String(mapping.invoice_number ? row[mapping.invoice_number] : (row.invoice_number || row.id || `INV-${idx + 1001}`)).trim();
      const custName = String(mapping.customer_name ? row[mapping.customer_name] : (row.customer_name || row.customer || '')).trim();
      const rawAmt = mapping.amount ? row[mapping.amount] : row.amount;
      const amtNum = normalizeAmount(rawAmt);
      const rawIssue = mapping.issue_date ? row[mapping.issue_date] : (row.issue_date || row.date);
      const issueDate = normalizeDate(rawIssue) || new Date().toISOString().slice(0, 10);
      
      const rawDue = mapping.due_date ? row[mapping.due_date] : row.due_date;
      let dueDate = normalizeDate(rawDue);
      if (!dueDate) {
        const d = new Date(issueDate);
        d.setDate(d.getDate() + 30);
        dueDate = d.toISOString().slice(0, 10);
      }

      const rawStatus = mapping.status ? row[mapping.status] : row.status;
      const desc = mapping.description ? row[mapping.description] : (row.description || row.narration || '');
      const email = mapping.customer_email ? row[mapping.customer_email] : row.email;
      const phone = mapping.customer_phone ? row[mapping.customer_phone] : row.phone;
      const city = mapping.city ? row[mapping.city] : row.city;

      const isValid = Boolean(invNum && custName && amtNum > 0);
      let issueText = '';
      if (!invNum) issueText = 'Missing Invoice Number';
      else if (!custName) issueText = 'Missing Customer';
      else if (amtNum <= 0) issueText = 'Invalid Amount';

      return {
        originalRow: idx + 1,
        invoice_number: invNum,
        customer_name: custName,
        amount: amtNum,
        issue_date: issueDate,
        due_date: dueDate,
        status: rawStatus || 'Pending',
        description: desc || `${source} Import`,
        customer_email: email,
        customer_phone: phone,
        city: city,
        isValid,
        issueText,
      };
    });
  };

  const mappedInvoices = getMappedInvoices();
  const validInvoices = mappedInvoices.filter(i => i.isValid);
  const invalidInvoices = mappedInvoices.filter(i => !i.isValid);

  // Execute Import
  const handleExecuteImport = async () => {
    if (validInvoices.length === 0) {
      setErrorMsg('No valid invoice rows available to import.');
      return;
    }

    setStep('importing');
    setErrorMsg(null);

    try {
      const result = await api.importInvoices({
        invoices: validInvoices,
        source,
      });

      setImportSummary(result);
      setStep('complete');
    } catch (err) {
      console.error('Import execution error:', err);
      setErrorMsg(err.message || 'Failed to complete invoice import.');
      setStep('preview');
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Invoice Number': 'INV-2026-001',
        'Customer Name': 'Apex Industrial Works',
        'Invoice Date': '2026-08-01',
        'Due Date': '2026-08-31',
        'Amount': '150000',
        'Status': 'Pending',
        'Customer Email': 'finance@apexworks.example',
        'Customer Phone': '+91-98765-11111',
        'City': 'Pune, MH',
        'Description': 'Industrial Machining Parts Batch A',
      },
      {
        'Invoice Number': 'INV-2026-002',
        'Customer Name': 'Mahindra Foundry Ltd',
        'Invoice Date': '2026-07-15',
        'Due Date': '2026-08-15',
        'Amount': '280000',
        'Status': 'Pending',
        'Customer Email': 'accounts@mahindrafoundry.example',
        'Customer Phone': '+91-98765-22222',
        'City': 'Nashik, MH',
        'Description': 'Heavy Casting Components',
      },
      {
        'Invoice Number': 'INV-2026-003',
        'Customer Name': 'Tata Robotics Division',
        'Invoice Date': '2026-06-20',
        'Due Date': '2026-07-20',
        'Amount': '95000',
        'Status': 'Paid',
        'Customer Email': 'payables@tatarobotics.example',
        'Customer Phone': '+91-98765-33333',
        'City': 'Pune, MH',
        'Description': 'Precision Servos & Wire Harnesses',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Invoices');
    XLSX.writeFile(wb, 'DuesOS_Invoice_Import_Sample.csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div 
        className="w-full max-w-2xl bg-white border border-[#E0DED7] rounded-lg shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DED7] bg-[#FBF9F4]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-gold bg-[#151D1C] px-2 py-0.5 rounded">
                Import Wizard
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {step === 'source' && 'Step 1: Select Data Source'}
                {step === 'upload' && `Step 2: Upload ${source} Export`}
                {step === 'mapping' && 'Step 3: Map Columns'}
                {step === 'preview' && 'Step 4: Review & Confirm'}
                {step === 'importing' && 'Step 5: Processing Ledger'}
                {step === 'complete' && 'Import Successful'}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1B1C19] mt-1">
              {step === 'complete' ? 'Invoices Synced to Ledger' : `Import Invoices from ${source}`}
            </h3>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs font-sans flex-1">
          {/* ========================================================= */}
          {/* STEP 1: SOURCE SELECTION */}
          {/* ========================================================= */}
          {step === 'source' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Choose the source accounting application or format you would like to import invoices from:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tally Prime */}
                <div 
                  onClick={() => handleSelectSource('Tally Prime')}
                  className="p-5 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded-lg cursor-pointer text-center transition-all group flex flex-col items-center justify-between"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1B1C19]">Tally Prime</div>
                    <div className="text-[11px] text-gray-500 mt-1">XML, Excel, JSON or CSV voucher exports</div>
                  </div>
                  <span className="mt-3 text-[11px] font-semibold text-brand-gold group-hover:underline">
                    Select Tally →
                  </span>
                </div>

                {/* Zoho Books */}
                <div 
                  onClick={() => handleSelectSource('Zoho Books')}
                  className="p-5 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded-lg cursor-pointer text-center transition-all group flex flex-col items-center justify-between"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-2xl">cloud_sync</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1B1C19]">Zoho Books</div>
                    <div className="text-[11px] text-gray-500 mt-1">Direct CSV / Excel invoice ledger export</div>
                  </div>
                  <span className="mt-3 text-[11px] font-semibold text-brand-gold group-hover:underline">
                    Select Zoho →
                  </span>
                </div>

                {/* CSV / Excel */}
                <div 
                  onClick={() => handleSelectSource('CSV / Excel')}
                  className="p-5 border border-[#E0DED7] hover:border-brand-gold hover:bg-[#FBF9F4] rounded-lg cursor-pointer text-center transition-all group flex flex-col items-center justify-between"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-2xl">table_chart</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1B1C19]">CSV / Excel</div>
                    <div className="text-[11px] text-gray-500 mt-1">Standard spreadsheet (.csv, .xlsx, .xls)</div>
                  </div>
                  <span className="mt-3 text-[11px] font-semibold text-brand-gold group-hover:underline">
                    Upload Spreadsheet →
                  </span>
                </div>
              </div>

              {/* Sample Template Download */}
              <div className="p-3.5 bg-[#FDFCF9] border border-[#E0DED7] rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-500">description</span>
                  <div>
                    <span className="font-semibold text-gray-800">Need a sample format?</span>
                    <p className="text-[11px] text-gray-500">Download our pre-formatted CSV template with example invoice records.</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 border border-[#E0DED7] bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Sample CSV
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: UPLOAD FILE */}
          {/* ========================================================= */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E0DED7] hover:border-brand-gold bg-[#FDFCF9] hover:bg-[#FBF9F4] rounded-lg p-8 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={source === 'Tally Prime' ? '.xml,.csv,.xlsx,.xls,.json' : '.csv,.xlsx,.xls'}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-dark mb-3">
                  <span className="material-symbols-outlined text-2xl">file_upload</span>
                </div>
                <h4 className="text-sm font-bold text-[#1B1C19] mb-1">
                  Click to select or drag & drop your {source} file
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  {source === 'Tally Prime' 
                    ? 'Supports .xml, .xlsx, .xls, .csv, and .json export files'
                    : 'Supports .csv, .xlsx, and .xls spreadsheet files'} (Max: 10MB)
                </p>
                <span className="inline-block px-3 py-1 bg-white border border-[#E0DED7] rounded text-xs font-semibold text-gray-700">
                  Browse File
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('source')}
                  className="text-xs text-gray-600 hover:text-[#1B1C19] flex items-center gap-1 font-semibold"
                >
                  ← Choose different source
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-xs text-brand-gold hover:underline font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download sample template
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: FIELD MAPPING */}
          {/* ========================================================= */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E0DED7]">
                <div>
                  <h4 className="font-bold text-sm text-[#1B1C19]">Map Spreadsheet Columns</h4>
                  <p className="text-xs text-gray-500">Match the detected columns from <span className="font-mono font-semibold">{file?.name}</span> to DuesOS ledger fields.</p>
                </div>
                <span className="px-2.5 py-1 bg-brand-gold/15 text-brand-dark rounded text-xs font-mono font-bold">
                  {rawRows.length} Rows Detected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Required Fields */}
                <div className="space-y-3 p-3.5 bg-[#FBF9F4] border border-[#E0DED7] rounded">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                    Required Fields
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Invoice Number *</label>
                    <select
                      value={mapping.invoice_number || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, invoice_number: e.target.value }))}
                      className="w-full p-2 border border-[#E0DED7] rounded bg-white font-mono text-xs outline-none focus:border-brand-gold"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Customer / Client Name *</label>
                    <select
                      value={mapping.customer_name || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="w-full p-2 border border-[#E0DED7] rounded bg-white font-mono text-xs outline-none focus:border-brand-gold"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Invoice Amount (₹) *</label>
                    <select
                      value={mapping.amount || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full p-2 border border-[#E0DED7] rounded bg-white font-mono text-xs outline-none focus:border-brand-gold"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Optional / Date Fields */}
                <div className="space-y-3 p-3.5 bg-[#FDFCF9] border border-[#E0DED7] rounded">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                    Date & Optional Fields
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Issue Date</label>
                    <select
                      value={mapping.issue_date || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, issue_date: e.target.value }))}
                      className="w-full p-2 border border-[#E0DED7] rounded bg-white font-mono text-xs outline-none focus:border-brand-gold"
                    >
                      <option value="">-- Default to Today --</option>
                      {detectedColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Due Date</label>
                    <select
                      value={mapping.due_date || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full p-2 border border-[#E0DED7] rounded bg-white font-mono text-xs outline-none focus:border-brand-gold"
                    >
                      <option value="">-- Default to +30 Days --</option>
                      {detectedColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={mapping.status || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-2 border border-[#E0DED7] rounded bg-white font-mono text-xs outline-none focus:border-brand-gold"
                    >
                      <option value="">-- Default to Pending --</option>
                      {detectedColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mapping Navigation */}
              <div className="flex justify-between items-center pt-3 border-t border-[#E0DED7]">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-[#E0DED7] rounded text-gray-700 hover:bg-gray-50 font-medium"
                >
                  ← Re-upload File
                </button>
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  className="px-4 py-2 bg-[#151D1C] hover:bg-[#253231] text-white font-semibold rounded flex items-center gap-1.5 transition-colors"
                >
                  Preview Invoices →
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: PREVIEW & VALIDATION */}
          {/* ========================================================= */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#FDFCF9] border border-[#E0DED7] rounded">
                <div>
                  <span className="font-bold text-sm text-[#1B1C19]">Import Preview</span>
                  <div className="text-xs text-gray-500 font-sans mt-0.5">
                    {mappedInvoices.length} invoices detected from {file?.name || source}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-mono font-bold">
                    ✓ {validInvoices.length} Valid
                  </span>
                  {invalidInvoices.length > 0 && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-mono font-bold">
                      ⚠ {invalidInvoices.length} Needs Attention
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-[#E0DED7] rounded overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F5F3EE] sticky top-0 border-b border-[#E0DED7] text-[11px] font-bold uppercase text-gray-600">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DED7] font-sans">
                    {mappedInvoices.map((inv, idx) => (
                      <tr key={idx} className={inv.isValid ? 'hover:bg-[#FBF9F4]' : 'bg-red-50/50'}>
                        <td className="py-2 px-3 font-mono text-gray-400">#{inv.originalRow}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#1B1C19]">
                          {inv.invoice_number || <span className="text-red-500 italic">Missing</span>}
                        </td>
                        <td className="py-2 px-3 font-medium text-gray-800">
                          {inv.customer_name || <span className="text-red-500 italic">Missing</span>}
                        </td>
                        <td className="py-2 px-3 font-mono text-right font-bold text-[#1B1C19]">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-600">{inv.due_date}</td>
                        <td className="py-2 px-3 text-center">
                          {inv.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-mono font-semibold">
                              Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-mono font-semibold">
                              {inv.issueText}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview Navigation */}
              <div className="flex justify-between items-center pt-3 border-t border-[#E0DED7]">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-[#E0DED7] rounded text-gray-700 hover:bg-gray-50 font-medium"
                >
                  ← Adjust Mapping
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-[#E0DED7] rounded text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={validInvoices.length === 0}
                    className="px-5 py-2 bg-[#151D1C] hover:bg-[#253231] text-white font-bold rounded flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm text-brand-gold">cloud_upload</span>
                    Import {validInvoices.length} Invoices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 5: IMPORTING IN PROGRESS */}
          {/* ========================================================= */}
          {step === 'importing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-4xl animate-spin text-brand-gold mb-3">
                sync
              </span>
              <h4 className="font-bold text-base text-[#1B1C19]">Importing Invoices into DuesOS...</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Resolving customer records, performing duplicate verification, and updating your receivables ledger.
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 6: IMPORT COMPLETE */}
          {/* ========================================================= */}
          {step === 'complete' && importSummary && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#1B1C19]">Import Complete</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your receivables ledger has been updated with real records.
                </p>
              </div>

              {/* Metrics Box */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-4 bg-[#FBF9F4] border border-[#E0DED7] rounded-lg">
                <div className="text-center">
                  <span className="font-mono text-xl font-bold text-emerald-700">
                    {importSummary.importedCount}
                  </span>
                  <div className="text-[11px] text-gray-600 font-medium">Imported</div>
                </div>

                <div className="text-center border-x border-[#E0DED7]">
                  <span className="font-mono text-xl font-bold text-amber-700">
                    {importSummary.skippedCount}
                  </span>
                  <div className="text-[11px] text-gray-600 font-medium">Skipped (Duplicates)</div>
                </div>

                <div className="text-center">
                  <span className="font-mono text-xl font-bold text-blue-700">
                    {importSummary.newCustomersCount}
                  </span>
                  <div className="text-[11px] text-gray-600 font-medium">New Customers</div>
                </div>
              </div>

              {/* Skipped notes if any */}
              {importSummary.skipped && importSummary.skipped.length > 0 && (
                <div className="max-w-md mx-auto text-left p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                  <div className="font-bold mb-1">Skipped Invoices (Already in Database):</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importSummary.skipped.slice(0, 3).map((s, idx) => (
                      <li key={idx}>Invoice <span className="font-mono font-bold">{s.invoiceNumber}</span> ({s.customer})</li>
                    ))}
                    {importSummary.skipped.length > 3 && (
                      <li>...and {importSummary.skipped.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onImportSuccess) onImportSuccess(source);
                    handleClose();
                  }}
                  className="px-6 py-2.5 bg-[#151D1C] hover:bg-[#253231] text-white font-bold rounded text-xs shadow-md transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm text-brand-gold">table_view</span>
                  View Receivables Ledger
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportInvoicesModal;
