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

export const generatePDFReport = (transactions: Transaction[], title: string) => {
  const doc = new jsPDF();
  
  // Theme colors
  const ACCENT_COLOR: [number, number, number] = [240, 180, 41]; // Gold
  const DARK_COLOR: [number, number, number] = [10, 12, 16];
  
  // Header
  doc.setFillColor(...DARK_COLOR);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT 2026', 15, 20);
  
  doc.setTextColor(...ACCENT_COLOR);
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 15, 30);
  
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${format(new Date(), 'PPpp')}`, 140, 30);

  // Summary Metrics
  const income = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  
  // Table
  const tableData = transactions.map(t => [
    t.date,
    t.name,
    t.category,
    t.type,
    t.from,
    t.to,
    formatPKR(t.amount)
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Date', 'Reference', 'Category', 'Type', 'From', 'To', 'Amount']],
    body: tableData,
    headStyles: { fillColor: [31, 36, 48], textColor: [232, 234, 240], fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      6: { halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: (data: any) => {
      // Custom footer or padding if needed
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY + 10 || 150;
  
  doc.setTextColor(...DARK_COLOR);
  doc.setFontSize(10);
  doc.text(`Total Transactions: ${transactions.length}`, 15, finalY);
  doc.text(`Total Income: ${formatPKR(income)}`, 15, finalY + 5);
  doc.text(`Total Expense: ${formatPKR(expense)}`, 15, finalY + 10);
  const saving = transactions.filter(t => t.type === 'SAVING').reduce((s, t) => s + t.amount, 0);
  doc.text(`Total Savings: ${formatPKR(saving)}`, 15, finalY + 15);
  doc.text(`Net: ${formatPKR(income - expense)}`, 15, finalY + 20);

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
