import React from 'react';
import { Transaction, CATEGORY_COLORS } from '../types';
import { formatPKR, cn } from '../lib/utils';
import { Info, Zap } from 'lucide-react';

interface BudgetSectionProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  budgets: Record<string, number>;
  onUpdateBudget: (category: string, amount: number) => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({ transactions, allTransactions, budgets, onUpdateBudget }) => {
  const expenseCategories = ['ENJOYMENT', 'FOOD', 'HOUSE HOLD', 'BILL', 'GROCERY', 'OUT-FITS', 'MISLINIUS'];

  // Calculate 3-month average for each category based on the 3 full months PRECEDING the current month
  // We use allTransactions to look back properly even if global filters are applied
  const averages = React.useMemo(() => {
    if (allTransactions.length === 0) return {};

    // Use the latest transaction date as anchor
    const sortedTxns = [...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestDateStr = sortedTxns.length > 0 ? sortedTxns[0].date : new Date().toISOString();
    const latestDate = new Date(latestDateStr);
    
    // Set anchor to first day of the CURRENT month (e.g., April 1st)
    // This ensures we look back at the 3 COMPLETED months (Jan, Feb, Mar)
    const anchorDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    
    // Look back exactly 3 months from the start of the current month
    const threeMonthsAgo = new Date(anchorDate);
    threeMonthsAgo.setMonth(anchorDate.getMonth() - 3);

    const result: Record<string, number> = {};
    
    expenseCategories.forEach(cat => {
      const catTxns = allTransactions.filter(t => 
        t.category === cat && 
        t.type === 'CREDIT' && 
        new Date(t.date) >= threeMonthsAgo && 
        new Date(t.date) < anchorDate
      );

      // Group by month to get totals for each of the 3 specified months
      const monthlyTotals: Record<string, number> = {};
      catTxns.forEach(t => {
        const monthKey = t.date.substring(0, 7); // YYYY-MM
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + t.amount;
      });

      // User wants (Month1 + Month2 + Month3) / 3
      // We sum all spending in that 90-day window and divide by 3
      const totalInWindow = catTxns.reduce((sum, t) => sum + t.amount, 0);
      result[cat] = totalInWindow / 3;
    });

    return result;
  }, [transactions, allTransactions]);

  const categorySpending = expenseCategories.map(cat => {
    const spent = transactions
      .filter(t => t.category === cat && t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);
    const manualLimit = budgets[cat] || 0;
    const fallbackLimit = averages[cat] || 0;
    const limit = manualLimit > 0 ? manualLimit : fallbackLimit;
    const isFallback = manualLimit === 0 && fallbackLimit > 0;
    
    const remaining = limit - spent;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    
    return { cat, spent, limit, remaining, percent, isFallback };
  });

  const totals = React.useMemo(() => {
    const totalSpent = categorySpending.reduce((sum, c) => sum + c.spent, 0);
    const totalBudgets = expenseCategories.reduce((sum, cat) => sum + (budgets[cat] || 0), 0);
    const totalAvg = expenseCategories.reduce((sum, cat) => sum + (averages[cat] || 0), 0);
    return { totalSpent, totalBudgets, totalAvg };
  }, [categorySpending, budgets, averages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <div className="lg:col-span-2 dashboard-card flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 group/info relative">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold mb-0.5">Category-Wise Budgeting</h3>
                <div className="cursor-help text-text-muted hover:text-accent-gold transition-colors">
                  <Info size={14} />
                </div>
              </div>
              <p className="text-[11px] text-text-muted">Track your spending against monthly targets</p>
            </div>

            {/* Budget Info Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-72 p-4 bg-surface-brightest border border-border-main rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-accent-gold" />
                <span className="text-[10px] uppercase font-black text-accent-gold tracking-widest">Budget Logic</span>
              </div>
              <p className="text-[11px] text-text-primary leading-relaxed">
                Tracks current month spending per category. 
                <br /><br />
                <span className="text-income font-bold">Green:</span> Under 85% of limit.
                <br />
                <span className="text-borrow font-bold">Yellow:</span> Over 85% of limit.
                <br />
                <span className="text-expense font-bold">Red:</span> Over-budget.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {categorySpending.map(({ cat, spent, limit, remaining, percent, isFallback }) => (
            <div key={cat} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">{cat}</span>
                  <span className="text-[10px] text-text-muted">
                    Spent {formatPKR(spent)} of {limit > 0 ? formatPKR(limit) : 'No Budget'}
                    {isFallback && <span className="ml-1 text-[8px] font-bold text-accent-gold/60 uppercase tracking-tighter">(3-mo avg)</span>}
                  </span>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-xs font-mono font-bold",
                    percent > 100 ? "text-expense" : percent > 85 ? "text-borrow" : "text-income"
                  )}>
                    {percent.toFixed(0)}%
                  </span>
                  {limit > 0 && (
                    <div className={cn(
                      "text-[9px] font-mono",
                      remaining < 0 ? "text-expense" : "text-text-muted"
                    )}>
                      {remaining < 0 ? `Over by ${formatPKR(Math.abs(remaining))}` : `${formatPKR(remaining)} left`}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-2 bg-surface-brighter rounded-full overflow-hidden border border-border-main/50">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    percent > 100 ? "bg-expense shadow-[0_0_8px_rgba(239,68,68,0.4)]" : 
                    percent > 85 ? "bg-borrow" : "bg-income"
                  )}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary Footer */}
        <div className="mt-8 pt-6 border-t border-border-main/50 flex justify-between items-center bg-surface-brighter/30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-4 rounded-b-3xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[2px]">Total Monthly Flow</span>
            <span className="text-[9px] text-text-muted/60">Comprehensive category aggregate</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-black font-mono text-accent-gold">
              {formatPKR(totals.totalSpent)}
            </div>
            <div className="text-[9px] text-text-muted font-bold uppercase tracking-tight">
              sum of total spending in current month
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card flex flex-col">
        <h3 className="text-sm font-bold mb-0.5">Manage Targets</h3>
        <p className="text-[11px] text-text-muted mb-6">Set monthly limits for each category</p>
        
        <div className="space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4 pb-2 border-b border-border-main">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Manual Setup</span>
            <div className="group/avg relative">
              <div className="flex items-center gap-1 cursor-help">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">3-Month Avg</span>
                <Info size={10} className="text-text-muted group-hover/avg:text-accent-gold" />
              </div>
              {/* Avg Logic Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/avg:opacity-100 group-hover/avg:visible transition-all z-50 pointer-events-none">
                <p className="text-[9px] text-text-primary leading-relaxed font-medium">
                  The <span className="text-accent-gold font-bold">3-Month Avg</span> is calculated by looking at the total spending of the 3 <span className="italic">previous full months</span> and dividing by 3.
                </p>
              </div>
            </div>
          </div>

          {expenseCategories.map(cat => (
            <div key={cat} className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{cat}</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[11px] font-mono">₨</span>
                  <input 
                    type="number" 
                    value={budgets[cat] || ''}
                    onChange={(e) => onUpdateBudget(cat, parseFloat(e.target.value) || 0)}
                    placeholder="Set limit..."
                    className="w-full bg-surface-brighter border border-border-main text-text-primary text-xs pl-8 pr-3 py-2 rounded-xl outline-none focus:border-accent-gold transition-colors font-mono"
                  />
                </div>
                <div className="bg-surface-brighter border border-border-main rounded-xl px-3 py-2 flex items-center">
                  <span className="text-xs font-bold text-accent-gold font-mono truncate">{formatPKR(averages[cat])}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Manage Targets Summary Footer */}
        <div className="mt-8 pt-6 border-t border-border-main/50 space-y-4 bg-surface-brighter/30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-4 rounded-b-3xl">
          <div className="flex justify-between items-end border-b border-border-main/30 pb-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Manual Total</span>
              <div className="text-xs font-bold text-text-primary font-mono">{formatPKR(totals.totalBudgets)}</div>
            </div>
            <div className="text-[8px] text-text-muted font-bold uppercase tracking-tighter text-right w-1/2 leading-tight">
              sum of monthly set budget (manual setup)
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Average Total</span>
              <div className="text-xs font-bold text-accent-gold font-mono">{formatPKR(totals.totalAvg)}</div>
            </div>
            <div className="text-[8px] text-text-muted font-bold uppercase tracking-tighter text-right w-1/2 leading-tight">
              sum of three months average
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
