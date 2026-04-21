import Papa from 'papaparse';
import { Transaction, MONTH_NAMES, TransactionType } from '../types';

/**
 * Parses raw date string into a standardized date string (YYYY-MM-DD).
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle DD-MonthName-YYYY format (e.g., 1-Jan-2026)
  const match = dateStr.match(/(\d+)-([A-Za-z]+)-(\d+)/);
  if (match) {
    let year = match[3];
    // Keep the specific business logic for typo correction if needed
    if (year === '2029') year = '2026';
    
    const monthName = match[2].toLowerCase();
    const day = match[1].padStart(2, '0');
    
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(monthName));
    if (monthIndex !== -1) {
      const month = String(monthIndex + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback for other formats, still try to avoid UTC shifts
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return dateStr;
  }
}

/**
 * Gets month name from standardized date string (YYYY-MM-DD).
 */
function getMonthName(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1]) - 1;
    return MONTH_NAMES[monthIdx] || '';
  }
  return '';
}

/**
 * Parses CSV text into Transaction objects.
 */
export function parseTransactionData(csvText: string): Transaction[] {
  if (!csvText || csvText.trim().length < 10) return [];

  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Try to find the header row if it's not the first line
  let headerIndex = -1;
  const headerKeywords = ['DATE', 'NAME', 'AMOUNT', 'SR'];
  
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toUpperCase();
    if (headerKeywords.some(key => line.includes(key))) {
      headerIndex = i;
      break;
    }
  }

  const effectiveCsv = headerIndex !== -1 ? lines.slice(headerIndex).join('\n') : csvText;

  const result = Papa.parse(effectiveCsv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const data = (result.data as any[]).map((row, i) => {
    // Column Mapping (Incase of shifted names or extra spaces)
    const getVal = (keys: string[]) => {
      // First try exact or case-insensitive match on the keys provided
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) return row[k];
        
        // Try to find a key in the row that matches (trimmed and case-insensitive)
        const rowKeys = Object.keys(row);
        const match = rowKeys.find(rk => 
          rk.trim().toUpperCase() === k.toUpperCase()
        );
        if (match) return row[match];
      }
      return '';
    };

    const amountRaw = String(getVal(['AMOUNT', 'Amount', 'AMT']) || 0);
    const amount = parseFloat(amountRaw.replace(/[^\d.]/g, '')) || 0;
    
    const rawDate = String(getVal(['DATE', 'Date']) || '');
    const date = normalizeDate(rawDate);
    
    let category = String(getVal(['CATEGORY', 'Category']) || '').trim();
    const catUp = category.toUpperCase();
    if (catUp === 'SAVING' || catUp === 'SAVINGS') {
      category = 'Saving';
    } else {
      category = catUp || 'MISLINIUS';
    }
    
    const type = (String(getVal(['TYPE', 'Type']) || '').trim().toUpperCase() || 'DEBIT') as TransactionType;
    const fromRaw = (String(getVal(['FROM', 'From', 'FRO']) || '').trim().toLowerCase());
    let from: string = 'OTHER';
    if (fromRaw.includes('jazz')) {
      from = 'Jazz-Cash';
    } else if (fromRaw.includes('cash')) {
      from = 'CASH';
    } else if (fromRaw.length > 0) {
      from = fromRaw.toUpperCase();
    }

    const toRaw = (String(getVal(['TO', 'To']) || '').trim().toLowerCase());
    let to: string = 'OTHER';
    if (toRaw.includes('jazz')) {
      to = 'Jazz-Cash';
    } else if (toRaw.includes('cash')) {
      to = 'CASH';
    } else if (toRaw.length > 0) {
      to = toRaw.toUpperCase();
    }
    
    const notesKeys = ['NOTES', 'Notes', 'REMARK', 'REMARKS', 'META', 'DETAILS'];
    let notes = String(getVal(notesKeys) || '').trim();
    
    // Fallback: If notes specifically are empty but there's an orphan 9th column (index 8) 
    // This happens when cell I1 is empty but column I has data.
    if (!notes) {
      const rowKeys = Object.keys(row);
      if (rowKeys.length >= 9) {
        // Find the 9th key (index 8)
        const orphanKey = rowKeys[8];
        const orphanVal = String(row[orphanKey] || '').trim();
        if (orphanVal) {
          notes = orphanVal;
        }
      }
    }
    
    return {
      sr: parseInt(getVal(['SR', 'Sr', 'SERIAL', '#'])) || i + 1,
      date,
      rawDate,
      name: (String(getVal(['NAME', 'Name', 'REFERENCE', 'DESCRIPTION']) || '').trim()),
      amount,
      category,
      type,
      from,
      to,
      notes,
      month: getMonthName(date),
      year: date ? date.split('-')[0] : '',
    };
  });

  return data.filter(r => r.name && r.amount > 0);
}

/**
 * Extracts a Google Sheets ID and GID from a shareable link.
 */
export function extractSheetInfo(url: string): { id: string | null; gid: string | null } {
  if (!url) return { id: null, gid: '0' };
  
  // Clean URL
  const cleanUrl = url.trim();
  
  // Support both full URL and just the ID
  // Pattern 1: /d/ID/ (Standard)
  // Pattern 2: /u/X/d/ID/ (Multiple accounts)
  const idMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = cleanUrl.match(/[#?&]gid=([0-9]+)/);
  
  let id = idMatch ? idMatch[1] : null;
  
  // Pattern 3: Direct ID if 20+ chars and alphanumeric-ish
  if (!id && /^[a-zA-Z0-9-_]{20,}$/.test(cleanUrl)) {
    id = cleanUrl;
  }
  
  return {
    id,
    gid: gidMatch ? gidMatch[1] : '0'
  };
}

/**
 * Constructs a CSV export URL for a Google Sheet.
 */
export function getGoogleSheetCsvUrl(id: string, gid: string = '0', range?: string, sheetName?: string): string {
  // If a range or sheet name is provided, use the Visualization API endpoint which is more robust for specific extractions
  if (range || (sheetName && sheetName !== 'Sheet1' && sheetName !== 'DashBoard')) {
    const sheetPart = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : `&gid=${gid}`;
    const rangePart = range ? `&range=${range}` : '';
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${sheetPart}${rangePart}`;
  }
  
  // Default export for the whole sheet/tab
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}
