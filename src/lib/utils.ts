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

/**
 * Robust clipboard copy with fallback for iframes and non-secure contexts.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern API first
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      console.log('Clipboard Copy: Navigator API successful');
      return true;
    }
  } catch (err) {
    console.warn('Clipboard Copy: Navigator API failed, trying fallback', err);
  }

  // Fallback: create temporary textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure textarea is not visible but part of the document
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    textArea.style.opacity = "0";
    textArea.setAttribute('readonly', ''); // Prevent keyboard on mobile
    
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      console.log('Clipboard Copy: Fallback execCommand successful');
    } else {
      console.warn('Clipboard Copy: Fallback execCommand failed');
    }
    return successful;
  } catch (err) {
    console.error('Clipboard Copy: Total failure', err);
    return false;
  }
}
