import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Trash2, Heart, Rocket, Home, Car, GraduationCap, Briefcase } from 'lucide-react';
import { formatPKR, cn } from '../lib/utils';

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  icon: string;
}

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: SavingsGoal) => void;
  onRemoveGoal: (id: string) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  availableBalance: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Target: <Target size={16} />,
  Heart: <Heart size={16} />,
  Rocket: <Rocket size={16} />,
  Home: <Home size={16} />,
  Car: <Car size={16} />,
  GraduationCap: <GraduationCap size={16} />,
  Briefcase: <Briefcase size={16} />
};

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({ goals, onAddGoal, onRemoveGoal, onUpdateGoal, availableBalance }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newIcon, setNewIcon] = useState('Target');

  const handleAdd = () => {
    if (!newName || !newTarget) return;
    onAddGoal({
      id: Date.now().toString(),
      name: newName,
      target: parseFloat(newTarget),
      saved: 0,
      icon: newIcon
    });
    setNewName('');
    setNewTarget('');
    setShowAdd(false);
  };

  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-0.5">Multi-Stage Savings Goals</h3>
          <p className="text-[11px] text-text-muted">Allocate funds toward future milestones</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-2 bg-accent-gold/10 text-accent-gold rounded-xl hover:bg-accent-gold/20 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {goals.map(goal => {
            const percent = Math.min((goal.saved / goal.target) * 100, 100);
            return (
              <motion.div 
                layout
                key={goal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3 p-4 bg-surface-brighter border border-border-main rounded-2xl relative group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border-main flex items-center justify-center text-accent-gold shadow-lg shadow-accent-gold/5">
                      {ICON_MAP[goal.icon] || <Target size={16} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{goal.name}</h4>
                      <p className="text-[10px] text-text-muted font-mono">{formatPKR(goal.saved)} / {formatPKR(goal.target)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-bold text-accent-gold font-mono">{percent.toFixed(0)}%</div>
                      <div className="text-[9px] text-text-muted uppercase tracking-tighter">{goal.target - goal.saved > 0 ? `${formatPKR(goal.target - goal.saved)} to go` : "Goal Achieved!"}</div>
                    </div>
                    <button 
                      onClick={() => onRemoveGoal(goal.id)}
                      className="p-1.5 text-text-muted hover:text-expense opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="h-2.5 bg-surface rounded-full overflow-hidden border border-border-main/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full transition-all shadow-[0_0_12px_rgba(var(--accent-gold-rgb),0.3)]",
                        percent >= 100 ? "bg-income" : "bg-accent-gold"
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {[1000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      disabled={availableBalance < amt}
                      onClick={() => onUpdateGoal(goal.id, amt)}
                      className="flex-1 py-1 selection:bg-surface border border-border-main rounded-lg text-[9px] font-bold text-text-muted hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                    >
                      + {formatPKR(amt)}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-surface-brightest border-2 border-dashed border-border-main rounded-3xl space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Goal Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Dream House"
                  className="w-full bg-surface border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-accent-gold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Target Amount</label>
                <input 
                  type="number" 
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-accent-gold font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Select Icon</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {Object.keys(ICON_MAP).map(iconName => (
                  <button
                    key={iconName}
                    onClick={() => setNewIcon(iconName)}
                    className={cn(
                      "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all",
                      newIcon === iconName ? "bg-accent-gold text-black scale-110 shadow-lg" : "bg-surface border border-border-main text-text-muted hover:text-white"
                    )}
                  >
                    {ICON_MAP[iconName]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAdd}
                className="flex-1 bg-accent-gold text-black py-3 rounded-xl text-xs font-bold hover:bg-yellow-500 transition-all active:scale-95 shadow-xl shadow-accent-gold/10"
              >
                Launch Saving Goal
              </button>
              <button 
                onClick={() => setShowAdd(false)}
                className="px-6 py-3 border border-border-main rounded-xl text-xs text-text-muted hover:text-text-primary transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
