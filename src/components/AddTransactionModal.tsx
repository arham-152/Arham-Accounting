import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Tag, CreditCard, Landmark, FileText, Loader2, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { EXPENSE_CATEGORIES, MONTH_NAMES } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  transactions?: any[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSubmit, transactions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: '',
    category: 'MISLINIUS',
    type: 'CREDIT',
    from: 'CASH',
    to: 'CASH',
    notes: ''
  });

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('arham_ledger_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load templates", e);
      }
    }
  }, [isOpen]);

  const saveTemplate = () => {
    if (!formData.name || !formData.amount) return;
    const newTemplate = {
      id: Date.now(),
      name: formData.name,
      amount: formData.amount,
      category: formData.category,
      type: formData.type,
      from: formData.from,
      to: formData.to,
      notes: formData.notes
    };
    const updated = [newTemplate, ...templates].slice(0, 8); // Keep last 8
    setTemplates(updated);
    localStorage.setItem('arham_ledger_templates', JSON.stringify(updated));
  };

  const deleteTemplate = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('arham_ledger_templates', JSON.stringify(updated));
  };

  const applyTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      amount: template.amount,
      category: template.category,
      type: template.type,
      from: template.from,
      to: template.to,
      notes: template.notes || ''
    }));
    setShowSuggestions(false);
  };

  // Autocomplete logic
  useEffect(() => {
    if (!formData.name || formData.name.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const uniqueNames = Array.from(new Set(transactions.map(t => t.name)))
      .filter(name => name && name.toLowerCase().includes(formData.name.toLowerCase()) && name.toLowerCase() !== formData.name.toLowerCase());
    
    setSuggestions(uniqueNames.slice(0, 5)); // Show top 5 matches
    setShowSuggestions(uniqueNames.length > 0);
  }, [formData.name, transactions]);

  // Click outside and escape handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.autocomplete-container')) {
        setShowSuggestions(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSuggestions(false);
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showSuggestions]);

  const selectSuggestion = (name: string) => {
    // Find a previous transaction with this name to auto-fill other fields if possible
    const prevTrans = transactions.find(t => t.name === name);
    
    setFormData(prev => ({
      ...prev,
      name,
      category: prevTrans?.category || prev.category,
      type: prevTrans?.type || prev.type,
      from: prevTrans?.from || prev.from,
      to: prevTrans?.to || prev.to
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;
    
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    
    if (success) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        name: '',
        amount: '',
        category: 'MISLINIUS',
        type: 'CREDIT',
        from: 'CASH',
        to: 'CASH',
        notes: ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-surface border border-border-main rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-main flex justify-between items-center bg-surface-brighter">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <CreditCard size={20} />
              </div>
              <h3 className="text-xl font-display font-black tracking-tight">Record Entry</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface rounded-full transition-colors text-text-muted hover:text-text-primary"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* Quick Templates Section */}
            {templates.length > 0 && (
              <div className="space-y-2 mb-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-accent-gold">Quick Templates</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="flex-shrink-0 px-4 py-2 bg-surface-brighter border border-border-main rounded-xl flex items-center gap-2 hover:border-accent-gold group transition-all"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold text-text-primary truncate max-w-[80px]">{t.name}</span>
                        <span className="text-[8px] font-mono text-text-muted">₨{t.amount}</span>
                      </div>
                      <div 
                        onClick={(e) => deleteTemplate(t.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-expense transition-opacity"
                      >
                        <Trash2 size={10} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount - The Hero Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Amount (PKR)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent-gold opacity-50">₨</div>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    placeholder="0.00"
                    className="w-full bg-surface-brighter border-2 border-border-main focus:border-accent-gold rounded-2xl py-5 pl-12 pr-6 outline-none text-3xl font-display font-black transition-all"
                  />
                </div>
              </div>

              {/* Reference Name */}
              <div className="space-y-2 relative autocomplete-container">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Reference / Person</label>
                <div className="relative">
                  <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    required
                    placeholder="Who or What? (e.g. Aslam, Fuel, Grocery)"
                    className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-xl py-3 pl-12 pr-4 outline-none text-sm transition-all"
                  />
                </div>

                {/* Autocomplete Suggestions */}
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-[160] left-0 right-0 top-full mt-1 bg-surface-brighter border border-border-main rounded-xl shadow-2xl overflow-hidden"
                    >
                      {suggestions.map((name, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectSuggestion(name)}
                          className="w-full text-left px-4 py-2.5 text-xs text-text-primary hover:bg-accent-gold hover:text-black transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                        >
                          <FileText size={12} className="opacity-40" />
                          <span className="font-bold">{name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Entry Type</label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData(prev => ({ 
                          ...prev, 
                          type: newType,
                          category: newType === 'TRANSFER' ? 'TRANSFER' : prev.category
                        }));
                      }}
                      className={cn(
                        "w-full bg-surface-brighter border border-border-main rounded-xl p-3 outline-none text-xs font-bold focus:border-accent-gold appearance-none transition-all",
                        formData.type === 'DEBIT' && "text-income border-income/30",
                        formData.type === 'CREDIT' && "text-expense border-expense/30",
                        formData.type === 'TRANSFER' && "text-accent-gold border-accent-gold/30"
                      )}
                    >
                      <option value="DEBIT">INCOME (DEBIT)</option>
                      <option value="CREDIT">EXPENSE (CREDIT)</option>
                      <option value="TRANSFER">TRANSFER</option>
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-surface-brighter border border-border-main rounded-xl py-2.5 pl-9 pr-3 outline-none text-xs font-bold focus:border-accent-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Channels */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">From (Source)</label>
                   <select 
                     value={formData.from}
                     onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                     className="w-full bg-surface-brighter border border-border-main rounded-xl p-3 outline-none text-xs font-bold focus:border-accent-gold appearance-none"
                   >
                     <option value="CASH">CASH</option>
                     <option value="Jazz-Cash">JAZZ-CASH</option>
                     <option value="BANK">BANK</option>
                     <option value="OTHER">OTHER</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">To (Target)</label>
                   <select 
                     value={formData.to}
                     onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                     className="w-full bg-surface-brighter border border-border-main rounded-xl p-3 outline-none text-xs font-bold focus:border-accent-gold appearance-none"
                   >
                     <option value="CASH">CASH</option>
                     <option value="Jazz-Cash">JAZZ-CASH</option>
                     <option value="BANK">BANK</option>
                     <option value="OTHER">OTHER (Expense)</option>
                   </select>
                 </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Category</label>
                <div className="flex flex-wrap gap-2">
                  {['SALARY', 'INCOME', 'BORROW', 'SAVING', 'TRANSFER', ...EXPENSE_CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[10px] font-bold border transition-all",
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

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Special Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes or details..."
                  rows={2}
                  className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-xl p-4 outline-none text-sm transition-all resize-none"
                />
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-surface-brighter border-t border-border-main flex flex-col gap-3">
             <div className="flex gap-3">
               <button
                 type="button"
                 onClick={saveTemplate}
                 disabled={!formData.name || !formData.amount}
                 className="flex-1 py-3 bg-surface border border-border-main text-[9px] font-black uppercase tracking-[1px] text-text-muted hover:border-accent-gold hover:text-accent-gold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 <Star size={12} />
                 Save Template
               </button>
               <button
                 type="button"
                 onClick={onClose}
                 className="flex-1 py-3 text-[9px] font-black uppercase tracking-[1px] text-text-muted hover:text-text-primary transition-colors"
               >
                 Cancel
               </button>
             </div>
             
             <button
               onClick={handleSubmit}
               disabled={loading || !formData.name || !formData.amount}
               className={cn(
                 "w-full py-4 bg-accent-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-xl transition-all flex items-center justify-center gap-2",
                 (loading || !formData.name || !formData.amount) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01] active:scale-95"
               )}
             >
               {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
               {loading ? 'Submitting...' : 'Confirm Entry'}
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
