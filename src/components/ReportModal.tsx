import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Calendar, Download, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: Transaction[], title: string, format: 'PDF' | 'EXCEL') => void;
  transactions: Transaction[];
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onGenerate, transactions }) => {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  const handleGenerate = (format: 'PDF' | 'EXCEL') => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    const filtered = transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });
    });

    if (filtered.length === 0) {
      setError('No transactions found in this date range.');
      return;
    }

    const title = `Financial Report (${startDate} to ${endDate})`;
    onGenerate(filtered, title, format);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-border-hover w-full max-w-md rounded-2xl p-6 sm:p-8 relative shadow-2xl z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-accent-gold" size={24} />
              <h2 className="text-xl font-bold font-display text-text-primary">Generate Report</h2>
            </div>
            
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Select a custom date range to export your financial data.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-brighter border border-border-main text-text-primary text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-accent-gold transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface-brighter border border-border-main text-text-primary text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-accent-gold transition-colors"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-expense text-[11px] font-bold mb-4">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleGenerate('PDF')}
                className="flex items-center justify-center gap-2 bg-accent-gold text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-all active:scale-95 shadow-lg shadow-accent-gold/10"
              >
                <FileText size={16} />
                <span>PDF Report</span>
              </button>
              <button 
                onClick={() => handleGenerate('EXCEL')}
                className="flex items-center justify-center gap-2 border border-border-main bg-surface-brighter text-text-secondary py-3 rounded-xl font-bold text-sm hover:border-accent-gold hover:text-text-primary transition-all active:scale-95"
              >
                <Download size={16} />
                <span>Excel Export</span>
              </button>
            </div>
            
            <div className="mt-6 text-[10px] text-text-muted font-mono text-center italic">
              Processing data locally for maximum security.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
