import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, MONTH_NAMES } from './types';
import { parseTransactionData, getGoogleSheetCsvUrl, extractSheetInfo } from './services/dataService';
import { Navbar } from './components/Navbar';
import { FiltersBar } from './components/FiltersBar';
import { KPICard } from './components/KPICard';
import { Charts } from './components/Charts';
import { AnalysisPanels } from './components/AnalysisPanels';
import { BudgetSection } from './components/BudgetSection';
import { TransactionTable } from './components/TransactionTable';
import { ConnectModal } from './components/ConnectModal';
import { ReportModal } from './components/ReportModal';
import { generatePDFReport, generateExcelReport } from './services/reportService';
import { suggestCategory, batchCategorize } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { CircleDollarSign, Receipt, Scale, Handshake, Landmark, AlertCircle, FileText, BrainCircuit, Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from './lib/utils';

const DEFAULT_SHEET_ID = '19VuSm-MmjdcYQShzBZQZAbWkvDkpVYG5k1Koa9A0jNs';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-surface-brighter rounded-xl border border-border-main", className)} />
);

export default function App() {
  const [allData, setAllData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('—');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [chartTab, setChartTab] = useState<'overview' | 'category' | 'month'>('overview');
  const [currentView, setCurrentView] = useState<'dashboard' | 'register'>('dashboard');
  const [csvUrl, setCsvUrl] = useState(getGoogleSheetCsvUrl(DEFAULT_SHEET_ID, '0', 'A1:I', 'Sheet1'));
  const [dataSource, setDataSource] = useState<'live' | 'file'>('live');
  const [aiLoading, setAiLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('account2026_theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });
  const [hideAmounts, setHideAmounts] = useState(() => localStorage.getItem('account2026_privacy') === 'true');

  useEffect(() => {
    localStorage.setItem('account2026_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('account2026_privacy', hideAmounts.toString());
  }, [hideAmounts]);

  const [filters, setFilters] = useState({
    months: [] as string[],
    year: '',
    category: '',
    type: '',
    channel: '',
    search: ''
  });

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('account2026_budgets');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('account2026_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    // Initial delay for entrance animation
    const timer = setTimeout(() => setIsReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const syncFinancialData = async (url: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.fetch) {
        throw new Error("Financial engine failure: 'fetch' is not supported in this environment.");
      }

      let res: Response;
      let resText = '';
      let isUsingProxy = true;

      // Use our server-side proxy to avoid CORS issues
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      console.log(`[Sync] Requesting data via proxy: ${proxyUrl}`);
      
      try {
        res = await window.fetch(`${proxyUrl}&cb=${Date.now()}`);
        
        // If we get a 404 on the proxy route itself, it means we are likely on a static host (Netlify/Vercel)
        // without the associated backend. In this case, we MUST try a direct fetch.
        if (res.status === 404) {
          console.warn('[Sync] Proxy endpoint not found (404). Switching to direct fetch fallback...');
          isUsingProxy = false;
          res = await window.fetch(`${url}&cb_direct=${Date.now()}`);
        }
      } catch (proxyErr) {
        console.warn('[Sync] Proxy request failed. Attempting direct fetch fallback...', proxyErr);
        isUsingProxy = false;
        res = await window.fetch(`${url}&cb_direct=${Date.now()}`);
      }

      const clone = res.clone();
      
      if (isUsingProxy) {
        try {
          const data = await res.json();
          if (!res.ok) {
            let msg = data?.details || data?.error || `HTTP ${res.status}`;
            if (res.status === 400) msg = "Invalid Spreadsheet URL. Please ensure you provided a valid Google Sheets link.";
            if (res.status === 401) msg = "Access Denied. Ensure your Sheet's Sharing settings is 'Anyone with the link' as Viewer.";
            throw new Error(msg);
          }
          resText = typeof data === 'string' ? data : JSON.stringify(data);
        } catch (e: any) {
          if (e.message.includes('HTTP') || e.message.includes('Access Denied') || e.message.includes('Invalid Spreadsheet')) {
            throw e;
          }
          resText = await clone.text();
          if (!res.ok) {
            throw new Error(`Connection Error (${res.status}): Failed to reach financial source.`);
          }
        }
      } else {
        // Direct fetch handling (CORS restricted)
        if (!res.ok) {
          if (res.status === 0 || res.status === 404 || res.status === 403) {
            throw new Error(`Static Deployment Sync Error: Failed to reach sheet directly. Since you are on a static host (like Netlify), please ensure your Google Sheet is 'Published to the web' as CSV or shared as 'Anyone with the link can view' as Viewer.`);
          }
          throw new Error(`Direct Connection Error (${res.status}): Failed to reach financial source.`);
        }
        resText = await res.text();
      }
      
      let parsed = parseTransactionData(resText);
      
      // Fallback: If targeted range returned nothing, try a blind sync (no range/sheet name)
      if (parsed.length === 0 && url.includes('range=')) {
        console.warn('[Sync] Targeted range returned empty. Attempting blind fallback...');
        const baseDocId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (baseDocId) {
          const fallbackUrl = getGoogleSheetCsvUrl(baseDocId);
          const fallbackTarget = isUsingProxy ? `/api/proxy?url=${encodeURIComponent(fallbackUrl)}` : fallbackUrl;
          const fallbackRes = await window.fetch(`${fallbackTarget}&cb=fallback_${Date.now()}`);
          if (fallbackRes.ok) {
            const fallbackText = await fallbackRes.text();
            parsed = parseTransactionData(fallbackText);
          }
        }
      }

      if (parsed.length === 0) {
        // Advanced debugging feedback for the user
        const firstLine = resText.split('\n')[0] || 'Empty';
        throw new Error(`Empty Ledger: No valid data found. (Sample: "${firstLine.substring(0, 50)}")`);
      }
      setAllData(parsed);
      setDataSource('live');
      setLastUpdated(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Core Sync Failure:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncFinancialData(csvUrl);
  }, [csvUrl]);

  const filteredData = useMemo(() => {
    return allData.filter(r => {
      if (filters.months.length > 0 && !filters.months.includes(r.month)) return false;
      if (filters.year && r.year !== filters.year) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.channel) {
        if (filters.channel === 'CASH' && r.from !== 'CASH') return false;
        if (filters.channel === 'Jazz-Cash' && r.from !== 'Jazz-Cash') return false;
      }
      if (filters.search && !(r.name + r.notes + r.category).toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [allData, filters]);

  const categories = useMemo(() => [...new Set(allData.map(r => r.category))].filter(Boolean), [allData]);

  const kpis = useMemo(() => {
    const income = filteredData.filter(r => r.type === 'DEBIT' && (['SALARY', 'INCOM', 'INCOME'].includes(r.category) || r.category === 'MISLINIUS')).reduce((s, r) => s + r.amount, 0);
    const expense = filteredData.filter(r => r.type === 'CREDIT' && !['BORROW', 'TRANSFER', 'SAVING'].includes(r.category.toUpperCase())).reduce((s, r) => s + r.amount, 0);
    
    // Just sum of "borrow" amount as requested
    const borrow = filteredData.filter(r => r.category === 'BORROW').reduce((s, r) => s + r.amount, 0);
    
    // Only sum of "saving" type/category as requested
    const savings = filteredData.filter(r => r.type === 'SAVING' || r.category.toUpperCase() === 'SAVING').reduce((s, r) => s + r.amount, 0);
    
    // Cash Logic following user's precise step guide
    // A: SUM TOTAL DEBIT CASH (Income directly into cash)
    const cashA = filteredData.filter(r => r.from === 'CASH' && r.type === 'DEBIT' && r.category !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // B: SUM TOTAL CASH CONVERTED FROM JAZZCASH/OTHERS TO CASH (Transfer To Cash)
    const cashB = filteredData.filter(r => r.category === 'TRANSFER' && r.to === 'CASH').reduce((s, r) => s + r.amount, 0);
    // C: SUM OF TOTAL CREDIT CASH (Standard expenses paid via cash)
    const cashC = filteredData.filter(r => r.from === 'CASH' && r.type === 'CREDIT' && r.category !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // D: SUM OF TOTAL CASH CONVERTED OR TRANSFER TO JAZZCASH/OTHERS (Transfer From Cash)
    const cashD = filteredData.filter(r => r.from === 'CASH' && r.category === 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    
    const totalCash = (cashA + cashB) - (cashC + cashD);
    
    // Total Accounts Balance (Mirrored Logic for everything not 'CASH')
    // A': Income into digital accounts
    const accA = filteredData.filter(r => r.from !== 'CASH' && r.type === 'DEBIT' && r.category !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // B': Transferred into digital accounts from elsewhere
    const accB = filteredData.filter(r => r.category === 'TRANSFER' && r.to !== 'CASH' && r.to !== 'OTHER' && r.to !== '').reduce((s, r) => s + r.amount, 0);
    // C': Expenses from digital accounts
    const accC = filteredData.filter(r => r.from !== 'CASH' && r.type === 'CREDIT' && r.category !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // D': Transferred from digital accounts to elsewhere
    const accD = filteredData.filter(r => r.from !== 'CASH' && r.category === 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    
    const totalAccounts = (accA + accB) - (accC + accD);
    
    // Net Borrow Standing (Positive = Owed to us, Negative = We owe)
    const borrowNet = filteredData.filter(r => r.category === 'BORROW').reduce((s, r) => s + (r.type === 'CREDIT' ? r.amount : -r.amount), 0);
    
    return { income, expense, net: income - expense, borrow, savings, totalCash, totalAccounts, borrowNet };
  }, [filteredData]);

  const handleConnect = (url: string) => {
    console.log(`[Connect] User provided URL: ${url}`);
    if (url.includes('docs.google.com')) {
      const { id, gid } = extractSheetInfo(url);
      if (id) {
        setCsvUrl(getGoogleSheetCsvUrl(id, gid || '0', 'A1:I', 'Sheet1'));
        console.log(`[Connect] Built Google Sheet CSV URL for ID: ${id}`);
      } else {
        setCsvUrl(url); // Try direct link if id extraction fails
      }
    } else {
      setCsvUrl(url);
    }
    setIsModalOpen(false);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseTransactionData(text);
      setAllData(parsed);
      setDataSource('file');
      setLastUpdated(`File: ${file.name}`);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const income = filteredData.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    const expense = filteredData.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    const saving = filteredData.filter(t => t.type === 'SAVING').reduce((s, t) => s + t.amount, 0);

    const summary = [
      ['SUMMARY'],
      ['Total Income', income],
      ['Total Expense', expense],
      ['Total Savings', saving],
      ['Net Balance', income - expense],
      [],
    ].map(row => row.join(',')).join('\n');

    const cols = ['sr', 'date', 'name', 'amount', 'category', 'type', 'from', 'notes'];
    const header = cols.join(',');
    const rows = filteredData.map(r => cols.map(c => {
      const val = (r as any)[c] || '';
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','));
    
    const blob = new Blob([summary + '\n' + header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Account2026_Export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleReportGenerate = (data: Transaction[], title: string, format: 'PDF' | 'EXCEL') => {
    if (format === 'PDF') {
      generatePDFReport(data, title);
    } else {
      generateExcelReport(data, title);
    }
  };

  const handleAICategorize = async () => {
    const targets = allData.filter(t => !t.category || t.category.toUpperCase() === 'MISLINIUS').slice(0, 10);
    if (targets.length === 0) {
      console.log("No targets for AI categorization found.");
      return;
    }

    try {
      setAiLoading(true);
      console.log(`Analyzing ${targets.length} transactions...`);
      const suggestions = await batchCategorize(targets.map(t => ({ id: t.sr, name: t.name, notes: t.notes })));
      
      if (!suggestions || suggestions.length === 0) {
        console.warn("AI returned no suggestions.");
        alert("AI could not categorize these transactions. Please check your notes/names.");
        return;
      }

      console.log("Suggestions received:", suggestions);
      setAllData(prev => prev.map(t => {
        const found = suggestions.find((s: any) => s.id === t.sr);
        if (found) {
          console.log(`Updating ${t.name}: ${found.category}`);
          return { ...t, category: found.category.toUpperCase() };
        }
        return t;
      }));
    } catch (e) {
      console.error("AI categorization failed:", e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg selection:bg-accent-gold/20 selection:text-accent-gold">
      <Navbar 
        onConnectClick={() => setIsModalOpen(true)}
        onUploadClick={() => document.getElementById('file-upload-dialog')?.click()}
        onExportCSV={handleExport}
        onReportClick={() => setIsReportModalOpen(true)}
        onRefreshClick={() => syncFinancialData(csvUrl)}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        lastUpdated={lastUpdated}
        status={(error || dataSource === 'file') ? 'offline' : 'online'}
        activeView={currentView}
        onViewChange={setCurrentView}
      />

      <input 
        type="file" 
        id="file-upload-dialog" 
        className="hidden" 
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />

      <FiltersBar 
        filters={filters}
        categories={categories}
        setFilters={setFilters}
        resetFilters={() => setFilters({ months: [], year: '', category: '', type: '', channel: '', search: '' })}
      />

      {error && (
        <div className="bg-expense/10 border-b border-expense/20 py-2 px-6 flex items-center justify-center gap-3">
          <AlertCircle size={14} className="text-expense" />
          <span className="text-[11px] font-bold text-expense uppercase tracking-widest">{error}</span>
          <button onClick={() => syncFinancialData(csvUrl)} className="text-[10px] bg-expense/20 px-2 py-0.5 rounded text-expense hover:bg-expense hover:text-white transition-colors">Retry</button>
        </div>
      )}

      <main className={cn(
        "max-w-[1600px] mx-auto p-6 transition-all duration-500",
        currentView === 'register' ? "flex flex-col gap-2 pt-2 px-4 lg:px-8" : "flex flex-col gap-10"
      )}>
        {currentView === 'dashboard' && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* KPI Grid */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[3px]">Key Performance Indicators</h2>
                <div className="flex-1 h-px bg-border-main" />
                <button 
                  onClick={() => setHideAmounts(!hideAmounts)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-brighter border border-border-main rounded-xl text-gray-400 hover:text-white transition-all hover:bg-surface-brightest active:scale-95 group"
                  title={hideAmounts ? "Show Amounts" : "Hide Amounts"}
                >
                  {hideAmounts ? <Eye size={12} className="text-accent-gold" /> : <EyeOff size={12} />}
                  <span className="text-[9px] font-bold uppercase tracking-wider">{hideAmounts ? "Show Data" : "Hide Data"}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                {(loading || !isReady) ? (
                  Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[170px]" />
                  ))
                ) : (
                  <>
                    <KPICard 
                      label="Total Income" 
                      value={kpis.income} 
                      subText={`${filteredData.filter(r => r.type === 'DEBIT').length} income entries`}
                      icon={<CircleDollarSign className="text-income" />}
                      colorClass="bg-income"
                      delay={0.1}
                      hideAmount={hideAmounts}
                    />
                    <KPICard 
                      label="Total Expenses" 
                      value={kpis.expense} 
                      subText={`${filteredData.filter(r => r.type === 'CREDIT').length} expense transactions`}
                      icon={<Receipt className="text-expense" />}
                      colorClass="bg-expense"
                      delay={0.2}
                      hideAmount={hideAmounts}
                    />
                    <KPICard 
                      label="Net Balance" 
                      value={kpis.net} 
                      subText={kpis.net >= 0 ? "✓ Healthy Balance" : "⚠ Deficit Alert"}
                      icon={<Scale className="text-teal-main" />}
                      colorClass="bg-teal-main"
                      delay={0.3}
                      hideAmount={hideAmounts}
                    />
                    <KPICard 
                      label="Total Cash" 
                      value={kpis.totalCash} 
                      subText="Physical cash on hand"
                      icon={<Handshake className="text-borrow" />}
                      colorClass="bg-borrow"
                      delay={0.4}
                      hideAmount={hideAmounts}
                    />
                    <KPICard 
                      label="Account Balance" 
                      value={kpis.totalAccounts} 
                      subText="Funds in digital accounts"
                      icon={<Landmark className="text-saving" />}
                      colorClass="bg-saving"
                      delay={0.5}
                      hideAmount={hideAmounts}
                    />
                    <KPICard 
                      label="Borrow Net Position" 
                      value={kpis.borrowNet} 
                      subText={kpis.borrowNet >= 0 ? "Owed to you" : "You owe"}
                      icon={kpis.borrowNet >= 0 ? <TrendingUp className="text-accent-gold" /> : <TrendingDown className="text-expense" />}
                      colorClass={kpis.borrowNet >= 0 ? "bg-accent-gold" : "bg-expense"}
                      delay={0.6}
                      hideAmount={hideAmounts}
                    />
                  </>
                )}
              </div>
            </section>

            {/* Charts Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[3px]">Trend Analytics</h2>
                <div className="flex-1 h-px bg-border-main" />
                
                <div className="flex items-center gap-1 bg-surface-brighter p-1 rounded-xl border border-border-main">
                  <button 
                    onClick={() => setChartTab('overview')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${chartTab === 'overview' ? 'bg-accent-gold text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setChartTab('category')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${chartTab === 'category' ? 'bg-accent-gold text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    Category Analysis
                  </button>
                  <button 
                    onClick={() => setChartTab('month')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${chartTab === 'month' ? 'bg-accent-gold text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    Monthly Breakdown
                  </button>
                </div>

                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-2 text-[10px] font-bold bg-white/5 border border-border-main px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all active:scale-95"
                >
                  <FileText size={14} className="text-accent-gold" />
                  <span>Generate Custom Report</span>
                </button>
              </div>
              <Charts transactions={filteredData} budgets={budgets} activeTab={chartTab} />
            </section>

            {/* Budget Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[3px]">Budget Tracking</h2>
                <div className="flex-1 h-px bg-border-main" />
              </div>
              <BudgetSection 
                transactions={allData.filter(r => {
                  if (filters.months.length > 0) return filters.months.includes(r.month);
                  const currentMonth = MONTH_NAMES[new Date().getMonth()];
                  return r.month === currentMonth;
                })} 
                budgets={budgets}
                onUpdateBudget={(cat, amt) => setBudgets(prev => ({ ...prev, [cat]: amt }))}
              />
            </section>

            {/* Deep Analysis */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[3px]">Intelligent Insights</h2>
                <div className="flex-1 h-px bg-border-main" />
              </div>
              <AnalysisPanels transactions={filteredData} borrowStatus={filters.borrowStatus} />
            </section>
          </div>
        )}

        {currentView === 'register' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[calc(100vh-250px)]">
            {/* Transaction Table */}
            <section className="mb-2">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[3px]">Master Ledger</h2>
                <div className="flex-1 h-px bg-border-main" />
              </div>
              <TransactionTable transactions={filteredData} />
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-border-main p-8 text-center bg-surface/50">
         <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2">
            Professional Fiscal Environment &nbsp;·&nbsp; Account 2026 Engine
         </div>
         <div className="text-[9px] text-gray-600">
            Secure browser-side processing. Built for high-frequency financial monitoring.
         </div>
      </footer>

      <ConnectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
        onFileUpload={handleFileUpload}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleReportGenerate}
        transactions={allData}
      />

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center gap-6"
          >
            <div className="text-2xl font-display font-extrabold tracking-tighter">Account <span className="text-accent-gold">2026</span></div>
            <div className="w-12 h-12 border-4 border-border-main border-t-accent-gold rounded-full animate-spin" />
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[4px]">Initializing Systems...</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
