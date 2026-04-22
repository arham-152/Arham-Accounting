import React, { useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar, Radar, PolarArea } from 'react-chartjs-2';
import { 
  BarChart as ReBarChart, 
  Bar as ReBar, 
  XAxis as ReXAxis, 
  YAxis as ReYAxis, 
  CartesianGrid as ReGrid, 
  Tooltip as ReTooltip, 
  Legend as ReLegend, 
  ResponsiveContainer 
} from 'recharts';
import { Transaction, EXPENSE_CATEGORIES, CATEGORY_COLORS, MONTH_NAMES } from '../types';
import { formatPKR, getPercentage } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Zap } from 'lucide-react';

// Register ChartJS modules
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  ArcElement, RadialLinearScale, Filler, Title, Tooltip, Legend
);

const ChartCard: React.FC<{ 
  title: string; 
  sub: string; 
  children: React.ReactNode; 
  height?: number; 
  delay?: number;
  logicInfo?: string;
}> = ({ title, sub, children, height = 290, delay = 0, logicInfo }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
    className="dashboard-card p-4 sm:p-5 group/card"
  >
    <div className="flex justify-between items-start mb-0.5">
      <h3 className="text-xs sm:text-sm font-bold">{title}</h3>
      {logicInfo && (
        <div className="relative group/logic">
          <div className="cursor-help text-text-muted hover:text-accent-gold transition-colors">
            <Info size={14} />
          </div>
          {/* Chart Logic Tooltip */}
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-surface-brightest border border-border-main rounded-xl shadow-2xl opacity-0 invisible group-hover/logic:opacity-100 group-hover/logic:visible transition-all z-50 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-accent-gold" />
              <span className="text-[9px] uppercase font-black text-accent-gold tracking-widest leading-none">Logic Info</span>
            </div>
            <p className="text-[10px] text-text-primary leading-relaxed font-medium">
              {logicInfo}
            </p>
          </div>
        </div>
      )}
    </div>
    <p className="text-[10px] sm:text-[11px] text-text-muted mb-6">{sub}</p>
    <div className="relative h-[240px] sm:h-[280px]" style={height ? { height: `calc(${height}px * 0.85)` } : undefined}>
      {children}
    </div>
  </motion.div>
);

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: 'easeOutQuart' as const,
  },
  hover: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      labels: {
        color: '#a0a8b8',
        font: { size: 9, family: 'Inter' },
        boxWidth: 8,
        padding: 10
      }
    },
    tooltip: {
      backgroundColor: '#1e2330',
      titleColor: '#e8eaf0',
      bodyColor: '#a0a8b8',
      borderColor: '#2a3040',
      borderWidth: 1,
      padding: 10,
      bodyFont: { family: 'JetBrains Mono', size: 11 },
      callbacks: {
        label: (context: any) => ` ${formatPKR(context.parsed.y || context.parsed || 0)}`
      },
      intersect: false,
      mode: 'index' as const,
    }
  },
  scales: {
    x: {
      ticks: { color: '#6b7280', font: { size: 9 } },
      grid: { color: 'rgba(31,36,48,0.5)' }
    },
    y: {
      ticks: { 
        color: '#6b7280', 
        font: { size: 9 },
        callback: (value: any) => {
          if (value >= 1000) return `₨${(value/1000).toFixed(value >= 10000 ? 0 : 1)}k`;
          return `₨${value}`;
        }
      },
      grid: { color: 'rgba(31,36,48,0.5)' }
    }
  }
};

interface ChartsProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  budgets: Record<string, number>;
  activeTab: 'overview' | 'category' | 'month';
  isDarkMode: boolean;
}

