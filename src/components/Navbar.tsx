import React from 'react';
import { Share2, FileDown, Printer, Database, FileText, RefreshCw, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface NavbarProps {
  onConnectClick: () => void;
  onUploadClick: () => void;
  onExportCSV: () => void;
  onReportClick: () => void;
  onRefreshClick: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  lastUpdated: string;
  status?: 'online' | 'offline';
  activeView: 'dashboard' | 'register';
  onViewChange: (view: 'dashboard' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onConnectClick, 
  onUploadClick, 
  onExportCSV, 
  onReportClick,
  onRefreshClick,
  isDarkMode,
  onThemeToggle,
  lastUpdated,
  status = 'online',
  activeView,
  onViewChange
}) => {
  const isOnline = status === 'online';

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-border-main px-6 h-[64px] flex items-center gap-6">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent-gold flex items-center justify-center text-black font-extrabold text-lg">A</div>
        <div className="hidden sm:block">
          <span className="font-display font-extrabold text-lg tracking-tighter">Account <span className="text-accent-gold">2026</span></span>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="flex items-center bg-surface-brighter p-1 rounded-xl border border-border-main shadow-lg relative">
          <button 
            onClick={() => onViewChange('dashboard')}
            className={cn(
              "relative z-10 px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
              activeView === 'dashboard' ? "text-black" : "text-text-muted hover:text-text-primary"
            )}
          >
            Dashboard & Graphs
            {activeView === 'dashboard' && (
              <motion.div 
                layoutId="nav-pill"
                className="absolute inset-0 bg-accent-gold rounded-lg -z-10 shadow-md shadow-accent-gold/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
          <button 
            onClick={() => onViewChange('register')}
            className={cn(
              "relative z-10 px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
              activeView === 'register' ? "text-black" : "text-text-muted hover:text-text-primary"
            )}
          >
            Transaction Register
            {activeView === 'register' && (
              <motion.div 
                layoutId="nav-pill"
                className="absolute inset-0 bg-accent-gold rounded-lg -z-10 shadow-md shadow-accent-gold/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className={`flex items-center gap-2 border rounded-full px-3 py-1 transition-colors duration-500 ${
          isOnline ? 'bg-income/10 border-income/20' : 'bg-expense/10 border-expense/20'
        }`}>
          <motion.div 
            animate={{ opacity: isOnline ? [1, 0.4, 1] : 1 }} 
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-income' : 'bg-expense'}`}
          />
          <span className={`text-[10px] font-bold tracking-widest uppercase ${isOnline ? 'text-income' : 'text-expense'}`}>
            {isOnline ? 'Live Tracking' : 'Offline'}
          </span>
        </div>
        
        <button 
          onClick={onConnectClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-income/30 bg-income/5 text-income text-[11px] font-bold transition-all hover:bg-income hover:text-black active:scale-95"
        >
          <Database size={14} />
          <span className="hidden md:inline">Connect Sheet</span>
        </button>

        <button 
          onClick={onRefreshClick}
          className="p-2 rounded-lg border border-border-main text-text-muted transition-all hover:text-text-primary active:scale-95 hover:bg-surface-brighter group"
          title="Refresh Data from Sheet"
        >
          <RefreshCw size={16} className="group-active:rotate-180 transition-transform duration-500" />
        </button>

        <div className="flex items-center gap-1.5 border-l border-border-main pl-4">
          <button 
            onClick={onExportCSV}
            className="p-2 rounded-lg border border-border-main text-text-muted transition-all hover:text-text-primary active:scale-90"
            title="Export CSV"
          >
            <FileDown size={18} />
          </button>
          <button 
            onClick={onThemeToggle}
            className="p-2 rounded-lg border border-border-main text-text-muted transition-all hover:text-text-primary active:scale-90"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
};
