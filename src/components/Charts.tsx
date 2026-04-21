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
import { Transaction, EXPENSE_CATEGORIES, CATEGORY_COLORS, MONTH_NAMES } from '../types';
import { formatPKR, getPercentage } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Register ChartJS modules
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  ArcElement, RadialLinearScale, Filler, Title, Tooltip, Legend
);

const ChartCard: React.FC<{ title: string; sub: string; children: React.ReactNode; height?: number; delay?: number }> = ({ title, sub, children, height = 290, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
    className="dashboard-card p-4 sm:p-5"
  >
    <h3 className="text-xs sm:text-sm font-bold mb-0.5">{title}</h3>
    <p className="text-[10px] sm:text-[11px] text-gray-500 mb-6">{sub}</p>
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
        callback: (value: any) => `₨${Math.round(value/1000)}k`
      },
      grid: { color: 'rgba(31,36,48,0.5)' }
    }
  }
};

interface ChartsProps {
  transactions: Transaction[];
  budgets: Record<string, number>;
  activeTab: 'overview' | 'category' | 'month';
  isDarkMode: boolean;
}

export const Charts: React.FC<ChartsProps> = ({ transactions, budgets, activeTab, isDarkMode }) => {
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

  const activeMonths = useMemo(() => {
    return MONTH_NAMES.filter(m => transactions.some(r => r.month === m))
      .sort((a, b) => MONTH_NAMES.indexOf(a) - MONTH_NAMES.indexOf(b));
  }, [transactions]);

  const categories = useMemo(() => {
    return [...new Set(transactions.map(t => t.category))].filter(Boolean).sort();
  }, [transactions]);

  // Line Chart Data
  const lineData = {
    labels: activeMonths,
    datasets: EXPENSE_CATEGORIES.map(cat => ({
      label: cat,
      data: activeMonths.map(m => transactions.filter(r => r.month === m && r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0)),
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
    labels: activeMonths,
    datasets: EXPENSE_CATEGORIES.map(cat => ({
      label: cat,
      data: activeMonths.map(m => transactions.filter(r => r.month === m && r.category === cat && r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0)),
      backgroundColor: CATEGORY_COLORS[cat],
      stack: 'total'
    }))
  };

  // Monthly Revenue Trend (Income vs Expenses)
  const revenueTrendData = {
    labels: activeMonths,
    datasets: [
      {
        label: 'Monthly Income',
        data: activeMonths.map(m => transactions.filter(r => r.month === m && r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0)),
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
        data: activeMonths.map(m => transactions.filter(r => r.month === m && r.type === 'CREDIT' && r.category !== 'BORROW').reduce((s, r) => s + r.amount, 0)),
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
    labels: activeMonths,
    datasets: [
      {
        label: 'Income',
        data: activeMonths.map(m => transactions.filter(r => r.month === m && r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0)),
        backgroundColor: '#22c55e',
        borderRadius: 4,
      },
      {
        label: 'Expense',
        data: activeMonths.map(m => transactions.filter(r => r.month === m && r.type === 'CREDIT' && r.category !== 'BORROW').reduce((s, r) => s + r.amount, 0)),
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
      {
        label: 'Borrow',
        data: activeMonths.map(m => transactions.filter(r => r.month === m && r.category === 'BORROW').reduce((s, r) => s + r.amount, 0)),
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
  }, [transactions]);  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pb-6">
      <ChartCard title="Overall Flow" sub="Income vs Expense vs Borrow comparison" delay={0.1}>
        <Bar data={compData} options={themeOptions} />
      </ChartCard>

      <ChartCard title="Cumulative Spend" sub="Running total of all expenses" delay={0.2}>
        <Line data={cumulativeData as any} options={{
          ...themeOptions,
          scales: {
            ...themeOptions.scales,
            y: {
              ...themeOptions.scales.y,
              ticks: {
                ...themeOptions.scales.y.ticks,
                callback: (value: any) => `₨${Math.round(value/1000)}k`
              }
            }
          }
        }} />
      </ChartCard>

      <ChartCard title="Category Intensity" sub="Spend focal points" delay={0.3} height={300}>
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

      <ChartCard title="Growth Highlights" sub="Financial trajectory" delay={0.4}>
        <Line data={revenueTrendData} options={{
          ...themeOptions,
          scales: {
            ...themeOptions.scales,
            x: { ...themeOptions.scales.x, title: { display: window.innerWidth > 640, text: 'Month', color: textColor, font: { size: 10, weight: 'bold' } } },
            y: { ...themeOptions.scales.y, title: { display: window.innerWidth > 640, text: 'Amount', color: textColor, font: { size: 10, weight: 'bold' } } }
          }
        }} />
      </ChartCard>

      <ChartCard title="Spending Trend" sub="Category tracking" delay={0.5}>
        <Line data={lineData} options={themeOptions} />
      </ChartCard>
      
      <ChartCard title="Category Allocation" sub="Spending breakdown" delay={0.6}>
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

      <ChartCard title="Stacked Composition" sub="Layering per month" delay={0.7}>
        <Bar data={stackedData} options={themeOptions} />
      </ChartCard>

      <ChartCard title="Channel Distribution" sub="Payment volumes" delay={0.8}>
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
    </div>
  );

  const renderCategoryTrends = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
      {categories.map(cat => {
        const data = {
          labels: MONTH_NAMES.map(m => m.slice(0, 3)),
          datasets: [{
            label: cat,
            data: MONTH_NAMES.map(m => transactions.filter(t => t.month === m && t.category === cat && t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)),
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
  );

  const renderMonthlyBreakdown = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
      {activeMonths.map(month => {
        const monthCats = [...new Set(transactions.filter(t => t.month === month).map(t => t.category))].filter((c): c is string => Boolean(c));
        const data = {
          labels: monthCats.map(c => c.length > 8 ? c.slice(0, 6) + '..' : c),
          datasets: [{
            label: 'Amount',
            data: monthCats.map(c => transactions.filter(t => t.month === month && t.category === c && t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)),
            backgroundColor: monthCats.map(c => (CATEGORY_COLORS[c] || '#6b7280') + 'bb'),
            borderColor: monthCats.map(c => CATEGORY_COLORS[c] || '#6b7280'),
            borderWidth: 1,
            borderRadius: 2
          }]
        };
        return (
          <ChartCard key={month} title={month.toUpperCase()} sub={`Category-wise breakdown for ${month}`} height={240}>
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
