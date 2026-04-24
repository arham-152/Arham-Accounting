import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { formatPKR } from '../lib/utils';
import { format } from 'date-fns';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportOptions {
  showDate?: boolean;
  showReference?: boolean;
  showAmount?: boolean;
  showCategory?: boolean;
  showType?: boolean;
  showFromTo?: boolean;
  showNotes?: boolean;
  logoData?: string;
}

export const generatePDFReport = (transactions: Transaction[], title: string, options?: ReportOptions) => {
  const doc = new jsPDF();
  
  // Theme colors
  const BG_COLOR: [number, number, number] = [232, 234, 235];
  const WHITE: [number, number, number] = [255, 255, 255];
  const TEXT_DARK: [number, number, number] = [31, 36, 48];
  const TEXT_MUTED: [number, number, number] = [100, 116, 139];
  const GREEN: [number, number, number] = [46, 125, 50];
  const RED: [number, number, number] = [191, 54, 12];
  
  // Page background
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Header section
  doc.setFillColor(232, 234, 235);
  doc.rect(10, 10, 190, 25, 'F');

  // Logo Logic
  if (options?.logoData) {
    try {
      doc.addImage(options.logoData, 'PNG', 12, 13.5, 18, 18, undefined, 'FAST');
    } catch (e) {
      // Branded placeholder if image fails
      doc.setFillColor(31, 36, 48);
      doc.rect(12, 13.5, 18, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('A', 21, 26, { align: 'center' });
    }
  } else {
    // Default Branded Icon
    doc.setFillColor(31, 36, 48); 
    doc.rect(12, 13.5, 18, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('A', 21, 26, { align: 'center' });
  }

  // App Title
  doc.setTextColor(31, 36, 48); // TEXT_DARK
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT', 35, 23);
  doc.setFontSize(14);
  doc.setTextColor(234, 179, 8); // Gold color
  doc.text('2026', 35, 30);
  
  // Timestamp in header
  doc.setTextColor(100, 116, 139); // TEXT_MUTED
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy, hh:mm a')}`, 195, 22.5, { align: 'right' });
  
  // Report title
  doc.setTextColor(31, 36, 48); // TEXT_DARK
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 15, 48);

  // Summary Metrics
  const credit = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const debit = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const net = debit - credit;
  
  const formatPDFCurrency = (amt: number) => {
    const val = Number(amt) || 0;
    return `Rs ${Math.round(val).toLocaleString()}`;
  };

  // Define column mapping based on options or defaults
  const showDate = options?.showDate !== false;
  const showReference = options?.showReference !== false;
  const showAmount = options?.showAmount !== false;
  const showCategory = options?.showCategory !== false;
  const showType = options?.showType !== false;
  const showFromTo = options?.showFromTo !== false;
  const showNotes = options?.showNotes !== false;

  const headers = [];
  if (showDate) headers.push('Date');
  if (showReference) headers.push('Reference');
  if (showAmount) headers.push('Amount');
  if (showCategory) headers.push('Category');
  if (showType) headers.push('Type');
  if (showFromTo) headers.push('From | To');
  if (showNotes) headers.push('Notes');

  // Table
  const tableData = transactions.map(t => {
    const row = [];
    if (showDate) {
      try {
        const d = new Date(t.date);
        row.push(isNaN(d.getTime()) ? (t.date || '-') : format(d, 'MMM dd'));
      } catch {
        row.push(t.date || '-');
      }
    }
    if (showReference) row.push(t.name);
    if (showAmount) row.push(formatPDFCurrency(t.amount));
    if (showCategory) row.push(t.category);
    if (showType) row.push(t.type);
    if (showFromTo) row.push(`${t.from} | ${t.to}`);
    if (showNotes) row.push(t.notes || '-');
    return row;
  });

  autoTable(doc, {
    startY: 55,
    margin: { left: 10, right: 10 },
    head: [headers],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: [232, 234, 235], 
      textColor: [31, 36, 48], 
      fontSize: 8, 
      fontStyle: 'bold',
      cellPadding: 3
    },
    bodyStyles: { 
      fontSize: 7, 
      cellPadding: 3, 
      textColor: [31, 36, 48] 
    },
    columnStyles: {
      [headers.indexOf('Amount')]: { halign: 'right', fontStyle: 'bold' },
      [headers.indexOf('Type')]: { halign: 'center' }
    },
    didParseCell: (data: any) => {
      // Color Logic: Credit = Red, Debit = Green
      if (data.section === 'body' && headers[data.column.index] === 'Type') {
        const type = data.cell.raw as string;
        if (type === 'CREDIT') {
          data.cell.styles.textColor = RED;
        } else if (type === 'DEBIT') {
          data.cell.styles.textColor = GREEN;
        }
      }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body') {
        const x = Number(data.cell.x);
        const y = Number(data.cell.y);
        const w = Number(data.cell.width);
        const h = Number(data.cell.height);
        
        if (isFinite(x) && isFinite(y) && isFinite(w) && isFinite(h)) {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.1);
          doc.line(x, y + h, x + w, y + h);
        }
      }
    }
  });

  const lastTable = (doc as any).lastAutoTable;
  let finalY = 150;
  if (lastTable && typeof lastTable.finalY === 'number' && isFinite(lastTable.finalY)) {
    finalY = lastTable.finalY + 10;
  }
  
  // Ensure finalY is a safe number
  if (!isFinite(finalY)) finalY = 150;

  // Check if we need a new page for footer
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }
  
  // Footer Summary Card
  doc.setFillColor(232, 234, 235);
  doc.rect(10, finalY, 190, 35, 'F');
  
  doc.setTextColor(31, 36, 48); 
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORY SUMMARY', 15, finalY + 8);
  
  const categoryName = title.split(' ')[0] || 'MASTER';
  doc.setFont('helvetica', 'normal');
  doc.text(categoryName, 15, finalY + 22);
  
  // Totals in footer - precisely positioned to avoid clashing
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // TEXT_MUTED
  doc.text('TOTAL DEBIT', 85, finalY + 10);
  doc.text('TOTAL CREDIT', 140, finalY + 10);
  doc.text('NET POSITION', 195, finalY + 10, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  doc.setTextColor(46, 125, 50); // Green for Debit
  doc.text(formatPDFCurrency(debit), 85, finalY + 22);
  
  doc.setTextColor(191, 54, 12); // Red for Credit
  doc.text(formatPDFCurrency(credit), 140, finalY + 22);

  doc.setTextColor(31, 36, 48); // Dark for Net
  doc.text(formatPDFCurrency(net), 195, finalY + 22, { align: 'right' });

  doc.save(`Financial_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateExcelReport = (transactions: Transaction[], title: string) => {
  const income = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const saving = transactions.filter(t => t.type === 'SAVING').reduce((s, t) => s + t.amount, 0);

  const worksheetData = [
    [title.toUpperCase()],
    [`Generated on ${format(new Date(), 'PPpp')}`],
    [],
    ['SUMMARY'],
    ['Total Income', income],
    ['Total Expense', expense],
    ['Total Savings', saving],
    ['Net Balance', income - expense],
    [],
    ['Date', 'Reference', 'Category', 'Type', 'Amount', 'From', 'To', 'Notes'],
    ...transactions.map(t => [
      t.date,
      t.name,
      t.category,
      t.type,
      t.amount,
      t.from,
      t.to,
      t.notes
    ])
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
  
  // Create XLSX file
  XLSX.writeFile(workbook, `Financial_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
