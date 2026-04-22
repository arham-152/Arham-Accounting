import React, { useState, useMemo, useDeferredValue } from 'react';
import { Transaction, CATEGORY_COLORS } from '../types';
import { cn, formatPKR } from '../lib/utils';
import { Search, ChevronDown, ChevronUp, X, ExternalLink, Calendar, Hash, Tag, ArrowUpRight, ArrowDownRight, Wallet, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionDetailModal: React.FC<{
  transaction: Transaction | null;
  onClose: () => void;
}> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const typeColor = transaction.type === 'DEBIT' ? 'text-income' : transaction.type === 'CREDIT' ? 'text-expense' : 'text-saving';
  const typeBg = transaction.type === 'DEBIT' ? 'bg-income/10' : transaction.type === 'CREDIT' ? 'bg-expense/10' : 'bg-saving/10';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface border border-border-main rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-main flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-display font-extrabold tracking-tight">Transaction details</h3>
              <p className="text-xs text-text-muted font-mono">Reference ID: #{transaction.sr}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-brighter rounded-full transition-colors text-text-muted hover:text-text-primary"
            >
              <X size={20} />
            </button>
          </div>

          {/* Amount Section */}
          <div className={cn("p-8 text-center flex flex-col items-center gap-2", typeBg)}>
             <span className={cn("text-[10px] font-black uppercase tracking-[3px]", typeColor)}>
               {transaction.type} Transaction
             </span>
             <h2 className={cn("text-4xl font-display font-black tracking-tighter", typeColor)}>
               {formatPKR(transaction.amount)}
             </h2>
             <p className="text-sm font-medium text-text-muted max-w-[80%] line-clamp-2">{transaction.name}</p>
          </div>

          {/* Details Grid */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
             <div className="p-3 sm:p-4 bg-surface-brighter rounded-xl border border-border-main flex items-center gap-3">
               <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface flex items-center justify-center text-accent-gold">
                 <Calendar size={18} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Date</span>
                 <span className="text-sm font-semibold">{transaction.date}</span>
               </div>
             </div>

             <div className="p-4 bg-surface-brighter rounded-xl border border-border-main flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-accent-gold">
                 <Tag size={18} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Category</span>
                 <span className="text-sm font-semibold">{transaction.category}</span>
               </div>
             </div>

             <div className="p-4 bg-surface-brighter rounded-xl border border-border-main flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-accent-gold">
                 <ArrowDownRight size={18} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Source (From)</span>
                 <span className="text-sm font-semibold uppercase">{transaction.from}</span>
               </div>
             </div>

             <div className="p-4 bg-surface-brighter rounded-xl border border-border-main flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-accent-gold">
                 <ArrowUpRight size={18} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Target (To)</span>
                 <span className="text-sm font-semibold uppercase">{transaction.to}</span>
               </div>
             </div>
          </div>

          {/* Notes Section */}
          <div className="px-6 pb-8">
            <div className="p-4 bg-surface-brighter rounded-xl border border-border-main flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-text-muted" />
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Notes & Meta</span>
              </div>
              <p className="text-sm text-text-primary italic whitespace-pre-wrap">
                {transaction.notes || "No additional notes provided for this transaction."}
              </p>
              <div className="mt-2 pt-2 border-t border-border-main/50 flex gap-4 text-[10px] text-text-muted font-mono">
                 <span>Year: {transaction.year}</span>
                 <span>Month: {transaction.month}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-border-main bg-surface-brighter flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-accent-gold text-black text-xs font-black rounded-lg hover:bg-white transition-all shadow-lg active:scale-95"
            >
              CLOSE PREVIEW
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({
    key: 'date',
    direction: 'desc'
  });
  const [tableSearch, setTableSearch] = useState('');
  const deferredSearch = useDeferredValue(tableSearch);
  const [ledgerModeCategory, setLedgerModeCategory] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [borrowFilter, setBorrowFilter] = useState<'all' | 'owes' | 'gets' | 'clear'>('all');
  const [borrowSort, setBorrowSort] = useState<'name' | 'activity' | 'balance'>('balance');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeNoteSr, setActiveNoteSr] = useState<number | null>(null);

  const [copySuccessSr, setCopySuccessSr] = useState<number | null>(null);

  const handleCopyHistory = (entityName: string, sr: number) => {
    // Filter transactions correctly for the entity in the current ledger category
    const history = transactions
      .filter(t => t.category === ledgerModeCategory && t.name === entityName)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (history.length === 0) return;

    let balance = 0;
    const historyString = history.map(t => {
      // User requested DEBIT as PLUS (+) and CREDIT as MINUS (-) if referring to his balance
      // But in his spreadsheet: DEBIT is inflow (+), CREDIT is outflow (-)
      // If I give money to someone (Borrow category), it's outflow (CREDIT).
      // If I receive back, it's inflow (DEBIT).
      // Based on user prompt: "DEBIT amount showing with PLUS & CREDIT (+) amount with MINUS (-)"
      const prefix = t.type === 'DEBIT' ? '+' : '-';
      const amt = t.amount;
      balance += (t.type === 'DEBIT' ? amt : -amt);
      return `${t.date}: ${prefix}${amt.toLocaleString()} [${t.notes || 'No notes'}]`;
    }).join('\n');

    const header = `COMPLETE HISTORY - ${entityName} (${ledgerModeCategory})\n================================\n`;
    const footer = `\n================================\nNET POSITION: Rs ${balance.toLocaleString()} ${balance >= 0 ? '(GETS)' : '(OWES)'}`;
    
    navigator.clipboard.writeText(header + historyString + footer).then(() => {
      setCopySuccessSr(sr);
      setTimeout(() => setCopySuccessSr(null), 2000);
    });
  };

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let items = [...transactions];
    
    // Apply Ledger Mode Filter if active
    if (ledgerModeCategory) {
      items = items.filter(r => r.category === ledgerModeCategory);
    }

    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      items = items.filter(r => (r.name + r.notes + r.category).toLowerCase().includes(q));
    }

    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [transactions, sortConfig, deferredSearch, ledgerModeCategory]);

  const ledgerSummary = useMemo(() => {
    if (!ledgerModeCategory) return [];
    
    const categoryTransactions = transactions.filter(t => t.category === ledgerModeCategory);
    const summaryMap: Record<string, { totalActivity: number; balance: number; recentSr: number; recentNotes: string }> = {};
    
    categoryTransactions.forEach(t => {
      const name = t.name || 'Unknown';
      if (!summaryMap[name]) {
        summaryMap[name] = { totalActivity: 0, balance: 0, recentSr: t.sr, recentNotes: t.notes || 'No notes available' };
      } else {
        // Update to show the most recent entry (highest SR usually stays last)
        summaryMap[name].recentSr = t.sr;
        summaryMap[name].recentNotes = t.notes || 'No notes available';
      }
      summaryMap[name].totalActivity += t.amount;
      
      // Balance logic is mostly for BORROW, for others it acts as activity tracker
      if (t.type === 'DEBIT') {
        summaryMap[name].balance += t.amount;
      } else if (t.type === 'CREDIT') {
        summaryMap[name].balance -= t.amount;
      }
    });

    let result = Object.entries(summaryMap).map(([name, stats]) => ({
      name,
      ...stats
    }));

    // Special filters for BORROW
    if (ledgerModeCategory === 'BORROW') {
      if (borrowFilter === 'owes') result = result.filter(n => n.balance < 0);
      if (borrowFilter === 'gets') result = result.filter(n => n.balance > 0);
      if (borrowFilter === 'clear') result = result.filter(n => n.balance === 0);
    }

    // Apply Sort
    result.sort((a, b) => {
      if (borrowSort === 'balance') return Math.abs(b.balance) - Math.abs(a.balance);
      if (borrowSort === 'activity') return b.totalActivity - a.totalActivity;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [transactions, ledgerModeCategory, borrowFilter, borrowSort]);

  const borrowStats = useMemo(() => {
    if (ledgerModeCategory !== 'BORROW') return null;
    const borrowTransactions = transactions.filter(t => t.category === 'BORROW');
    const summaryMap: Record<string, number> = {};
    borrowTransactions.forEach(t => {
       const v = t.type === 'DEBIT' ? t.amount : -t.amount;
       summaryMap[t.name] = (summaryMap[t.name] || 0) + v;
    });

    let owes = 0;
    let gets = 0;
    Object.values(summaryMap).forEach(v => {
      if (v < 0) owes += Math.abs(v);
      else gets += v;
    });

    return { totalOwed: owes, totalGets: gets, net: gets - owes };
  }, [transactions, ledgerModeCategory]);

  const registerSummary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    const saving = filteredTransactions.filter(t => t.type === 'SAVING').reduce((s, t) => s + t.amount, 0);
    return { income, expense, saving, net: (income - expense) };
  }, [filteredTransactions]);

  const requestSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Transaction) => {
    if (sortConfig?.key !== key) return <div className="w-3 h-3 opacity-20"><ChevronDown size={12} /></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-accent-gold" /> : <ChevronDown size={12} className="text-accent-gold" />;
  };

  return (
    <div className="flex flex-col gap-6 mb-12" onClick={() => setActiveNoteSr(null)}>
      <TransactionDetailModal 
        transaction={selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
      />

      <div className="dashboard-card p-0 overflow-hidden flex flex-col mb-4">
        <div className="p-4 sm:p-5 border-b border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-surface/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <h3 className="text-xs font-bold m-0 text-text-primary whitespace-nowrap">Transaction Register</h3>
            <span className="font-mono text-[9px] sm:text-[10px] text-text-muted px-2 py-0.5 bg-surface-brighter rounded border border-border-main shrink-0">
              {filteredTransactions.length} of {transactions.length} entries
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-2 group cursor-pointer">
              <input 
                type="checkbox" 
                id="show-summary-toggle"
                checked={showSummary}
                onChange={(e) => setShowSummary(e.target.checked)}
                className="w-4 h-4 rounded border-border-main bg-surface-brighter text-accent-gold focus:ring-accent-gold/20 cursor-pointer"
              />
              <label htmlFor="show-summary-toggle" className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary transition-colors cursor-pointer uppercase tracking-widest whitespace-nowrap">
                Summary
              </label>
            </div>

            <div className="flex items-center gap-2 bg-surface-brighter px-3 py-1.5 rounded-lg border border-border-main w-full sm:w-auto">
              <span className="text-[8px] sm:text-[9px] font-black text-text-secondary uppercase tracking-widest shrink-0 opacity-80">Mode:</span>
              <select 
                value={ledgerModeCategory || ''} 
                onChange={(e) => setLedgerModeCategory(e.target.value || null)}
                className="bg-transparent text-[10px] font-bold text-accent-gold outline-none cursor-pointer flex-1 sm:min-w-[120px]"
              >
                <option value="" className="bg-surface text-text-primary">Master Ledger</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-surface text-text-primary">{cat}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search..."
                className="bg-surface-brighter border border-border-main text-text-primary text-xs pl-9 pr-3 py-1.5 rounded-lg outline-none focus:border-accent-gold transition-colors w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto h-[calc(100vh-220px)] lg:h-[calc(100vh-260px)] min-h-[400px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-brightest shadow-sm">
              <tr>
                <th onClick={() => requestSort('sr')} className="hidden sm:table-cell p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap">
                  <div className="flex items-center gap-1"># {getSortIcon('sr')}</div>
                </th>
                <th onClick={() => requestSort('date')} className="p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap">
                  <div className="flex items-center gap-1">Date {getSortIcon('date')}</div>
                </th>
                <th onClick={() => requestSort('name')} className="p-3 font-bold text-[9px] uppercase tracking-wider text-text-primary sm:text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap">
                  <div className="flex items-center gap-1">Reference {getSortIcon('name')}</div>
                </th>
                <th onClick={() => requestSort('amount')} className="p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap text-right sm:text-left">
                  <div className="flex items-center sm:justify-start justify-end gap-1">Amount {getSortIcon('amount')}</div>
                </th>
                <th onClick={() => requestSort('category')} className="hidden lg:table-cell p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap">
                  <div className="flex items-center gap-1">Category {getSortIcon('category')}</div>
                </th>
                <th onClick={() => requestSort('type')} className="hidden sm:table-cell p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap">
                  <div className="flex items-center gap-1">Type {getSortIcon('type')}</div>
                </th>
                <th className="hidden xl:table-cell p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted whitespace-nowrap">From</th>
                <th className="hidden xl:table-cell p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted whitespace-nowrap">To</th>
                <th className="p-3 font-bold text-[9px] uppercase tracking-wider text-text-muted whitespace-nowrap">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredTransactions.map((r, idx) => (
                  <motion.tr 
                    key={r.sr} 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedTransaction(r)}
                    className={cn("hover:bg-accent-gold/[0.05] transition-colors cursor-pointer group", idx % 2 === 0 ? "bg-transparent" : "bg-surface-brighter/40")}
                  >
                    <td className="hidden sm:table-cell p-3 font-mono text-[10px] text-text-muted">{r.sr}</td>
                    <td className="p-2 sm:p-3 font-mono text-[9px] sm:text-[10px] whitespace-nowrap text-text-secondary">{r.date || '—'}</td>
                    <td className="p-2 sm:p-3 font-semibold truncate max-w-[120px] sm:max-w-[180px] text-text-primary text-[11px] sm:text-[12px]" title={r.name}>{r.name || '—'}</td>
                    <td className={cn("p-2 sm:p-3 font-mono font-bold text-right sm:text-left text-[11px] sm:text-[12px]", 
                      r.type === 'DEBIT' ? "text-income" : r.type === 'CREDIT' ? "text-expense" : "text-text-muted"
                    )}>
                      {formatPKR(r.amount)}
                    </td>
                    <td className="hidden lg:table-cell p-3">
                      <span 
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: `${CATEGORY_COLORS[r.category] || '#888'}15`, color: CATEGORY_COLORS[r.category] || '#888' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[r.category] || '#888' }}></span>
                        {r.category}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-tighter",
                        r.type === 'CREDIT' ? "bg-expense/10 text-expense" :
                        r.type === 'DEBIT' ? "bg-income/10 text-income" :
                        r.type === 'SAVING' ? "bg-saving/10 text-saving" :
                        "bg-blue-500/10 text-blue-400"
                      )}>
                        {r.type}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell p-3 text-[10px] text-text-muted capitalize">{r.from}</td>
                    <td className="hidden xl:table-cell p-3 text-[10px] text-accent-gold/80 font-medium capitalize">{r.to}</td>
                    <td className="p-2 sm:p-3 text-[10px] text-text-primary font-medium italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] sm:max-w-[200px]" title={r.notes}>{r.notes || '—'}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Register Summary Footer */}
        <div className="p-4 bg-surface border-t border-border-main flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Total Income</span>
              <span className="text-sm font-mono font-bold text-income">{formatPKR(registerSummary.income)}</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-border-main" />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Total Expense</span>
              <span className="text-sm font-mono font-bold text-expense">{formatPKR(registerSummary.expense)}</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-border-main" />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Savings</span>
              <span className="text-sm font-mono font-bold text-saving">{formatPKR(registerSummary.saving)}</span>
            </div>
          </div>
          
          <div className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-surface-brighter rounded-xl border border-border-main flex items-center justify-between sm:justify-start gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Net Filtered Balance</span>
              <span className={cn(
                "text-xl font-display font-black tracking-tighter",
                registerSummary.net >= 0 ? "text-income" : "text-expense"
              )}>
                {formatPKR(registerSummary.net)}
              </span>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
              registerSummary.net >= 0 ? "bg-income text-black" : "bg-expense text-white"
            )}>
              <Wallet size={20} />
            </div>
          </div>
        </div>
      </div>

      {showSummary && ledgerModeCategory && ledgerSummary.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-6 border-t border-border-main/50">
          <div className="mb-6 px-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg sm:text-xl font-display font-black tracking-tight capitalize leading-tight">
                {ledgerModeCategory} Ledger Summary
              </h2>
              {borrowStats && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                   <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-text-muted tracking-widest">Total Owed</span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-expense">{formatPKR(borrowStats.totalOwed)}</span>
                   </div>
                   <div className="hidden sm:block w-px h-6 bg-border-main" />
                   <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-text-muted tracking-widest">To be Received</span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-income">{formatPKR(borrowStats.totalGets)}</span>
                   </div>
                   <div className="hidden sm:block w-px h-6 bg-border-main" />
                   <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-text-muted tracking-widest">Net Position</span>
                      <span className={cn("text-xs sm:text-sm font-mono font-bold", borrowStats.net >= 0 ? "text-income" : "text-expense")}>
                        {formatPKR(Math.abs(borrowStats.net))} {borrowStats.net >= 0 ? 'Surplus' : 'Deficit'}
                      </span>
                   </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-surface-brighter p-2 rounded-xl border border-border-main">
               <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-text-muted uppercase ml-1 mr-1">Sort:</span>
                  <select 
                    value={borrowSort} 
                    onChange={(e) => setBorrowSort(e.target.value as any)}
                    className="bg-transparent text-[10px] font-bold text-accent-gold border-none outline-none cursor-pointer"
                  >
                    <option value="balance" className="bg-surface text-text-primary">{ledgerModeCategory === 'BORROW' ? 'By Balance' : 'By Intensity'}</option>
                    <option value="activity" className="bg-surface text-text-primary">By Activity</option>
                    <option value="name" className="bg-surface text-text-primary">By Name</option>
                  </select>
               </div>
               {ledgerModeCategory === 'BORROW' && (
                  <div className="flex items-center gap-2">
                    <div className="w-px h-4 bg-border-main" />
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-text-muted uppercase ml-1 mr-1">View:</span>
                        <div className="flex gap-1 pr-1">
                          {['all', 'owes', 'gets', 'clear'].map(f => (
                            <button 
                              key={f}
                              onClick={() => setBorrowFilter(f as any)}
                              className={cn(
                                "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all",
                                borrowFilter === f ? "bg-accent-gold text-black" : "text-text-muted hover:text-text-primary"
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                    </div>
                  </div>
               )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {ledgerSummary.map((item) => (
              <div 
                key={item.name} 
                className={cn(
                  "dashboard-card group hover:border-accent-gold/40 transition-all relative",
                  activeNoteSr === item.recentSr ? "z-[60]" : "z-10 hover:z-20"
                )}
              >
                {/* Copy Feedback Overlay - uses internal rounding to allow overflow of notes */}
                <AnimatePresence>
                  {copySuccessSr === item.recentSr && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute inset-0 bg-accent-gold/90 flex items-center justify-center z-30 rounded-[inherit]"
                    >
                      <span className="text-black font-black text-xs uppercase tracking-widest">History Copied!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center h-full">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <div 
                         className="relative group/sr"
                         onClick={(e) => {
                           e.stopPropagation();
                           setActiveNoteSr(activeNoteSr === item.recentSr ? null : item.recentSr);
                         }}
                       >
                          <span className={cn(
                            "text-[10px] text-text-muted transition-colors cursor-help border-b border-dotted border-text-muted/30 hover:text-accent-gold hover:border-accent-gold",
                            activeNoteSr === item.recentSr ? "text-accent-gold border-accent-gold" : ""
                          )}>
                            ({item.recentSr}#)
                          </span>
                          {/* Hover/Touch Pop-up for Notes */}
                          <div className={cn(
                            "absolute bottom-full left-0 mb-3 w-64 p-4 bg-surface-brightest border border-border-main rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all z-[70] pointer-events-none",
                            (activeNoteSr === item.recentSr) 
                              ? "opacity-100 visible translate-y-0" 
                              : "opacity-0 invisible translate-y-1 sm:group-hover/sr:opacity-100 sm:group-hover/sr:visible sm:group-hover/sr:translate-y-0"
                          )}>
                             <div className="flex items-center justify-between mb-3">
                               <span className="text-[10px] uppercase font-bold text-accent-gold tracking-[2px]">Last Transaction Notes</span>
                               <span className="text-[9px] font-mono text-text-muted bg-surface p-1 rounded border border-border-main">SR: {item.recentSr}</span>
                             </div>
                             <p className="text-[12px] text-text-primary italic leading-relaxed font-medium">
                               {item.recentNotes || "No notes available for this entry."}
                             </p>
                             <div className="mt-3 pt-3 border-t border-border-main/50 flex justify-between items-center">
                                <span className="text-[8px] text-text-muted uppercase font-bold">Quick View</span>
                                <span className="text-[8px] text-accent-gold/70 uppercase tracking-tighter">Tap serial again to close</span>
                             </div>
                          </div>
                       </div>
                       <span 
                         onClick={() => handleCopyHistory(item.name, item.recentSr)}
                         className="font-bold text-sm tracking-tight hover:text-accent-gold transition-colors cursor-pointer underline decoration-accent-gold/20 underline-offset-4 decoration-dotted truncate max-w-[120px] sm:max-w-none"
                         title="Click to copy full history"
                       >
                         {item.name}
                       </span>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">
                      {ledgerModeCategory === 'BORROW' ? 'Activity' : 'Volume'}: <span className="text-text-secondary">₨ {item.totalActivity.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[2px] mb-1",
                      item.balance > 0 ? "text-income" : item.balance < 0 ? "text-expense" : "text-text-muted"
                    )}>
                      {ledgerModeCategory === 'BORROW' 
                        ? (item.balance > 0 ? 'GETS' : item.balance < 0 ? 'OWES' : 'CLEAR')
                        : (item.balance > 0 ? 'INCOME' : 'EXPENSE')
                      }
                    </span>
                    <span className={cn(
                      "text-sm font-mono font-bold",
                      item.balance > 0 ? "text-income" : item.balance < 0 ? "text-expense" : "text-text-muted"
                    )}>
                      Rs {Math.abs(item.balance).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
