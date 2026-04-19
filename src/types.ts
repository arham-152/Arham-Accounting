/**
 * Core types for the Account 2026 Dashboard.
 */

export type TransactionType = 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'SAVING';

export interface Transaction {
  sr: number;
  date: string;
  rawDate: string;
  name: string;
  amount: number;
  category: string;
  type: TransactionType;
  from: 'CASH' | 'Jazz-Cash' | string;
  to: string;
  notes: string;
  month: string;
  year: string;
}

export interface MonthSummary {
  m: string;
  inc: number;
  exp: number;
  net: number;
  cnt: number;
  topCat: string;
}

export interface Insight {
  label: string;
  value: string | number;
  sub: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  'ENJOYMENT': '#f0b429',
  'FOOD': '#38bdf8',
  'HOUSE HOLD': '#a78bfa',
  'BILL': '#e879f9',
  'GROCERY': '#84cc16',
  'OUT-FITS': '#f97316',
  'BORROW': '#f59e0b',
  'SALARY': '#22c55e',
  'INCOM': '#34d399',
  'MISLINIUS': '#6b7280',
  'Saving': '#818cf8',
  'TRANSFER': '#818cf8',
  'SAVING': '#818cf8',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const EXPENSE_CATEGORIES = [
  'ENJOYMENT', 'FOOD', 'HOUSE HOLD', 'BILL', 'GROCERY', 'OUT-FITS', 'MISLINIUS'
];

export const YEAR_OPTIONS = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface TransactionFilters {
  months: string[];
  year: string;
  category: string;
  type: string;
  channel: string;
  search: string;
}
