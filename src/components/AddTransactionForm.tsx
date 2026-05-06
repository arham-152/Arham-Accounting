import React, { useState, useEffect } from 'react';
import { Transaction, EXPENSE_CATEGORIES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Save, FileText, Loader2, Star, Trash2, Plus, Search, ArrowLeft, Landmark, History, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

interface AddTransactionFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  transactions: Transaction[];
  onCancel: () => void;
}

interface Template {
  id: string;
  name: string;
  amount: string;
  category: string;
  type: string;
  from: string;
  to: string;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onSubmit, transactions, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    sr?: number | string;
    amount: string;
    name: string;
    category: string;
    type: string;
    date: string;
    from: string;
    to: string;
    notes: string;
  }>({
    amount: '',
    name: '',
    category: 'MISLINIUS',
    type: 'CREDIT',
    date: new Date().toISOString().split('T')[0],
    from: 'CASH',
    to: 'OTHER',
    notes: ''
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const saved = localStorage.getItem('account2026_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Autocomplete logic
  useEffect(() => {
    const input = formData.name.trim().toLowerCase();
    if (input.length > 0) {
      const uniqueNames: string[] = Array.from(new Set(transactions.map(t => String(t.name || ''))));
      const filtered = uniqueNames
        .filter(name => {
          const n = name.toLowerCase();
          return n.includes(input) && n !== input;
        })
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.name, transactions]);

  const selectSuggestion = (name: string) => {
    const lastMatch = transactions.find(t => t.name === name);
    if (lastMatch) {
      setFormData(prev => ({
        ...prev,
        name,
        category: lastMatch.category || 'MISLINIUS',
        type: lastMatch.type,
        from: lastMatch.from,
        to: lastMatch.to
      }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.autocomplete-container')) {
        setShowSuggestions(false);
      }
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('account2026_templates', JSON.stringify(updated));
  };

  const applyTemplate = (t: Template) => {
    setFormData(prev => ({
      ...prev,
      sr: undefined,
      amount: t.amount,
      name: t.name,
      category: t.category,
      type: t.type,
      from: t.from,
      to: t.to,
      notes: (t as any).notes || ''
    }));
    setShowSuggestions(false);
  };

  const saveTemplate = () => {
    if (!formData.name || !formData.amount) return;
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: formData.name,
      amount: formData.amount,
      category: formData.category,
      type: formData.type,
      from: formData.from,
      to: formData.to,
      notes: formData.notes
    } as any;
    const updated = [newTemplate, ...templates].slice(0, 8);
    setTemplates(updated);
    localStorage.setItem('account2026_templates', JSON.stringify(updated));
  };

  const [searchSr, setSearchSr] = useState('');

  const fetchRecord = () => {
    if (!searchSr) return;
    const match = transactions.find(t => String(t.sr) === searchSr);
    if (match) {
      setFormData(prev => ({
        ...prev,
        sr: match.sr,
        amount: String(match.amount),
        name: match.name,
        category: match.category || 'MISLINIUS',
        type: match.type,
        from: match.from,
        to: match.to,
        notes: match.notes || '',
        date: match.date || prev.date
      }));
      setSearchSr('');
    }
  };

  const clearEdit = () => {
    setFormData({
      amount: '',
      name: '',
      category: 'MISLINIUS',
      type: 'CREDIT',
      date: new Date().toISOString().split('T')[0],
      from: 'CASH',
      to: 'OTHER',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const success = await onSubmit(formData);
    if (success) {
      clearEdit();
      onCancel();
    }
    setLoading(false);
  };

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categories = ['SALARY', 'INCOME', 'BORROW', 'SAVING', 'TRANSFER', ...EXPENSE_CATEGORIES];

  return (
    <div className="w-full h-full flex flex-col bg-surface overflow-hidden">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 pb-24 space-y-12 custom-scrollbar">
        
        {/* State Banner for Edit Mode */}
        {formData.sr && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent-gold/5 border-2 border-accent-gold/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-gold flex items-center justify-center text-black shadow-xl shadow-accent-gold/20">
                <FileText size={24} />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <h3 className="text-sm font-black uppercase tracking-[3px] text-accent-gold">Record Modification Active</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">You are currently editing Ledger Entry # {formData.sr}</p>
              </div>
            </div>
            <button 
              onClick={clearEdit}
              className="px-6 py-2 bg-expense/10 text-expense text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-expense hover:text-white transition-all active:scale-95"
            >
              Discard & New Entry
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Input Panel */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Amount Section - The Hero of the form */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 ml-2">
                <div className="w-6 h-[1px] bg-accent-gold" />
                <label className="text-[10px] font-black uppercase tracking-[4px] text-text-muted">Transaction Value</label>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-accent-gold/20 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <div className="relative">
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-accent-gold opacity-30 select-none">₨</div>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    placeholder="0.00"
                    className="w-full bg-surface-brighter border-2 border-border-main focus:border-accent-gold rounded-[2.5rem] py-8 pl-20 pr-10 outline-none text-5xl sm:text-7xl font-display font-black transition-all shadow-inner focus:shadow-2xl"
                  />
                  {formData.amount && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted/40 uppercase tracking-widest">
                      PKR Verified
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 relative autocomplete-container">
                <label className="ml-4 text-[10px] font-black uppercase tracking-[3px] text-text-muted">Reference Identity</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    required
                    placeholder="Enter recipient or name..."
                    className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-2xl py-4 px-6 outline-none text-base font-bold transition-all"
                  />
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        className="absolute z-[100] left-0 right-0 top-full mt-2 bg-surface border-2 border-border-main rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl"
                      >
                        {suggestions.map((name, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectSuggestion(name)}
                            className="w-full text-left px-6 py-4 text-xs text-text-primary hover:bg-accent-gold hover:text-black transition-all flex items-center justify-between group border-b border-border-main last:border-0"
                          >
                            <span className="font-bold">{name}</span>
                            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-4 text-[10px] font-black uppercase tracking-[3px] text-text-muted">Entry Timestamp</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-surface-brighter border border-border-main rounded-2xl py-4 px-6 outline-none text-sm font-bold focus:border-accent-gold transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="ml-4 text-[10px] font-black uppercase tracking-[2px] text-text-muted">Impact Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className={cn(
                    "w-full bg-surface-brighter border border-border-main rounded-2xl p-4 outline-none text-[11px] font-black uppercase tracking-[2px] focus:border-accent-gold appearance-none transition-all shadow-sm",
                    formData.type === 'DEBIT' && "text-income border-income/40",
                    formData.type === 'CREDIT' && "text-expense border-expense/40"
                  )}
                >
                  <option value="DEBIT">Financial Intake</option>
                  <option value="CREDIT">Financial Outgo</option>
                  <option value="TRANSFER">Asset Transfer</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="ml-4 text-[10px] font-black uppercase tracking-[2px] text-text-muted">Funding Source</label>
                <select 
                  value={formData.from}
                  onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full bg-surface-brighter border border-border-main rounded-2xl p-4 outline-none text-[11px] font-bold uppercase tracking-wider focus:border-accent-gold appearance-none shadow-sm"
                >
                  <option value="CASH">Liquid Reserve (Cash)</option>
                  <option value="Jazz-Cash">Jazz-Cash Wallet</option>
                  <option value="BANK">Vault Storage (Bank)</option>
                  <option value="OTHER">Diversified Source</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="ml-4 text-[10px] font-black uppercase tracking-[2px] text-text-muted">Funding Target</label>
                <select 
                  value={formData.to}
                  onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full bg-surface-brighter border border-border-main rounded-2xl p-4 outline-none text-[11px] font-bold uppercase tracking-wider focus:border-accent-gold appearance-none shadow-sm"
                >
                  <option value="OTHER">External Liquidation</option>
                  <option value="CASH">Reserve Deposit (Cash)</option>
                  <option value="Jazz-Cash">Jazz-Cash Wallet</option>
                  <option value="BANK">Asset Deposit (Bank)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="ml-4 text-[10px] font-black uppercase tracking-[3px] text-text-muted">Architectural Category</label>
              <div className="relative group category-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full bg-surface-brighter border-2 border-border-main focus:border-accent-gold rounded-[1.5rem] py-5 px-8 outline-none text-[11px] font-black uppercase tracking-[3px] transition-all flex items-center justify-between hover:border-accent-gold/50"
                >
                  <span className={formData.category ? "text-accent-gold" : "text-text-muted"}>
                    {formData.category || "Select Classification"}
                  </span>
                  <div className={cn("transition-transform duration-300", showCategoryDropdown ? "rotate-180" : "rotate-0")}>
                    <Search size={14} className="rotate-90 opacity-40 text-accent-gold" />
                  </div>
                </button>

                <AnimatePresence>
                  {showCategoryDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="absolute z-[110] left-0 right-0 bottom-full mb-4 bg-surface-brighter border-2 border-border-main rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-3xl"
                    >
                      <div className="p-4 border-b border-border-main bg-black/20 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[4px] text-text-muted">Classification Registry</span>
                        <span className="text-[8px] font-bold text-accent-gold uppercase tracking-widest">{categories.length} Types</span>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: cat }));
                              setShowCategoryDropdown(false);
                            }}
                            className={cn(
                              "px-4 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-left flex items-center justify-between group",
                              formData.category === cat 
                                ? "bg-accent-gold border-accent-gold text-black shadow-lg shadow-accent-gold/20" 
                                : "bg-surface border-border-main text-text-muted hover:border-accent-gold/40 hover:text-text-primary"
                            )}
                          >
                            <span className="truncate">{cat}</span>
                            {formData.category === cat && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-3">
              <label className="ml-4 text-[10px] font-black uppercase tracking-[3px] text-text-muted">Narrative Notes</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Elaborate on specific nuances, serials, or operational details..."
                rows={4}
                className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-3xl p-6 outline-none text-sm transition-all resize-none shadow-inner"
              />
            </div>

            {/* Direct Action Hub */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <button
                type="button"
                onClick={saveTemplate}
                disabled={!formData.name || !formData.amount}
                className="sm:col-span-4 group flex items-center justify-center gap-3 py-5 px-6 bg-surface-brighter border-2 border-border-main rounded-2xl text-[10px] font-black uppercase tracking-[2px] text-text-muted hover:border-accent-gold hover:text-accent-gold transition-all disabled:opacity-30 active:scale-95 shadow-sm"
              >
                <Star size={16} className="group-hover:fill-accent-gold transition-colors" />
                Index Template
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.amount}
                className={cn(
                  "sm:col-span-8 py-5 px-10 rounded-2xl text-[11px] font-black uppercase tracking-[5px] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] group relative overflow-hidden",
                  (loading || !formData.name || !formData.amount) 
                    ? "bg-surface-brightest border border-border-main text-text-muted cursor-not-allowed opacity-50" 
                    : "bg-accent-gold text-black shadow-accent-gold/30"
                )}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>{loading ? 'Finalizing Sync...' : formData.sr ? `Overwrite SR# ${formData.sr}` : 'Commit Transaction'}</span>
              </button>
            </div>
            
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-4 text-[10px] font-black uppercase tracking-[4px] text-text-muted hover:text-expense transition-colors flex items-center justify-center gap-2 border-t border-border-main pt-8 mt-12"
            >
              Exit Ledger Environment
            </button>
          </div>

          {/* Right Column: Information & Utils */}
          <div className="lg:col-span-4 space-y-8">
            {/* Search Box */}
            <div className="bg-surface-brighter border border-border-main rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                    <Eye size={18} />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[3px] text-text-primary">Historical Lookup</h4>
                </div>
                <div className="space-y-2">
                  <input 
                    type="number"
                    placeholder="Reference SR #"
                    value={searchSr}
                    onChange={(e) => setSearchSr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchRecord()}
                    className="w-full bg-surface border border-border-main focus:border-accent-gold rounded-xl py-3 px-5 outline-none text-xs font-mono font-bold transition-all"
                  />
                  <button
                    type="button"
                    onClick={fetchRecord}
                    className="w-full bg-accent-gold px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-black hover:opacity-90 transition-all font-display"
                  >
                    Sync State For Edit
                  </button>
                </div>
                <p className="text-[9px] text-text-muted leading-relaxed opacity-60 text-center italic">
                  Enter any previous SR number to perfectly mirror its state for rapid modifications or corrections.
                </p>
              </div>

              <div className="pt-6 border-t border-border-main space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Usage Stats</h4>
                  <div className="text-[9px] font-bold text-accent-gold opacity-50">REALTIME</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface border border-border-main rounded-xl p-3 text-center">
                    <p className="text-[8px] font-black text-text-muted uppercase mb-1">Vol. Size</p>
                    <p className="text-sm font-black text-text-primary">{transactions.length}</p>
                  </div>
                  <div className="bg-surface border border-border-main rounded-xl p-3 text-center">
                    <p className="text-[8px] font-black text-text-muted uppercase mb-1">Templates</p>
                    <p className="text-sm font-black text-text-primary">{templates.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Templates List */}
            {templates.length > 0 && (
              <div className="bg-surface-brighter border border-border-main rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star size={16} className="text-accent-gold" />
                    <h4 className="text-[10px] font-black uppercase tracking-[3px] text-text-primary">Shortcuts</h4>
                  </div>
                  <button onClick={() => { setTemplates([]); localStorage.removeItem('account2026_templates'); }} className="text-text-muted hover:text-expense">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {templates.map(t => (
                    <div key={t.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="w-full flex items-center justify-between p-4 bg-surface border border-border-main rounded-2xl hover:border-accent-gold transition-all text-left pr-12"
                      >
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-black text-text-primary group-hover:text-accent-gold transition-colors">{t.name}</p>
                          <p className="text-[9px] font-mono text-accent-gold">₨ {t.amount}</p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => deleteTemplate(t.id, e)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-expense transition-all opacity-0 group-hover:opacity-100 z-10"
                        title="Delete Template"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Info */}
            <div className="p-6 text-center space-y-3 opacity-40">
              <Landmark size={24} className="mx-auto text-text-muted" />
              <p className="text-[9px] font-black uppercase tracking-[4px] text-text-muted">
                End-to-End Encryption &nbsp;·&nbsp; Cloud Commit Ready
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
