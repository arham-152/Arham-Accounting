import React from 'react';
import { Transaction, CATEGORY_COLORS, EXPENSE_CATEGORIES, MONTH_NAMES } from '../types';
import { cn, formatPKR, getPercentage } from '../lib/utils';
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

interface AnalysisPanelsProps {
  transactions: Transaction[];
  borrowStatus?: 'All' | 'Owed' | 'Gets';
}

export const AnalysisPanels: React.FC<AnalysisPanelsProps> = ({ transactions, borrowStatus = 'All' }) => {
  const catAnalysis = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: transactions.filter(r => r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0),
    count: transactions.filter(r => r.category === cat && r.type === 'CREDIT').length
  })).sort((a, b) => b.total - a.total);

  const maxTotal = catAnalysis[0]?.total || 1;

  const borrowLedger = React.useMemo(() => {
    const ledger: Record<string, { g: number; r: number }> = {};
    transactions.filter(r => r.category === 'BORROW').forEach(r => {
      const name = r.name.replace(/\s*(Rtn|Return|Httc|Previous|Pending)[^,]*/gi, '').trim() || r.name;
      if (!ledger[name]) ledger[name] = { g: 0, r: 0 };
      if (r.type === 'CREDIT') ledger[name].g += r.amount;
      else ledger[name].r += r.amount;
    });
    
    return Object.entries(ledger)
      .filter(([_, data]) => {
        const net = data.g - data.r;
        if (net === 0) return false;
        if (borrowStatus === 'Owed' && net <= 0) return false;
        if (borrowStatus === 'Gets' && net >= 0) return false;
        return true;
      })
      .sort((a, b) => (b[1].g + b[1].r) - (a[1].g + a[1].r))
      .slice(0, 10);
  }, [transactions, borrowStatus]);

  const monthlySummaries = React.useMemo(() => {
    const activeMonths = MONTH_NAMES.filter(m => transactions.some(r => r.month === m));
    return activeMonths.map(m => {
      const inc = transactions.filter(r => r.month === m && r.type === 'DEBIT' && ['SALARY', 'INCOM'].includes(r.category)).reduce((s, r) => s + r.amount, 0);
      const exp = transactions.filter(r => r.month === m && r.type === 'CREDIT' && !['BORROW', 'TRANSFER'].includes(r.category)).reduce((s, r) => s + r.amount, 0);
      const topCat = EXPENSE_CATEGORIES.map(cat => ({
        cat,
        s: transactions.filter(r => r.month === m && r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0)
      })).sort((a, b) => b.s - a.s)[0]?.cat || '—';
      return { m, inc, exp, net: inc - exp, topCat };
    });
  }, [transactions]);

  const insights = React.useMemo(() => {
    const totalExp = transactions.filter(r => r.type === 'CREDIT' && !['BORROW', 'TRANSFER'].includes(r.category)).reduce((s, r) => s + r.amount, 0);
    const activeDays = new Set(transactions.filter(r => r.type === 'CREDIT' && r.date).map(r => r.date)).size || 1;
    const bigTxn = [...transactions].sort((a, b) => b.amount - a.amount)[0] || { name: '—', amount: 0 };

    return [
      { label: 'Avg Daily Spend', value: formatPKR(totalExp / activeDays), sub: `Across ${activeDays} tracking days`, icon: <Zap size={14} /> },
      { label: 'Biggest Velocity', value: bigTxn.name.slice(0, 20), sub: formatPKR(bigTxn.amount), icon: <TrendingUp size={14} /> },
      { label: 'Efficiency Score', value: getPercentage(activeDays, 30), sub: 'Monthly activity consistency', icon: <Target size={14} /> },
      { label: 'Burn Rate', value: formatPKR(totalExp), sub: 'Current filtered volume', icon: <TrendingDown size={14} /> },
    ];
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div className="dashboard-card h-fit">
        <h3 className="text-sm font-bold mb-0.5">Category Intensity</h3>
        <p className="text-[11px] text-gray-500 mb-6">Distribution based on spending volume</p>
        <div className="space-y-4">
          {catAnalysis.map(({ cat, total, count }) => (
            <div key={cat} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-text-primary">{cat}</span>
                <span className="font-mono text-accent-gold">{formatPKR(total)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-surface-brighter rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${(total / maxTotal * 100).toFixed(1)}%`,
                      backgroundColor: CATEGORY_COLORS[cat] || '#888'
                    }}
                  />
                </div>
                <span className="text-[9px] text-gray-600 font-mono w-6 text-right">{count}x</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-card h-fit">
        <h3 className="text-sm font-bold mb-0.5">Borrow Ledger</h3>
        <p className="text-[11px] text-gray-500 mb-6">Active relations and outstanding balances</p>
        <div className="space-y-2">
          {borrowLedger.map(([name, { g, r }]) => {
            const net = g - r;
            return (
              <div key={name} className="flex justify-between items-center p-3 bg-surface-brighter border border-border-main rounded-xl hover:border-border-hover transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">{name}</span>
                  <div className="flex gap-3 text-[9px] font-mono mt-0.5">
                    <span className="text-text-muted">Activity: {formatPKR(g + r)}</span>
                  </div>
                </div>
                <div className={cn("text-xs font-mono font-bold", net > 0 ? "text-expense" : "text-income")}>
                  {net > 0 ? 'OWES' : 'GETS'} {formatPKR(Math.abs(net))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dashboard-card h-fit">
          <h3 className="text-sm font-bold mb-0.5">Monthly Financial Flow</h3>
          <p className="text-[11px] text-gray-500 mb-6">Comparative view of month-over-month results</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-border-main">
                  <th className="pb-3 px-2">Month</th>
                  <th className="pb-3 px-2">Income</th>
                  <th className="pb-3 px-2">Spend</th>
                  <th className="pb-3 px-2">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/50">
                {monthlySummaries.map(row => (
                  <tr key={row.m} className="group hover:bg-surface-brighter">
                    <td className="py-2.5 px-2 font-bold text-text-secondary group-hover:text-text-primary">{row.m.slice(0, 3)}</td>
                    <td className="py-2.5 px-2 font-mono text-income">{formatPKR(row.inc)}</td>
                    <td className="py-2.5 px-2 font-mono text-expense">{formatPKR(row.exp)}</td>
                    <td className={cn("py-2.5 px-2 font-mono font-bold", row.net >= 0 ? "text-teal-main" : "text-expense")}>
                      {formatPKR(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      <div className="dashboard-card h-fit flex flex-col">
        <h3 className="text-sm font-bold mb-0.5">Financial Insights</h3>
        <p className="text-[11px] text-gray-500 mb-6">Algorithmic markers and performance snapshots</p>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {insights.map((ins, i) => (
            <div key={i} className="bg-surface-brighter border border-border-main p-4 rounded-xl">
              <div className="flex items-center gap-2 text-text-muted mb-1">
                {ins.icon}
                <span className="text-[9px] font-bold uppercase tracking-wider">{ins.label}</span>
              </div>
              <div className="text-sm font-bold text-accent-gold font-mono">{ins.value}</div>
              <div className="text-[10px] text-text-muted mt-1 leading-tight">{ins.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
