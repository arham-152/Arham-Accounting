import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Coins, TrendingUp, Plus, Trash2, Wallet } from 'lucide-react';
import { formatPKR, cn } from '../lib/utils';

export interface Asset {
  id: string;
  name: string;
  type: 'Gold' | 'Stocks' | 'Property' | 'Crypto' | 'Other';
  value: number;
}

interface WealthTrackerProps {
  assets: Asset[];
  onAddAsset: (asset: Asset) => void;
  onRemoveAsset: (id: string) => void;
}

export const WealthTracker: React.FC<WealthTrackerProps> = ({ assets, onAddAsset, onRemoveAsset }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<Asset['type']>('Other');

  const totalWealth = assets.reduce((sum, a) => sum + a.value, 0);

  const handleAdd = () => {
    if (!newName || !newValue) return;
    onAddAsset({
      id: Date.now().toString(),
      name: newName,
      value: parseFloat(newValue),
      type: newType
    });
    setNewName('');
    setNewValue('');
    setShowAdd(false);
  };

  const getIcon = (type: Asset['type']) => {
    switch (type) {
      case 'Gold': return <Coins className="text-accent-gold" />;
      case 'Stocks': return <TrendingUp className="text-income" />;
      case 'Property': return <Landmark className="text-saving" />;
      case 'Crypto': return <Wallet className="text-borrow" />;
      default: return <Landmark className="text-text-muted" />;
    }
  };

  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-0.5">Wealth & Assets</h3>
          <p className="text-[11px] text-text-muted">Track your net worth beyond cash flow</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-accent-gold font-mono">{formatPKR(totalWealth)}</div>
          <div className="text-[9px] text-text-muted uppercase tracking-widest">Total Asset Value</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {(['Gold', 'Stocks', 'Property', 'Crypto'] as const).map(type => {
          const val = assets.filter(a => a.type === type).reduce((sum, a) => sum + a.value, 0);
          return (
            <button 
              key={type} 
              onClick={() => {
                setNewType(type);
                setShowAdd(true);
              }}
              className="bg-surface-brighter border border-border-main p-2.5 rounded-2xl text-left hover:border-accent-gold/40 hover:bg-surface-brightest transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-xs">{getIcon(type as Asset['type'])}</div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{type}</span>
                </div>
                <Plus size={8} className="text-text-muted group-hover:text-accent-gold transition-colors shrink-0" />
              </div>
              <div className="text-xs font-bold text-text-primary font-mono truncate">{formatPKR(val)}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {assets.map(asset => (
          <motion.div 
            layout
            key={asset.id}
            className="flex items-center justify-between p-3 bg-surface-brighter border border-border-main rounded-xl group hover:border-border-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-border-main text-sm">
                {getIcon(asset.type)}
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">{asset.name}</div>
                <div className="text-[10px] text-text-muted font-mono">{asset.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-bold text-text-primary font-mono">{formatPKR(asset.value)}</div>
              <button 
                onClick={() => onRemoveAsset(asset.id)}
                className="p-2 text-text-muted hover:text-expense opacity-0 group-hover:opacity-100 transition-all active:scale-90"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {showAdd ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-surface-brightest border-2 border-dashed border-border-main rounded-2xl flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase">Asset Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. BTC, Plot 5..."
                    className="w-full bg-surface border border-border-main rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase">Type</label>
                  <select 
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full bg-surface border border-border-main rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-gold"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Stocks">Stocks</option>
                    <option value="Property">Property</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase">Market Value (₨)</label>
                <input 
                  type="number" 
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface border border-border-main rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-gold font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleAdd}
                  className="flex-1 bg-accent-gold text-black py-2 rounded-xl text-xs font-bold hover:bg-yellow-500 transition-colors"
                >
                  Confirm Asset
                </button>
                <button 
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border border-border-main rounded-xl text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <button 
              onClick={() => setShowAdd(true)}
              className="w-full py-2.5 border-2 border-dashed border-border-main rounded-2xl flex items-center justify-center gap-2 text-text-muted hover:text-accent-gold hover:border-accent-gold transition-all group"
            >
              <Plus size={14} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Register New Asset</span>
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
