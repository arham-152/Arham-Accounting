import React, { useMemo, useState } from 'react';
import { Transaction, MONTH_NAMES } from '../types';
import { cn, formatPKR } from '../lib/utils';
import { TrendingUp, TrendingDown, Clock, Target, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialInsightsProps {
  transactions: Transaction[];
  budgets: Record<string, number>;
}

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ transactions, budgets }) => {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const insights = useMemo(() => {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentMonthName = MONTH_NAMES[currentMonthIndex];
    const currentYear = String(now.getFullYear());
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Filter current month expenses
    const monthExpenses = transactions.filter(t => 
      t.month === currentMonthName && 
      t.year === currentYear && 
      t.type === 'CREDIT' && 
      !['BORROW', 'TRANSFER', 'SAVING'].includes((t.category || '').toUpperCase())
    );

    const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const avgDailySpend = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
    const projectedSpent = avgDailySpend * daysInMonth;

    // Budget Comparison
    const totalBudget = (Object.values(budgets) as any[]).reduce((s, b) => s + (Number(b) || 0), 0);
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const daysRemaining = daysInMonth - dayOfMonth;
    const safeDailyLimit = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

    return {
      avgDailySpend,
      projectedSpent,
      totalBudget,
      totalSpent,
      remainingBudget,
      safeDailyLimit,
      daysRemaining,
      dayOfMonth,
      daysInMonth,
      progress: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      currentMonthName
    };
  }, [transactions, budgets]);

  const cards = [
    {
      id: 'daily',
      title: 'Avg Daily Spend',
      icon: <Clock size={20} />,
      value: formatPKR(insights.avgDailySpend),
      suffix: '/ day',
      desc: 'Based on spending behavior so far this month.',
      colorClass: 'accent-gold',
      calculation: [
        { label: 'Total Spent', value: formatPKR(insights.totalSpent) },
        { label: 'Current Day', value: String(insights.dayOfMonth) },
        { label: 'Formula', value: `${formatPKR(insights.totalSpent)} ÷ ${insights.dayOfMonth} days` }
      ]
    },
    {
      id: 'projection',
      title: 'Projected Finish',
      icon: <TrendingUp size={20} />,
      value: formatPKR(insights.projectedSpent),
      suffix: '',
      desc: `Estimated total spend for ${insights.currentMonthName}.`,
      colorClass: insights.projectedSpent > insights.totalBudget && insights.totalBudget > 0 ? 'expense' : 'text-primary',
      calculation: [
        { label: 'Daily Average', value: formatPKR(insights.avgDailySpend) },
        { label: 'Days in Month', value: String(insights.daysInMonth) },
        { label: 'Formula', value: `${formatPKR(insights.avgDailySpend)} × ${insights.daysInMonth} days` }
      ]
    },
    {
      id: 'safe',
      title: 'Safe Daily Limit',
      icon: <Target size={20} />,
      value: formatPKR(insights.safeDailyLimit),
      suffix: '/ day left',
      desc: 'Max daily spend to stay under total budget.',
      colorClass: 'income',
      calculation: [
        { label: 'Remaining Budget', value: formatPKR(insights.remainingBudget) },
        { label: 'Days Left', value: String(insights.daysRemaining) },
        { label: 'Formula', value: `${formatPKR(insights.remainingBudget)} ÷ ${insights.daysRemaining} days` }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <motion.div 
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-surface-brighter border border-border-main rounded-2xl p-6 relative overflow-hidden group transition-all h-[180px]",
            activeInfo === card.id ? `border-${card.id === 'daily' ? 'accent-gold' : card.id === 'safe' ? 'income' : 'expense'}/50` : `hover:border-${card.id === 'daily' ? 'accent-gold' : card.id === 'safe' ? 'income' : 'expense'}/30`
          )}
        >
          {/* Main Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("flex items-center gap-3")}>
                <div className={cn("p-2 rounded-xl bg-opacity-10", `bg-${card.id === 'daily' ? 'accent-gold' : card.id === 'safe' ? 'income' : 'expense'} text-${card.id === 'daily' ? 'accent-gold' : card.id === 'safe' ? 'income' : 'expense'}`)}>
                  {card.icon}
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{card.title}</h3>
              </div>
              
              <button 
                onClick={() => setActiveInfo(activeInfo === card.id ? null : card.id)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  activeInfo === card.id ? "bg-surface text-accent-gold" : "text-text-muted hover:bg-surface hover:text-text-primary"
                )}
              >
                {activeInfo === card.id ? <X size={14} /> : <Info size={14} />}
              </button>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn(
                "text-3xl font-display font-black tracking-tighter",
                card.id === 'projection' && insights.projectedSpent > insights.totalBudget && insights.totalBudget > 0 ? "text-expense" : "text-text-primary",
                card.id === 'safe' && "text-income"
              )}>
                {card.value}
              </span>
              <span className="text-[10px] text-text-muted font-bold uppercase">{card.suffix}</span>
            </div>
            <p className="text-[10px] text-text-muted font-medium italic">
              {card.desc}
            </p>
          </div>

          {/* Info/Calculation Overlay */}
          <AnimatePresence>
            {activeInfo === card.id && (
              <motion.div 
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                onClick={() => setActiveInfo(null)}
                className="absolute inset-0 bg-surface-brightest z-20 p-5 flex flex-col cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4 border-b border-border-main/50 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent-gold">Detailed Calculation</span>
                  <div className="p-1.5 bg-surface rounded-lg text-text-muted">
                    <X size={12} />
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  {card.calculation.map((calc, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{calc.label}</span>
                      <span className={cn("text-[11px] font-mono font-bold", i === card.calculation.length - 1 ? "text-accent-gold" : "text-text-primary")}>
                        {calc.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border-main/50 flex flex-col items-center gap-2">
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Live System Data</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveInfo(null);
                    }}
                    className="w-full py-2 bg-surface hover:bg-surface-brighter border border-border-main rounded-xl text-[9px] font-black uppercase tracking-widest text-text-primary transition-all"
                  >
                    Close Details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative Background Icon */}
          <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-text-primary group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            {React.cloneElement(card.icon as React.ReactElement, { size: 100 })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
