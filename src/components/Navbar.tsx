import React from 'react';
import { Share2, FileDown, Printer, Database, FileText, RefreshCw, Sun, Moon, PlusCircle, Plus } from 'lucide-react';
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
  onToggleFilters: () => void;
  showFilters: boolean;
  onAddClick: () => void;
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
  onViewChange,
  onToggleFilters,
  showFilters,
  onAddClick
}) => {
  const isOnline = status === 'online';

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-border-main px-4 sm:px-6 pt-4 pb-3 sm:h-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm">
      <div className="w-full sm:w-auto flex justify-between items-center sm:shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 flex items-center justify-center">
            {isDarkMode ? (
              <img src="/logo-dark.png" alt="Account" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
            ) : (
              <img src="/logo-light.png" alt="Account" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
            )}
          </div>
          <div className="hidden sm:block border-l border-border-main pl-3 h-6 flex items-center">
            <span className="font-display font-extrabold text-lg tracking-tighter">Account <span className="text-accent-gold">2026</span></span>
          </div>
        </div>
        
        {/* Mobile Status Indicator */}
        <div className="flex sm:hidden items-center gap-2 border rounded-full px-2.5 py-1 transition-colors duration-500 bg-surface-brighter border-border-main">
          <motion.div 
            animate={{ opacity: isOnline ? [1, 0.4, 1] : 1 }} 
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-income' : 'bg-expense'}`}
          />
          <span className={`text-[8px] font-bold tracking-widest uppercase ${isOnline ? 'text-income' : 'text-expense'}`}>
            {isOnline ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="w-full sm:flex-1 flex justify-center order-3 sm:order-none">
        <div className="flex items-center w-full sm:w-auto bg-surface-brighter p-1 rounded-xl border border-border-main shadow-sm relative">
          <button 
            onClick={() => onViewChange('dashboard')}
            className={cn(
              "flex-1 sm:flex-none relative z-10 px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all",
              activeView === 'dashboard' ? "text-black" : "text-text-muted hover:text-text-primary"
            )}
          >
            Graphs
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
              "flex-1 sm:flex-none relative z-10 px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all",
              activeView === 'register' ? "text-black" : "text-text-muted hover:text-text-primary"
            )}
          >
            Register
            {activeView === 'register' && (
              <motion.div 
                layoutId="nav-pill"
                className="absolute inset-0 bg-accent-gold rounded-lg -z-10 shadow-md shadow-accent-gold/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
          
          {/* Mobile Quick Add Integrated Button */}
          <button 
            onClick={onAddClick}
            className="sm:hidden flex items-center justify-center w-10 h-10 bg-accent-gold text-black rounded-lg ml-1 shadow-lg active:scale-95 transition-transform shrink-0"
            aria-label="Quick Entry"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-4 shrink-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className={`hidden sm:flex items-center gap-2 border rounded-full px-3 py-1 transition-colors duration-500 ${
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
        
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={onToggleFilters}
            className={cn(
              "sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all active:scale-95",
              showFilters 
                ? "bg-accent-gold border-accent-gold text-black" 
                : "border-border-main text-text-muted hover:text-text-primary"
            )}
          >
             <Share2 size={14} className={cn(showFilters ? "rotate-90" : "rotate-0", "transition-transform")} />
             Filters
          </button>

          <button 
            onClick={onAddClick}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent-gold/30 bg-accent-gold/5 text-accent-gold text-[11px] font-bold transition-all hover:bg-accent-gold hover:text-black active:scale-95 shadow-sm shadow-accent-gold/5"
          >
            <PlusCircle size={14} />
            <span className="hidden lg:inline">Quick Entry</span>
          </button>

          <button 
            onClick={onConnectClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-income/30 bg-income/5 text-income text-[11px] font-bold transition-all hover:bg-income hover:text-black active:scale-95"
          >
            <Database size={14} />
            <span className="hidden lg:inline">Connect</span>
          </button>

          <button 
            onClick={onRefreshClick}
            className="p-2 rounded-lg border border-border-main text-text-muted transition-all hover:text-text-primary active:scale-95 hover:bg-surface-brighter group"
            title="Refresh Data"
          >
            <RefreshCw size={16} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 border-l border-border-main pl-2 sm:pl-4">
          <button 
            onClick={onExportCSV}
            className="p-2 rounded-lg border border-border-main text-text-muted transition-all hover:text-text-primary active:scale-90"
            title="Export CSV"
          >
            <FileDown size={18} />
          </button>
          <button 
            onClick={onReportClick}
            className="p-2 rounded-lg border border-border-main text-text-muted transition-all hover:text-text-primary active:scale-90"
            title="Generate custom report"
          >
            <FileText size={18} />
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
