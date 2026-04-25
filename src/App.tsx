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
import { WealthTracker, Asset } from './components/WealthTracker';
import { SavingsGoals, SavingsGoal } from './components/SavingsGoals';
import { RecurringBills } from './components/RecurringBills';
import { ConnectModal } from './components/ConnectModal';
import { ReportModal } from './components/ReportModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { generatePDFReport, generateExcelReport } from './services/reportService';
import { suggestCategory, batchCategorize } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { CircleDollarSign, Receipt, Scale, Handshake, Landmark, AlertCircle, FileText, BrainCircuit, Eye, EyeOff, TrendingDown, TrendingUp, Plus } from 'lucide-react';
import { cn } from './lib/utils';

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
  const [chartTab, setChartTab] = useState<'overview' | 'budget' | 'category' | 'month'>('overview');
  const [currentView, setCurrentView] = useState<'dashboard' | 'register'>('dashboard');
  const [csvUrl, setCsvUrl] = useState(() => localStorage.getItem('account2026_csv_url') || '');
  const [syncUrl, setSyncUrl] = useState(() => localStorage.getItem('account2026_sync_url') || '');
  const [dataSource, setDataSource] = useState<'live' | 'file'>(() => localStorage.getItem('account2026_csv_url') ? 'live' : 'file');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('account2026_theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });
  const [hideAmounts, setHideAmounts] = useState(() => localStorage.getItem('account2026_privacy') === 'true');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      console.log('Install prompt deferred');
    });

    window.addEventListener('appinstalled', (evt) => {
      setDeferredPrompt(null);
      console.log('App was installed');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

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
    try {
      const saved = localStorage.getItem('account2026_budgets');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to parse budgets from localStorage:', e);
      return {};
    }
  });

  const [wealthAssets, setWealthAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem('account2026_wealth');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse wealth assets from localStorage:', e);
      return [];
    }
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('account2026_goals');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse savings goals from localStorage:', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('account2026_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('account2026_wealth', JSON.stringify(wealthAssets));
  }, [wealthAssets]);

  useEffect(() => {
    localStorage.setItem('account2026_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    // Initial delay for entrance animation
    const timer = setTimeout(() => setIsReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Save CSV URL when it changes
    if (csvUrl) {
      localStorage.setItem('account2026_csv_url', csvUrl);
    }
  }, [csvUrl]);

  useEffect(() => {
    if (syncUrl) {
      localStorage.setItem('account2026_sync_url', syncUrl);
    }
  }, [syncUrl]);

  useEffect(() => {
    // If no data source and no URL, force connect modal for first time users
    if (!csvUrl && dataSource === 'live') {
      setIsModalOpen(true);
      setLoading(false);
    }
  }, [csvUrl, dataSource]);

  const syncFinancialData = async (url: string) => {
    if (!url) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      let res: Response;
      let resText = '';
      let isUsingProxy = true;

      // Use our server-side proxy to avoid CORS issues
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      
      try {
        // Try proxy first
        res = await window.fetch(`${proxyUrl}&cb=${Date.now()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        // If we get a 404 or a non-JSON response from the proxy, it means we are likely on a static host
        const contentType = res.headers.get('content-type');
        if (res.status === 404 || (contentType && contentType.includes('text/html'))) {
          console.warn('[Sync] Proxy unavailable (Static host). Trying direct fetch...');
          isUsingProxy = false;
          res = await window.fetch(`${url}&cb_direct=${Date.now()}`);
        }
      } catch (proxyErr) {
        console.warn('[Sync] Proxy communication failed. Falling back to direct fetch...', proxyErr);
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
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      setError(isTimeout ? "Sync Timeout: Connection to Google Sheets is taking too long." : err.message);
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
      if (filters.search && !(r.name + r.notes + (r.category || '') + (r.sr || '')).toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [allData, filters]);

  const categories = useMemo(() => [...new Set(allData.map(r => r.category))].filter(Boolean), [allData]);

  const kpis = useMemo(() => {
    const income = filteredData.filter(r => r.type === 'DEBIT' && (['SALARY', 'INCOM', 'INCOME'].includes((r.category || '').toUpperCase()) || (r.category || '').toUpperCase() === 'MISLINIUS')).reduce((s, r) => s + r.amount, 0);
    const expense = filteredData.filter(r => r.type === 'CREDIT' && !['BORROW', 'TRANSFER', 'SAVING'].includes((r.category || '').toUpperCase())).reduce((s, r) => s + r.amount, 0);
    
    // Just sum of "borrow" amount as requested
    const borrow = filteredData.filter(r => (r.category || '').toUpperCase() === 'BORROW').reduce((s, r) => s + r.amount, 0);
    
    // Only sum of "saving" type/category as requested
    const savings = filteredData.filter(r => r.type === 'SAVING' || (r.category || '').toUpperCase() === 'SAVING').reduce((s, r) => s + r.amount, 0);
    
    const isCashArr = (c: string) => (c || '').toUpperCase() === 'CASH';
    const isAccountArr = (c: string) => {
      const u = (c || '').toUpperCase();
      return u !== 'CASH' && u !== 'OTHER' && u !== '';
    };

    // Cash Logic following user's precise step guide - responsive to filters
    const cashData = filteredData;
    // A: SUM TOTAL DEBIT CASH (Income directly into cash)
    const cashA = cashData.filter(r => isCashArr(r.to) && r.type === 'DEBIT' && (r.category || '').toUpperCase() !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // B: SUM TOTAL CASH CONVERTED FROM JAZZCASH/OTHERS TO CASH (Transfer To Cash)
    const cashB = cashData.filter(r => (r.category || '').toUpperCase() === 'TRANSFER' && isCashArr(r.to)).reduce((s, r) => s + r.amount, 0);
    // C: SUM OF TOTAL CREDIT CASH (Standard expenses paid via cash)
    const cashC = cashData.filter(r => isCashArr(r.from) && r.type === 'CREDIT' && (r.category || '').toUpperCase() !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // D: SUM OF TOTAL CASH CONVERTED OR TRANSFER TO JAZZCASH/OTHERS (Transfer From Cash)
    const cashD = cashData.filter(r => isCashArr(r.from) && (r.category || '').toUpperCase() === 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    
    const totalCash = (cashA + cashB) - (cashC + cashD);
    
    // Total Accounts Balance (Mirrored Logic for everything not 'CASH')
    const accData = filteredData;
    // A': Income into digital accounts
    const accA = accData.filter(r => isAccountArr(r.to) && r.type === 'DEBIT' && (r.category || '').toUpperCase() !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // B': Transferred into digital accounts from elsewhere
    const accB = accData.filter(r => (r.category || '').toUpperCase() === 'TRANSFER' && isAccountArr(r.to)).reduce((s, r) => s + r.amount, 0);
    // C': Expenses from digital accounts
    const accC = accData.filter(r => isAccountArr(r.from) && r.type === 'CREDIT' && (r.category || '').toUpperCase() !== 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    // D': Transferred from digital accounts to elsewhere
    const accD = accData.filter(r => isAccountArr(r.from) && (r.category || '').toUpperCase() === 'TRANSFER').reduce((s, r) => s + r.amount, 0);
    
    const totalAccounts = (accA + accB) - (accC + accD);
    
    // Net Borrow Standing (Positive = Owed to us, Negative = We owe)
    const borrowNet = filteredData.filter(r => (r.category || '').toUpperCase() === 'BORROW').reduce((s, r) => s + (r.type === 'CREDIT' ? r.amount : -r.amount), 0);
    
    return { income, expense, net: income - expense, borrow, savings, totalCash, totalAccounts, borrowNet };
  }, [filteredData]);

  const handleConnect = (url: string, sUrl?: string) => {
    console.log(`[Connect] User provided URL: ${url}`);
    if (sUrl) {
      setSyncUrl(sUrl);
      localStorage.setItem('account2026_sync_url', sUrl);
    }

    let finalUrl = url;
    if (url.includes('docs.google.com')) {
      const { id, gid } = extractSheetInfo(url);
      if (id) {
        finalUrl = getGoogleSheetCsvUrl(id, gid || '0', 'A1:I', 'Sheet1');
        console.log(`[Connect] Built Google Sheet CSV URL for ID: ${id}`);
      }
    }
    
    setCsvUrl(finalUrl);
    localStorage.setItem('account2026_csv_url', finalUrl);
    setDataSource('live');
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

  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Pre-load logo for PDF reports
    const loadLogo = async () => {
      try {
        const resp = await fetch('/logo-light.png');
        if (!resp.ok) {
           console.warn('Logo fetch failed with status:', resp.status);
           return;
        }
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.warn('Failed to pre-load logo:', e);
      }
    };
    loadLogo();
  }, []);

  const handleReportGenerate = (data: Transaction[], title: string, format: 'PDF' | 'EXCEL', options?: any) => {
    if (format === 'PDF') {
      generatePDFReport(data, title, { ...options, logoData: logoBase64 });
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

  const handleAddTransaction = async (data: any) => {
    if (!syncUrl) {
      setError("Sync URL missing. Please configure 'Sync URL' in Connections to enable cloud saving.");
      setIsModalOpen(true);
      return false;
    }

    try {
      setError(null);
      setSuccessMsg(null);
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: syncUrl,
          method: 'POST',
          data: data
        })
      });

      const resultText = await response.text();

      // Check if Apps Script returned an error explicitly in the message
      if (!response.ok || resultText.toLowerCase().includes("error")) {
         throw new Error(resultText || "Cloud rejected the entry. Check Apps Script logs.");
      }

      if (resultText.trim() === "OK" || resultText.includes("OK")) {
        setSuccessMsg("Record confirmed by Cloud! Sycing ledger...");
        
        // 1. Give Google Sheets a moment to commit the write
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 2. Perform a fresh sync
        await syncFinancialData(csvUrl);
        
        // 3. Update success message to be final
        setSuccessMsg("Success: Entry persistent in Spreadsheet.");
        setTimeout(() => setSuccessMsg(null), 5000);
        return true;
      } else {
        throw new Error("Unexpected response from cloud sync engine.");
      }
    } catch (err: any) {
      console.error("Cloud Error:", err);
      setError(`CRITICAL: Entry NOT saved. (${err.message}). Check your Script URL and Sheet naming.`);
      return false;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg selection:bg-accent-gold/20 selection:text-accent-gold overflow-x-hidden">
      <header className="sticky top-0 z-50">
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
          onToggleFilters={() => setShowMobileFilters(!showMobileFilters)}
          showFilters={showMobileFilters}
          onAddClick={() => setIsAddModalOpen(true)}
          isInstallable={!!deferredPrompt}
          onInstallClick={handleInstallClick}
        />

        <AnimatePresence>
          {(showMobileFilters || window.innerWidth >= 640) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden sm:!h-auto sm:!opacity-100"
            >
              <FiltersBar 
                filters={filters}
                categories={categories}
                setFilters={setFilters}
                resetFilters={() => setFilters({ months: [], year: '', category: '', type: '', channel: '', search: '' })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <input 
        type="file" 
        id="file-upload-dialog" 
        className="hidden" 
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />

      {successMsg && (
        <div className="bg-income/10 border-b border-income/20 py-2 px-6 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="w-2 h-2 rounded-full bg-income animate-pulse" />
          <span className="text-[11px] font-bold text-income uppercase tracking-widest">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[10px] text-text-muted hover:text-text-primary px-2">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-expense/10 border-b border-expense/20 py-2 px-6 flex items-center justify-center gap-3">
          <AlertCircle size={14} className="text-expense" />
          <span className="text-[11px] font-bold text-expense uppercase tracking-widest">{error}</span>
          <button onClick={() => syncFinancialData(csvUrl)} className="text-[10px] bg-expense/20 px-2 py-0.5 rounded text-expense hover:bg-expense hover:text-white transition-colors">Retry</button>
        </div>
      )}

      <main className={cn(
        "flex-1 max-w-[1600px] mx-auto w-full p-6 transition-all duration-500 pb-32",
        currentView === 'register' ? "flex flex-col gap-2 pt-2 px-4 lg:px-8" : "flex flex-col gap-8"
      )}>
        {currentView === 'dashboard' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* KPI Grid */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[3px]">Key Performance Indicators</h2>
                <div className="flex-1 h-px bg-border-main" />
                <button 
                  onClick={() => setHideAmounts(!hideAmounts)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-brighter border border-border-main rounded-xl text-text-muted hover:text-text-primary transition-all hover:bg-surface-brightest active:scale-95 group"
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
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-3 mb-6">
                <div className="flex items-center gap-3 shrink-0">
                  <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[3px]">
                    {chartTab === 'overview' ? 'Trend Analytics' : 
                     chartTab === 'budget' ? 'Budget Tracking' : 
                     chartTab === 'category' ? 'Category Analysis' : 'Monthly Breakdown'}
                  </h2>
                  <div className="flex-1 lg:hidden h-px bg-border-main" />
                </div>
                
                <div className="hidden lg:block flex-1 h-px bg-border-main" />
                
                <div className="flex items-center gap-1 bg-surface-brighter p-1 rounded-xl border border-border-main overflow-x-auto scrollbar-none">
                  <button 
                    onClick={() => setChartTab('overview')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${chartTab === 'overview' ? 'bg-accent-gold text-black' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setChartTab('budget')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${chartTab === 'budget' ? 'bg-accent-gold text-black' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Budget Tracking
                  </button>
                  <button 
                    onClick={() => setChartTab('category')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${chartTab === 'category' ? 'bg-accent-gold text-black' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Category Analysis
                  </button>
                  <button 
                    onClick={() => setChartTab('month')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${chartTab === 'month' ? 'bg-accent-gold text-black' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Monthly Breakdown
                  </button>
                </div>

                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 text-[10px] font-bold bg-white/5 border border-border-main px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary transition-all active:scale-95 whitespace-nowrap"
                >
                  <FileText size={14} className="text-accent-gold" />
                  <span>Custom Report</span>
                </button>
              </div>
              {chartTab !== 'budget' ? (
                <Charts transactions={filteredData} allTransactions={allData} budgets={budgets} activeTab={chartTab as any} isDarkMode={isDarkMode} />
              ) : null}
            </section>

            {chartTab === 'budget' && (
              <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Budget Section */}
                <section>
              <BudgetSection 
                transactions={allData.filter(r => {
                  const targetYear = filters.year || String(new Date().getFullYear());
                  const targetMonths = filters.months.length > 0 ? filters.months : [MONTH_NAMES[new Date().getMonth()]];
                  return r.year === targetYear && targetMonths.includes(r.month);
                })} 
                allTransactions={allData}
                budgets={budgets}
                onUpdateBudget={(cat, amt) => setBudgets(prev => ({ ...prev, [cat]: amt }))}
              />
            </section>

            {/* Deep Analysis */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Receipt size={24} className="text-accent-gold" />
                <h2 className="text-xl font-bold text-text-primary">Advanced Intelligence</h2>
              </div>
              <AnalysisPanels transactions={filteredData} borrowStatus={filters.borrowStatus} budgets={budgets} />
            </section>

            {/* Smart Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
              <div className="lg:col-span-2 space-y-8">
                <RecurringBills transactions={allData} />
              </div>
              <div className="space-y-8">
                <SavingsGoals 
                  goals={savingsGoals}
                  onAddGoal={g => setSavingsGoals(prev => [...prev, g])}
                  onRemoveGoal={id => setSavingsGoals(prev => prev.filter(g => g.id !== id))}
                  onUpdateGoal={(id, amt) => {
                    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, saved: g.saved + amt } : g));
                  }}
                  availableBalance={kpis.net - savingsGoals.reduce((s, g) => s + g.saved, 0)}
                />
                <WealthTracker 
                  assets={wealthAssets}
                  onAddAsset={a => setWealthAssets(prev => [...prev, a])}
                  onRemoveAsset={id => setWealthAssets(prev => prev.filter(a => a.id !== id))}
                />
                <div className="dashboard-card bg-surface-brighter border-dashed border-border-main p-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-gold/5 flex items-center justify-center text-accent-gold/40">
                    <BrainCircuit size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Neural Engine Optimization</h4>
                    <p className="text-[9px] text-text-muted/60 leading-relaxed">System is continuously learning from your spending patterns to improve predictive accuracy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

        {currentView === 'register' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[calc(100vh-250px)]">
            {/* Transaction Table */}
            <section className="mb-2">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[3px]">Master Ledger</h2>
                <div className="flex-1 h-px bg-border-main" />
              </div>
              <TransactionTable 
                transactions={filteredData} 
                onGenerateReport={handleReportGenerate}
              />
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-border-main p-8 text-center bg-surface-brighter selection:bg-accent-gold/10 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="text-[10px] text-text-muted font-mono tracking-widest uppercase mb-2">
            Professional Fiscal Environment &nbsp;·&nbsp; Account 2026 Engine
          </div>
          <div className="text-[9px] text-text-secondary opacity-70">
            Secure browser-side processing. Built for high-frequency financial monitoring.
          </div>
        </div>
      </footer>

      <ConnectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
        onFileUpload={handleFileUpload}
        currentSyncUrl={syncUrl}
      />

      <AddTransactionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
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
            <div className="h-32 flex items-center justify-center">
              {isDarkMode ? (
                <img 
                  src="/logo-dark.png" 
                  alt="Account" 
                  className="h-full w-auto object-contain" 
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <img 
                  src="/logo-light.png" 
                  alt="Account" 
                  className="h-full w-auto object-contain"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  referrerPolicy="no-referrer" 
                />
              )}
            </div>
            <div className="w-12 h-12 border-4 border-border-main border-t-accent-gold rounded-full animate-spin" />
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-[4px]">Initializing Systems...</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
