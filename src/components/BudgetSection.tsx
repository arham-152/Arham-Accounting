import React from 'react';
import { Transaction, CATEGORY_COLORS } from '../types';
import { formatPKR, cn } from '../lib/utils';

interface BudgetSectionProps {
  transactions: Transaction[];
  budgets: Record<string, number>;
  onUpdateBudget: (category: string, amount: number) => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({ transactions, budgets, onUpdateBudget }) => {
  const expenseCategories = ['ENJOYMENT', 'FOOD', 'HOUSE HOLD', 'BILL', 'GROCERY', 'OUT-FITS', 'MISLINIUS'];

  const categorySpending = expenseCategories.map(cat => {
    const spent = transactions
      .filter(t => t.category === cat && t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);
    const limit = budgets[cat] || 0;
    const remaining = limit - spent;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    
    return { cat, spent, limit, remaining, percent };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <div className="lg:col-span-2 dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold mb-0.5">Category-Wise Budgeting</h3>
            <p className="text-[11px] text-gray-500">Track your spending against monthly targets</p>
          </div>
        </div>

        <div className="space-y-6">
          {categorySpending.map(({ cat, spent, limit, remaining, percent }) => (
            <div key={cat} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-200">{cat}</span>
                  <span className="text-[10px] text-gray-500">
                    Spent {formatPKR(spent)} of {limit > 0 ? formatPKR(limit) : 'No Budget'}
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
                      remaining < 0 ? "text-expense" : "text-gray-500"
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
      </div>

      <div className="dashboard-card">
        <h3 className="text-sm font-bold mb-0.5">Manage Targets</h3>
        <p className="text-[11px] text-gray-500 mb-6">Set monthly limits for each category</p>
        
        <div className="space-y-4">
          {expenseCategories.map(cat => (
            <div key={cat} className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{cat}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[11px] font-mono">₨</span>
                <input 
                  type="number" 
                  value={budgets[cat] || ''}
                  onChange={(e) => onUpdateBudget(cat, parseFloat(e.target.value) || 0)}
                  placeholder="Set limit..."
                  className="w-full bg-surface-brighter border border-border-main text-gray-200 text-xs pl-8 pr-3 py-2 rounded-xl outline-none focus:border-accent-gold transition-colors font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
