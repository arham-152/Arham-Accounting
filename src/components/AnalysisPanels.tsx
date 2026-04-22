import React from 'react';
import { Transaction, CATEGORY_COLORS, EXPENSE_CATEGORIES, MONTH_NAMES } from '../types';
import { cn, formatPKR, getPercentage, copyToClipboard } from '../lib/utils';
import { TrendingUp, TrendingDown, Target, Zap, Activity, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisPanelsProps {
  transactions: Transaction[];
  borrowStatus?: 'All' | 'Owed' | 'Gets';
  budgets?: Record<string, number>;
}

export const AnalysisPanels: React.FC<AnalysisPanelsProps> = ({ transactions, borrowStatus = 'All', budgets = {} }) => {
  // Existing Category Analysis
  const catAnalysis = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: transactions.filter(r => r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0),
    count: transactions.filter(r => r.category === cat && r.type === 'CREDIT').length
  })).sort((a, b) => b.total - a.total);

  const maxTotal = catAnalysis[0]?.total || 1;

  // Existing Borrow Ledger
  const borrowLedger = React.useMemo(() => {
    const ledger: Record<string, { g: number; r: number; txns: Transaction[] }> = {};
    transactions.filter(r => r.category === 'BORROW').forEach(r => {
      const name = r.name.replace(/\s*(Rtn|Return|Httc|Previous|Pending)[^,]*/gi, '').trim() || r.name;
      if (!ledger[name]) ledger[name] = { g: 0, r: 0, txns: [] };
      if (r.type === 'CREDIT') ledger[name].g += r.amount;
      else ledger[name].r += r.amount;
      ledger[name].txns.push(r);
    });
    
    return Object.entries(ledger)
      .filter(([_, data]) => {
        const net = data.g - data.r;
        if (net === 0) return false;
        if (borrowStatus === 'Owed' && net <= 0) return false;
        if (borrowStatus === 'Gets' && net >= 0) return false;
        return true;
      })
      .map(([name, data]) => ({
        name,
        g: data.g,
        r: data.r,
        txns: data.txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }))
      .sort((a, b) => (b.g + b.r) - (a.g + a.r))
      .slice(0, 10);
  }, [transactions, borrowStatus]);

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const generateStatement = async (name: string, net: number, txns: Transaction[]) => {
    const history = txns
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => {
        const sign = t.type === 'DEBIT' ? '+' : '-';
        return `- ${t.date}: ${sign}${t.amount.toLocaleString('en-PK')} (${t.name})`;
      }).join('\n');

    const summary = `Fiscal Statement for ${name}\n` +
      `Current Balance: ${net > 0 ? 'OWES' : 'GETS'} ${formatPKR(Math.abs(net))}\n\n` +
      `Complete History (Date Wise):\n` +
      history +
      `\n\nGenerated via Account 2026 Engine`;
    
    const success = await copyToClipboard(summary);
    if (success) {
      setCopiedId(name);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      alert("Failed to copy. Please try again.");
    }
  };

  // Advanced: Financial Health Score
  const healthScore = React.useMemo(() => {
    const income = transactions.filter(r => r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0);
    const expense = transactions.filter(r => r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0);
    
    // Factors:
    // 1. Savings Rate (40%)
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const savingsScore = Math.max(0, Math.min(savingsRate, 1) * 40); // Max 40pts for 25%+ savings
    
    // 2. Budget Adherence (40%)
    let budgetOverages = 0;
    Object.entries(budgets).forEach(([cat, limit]) => {
      const spent = transactions.filter(r => r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0);
      if (spent > limit) budgetOverages++;
    });
    const budgetScore = Math.max(0, 40 - (budgetOverages * 10)); // Lose 10pts per category over budget

    // 3. Borrow Position (20%)
    const borrowNet = transactions.filter(r => r.category === 'BORROW').reduce((s, r) => s + (r.type === 'CREDIT' ? -r.amount : r.amount), 0);
    const borrowScore = borrowNet >= 0 ? 20 : Math.max(0, 20 + (borrowNet / 5000)); // Lose points for net debt

    return Math.round(savingsScore + budgetScore + borrowScore);
  }, [transactions, budgets]);

  // Advanced: Predictive Forecasting (Next Month)
  const forecast = React.useMemo(() => {
    const activeMonths = [...new Set(transactions.map(t => t.month))];
    if (activeMonths.length < 2) return null;

    const monthlyNets = activeMonths.map(m => {
      const inc = transactions.filter(t => t.month === m && t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter(t => t.month === m && t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
      return inc - exp;
    });

    const avgNet = monthlyNets.reduce((s, v) => s + v, 0) / monthlyNets.length;
    return {
      predictedNet: avgNet,
      confidence: activeMonths.length > 3 ? 'High' : 'Moderate'
    };
  }, [transactions]);

  // Advanced: Anomaly & Spike Detection
  const anomalies = React.useMemo(() => {
    const alerts: { cat: string; spike: number }[] = [];
    EXPENSE_CATEGORIES.forEach(cat => {
      const catTxns = transactions.filter(t => t.category === cat && t.type === 'CREDIT');
      if (catTxns.length < 5) return;

      const total = catTxns.reduce((s, t) => s + t.amount, 0);
      const avg = total / catTxns.length;
      
      // Look for any txn that is 50% higher than average
      const spike = catTxns.find(t => t.amount > avg * 1.5);
      if (spike) {
        alerts.push({ cat, spike: ((spike.amount - avg) / avg) * 100 });
      }
    });
    return alerts.slice(0, 3);
  }, [transactions]);

  const insights = React.useMemo(() => {
    const totalExp = transactions.filter(r => r.type === 'CREDIT' && !['BORROW', 'TRANSFER'].includes(r.category)).reduce((s, r) => s + r.amount, 0);
    const activeDays = new Set(transactions.filter(r => r.type === 'CREDIT' && r.date).map(r => r.date)).size || 1;

    return [
      { label: 'Fiscal Health', value: `${healthScore}/100`, sub: healthScore > 80 ? 'Exceptional Performance' : 'Growth Opportunities', icon: <Activity size={14} /> },
      { label: 'Predictive Net', value: forecast ? formatPKR(forecast.predictedNet) : 'Insufficient Data', sub: `Forecasted for next interval (${forecast?.confidence || '—'})`, icon: <TrendingUp size={14} /> },
      { label: 'Burn Velocity', value: formatPKR(totalExp / activeDays), sub: `Daily average liquidation`, icon: <Zap size={14} /> },
      { label: 'Efficiency', value: getPercentage(activeDays, 30), sub: 'Tracking consistency index', icon: <Target size={14} /> },
    ];
  }, [transactions, healthScore, forecast]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {/* Category Intensity */}
      <div className="dashboard-card h-fit">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-sm font-bold text-text-primary">Category Intensity</h3>
          <div className="group/hint relative">
            <Info size={12} className="text-text-muted cursor-help hover:text-accent-gold transition-colors" />
            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/hint:opacity-100 group-hover/hint:visible transition-all z-50 pointer-events-none">
              <p className="text-[9px] text-text-primary leading-relaxed font-medium">
                Plots historical spending volume per category to highlight where your money is most concentrated.
              </p>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-text-muted mb-6">Distribution based on spending volume</p>
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
                <span className="text-[9px] text-text-muted font-mono w-6 text-right">{count}x</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Column: Health & Forecast */}
      <div className="flex flex-col gap-6">
        {/* Health Score Widget */}
        <div className="dashboard-card relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <Activity size={80} />
           </div>
           
           <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">Financial Health Score</h3>
            <div className="group/health relative">
              <Info size={12} className="text-text-muted cursor-help hover:text-accent-gold transition-colors" />
              <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/health:opacity-100 group-hover/health:visible transition-all z-50 pointer-events-none">
                <div className="flex items-center gap-2 mb-2 text-accent-gold">
                  <Zap size={10} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent-gold">Algorithm</span>
                </div>
                <p className="text-[10px] text-text-primary leading-relaxed">
                  A weighted score based on:
                  <br />• 40% Savings Rate
                  <br />• 40% Budget Adherence
                  <br />• 20% Net Debt Position
                </p>
              </div>
            </div>
           </div>
           <p className="text-[10px] text-text-muted mb-6 uppercase tracking-wider">Algorithmic Assessment</p>
           
           <div className="flex items-center justify-center p-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64" cy="64" r="58"
                    stroke="currentColor" strokeWidth="8"
                    fill="transparent" className="text-surface-brighter"
                  />
                  <motion.circle
                    cx="64" cy="64" r="58"
                    stroke="currentColor" strokeWidth="8"
                    strokeDasharray={364.4}
                    initial={{ strokeDashoffset: 364.4 }}
                    animate={{ strokeDashoffset: 364.4 - (364.4 * healthScore) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    fill="transparent"
                    className={cn(
                      "transition-colors",
                      healthScore > 80 ? "text-income" : healthScore > 60 ? "text-accent-gold" : "text-expense"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-text-primary font-mono">{healthScore}</span>
                  <span className="text-[8px] text-text-muted uppercase tracking-widest">Score</span>
                </div>
              </div>
           </div>
           <div className="text-center text-[10px] text-text-muted italic px-4">
              {healthScore > 80 ? "Your fiscal management is top-tier. Keep maintaining these ratios." : "Your score is impacted by savings rates or budget overages."}
           </div>
        </div>

        {/* Predictive Card */}
        <div className="dashboard-card bg-gradient-to-br from-surface to-accent-gold/5 border-accent-gold/20">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Sparkles size={18} className="text-accent-gold" />
               <h3 className="text-sm font-bold text-text-primary">Predictive Outlook</h3>
             </div>
             <div className="group/predict relative">
              <Info size={12} className="text-text-muted cursor-help hover:text-accent-gold transition-colors" />
              <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/predict:opacity-100 group-hover/predict:visible transition-all z-50 pointer-events-none">
                <p className="text-[9px] text-text-primary leading-relaxed font-medium">
                  Uses historical average net balance to forecast your likely liquidity position for the next interval.
                </p>
              </div>
            </div>
           </div>
           {forecast ? (
             <div className="space-y-4">
                <div>
                   <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Estimated Next Month Balance</div>
                   <div className="text-xl font-bold text-accent-gold font-mono">{formatPKR(forecast.predictedNet)}</div>
                </div>
                <div className="p-2.5 bg-accent-gold/10 rounded-xl border border-accent-gold/20">
                   <p className="text-[10px] text-text-secondary leading-relaxed">
                     Based on {forecast.confidence.toLowerCase()} confidence historical patterns, your liquidity is expected to {forecast.predictedNet > 0 ? 'increase' : 'shrink'}.
                   </p>
                </div>
             </div>
           ) : (
             <div className="py-8 text-center text-text-muted text-xs opacity-50">
                Register more data to unlock forecasting.
             </div>
           )}
        </div>
      </div>

      {/* Right Column: Anomalies & Insights */}
      <div className="flex flex-col gap-6">
        {/* Anomaly Alerts */}
        <div className="dashboard-card border-expense/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-expense" />
              <h3 className="text-sm font-bold text-text-primary">Anomalies Detected</h3>
              <div className="group/anomaly relative">
                <Info size={12} className="text-text-muted cursor-help hover:text-accent-gold transition-colors" />
                <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/anomaly:opacity-100 group-hover/anomaly:visible transition-all z-50 pointer-events-none">
                  <p className="text-[9px] text-text-primary leading-relaxed font-medium">
                    Identifies specific transactions that are <span className="text-expense font-bold">50% higher</span> than the historical average for that category.
                  </p>
                </div>
              </div>
            </div>
            <span className="bg-expense/10 text-expense text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{anomalies.length} Alerts</span>
          </div>
          
          <div className="space-y-3">
            {anomalies.length > 0 ? anomalies.map((a, i) => (
              <div key={i} className="flex flex-col gap-1 p-3 bg-expense/5 border border-expense/10 rounded-xl">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">{a.cat} SPIKE</span>
                    <span className="text-[10px] font-mono text-expense">+{a.spike.toFixed(0)}%</span>
                 </div>
                 <p className="text-[9px] text-text-muted leading-tight">Unexpected high-volume activity detected in this category compared to 30-day mean.</p>
              </div>
            )) : (
              <div className="py-6 text-center text-[10px] text-text-muted italic opacity-50">
                No significant spending spikes detected.
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {insights.map((ins, i) => (
            <div key={i} className="bg-surface border border-border-main p-3 rounded-2xl flex flex-col justify-between hover:border-border-hover transition-colors group relative">
              <div className="flex items-center justify-between text-text-muted mb-2 group-hover:text-accent-gold transition-colors">
                <div className="flex items-center gap-2">
                  {ins.icon}
                  <span className="text-[8px] font-bold uppercase tracking-widest">{ins.label}</span>
                </div>
                <div className="group/stat-info relative">
                  <Info size={10} className="cursor-help opacity-50 hover:opacity-100" />
                  <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/stat-info:opacity-100 group-hover/stat-info:visible transition-all z-50 pointer-events-none">
                    <p className="text-[9px] text-text-primary leading-tight lowercase">
                      {ins.label === 'Fiscal Health' ? 'Weighted disciplinary score' :
                       ins.label === 'Predictive Net' ? 'Forecasted balance variance' :
                       ins.label === 'Burn Velocity' ? 'Daily average liquidation rate' :
                       'Tracking consistency index'}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary font-mono">{ins.value}</div>
                <div className="text-[8px] text-text-muted mt-1 leading-tight">{ins.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Borrow Ledger (Full Width) - Only show if has active balances */}
      {borrowLedger.length > 0 && (
        <div className="lg:col-span-3 dashboard-card">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-0.5">Borrow Ledger</h3>
                <p className="text-[11px] text-text-muted">Active relations and outstanding balances</p>
              </div>
              <div className="group/borrow-info relative">
                <Info size={14} className="text-text-muted cursor-help hover:text-accent-gold transition-colors" />
                <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/borrow-info:opacity-100 group-hover/borrow-info:visible transition-all z-50 pointer-events-none">
                  <p className="text-[9px] text-text-primary leading-relaxed font-medium">
                    A net-position summary calculated by subtracting total repayments from total borrowed amounts per person.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-income" />
               <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Sync Active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {borrowLedger.map(({ name, g, r, txns }) => {
              const net = g - r;
              return (
                <div 
                  key={name} 
                  onClick={() => generateStatement(name, net, txns)}
                  className="flex flex-col justify-between gap-3 p-3 bg-surface-brighter border border-border-main rounded-2xl hover:border-accent-gold/40 hover:bg-surface-brightest cursor-pointer transition-all group relative overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity size={40} />
                  </div>
                  
                  <AnimatePresence>
                    {copiedId === name && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-accent-gold/90 flex items-center justify-center z-10"
                      >
                        <span className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1">
                          <Zap size={10} fill="currentColor" /> Copied History
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text-primary group-hover:text-accent-gold transition-colors truncate">{name}</span>
                      <span className="text-[9px] text-text-muted uppercase tracking-tighter mt-0.5">Net Position</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className={cn("text-xs font-mono font-bold", net > 0 ? "text-expense" : "text-income")}>
                      {net > 0 ? 'OWES' : 'GETS'} {formatPKR(Math.abs(net))}
                    </div>
                    <div className="text-[8px] text-text-muted font-mono opacity-50">Total: {formatPKR(g + r)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

