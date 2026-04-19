import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';

interface KPICardProps {
  label: string;
  value: number;
  subText: string;
  icon: React.ReactNode;
  colorClass: string;
  delay?: number;
  hideAmount?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, subText, icon, colorClass, delay = 0, hideAmount = false }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      className="dashboard-card relative overflow-hidden flex flex-col h-[170px] group"
    >
      {/* Premium Glow Effect */}
      <div className={cn(
        "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
        colorClass
      )} />
      
      <div className={cn("kpi-border transition-all duration-300 group-hover:h-full group-hover:opacity-10", colorClass)} />
      
      <div className="relative z-10 flex items-center gap-2 mb-2">
        <div className="text-xl transformation group-hover:scale-110 transition-transform duration-300">{icon}</div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</div>
      </div>
      
      <div className={cn("relative z-10 font-mono text-2xl font-semibold mb-1", colorClass.replace('bg-', 'text-'))}>
        {hideAmount ? (
          <span className="tracking-widest">••••••</span>
        ) : (
          <AnimatedNumber value={value} prefix="₨ " />
        )}
      </div>
      
      <div className="relative z-10 text-[11px] text-gray-400 font-mono mt-auto flex justify-between items-end">
        <span>{subText}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-accent-gold"
          >
            →
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