export const Charts: React.FC<ChartsProps> = ({ transactions, allTransactions, budgets, activeTab, isDarkMode }) => {
  const textColor = isDarkMode ? '#a0a8b8' : '#64748b';
  const gridColor = isDarkMode ? 'rgba(31,36,48,0.5)' : 'rgba(203,213,225,0.4)';
  const tooltipBg = isDarkMode ? '#1e2330' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#2a3040' : '#e2e8f0';

  const themeOptions = useMemo(() => ({
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        labels: {
          ...commonOptions.plugins.legend.labels,
          color: textColor
        }
      },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        backgroundColor: tooltipBg,
        titleColor: isDarkMode ? '#e8eaf0' : '#1e293b',
        bodyColor: textColor,
        borderColor: tooltipBorder,
      }
    },
    scales: {
      x: {
        ...commonOptions.scales.x,
        ticks: { ...commonOptions.scales.x.ticks, color: textColor },
        grid: { color: gridColor }
      },
      y: {
        ...commonOptions.scales.y,
        ticks: { ...commonOptions.scales.y.ticks, color: textColor },
        grid: { color: gridColor }
      },
      r: {
        angleLines: { color: gridColor },
        grid: { color: gridColor },
        pointLabels: { color: textColor, font: { size: 9 } },
        ticks: { display: false }
      }
    }
  }), [isDarkMode, textColor, gridColor, tooltipBg, tooltipBorder]);

  const timeline = useMemo(() => {
    const pairs = transactions.map(t => ({ month: t.month, year: t.year }));
    const unique = Array.from(new Set(pairs.map(p => `${p.month} ${p.year}`)))
      .map((s: string) => {
        const [month, year] = s.split(' ');
        return { 
          month, 
          year, 
          label: [month.slice(0, 3), year], // Multi-line label: Month top, Year bottom
          key: s,
          sortVal: parseInt(year) * 100 + MONTH_NAMES.indexOf(month)
        };
      })
      .sort((a, b) => a.sortVal - b.sortVal);
    return unique;
  }, [transactions]);

  const categories = useMemo(() => {
    return [...new Set(transactions.map(t => t.category))].filter(Boolean).sort();
  }, [transactions]);

  // Line Chart Data
  const lineData = {
    labels: timeline.map(t => t.label),
    datasets: EXPENSE_CATEGORIES.map(cat => ({
      label: cat,
      data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0)),
      borderColor: CATEGORY_COLORS[cat],
      backgroundColor: CATEGORY_COLORS[cat] + '22',
      tension: 0.4,
      pointRadius: 2,
    }))
  };

  // Donut Chart Data
  const totals = EXPENSE_CATEGORIES.map(cat => transactions.filter(r => r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0));
  const totalSpend = totals.reduce((a, b) => a + b, 0);
  const donutData = {
    labels: EXPENSE_CATEGORIES,
    datasets: [{
      data: totals,
      backgroundColor: EXPENSE_CATEGORIES.map(c => CATEGORY_COLORS[c]),
      borderColor: '#111318',
      borderWidth: 2
    }]
  };

  const radarData = {
    labels: EXPENSE_CATEGORIES,
    datasets: [{
      label: 'Intensity',
      data: totals,
      backgroundColor: 'rgba(240, 180, 41, 0.1)',
      borderColor: '#f0b429',
      pointBackgroundColor: '#f0b429',
      pointBorderColor: '#fff',
      borderWidth: 2
    }]
  };

  // Stacked Bar Data
  const stackedData = {
    labels: timeline.map(t => t.label),
    datasets: EXPENSE_CATEGORIES.map(cat => ({
      label: cat,
      data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0)),
      backgroundColor: CATEGORY_COLORS[cat],
      stack: 'total'
    }))
  };

  // Monthly Revenue Trend (Income vs Expenses)
  const revenueTrendData = {
    labels: timeline.map(t => t.label),
    datasets: [
      {
        label: 'Monthly Income',
        data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0)),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
      },
      {
        label: 'Monthly Expenses',
        data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.type === 'CREDIT' && r.category !== 'BORROW').reduce((s, r) => s + r.amount, 0)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
      }
    ]
  };

  // Comparative Chart Data
  const compData = {
    labels: timeline.map(t => t.label),
    datasets: [
      {
        label: 'Income',
        data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0)),
        backgroundColor: '#22c55e',
        borderRadius: 4,
      },
      {
        label: 'Expense',
        data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.type === 'CREDIT' && r.category !== 'BORROW').reduce((s, r) => s + r.amount, 0)),
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
      {
        label: 'Borrow',
        data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.category === 'BORROW').reduce((s, r) => s + r.amount, 0)),
        backgroundColor: '#f59e0b',
        borderRadius: 4,
      }
    ]
  };

  // Cumulative Chart Data
  const cumulativeData = useMemo(() => {
    const sorted = [...transactions]
      .filter(t => t.type === 'CREDIT')
      .sort((a, b) => a.date.localeCompare(b.date));
    
    let runningTotal = 0;
    const points = sorted.map(t => {
      runningTotal += t.amount;
      return { x: t.date, y: runningTotal };
    });

    const step = Math.max(1, Math.floor(points.length / 50));
    const finalPoints = points.filter((_, i) => i % step === 0);
    if (points.length > 0 && finalPoints[finalPoints.length - 1] !== points[points.length - 1]) {
      finalPoints.push(points[points.length - 1]);
    }

    return {
      labels: finalPoints.map(p => p.x.slice(5)), // MM-DD
      datasets: [{
        label: 'Cumulative Spend',
        data: finalPoints.map(p => p.y),
        borderColor: '#f0b429',
        backgroundColor: 'rgba(240, 180, 41, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
      }]
    };
  }, [transactions]);  // Benchmark Analysis (3-Month Avg vs Current)
  const benchmarkData = useMemo(() => {
    // 1. Identify the reference month/year (latest in the shown transactions)
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sorted.length === 0) return { labels: [], datasets: [] };
    
    const curMonth = sorted[0].month;
    const curYear = sorted[0].year;
    
    // Find target months for average
    const curIdx = MONTH_NAMES.indexOf(curMonth);
    const targetMonths: { month: string, year: string }[] = [];
    
    for (let i = 1; i <= 3; i++) {
       let mIdx = curIdx - i;
       let y = parseInt(curYear);
       if (mIdx < 0) {
         mIdx += 12;
         y -= 1;
       }
       targetMonths.push({ month: MONTH_NAMES[mIdx], year: String(y) });
    }

    const averages: Record<string, number> = {};
    const currentSpending: Record<string, number> = {};

    EXPENSE_CATEGORIES.forEach(cat => {
      // 3-Month Historical Average
      const histTxns = allTransactions.filter(t => 
        t.category === cat && 
        t.type === 'CREDIT' && 
        targetMonths.some(tm => tm.month === t.month && tm.year === t.year)
      );
      averages[cat] = histTxns.reduce((sum, t) => sum + t.amount, 0) / 3;

      // Current Month Spending
      currentSpending[cat] = transactions.filter(t => 
        t.category === cat && 
        t.type === 'CREDIT' &&
        t.month === curMonth &&
        t.year === curYear
      ).reduce((sum, t) => sum + t.amount, 0);
    });

    return {
      labels: EXPENSE_CATEGORIES.map(c => c.length > 8 ? c.slice(0, 5) + '..' : c),
      datasets: [
        {
          label: '3-Month Avg',
          data: EXPENSE_CATEGORIES.map(c => averages[c] || 0),
          backgroundColor: '#94a3b8aa', // Muted blue/gray for historical
          borderColor: '#94a3b8',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Current Month',
          data: EXPENSE_CATEGORIES.map(c => currentSpending[c] || 0),
          backgroundColor: EXPENSE_CATEGORIES.map(c => CATEGORY_COLORS[c] + 'bb'),
          borderColor: EXPENSE_CATEGORIES.map(c => CATEGORY_COLORS[c]),
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  }, [allTransactions, transactions]);

  const yearlySummary = useMemo(() => {
    const years = [...new Set(allTransactions.map(t => t.year))].sort();
    return years.map(year => {
      const yearTxns = allTransactions.filter(t => t.year === year);
      const income = yearTxns.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
      const expense = yearTxns.filter(t => t.type === 'CREDIT' && t.category !== 'BORROW').reduce((s, t) => s + t.amount, 0);
      return { year, income, expense };
    });
  }, [allTransactions]);

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pb-6">
      <ChartCard 
        title="Overall Flow" 
        sub="Income vs Expense vs Borrow comparison" 
        delay={0.1}
        logicInfo="Aggregates Monthly Income (DEBIT), Monthly Expenses (CREDIT excluding Borrow), and Monthly Borrowings. It provides a macro view of capital movement."
      >
        <Bar data={compData} options={themeOptions} />
      </ChartCard>

      <ChartCard 
        title="Benchmark Analysis" 
        sub="Current vs 3-Month Historical Average" 
        delay={0.15}
        logicInfo="Calculates the average spending of the previous 3 full months per category and compares it against the latest month in your ledger to identify over-spending."
      >
        <Bar data={benchmarkData} options={{
          ...themeOptions,
          scales: {
            ...themeOptions.scales,
            x: {
              ...themeOptions.scales.x,
              ticks: { ...themeOptions.scales.x.ticks, font: { size: 8 } }
            }
          }
        }} />
      </ChartCard>

      <ChartCard 
        title="Cumulative Spend" 
        sub="Running total of all expenses" 
        delay={0.2}
        logicInfo="A continuous running sum of every single expense recorded, sorted by date. It shows the total amount of money that has left your accounts since day one."
      >
        <Line data={cumulativeData as any} options={{
          ...themeOptions,
          scales: {
            ...themeOptions.scales,
              y: {
                ...themeOptions.scales.y,
                ticks: {
                  ...themeOptions.scales.y.ticks,
                  callback: (value: any) => {
                    if (value >= 1000) return `₨${(value/1000).toFixed(value >= 10000 ? 0 : 1)}k`;
                    return `₨${value}`;
                  }
                }
              }
          }
        }} />
      </ChartCard>

      <ChartCard 
        title="Category Intensity" 
        sub="Spend focal points" 
        delay={0.3} 
        height={300}
        logicInfo="Plots lifetime category totals. The larger the area, the more dominant that category is in your spending habits."
      >
        <Radar data={radarData} options={{
          ...themeOptions,
          plugins: {
            ...themeOptions.plugins,
            legend: {
              ...themeOptions.plugins.legend,
              display: window.innerWidth > 640
            }
          }
        }} />
      </ChartCard>

      <ChartCard 
        title="Growth Highlights" 
        sub="Financial trajectory" 
        delay={0.4}
        logicInfo="Compares Monthly Net Savings (Income vs Expense) over time to track your wealth trajectory."
      >
        <Line data={revenueTrendData} options={{
          ...themeOptions,
          scales: {
            ...themeOptions.scales,
            x: { ...themeOptions.scales.x, title: { display: window.innerWidth > 640, text: 'Month', color: textColor, font: { size: 10, weight: 'bold' } } },
            y: { ...themeOptions.scales.y, title: { display: window.innerWidth > 640, text: 'Amount', color: textColor, font: { size: 10, weight: 'bold' } } }
          }
        }} />
      </ChartCard>

      <ChartCard 
        title="Spending Trend" 
        sub="Category tracking" 
        delay={0.5}
        logicInfo="Splits expense data by category per month. Useful for seeing which specific costs are rising or falling."
      >
        <Line data={lineData} options={themeOptions} />
      </ChartCard>
      
      <ChartCard 
        title="Category Allocation" 
        sub="Spending breakdown" 
        delay={0.6}
        logicInfo="Shows the percentage share of each category within your total lifetime spending."
      >
        <Doughnut 
          data={donutData} 
          options={{
            ...themeOptions,
            cutout: '65%',
            plugins: {
              ...themeOptions.plugins,
              legend: {
                ...themeOptions.plugins.legend,
                position: window.innerWidth < 1024 ? 'bottom' : 'right' as const,
                labels: {
                  ...themeOptions.plugins.legend.labels,
                  font: { size: 8 }
                }
              },
              tooltip: {
                ...themeOptions.plugins.tooltip,
                callbacks: {
                  label: (c: any) => ` ${formatPKR(c.parsed)} (${getPercentage(c.parsed, totalSpend)})`
                }
              }
            }
          }} 
        />
      </ChartCard>

      <ChartCard 
        title="Stacked Composition" 
        sub="Layering per month" 
        delay={0.7}
        logicInfo="Visualizes how different categories stack up in your monthly budget totals."
      >
        <Bar data={stackedData} options={themeOptions} />
      </ChartCard>

      <ChartCard 
        title="Channel Distribution" 
        sub="Payment volumes" 
        delay={0.8}
        logicInfo="Breaks down total inflows and outflows specifically by account/medium (CASH vs Jazz-Cash)."
      >
        <PolarArea 
          data={{
            labels: ['Cash Exp', 'Jazz Exp', 'Cash Inc', 'Jazz Inc'],
            datasets: [{
              data: [
                transactions.filter(r => r.from === 'CASH' && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0),
                transactions.filter(r => r.from === 'Jazz-Cash' && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0),
                transactions.filter(r => r.from === 'CASH' && r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0),
                transactions.filter(r => r.from === 'Jazz-Cash' && r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0),
              ],
              backgroundColor: ['#ef444455', '#f0b42955', '#22c55e55', '#4ecdc455'],
              borderColor: ['#ef4444', '#f0b429', '#22c55e', '#4ecdc4'],
              borderWidth: 1.5
            }]
          }}
          options={{
            ...themeOptions,
            plugins: {
              ...themeOptions.plugins,
              legend: {
                ...themeOptions.plugins.legend,
                position: 'bottom'
              }
            }
          }}
        />
      </ChartCard>

      <ChartCard 
        title="Yearly Fiscal Comparison" 
        sub="Income vs Expense volume" 
        delay={0.9}
        logicInfo="Aggregates total Volume of Income (DEBIT) and Expenses (CREDIT) for each calendar year. Stacked bars show the total economic scale per year."
      >
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={yearlySummary} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <ReGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <ReXAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: textColor, fontSize: 10 }}
            />
            <ReYAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: textColor, fontSize: 10 }}
              tickFormatter={(v) => v >= 1000 ? `₨${(v/1000).toFixed(0)}k` : `₨${v}`}
            />
            <ReTooltip 
              contentStyle={{ 
                backgroundColor: tooltipBg, 
                borderColor: tooltipBorder, 
                borderRadius: '12px',
                fontSize: '11px',
                color: textColor 
              }}
              itemStyle={{ fontSize: '11px', padding: '2px 0' }}
              formatter={(value: number) => [formatPKR(value), '']}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <ReLegend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }}
            />
            <ReBar dataKey="income" name="Income" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <ReBar dataKey="expense" name="Expense" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </ReBarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  const renderCategoryTrends = () => {
    const borrowTxns = allTransactions.filter(t => t.category === 'BORROW');
    const personBalances: Record<string, number> = {};
    borrowTxns.forEach(t => {
      const v = t.type === 'DEBIT' ? t.amount : -t.amount;
      personBalances[t.name] = (personBalances[t.name] || 0) + v;
    });

    const borrowEntries = Object.entries(personBalances)
      .filter(([_, balance]) => Math.abs(balance) > 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 15);

    return (
      <div className="flex flex-col gap-8 pb-6">
        {borrowEntries.length > 0 && (
          <div className="col-span-full">
            <ChartCard 
              title="BORROW LEDGER SNAPSHOT" 
              sub="Person-wise net position (Green = You get, Red = You owe)" 
              height={320}
              logicInfo="Calculates balance per person by adding DEBITS (what they owe you / inflow) and subtracting CREDITS (what you owe them / outflow). Shows the top 15 active relationships."
            >
              <Bar 
                data={{
                  labels: borrowEntries.map(e => e[0]),
                  datasets: [{
                    label: 'Balance',
                    data: borrowEntries.map(e => e[1]),
                    backgroundColor: borrowEntries.map(e => e[1] > 0 ? '#10b98188' : '#ef444488'),
                    borderColor: borrowEntries.map(e => e[1] > 0 ? '#10b981' : '#ef4444'),
                    borderWidth: 1.5,
                    borderRadius: 4
                  }]
                }} 
                options={{
                  ...commonOptions,
                  indexAxis: 'y' as const,
                  plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false }
                  }
                }} 
              />
            </ChartCard>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const data = {
              labels: timeline.map(t => t.label),
              datasets: [{
                label: cat,
                data: timeline.map(t => transactions.filter(r => r.month === t.month && r.year === t.year && r.category === cat && r.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)),
                backgroundColor: (CATEGORY_COLORS[cat] || '#6b7280') + 'bb',
                borderColor: CATEGORY_COLORS[cat] || '#6b7280',
                borderWidth: 1,
                borderRadius: 2
              }]
            };
            return (
              <ChartCard key={cat} title={cat} sub={`Monthly trend for ${cat.toLowerCase()} expenses`} height={200}>
                <Bar data={data} options={{
                  ...themeOptions,
                  plugins: { ...themeOptions.plugins, legend: { display: false } }
                }} />
              </ChartCard>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthlyBreakdown = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
      {timeline.map(t => {
        const monthTransactions = transactions.filter(r => r.month === t.month && r.year === t.year);
        const monthCats = [...new Set(monthTransactions.map(t => t.category))].filter((c): c is string => Boolean(c));
        const data = {
          labels: monthCats.map(c => c.length > 8 ? c.slice(0, 6) + '..' : c),
          datasets: [{
            label: 'Amount',
            data: monthCats.map(c => monthTransactions.filter(t => t.category === c && t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)),
            backgroundColor: monthCats.map(c => (CATEGORY_COLORS[c] || '#6b7280') + 'bb'),
            borderColor: monthCats.map(c => CATEGORY_COLORS[c] || '#6b7280'),
            borderWidth: 1,
            borderRadius: 2
          }]
        };
        return (
          <ChartCard key={t.key} title={t.key.toUpperCase()} sub={`Category-wise breakdown for ${t.key}`} height={240}>
            <Bar data={data} options={{
              ...themeOptions,
              plugins: { ...themeOptions.plugins, legend: { display: false } }
            }} />
          </ChartCard>
        );
      })}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'category' && renderCategoryTrends()}
      {activeTab === 'month' && renderMonthlyBreakdown()}
    </div>
  );
};
