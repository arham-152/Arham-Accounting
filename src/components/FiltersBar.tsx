import React from 'react';
import { MONTH_NAMES, YEAR_OPTIONS } from '../types';
import { cn } from '../lib/utils';

interface FiltersBarProps {
  filters: {
    months: string[];
    year: string;
    category: string;
    type: string;
    channel: string;
    search: string;
  };
  categories: string[];
  setFilters: (filters: any) => void;
  resetFilters: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({ filters, categories, setFilters, resetFilters }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  const toggleMonth = (m: string) => {
    setFilters((prev: any) => {
      const months = prev.months.includes(m) 
        ? prev.months.filter((x: string) => x !== m)
        : [...prev.months, m];
      return { ...prev, months };
    });
  };

  return (
    <div className="sticky top-0 sm:top-[64px] lg:top-[64px] z-40 bg-bg/95 backdrop-blur-md border-b border-border-main p-3 px-4 sm:px-6 flex flex-wrap gap-3 sm:gap-4 items-end">
      <div className="flex flex-col gap-1.5 w-full lg:w-auto xl:min-w-[300px]">
        <label className="text-[9px] font-bold text-text-muted tracking-widest uppercase">Select Months</label>
        <div className="flex flex-row sm:flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {MONTH_NAMES.map(m => {
            const isActive = filters.months.includes(m);
            return (
              <button 
                key={m}
                onClick={() => toggleMonth(m)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold transition-all border",
                  isActive 
                    ? "bg-accent-gold text-black border-accent-gold" 
                    : "bg-surface-brighter text-text-muted border-border-main hover:border-text-secondary"
                )}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-bold text-text-secondary tracking-widest uppercase opacity-80">Financial Year</label>
        <select 
          name="year" 
          value={filters.year} 
          onChange={handleChange}
          className="bg-surface-brighter border border-border-main text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-accent-gold transition-colors appearance-none pr-8 bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%228%22_height=%225%22%3E%3Cpath_d=%22M0_0l4_5_4-5z%22_fill=%22%236b7280%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_8px_center]"
        >
          <option value="" className="bg-surface text-text-primary">Select Year</option>
          {YEAR_OPTIONS.map(y => <option key={y} value={y} className="bg-surface text-text-primary">{y}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-bold text-text-secondary tracking-widest uppercase opacity-80">Category</label>
        <select 
          name="category" 
          value={filters.category} 
          onChange={handleChange}
          className="bg-surface-brighter border border-border-main text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-accent-gold transition-colors appearance-none pr-8 bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%228%22_height=%225%22%3E%3Cpath_d=%22M0_0l4_5_4-5z%22_fill=%22%236b7280%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_8px_center]"
        >
          <option value="" className="bg-surface text-text-primary">All Categories</option>
          {categories.map(c => <option key={c} value={c} className="bg-surface text-text-primary">{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-bold text-text-secondary tracking-widest uppercase opacity-80">Type</label>
        <select 
          name="type" 
          value={filters.type} 
          onChange={handleChange}
          className="bg-surface-brighter border border-border-main text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-accent-gold transition-colors appearance-none pr-8 bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%228%22_height=%225%22%3E%3Cpath_d=%22M0_0l4_5_4-5z%22_fill=%22%236b7280%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_8px_center]"
        >
          <option value="" className="bg-surface text-text-primary">All Types</option>
          <option value="CREDIT" className="bg-surface text-text-primary">CREDIT</option>
          <option value="DEBIT" className="bg-surface text-text-primary">DEBIT</option>
          <option value="TRANSFER" className="bg-surface text-text-primary">TRANSFER</option>
          <option value="SAVING" className="bg-surface text-text-primary">SAVING</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-bold text-text-secondary tracking-widest uppercase opacity-80">Channel</label>
        <select 
          name="channel" 
          value={filters.channel} 
          onChange={handleChange}
          className="bg-surface-brighter border border-border-main text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-accent-gold transition-colors appearance-none pr-8 bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%228%22_height=%225%22%3E%3Cpath_d=%22M0_0l4_5_4-5z%22_fill=%22%236b7280%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_8px_center]"
        >
          <option value="" className="bg-surface text-text-primary">All</option>
          <option value="CASH" className="bg-surface text-text-primary">Cash</option>
          <option value="Jazz-Cash" className="bg-surface text-text-primary">JazzCash</option>
        </select>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-[160px]">
        <label className="text-[9px] font-bold text-text-muted tracking-widest uppercase">Search</label>
        <input 
          type="text" 
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Name or notes..."
          className="bg-surface-brighter border border-border-main text-text-primary text-xs px-3 py-1.5 rounded-lg outline-none focus:border-accent-gold transition-colors"
        />
      </div>

      <button 
        onClick={resetFilters}
        className="text-[11px] font-bold text-text-muted border border-border-main px-3 py-1.5 rounded-lg hover:border-expense hover:text-expense transition-all"
      >
        ↺ Reset
      </button>
    </div>
  );
};
