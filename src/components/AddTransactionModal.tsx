import React, { useState } from 'react';
import { X, Save, Calendar, Tag, CreditCard, Landmark, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { EXPENSE_CATEGORIES, MONTH_NAMES } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: '',
    category: 'MISLINIUS',
    type: 'CREDIT',
    from: 'CASH',
    to: 'OTHER',
    notes: ''
  });

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
        to: 'OTHER',
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

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
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
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Reference / Person</label>
              <div className="relative">
                <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Who or What? (e.g. Aslam, Fuel, Grocery)"
                  className="w-full bg-surface-brighter border border-border-main focus:border-accent-gold rounded-xl py-3 pl-12 pr-4 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Entry Type</label>
                <div className="flex bg-surface-brighter p-1 rounded-xl border border-border-main">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'DEBIT' }))}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all",
                      formData.type === 'DEBIT' ? "bg-income text-black shadow-lg" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    INCOME
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'CREDIT' }))}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all",
                      formData.type === 'CREDIT' ? "bg-expense text-white shadow-lg" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    EXPENSE
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'TRANSFER', category: 'TRANSFER' }))}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all",
                      formData.type === 'TRANSFER' ? "bg-accent-gold text-black shadow-lg" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    TRANSFER
                  </button>
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
                {['SALARY', 'BORROW', 'SAVING', 'TRANSFER', ...EXPENSE_CATEGORIES].map(cat => (
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

          {/* Footer Actions */}
          <div className="p-6 bg-surface-brighter border-t border-border-main flex gap-3">
             <button
               type="button"
               onClick={onClose}
               className="flex-1 py-4 text-[10px] font-black uppercase tracking-[2px] text-text-muted hover:text-text-primary transition-colors"
             >
               Cancel
             </button>
             <button
               onClick={handleSubmit}
               disabled={loading || !formData.name || !formData.amount}
               className={cn(
                 "flex-[2] py-4 bg-accent-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-xl transition-all flex items-center justify-center gap-2",
                 (loading || !formData.name || !formData.amount) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"
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
