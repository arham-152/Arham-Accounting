import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes with clsx logic.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as PKR currency.
 */
export function formatPKR(amount: number): string {
  return '₨ ' + Math.round(amount || 0).toLocaleString('en-PK');
}

/**
 * Calculates percentage.
 */
export function getPercentage(part: number, total: number): string {
  if (!total) return '0%';
  return ((part / total) * 100).toFixed(1) + '%';
}
