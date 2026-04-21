import React from 'react';
import { Transaction } from '../types';
import { formatPKR, cn, copyToClipboard } from '../lib/utils';
import { RefreshCw, Calendar, AlertCircle, ChevronRight, Zap } from 'lucide-react';
import { format, addMonths, parseISO, isBefore, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface RecurringBillsProps {
  transactions: Transaction[];
}

export const RecurringBills: React.FC<RecurringBillsProps> = ({ transactions }) => {
  const [copiedId, setCopiedId] = React.useState<number | null>(null);
  // Logic to detect recurring transactions (same amount, similar name, across different months)
  const recurring = React.useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'CREDIT' && !['BORROW', 'TRANSFER'].includes(t.category));
    const grouped = expenses.reduce((acc, t) => {
      const key = `${t.name.toLowerCase().trim()}_${t.amount}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const values = Object.values(grouped) as Transaction[][];

    return values
      .filter(list => {
        const uniqueMonths = new Set(list.map(t => t.month)).size;
        return uniqueMonths >= 2; // Seen in at least 2 different months
      })
      .map(list => {
        const last = [...list].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
        const nextDate = addMonths(parseISO(last.date), 1);
        const isUpcoming = isAfter(nextDate, new Date());
        
        return {
          name: last.name,
          amount: last.amount,
          category: last.category,
          lastDate: last.date,
          nextDate: format(nextDate, 'yyyy-MM-dd'),
          isUpcoming
        };
      })
      .sort((a, b) => parseISO(a.nextDate).getTime() - parseISO(b.nextDate).getTime());
  }, [transactions]);

  const totalMonthlyBurn = recurring.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="dashboard-card flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-0.5">Recurring Subscriptions</h3>
          <p className="text-[11px] text-text-muted">Managed active commitments and fixed costs</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-expense font-mono">{formatPKR(totalMonthlyBurn)}</div>
          <div className="text-[9px] text-text-muted uppercase tracking-widest">Monthly Committed Burn</div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {recurring.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-text-muted opacity-40">
            <RefreshCw size={18} className="mb-1" />
            <p className="text-[10px]">No recurring patterns detected yet.</p>
          </div>
        ) : (
          recurring.map((bill, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-surface-brighter border border-border-main rounded-2xl hover:border-border-hover transition-all group relative overflow-hidden">
              <AnimatePresence>
                {copiedId === i && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-accent-gold/90 flex items-center justify-center z-10"
                  >
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1">
                      <Zap size={10} fill="currentColor" /> Copied Info
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3">
                <button 
                  onClick={async () => {
                    const info = `Subscription: ${bill.name}\nAmount: ${formatPKR(bill.amount)}\nNext Due: ${format(parseISO(bill.nextDate), 'MMM dd, yyyy')}`;
                    const success = await copyToClipboard(info);
                    if (success) {
                      setCopiedId(i);
                      setTimeout(() => setCopiedId(null), 2000);
                    } else {
                      alert("Failed to copy. Please try again.");
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-surface border border-border-main flex items-center justify-center text-text-secondary hover:text-accent-gold hover:border-accent-gold/40 hover:bg-surface-brightest transition-all active:scale-90"
                  title="Copy Next Payment Info"
                >
                  <RefreshCw size={16} />
                </button>
                <div>
                  <h4 className="text-xs font-bold text-text-primary truncate max-w-[120px]">{bill.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Calendar size={10} className="text-text-muted" />
                    <span className="text-[9px] text-text-muted font-mono uppercase">Next: {format(parseISO(bill.nextDate), 'MMM dd')}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="text-xs font-bold text-text-primary font-mono">{formatPKR(bill.amount)}</div>
                  {bill.isUpcoming && (
                    <div className="flex items-center justify-end gap-1 text-[9px] text-accent-gold font-bold uppercase tracking-tighter">
                      <AlertCircle size={8} />
                      Upcoming
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border-main">
         <div className="flex items-center gap-2 text-[10px] text-text-muted italic">
            <AlertCircle size={12} className="text-accent-gold" />
            <span>AI automatically identifies recurring patterns in your ledger history.</span>
         </div>
      </div>
    </div>
  );
};
