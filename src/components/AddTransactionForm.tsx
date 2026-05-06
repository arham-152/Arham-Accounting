import React, { useState, useEffect } from 'react';
import { Transaction, EXPENSE_CATEGORIES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Save, FileText, Loader2, Star, Trash2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({
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
    if (formData.name.length > 0) {
      const uniqueNames: string[] = Array.from(new Set(transactions.map(t => String(t.name || ''))));
      const filtered = uniqueNames
        .filter(name => name.toLowerCase().includes(formData.name.toLowerCase()))
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

  const applyTemplate = (t: Template) => {
    setFormData(prev => ({
      ...prev,
      amount: t.amount,
      name: t.name,
      category: t.category,
      type: t.type,
      from: t.from,
      to: t.to
    }));
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
      to: formData.to
    };
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
        amount: String(match.amount),
        name: match.name,
        category: match.category || 'MISLINIUS',
        type: match.type,
        from: match.from,
        to: match.to,
        notes: match.notes || ''
      }));
      setSearchSr('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const success = await onSubmit(formData);
    if (success) {
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
      onCancel(); // Use cancel logic to go back
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface overflow-hidden">
      {/* Scrollable Form Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Fetch Old Record Section - Optimized for space */}
        <div className="bg-surface-brighter border border-border-main rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[2px] text-accent-gold">Fetch Old Record</h3>
            <span className="text-[8px] text-text-muted font-bold opacity-50">QUICK EDIT MODE</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="number"
                placeholder="Enter SR Number (#)"
                value={searchSr}
                onChange={(e) => setSearchSr(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRecord()}
                className="w-full bg-surface border border-border-main focus:border-accent-gold rounded-xl py-2 px-3 outline-none text-xs font-mono transition-all"
              />
            </div>
            <button
              type="button"
              onClick={fetchRecord}
              className="bg-accent-gold px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent-gold/20"
            >
              Fetch
            </button>
          </div>
        </div>

        {/* Templates Row */}
        {templates.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-accent-gold">Quick Templates</label>
              <button 
                type="button"
                onClick={() => {
                  setTemplates([]);
                  localStorage.removeItem('account2026_templates');
                }}
                className="text-text-muted hover:text-expense p-1"
                title="Clear all templates"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="flex-shrink-0 px-3 py-2 bg-surface-brighter border border-border-main rounded-xl hover:border-accent-gold transition-all group"
                >
                  <p className="text-[11px] font-bold text-text-primary group-hover:text-accent-gold">{t.name}</p>
                  <p className="text-[9px] font-mono text-text-muted text-left">₨{t.amount}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="space-y-4">
          {/* Main Amount - Focus Point */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Amount (PKR)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-accent-gold opacity-50">₨</div>
              <input 
                type="number" 
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
                placeholder="0.00"
                className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-2xl py-4 pl-12 pr-6 outline-none text-3xl font-display font-black transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Recipient / Name */}
          <div className="space-y-1.5 relative autocomplete-container">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Reference / Person</label>
            <div className="relative">
              <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                required
                placeholder="Who or what is this for?"
                className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-2xl py-3 pl-12 pr-4 outline-none text-sm transition-all"
              />
            </div>

            <AnimatePresence>
              {showSuggestions && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-[100] left-0 right-0 top-full mt-2 bg-surface border border-border-main rounded-2xl shadow-2xl overflow-hidden"
                >
                  {suggestions.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSuggestion(name)}
                      className="w-full text-left px-5 py-3 text-xs text-text-primary hover:bg-accent-gold hover:text-black transition-colors flex items-center gap-3 border-b border-border-main last:border-0"
                    >
                      <FileText size={14} className="opacity-40" />
                      <span className="font-bold">{name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid for Primary Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Entry Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className={cn(
                  "w-full bg-surface-brighter border border-border-main rounded-2xl p-3 outline-none text-[11px] font-bold focus:border-accent-gold appearance-none transition-all",
                  formData.type === 'DEBIT' && "text-income border-income/30",
                  formData.type === 'CREDIT' && "text-expense border-expense/30"
                )}
              >
                <option value="DEBIT">INCOME (DEBIT)</option>
                <option value="CREDIT">EXPENSE (CREDIT)</option>
                <option value="TRANSFER">INTERNAL TRANSFER</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Transaction Date</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-surface-brighter border border-border-main rounded-2xl p-3 outline-none text-[11px] font-bold focus:border-accent-gold"
              />
            </div>
          </div>

          {/* Sources & Targets */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">From (Source)</label>
              <select 
                value={formData.from}
                onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                className="w-full bg-surface-brighter border border-border-main rounded-2xl p-3 outline-none text-[11px] font-bold focus:border-accent-gold appearance-none"
              >
                <option value="CASH">Liquid Cash</option>
                <option value="Jazz-Cash">Jazz-Cash Wallet</option>
                <option value="BANK">Bank Account</option>
                <option value="OTHER">Other Source</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">To (Target)</label>
              <select 
                value={formData.to}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                className="w-full bg-surface-brighter border border-border-main rounded-2xl p-3 outline-none text-[11px] font-bold focus:border-accent-gold appearance-none"
              >
                <option value="OTHER">Standard Purchase</option>
                <option value="CASH">Physical Cash</option>
                <option value="Jazz-Cash">Jazz-Cash Wallet</option>
                <option value="BANK">Bank Account</option>
              </select>
            </div>
          </div>

          {/* Category Scroller */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Economic Category</label>
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
              {['SALARY', 'INCOME', 'BORROW', 'SAVING', 'TRANSFER', ...EXPENSE_CATEGORIES].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap uppercase tracking-widest",
                    formData.category === cat 
                      ? "bg-accent-gold/10 border-accent-gold text-accent-gold" 
                      : "bg-surface-brighter border-border-main text-text-muted hover:border-text-muted"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pb-20">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Additional Information</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Record any specific nuances, serial numbers, or details about this entry..."
              rows={2}
              className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-2xl p-4 outline-none text-xs transition-all resize-none"
            />
          </div>
        </form>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-surface/80 backdrop-blur-xl border-t border-border-main max-w-[1600px] mx-auto w-full z-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={saveTemplate}
            disabled={!formData.name || !formData.amount}
            className="flex-1 py-3 bg-surface border border-border-main text-[10px] font-black uppercase tracking-[2px] text-text-muted hover:border-accent-gold hover:text-accent-gold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Star size={14} />
            Keep as Template
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.amount}
            className={cn(
              "flex-[2] py-4 bg-accent-gold text-black rounded-2xl text-[11px] font-black uppercase tracking-[3px] shadow-2xl flex items-center justify-center gap-3 transition-all",
              (loading || !formData.name || !formData.amount) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95 shadow-accent-gold/20"
            )}
          >
            {loading ? <Loader2 className="animate-spin text-black" size={18} /> : <Save className="text-black" size={18} />}
            {loading ? 'Processing Ledger...' : 'Commit Transaction'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="sm:hidden py-3 text-[10px] font-black uppercase tracking-[2px] text-text-muted hover:text-expense transition-colors"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    </div>
  );
};
