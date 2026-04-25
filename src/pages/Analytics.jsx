/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS,
  Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp, LineChart as LineChartIcon, Package, PieChart, AlertTriangle, TrendingDown, TrendingUp, Lightbulb, HelpCircle, X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DB } from '../services/db';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler, ChartDataLabels);

export function Analytics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, lang } = useLanguage();

  const [salesData, setSalesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [timeRange, setTimeRange] = useState('daily');
  const [donutToggle, setDonutToggle] = useState('revenue');
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
  const [expandedWhy, setExpandedWhy] = useState(null); // id of active Why? explanation

  useEffect(() => {
    if (user?.uid) {
      setSalesData(DB.getSales(user.uid));
      setProductsData(DB.getProducts(user.uid));
    }
  }, [user]);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const axisTextColor = isDark ? '#aaaaaa' : '#555555';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  // --- SALES TREND ANALYSIS (Line + Area) ---
  const lineData = useMemo(() => {
    const dmapRev = {};
    const dmapProf = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysToTrack = 14;
    if (timeRange === 'weekly') daysToTrack = 30; // approx 4 weeks
    if (timeRange === 'monthly') daysToTrack = 180; // approx 6 months

    // Initialize buckets
    for (let i = daysToTrack; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      let lbl = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      if (timeRange === 'weekly') {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        lbl = `Wk of ${startOfWeek.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
      } else if (timeRange === 'monthly') {
        lbl = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      }
      dmapRev[lbl] = 0;
      dmapProf[lbl] = 0;
    }

    salesData.forEach((x) => {
      const d = new Date(x.date);
      let lbl = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      if (timeRange === 'weekly') {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        lbl = `Wk of ${startOfWeek.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
      } else if (timeRange === 'monthly') {
        lbl = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      }
      if (dmapRev[lbl] !== undefined) {
        dmapRev[lbl] += x.amt;
        dmapProf[lbl] += x.profit;
      }
    });

    return {
      labels: Object.keys(dmapRev),
      datasets: [
        {
          label: t('analytics.revenue'),
          data: Object.values(dmapRev),
          borderColor: '#FFD600',
          backgroundColor: 'rgba(255, 214, 0, 0.1)',
          borderWidth: 4,
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: isDark ? '#151515' : '#ffffff',
          pointBorderColor: '#FFD600',
          pointBorderWidth: 2,
        },
        {
          label: t('analytics.profit'),
          data: Object.values(dmapProf),
          borderColor: '#00E5FF',
          backgroundColor: 'transparent',
          borderWidth: 4,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: isDark ? '#151515' : '#ffffff',
          pointBorderColor: '#00E5FF',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [salesData, timeRange, isDark, t, lang]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: textColor, font: { family: 'Space Grotesk', size: 14, weight: '700' }, usePointStyle: true, boxWidth: 10 } },
      tooltip: { backgroundColor: '#000000', titleColor: '#FFFFFF', bodyColor: '#FFFFFF', borderColor: '#FFFFFF', borderWidth: 2, padding: 12, cornerRadius: 0, displayColors: false },
      datalabels: { display: false }
    },
    scales: {
      x: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { display: false }, border: { color: textColor, width: 2 } },
      y: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { color: gridColor }, border: { color: textColor, width: 2 } },
    },
  };

  // --- PROFIT COMPOSITION (Stacked Bar) ---
  const stackedBarData = useMemo(() => {
    const dmap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const lbl = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      dmap[lbl] = { rev: 0, cost: 0, profit: 0 };
    }
    salesData.forEach((x) => {
      const lbl = new Date(x.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      if (dmap[lbl]) {
        dmap[lbl].rev += x.amt;
        dmap[lbl].profit += x.profit;
        dmap[lbl].cost += (x.amt - x.profit);
      }
    });

    const labels = Object.keys(dmap);
    return {
      labels,
      datasets: [
        {
          label: t('analytics.profit'),
          data: labels.map(l => dmap[l].profit),
          backgroundColor: '#00C853',
          borderColor: isDark ? '#ffffff' : '#000000',
          borderWidth: 2,
        },
        {
          label: t('analytics.cost'),
          data: labels.map(l => dmap[l].cost),
          backgroundColor: '#FF4081',
          borderColor: isDark ? '#ffffff' : '#000000',
          borderWidth: 2,
        }
      ]
    };
  }, [salesData, isDark, t, lang]);

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: textColor, font: { family: 'Space Grotesk', size: 14, weight: '700' }, usePointStyle: true, boxWidth: 10 } },
      tooltip: { backgroundColor: '#000000', titleColor: '#FFFFFF', bodyColor: '#FFFFFF', borderColor: '#FFFFFF', borderWidth: 2, padding: 12, cornerRadius: 0 },
      datalabels: { display: false }
    },
    scales: {
      x: { stacked: true, ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { display: false }, border: { color: textColor, width: 2 } },
      y: { stacked: true, ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { color: gridColor }, border: { color: textColor, width: 2 } },
    },
  };

  // --- CATEGORY DONUT ---
  const donutData = useMemo(() => {
    const cmap = {};
    salesData.forEach((txn) => {
      if (txn.items) {
        txn.items.forEach(item => {
          const prod = productsData.find((x) => x.id === item.pid);
          let rawCat = prod && prod.category ? prod.category.trim() : '';
          let cat = rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase() : t('analytics.uncategorized');
          cmap[cat] = (cmap[cat] || 0) + (donutToggle === 'revenue' ? (item.price * item.qty) : item.qty);
        });
      } else {
        const prod = productsData.find((x) => x.id === txn.pid);
        let rawCat = prod && prod.category ? prod.category.trim() : '';
        let cat = rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase() : t('analytics.uncategorized');
        cmap[cat] = (cmap[cat] || 0) + (donutToggle === 'revenue' ? txn.amt : txn.qty);
      }
    });
    return {
      labels: Object.keys(cmap),
      datasets: [
        {
          data: Object.values(cmap),
          backgroundColor: ['#FFD600', '#FF4081', '#00E5FF', '#00C853', isDark ? '#333333' : '#111111', '#FF9100'],
          borderColor: isDark ? '#ffffff' : '#000000',
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  }, [salesData, productsData, donutToggle, isDark, t, lang]);

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Space Grotesk', size: 12, weight: '700' }, padding: 24, usePointStyle: true, boxWidth: 10 } },
      tooltip: { 
        backgroundColor: '#000000', titleColor: '#FFFFFF', bodyColor: '#FFFFFF', borderColor: '#FFFFFF', borderWidth: 2, padding: 12, cornerRadius: 0,
        callbacks: {
          label: (context) => {
            const val = context.raw;
            return ` ${context.label}: ` + (donutToggle === 'revenue' ? `₹${val.toLocaleString()}` : `${val} ${t('analytics.units')}`);
          }
        }
      },
      datalabels: {
        color: '#ffffff',
        font: { family: 'Space Grotesk', weight: '900', size: 14 },
        formatter: (value, ctx) => {
          let sum = 0;
          let dataArr = ctx.chart.data.datasets[0].data;
          dataArr.map(data => { sum += data; });
          if (sum === 0) return '';
          let percentage = (value * 100 / sum).toFixed(0) + "%";
          return percentage;
        },
        textStrokeColor: '#000000',
        textStrokeWidth: 4,
      }
    },
  };

  // --- PRODUCT PERFORMANCE GRID ---
  const productGridData = useMemo(() => {
    const pmap = {};
    salesData.forEach((s) => {
      if (s.items) {
        s.items.forEach(item => {
           if (!pmap[item.pid]) pmap[item.pid] = { id: item.pid, name: item.name, qty: 0, rev: 0, profit: 0 };
           pmap[item.pid].qty += item.qty;
           pmap[item.pid].rev += item.price * item.qty;
           pmap[item.pid].profit += (item.price - item.cost) * item.qty;
        });
      } else {
        if (!pmap[s.pid]) pmap[s.pid] = { id: s.pid, name: s.name, qty: 0, rev: 0, profit: 0 };
        pmap[s.pid].qty += s.qty;
        pmap[s.pid].rev += s.amt;
        pmap[s.pid].profit += s.profit;
      }
    });
    
    let arr = Object.values(pmap).map(p => ({
      ...p,
      margin: p.rev > 0 ? ((p.profit / p.rev) * 100).toFixed(1) : 0
    }));

    arr.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return arr;
  }, [salesData, sortConfig, t, lang]);

  // --- TOP CUSTOMERS ---
  const topCustomersData = useMemo(() => {
    const cmap = {};
    salesData.forEach((s) => {
      if (!s.customerId) return;
      if (!cmap[s.customerId]) cmap[s.customerId] = { id: s.customerId, name: s.customerName, rev: 0, txns: 0 };
      cmap[s.customerId].rev += s.amt;
      cmap[s.customerId].txns += 1;
    });
    let arr = Object.values(cmap);
    arr.sort((a,b) => b.rev - a.rev);
    return arr;
  }, [salesData]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  // --- BUSINESS INSIGHTS STATEMENTS ---
  const businessInsights = useMemo(() => {
    const insights = [];
    if (!productsData.length || !salesData.length) return insights;

    // Top Category
    if (donutData.labels.length > 0) {
      let maxCat = '';
      let maxVal = -1;
      let sum = 0;
      donutData.labels.forEach((lbl, i) => {
        const val = donutData.datasets[0].data[i];
        sum += val;
        if (val > maxVal) { maxVal = val; maxCat = lbl; }
      });
      if (maxVal > 0) {
        let percent = ((maxVal / sum) * 100).toFixed(1);
        insights.push({
          title: `${t('analytics.topCategory')}: ${maxCat}`,
          desc: donutToggle === 'revenue' ? `(₹${maxVal.toLocaleString()}, ${percent}%)` : `(${maxVal} ${t('analytics.units')}, ${percent}%)`,
          icon: <TrendingUp className="w-6 h-6 text-[#111111]" />, bg: '#00C853'
        });
      }
    }

    // Lowest Performer (by qty)
    if (productGridData.length > 0) {
      const sortedByQty = [...productGridData].sort((a,b) => a.qty - b.qty);
      const lowest = sortedByQty.find(p => p.qty > 0) || sortedByQty[0];
      if (lowest) {
        insights.push({
          title: `${t('analytics.lowestPerformer')}: ${lowest.name}`,
          desc: `(${lowest.qty} ${t('analytics.units')} sold)`,
          icon: <TrendingDown className="w-6 h-6 text-[#111111]" />, bg: '#FF4081'
        });
      }

      // High Margin
      const sortedByMargin = [...productGridData].sort((a,b) => Number(b.margin) - Number(a.margin));
      const highestMargin = sortedByMargin.find(p => p.rev > 0);
      if (highestMargin) {
        insights.push({
          title: `${t('analytics.highMargin')}: ${highestMargin.name}`,
          desc: `(${highestMargin.margin}% ${t('analytics.margin')})`,
          icon: <PieChart className="w-6 h-6 text-[#111111]" />, bg: '#00E5FF'
        });
      }
    }

    return insights;
  }, [donutData, productGridData, t, donutToggle]);

  const renderEmptyState = (msg) => (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-[var(--text-secondary)] opacity-30 py-20 text-center">
      <LineChartIcon className="w-16 h-16" />
      <p className="text-xl font-black uppercase tracking-widest">{msg || t('analytics.noAnalyticsData')}</p>
      <p className="text-sm font-bold">{t('analytics.noDataCta')}</p>
    </div>
  );

  return (
    <div className="space-y-12">
      
      {/* HEADER OVERVIEW */}
      <div className="brutalist-card bg-[var(--color-brand)] border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 p-12 hover:shadow-[10px_10px_0_var(--shadow-color)] transition-shadow">
        <div className="max-w-xl">
          <h2 className="text-5xl font-black tracking-tighter mb-4 uppercase italic leading-none text-[#111111]">{t('insights.title')}</h2>
          <p className="text-lg font-bold text-[#111111]/80 leading-tight">{t('insights.subtitle')}</p>
        </div>
        <div className="p-6 bg-[var(--card-bg)] border-4 border-[var(--border-color)] shadow-[6px_6px_0_var(--shadow-color)]">
          <Lightbulb className="w-12 h-12 text-[var(--text-primary)]" />
        </div>
      </div>

      {/* BUSINESS INSIGHTS */}
      {businessInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {businessInsights.map((insight, i) => (
            <div key={i} className="border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-[6px_6px_0_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--shadow-color)] transition-all flex items-center gap-4">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center border-2 border-[var(--border-color)] shadow-[3px_3px_0_var(--shadow-color)]" style={{ backgroundColor: insight.bg }}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight text-[var(--text-primary)] mb-1">{insight.title}</h3>
                <p className="text-sm font-bold text-[var(--text-secondary)]">{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHARTS GRID 1: TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Sales Trend Analysis */}
        <div className="lg:col-span-2 brutalist-card hover:shadow-[8px_8px_0_var(--shadow-color)] transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--color-accent)] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)]">
                <LineChartIcon className="w-5 h-5 text-[#111111]" />
              </div>
              <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('analytics.salesTrendTitle')}</p>
            </div>
            <div className="flex border-2 border-[var(--border-color)] shadow-[3px_3px_0_var(--shadow-color)]">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 text-xs font-black uppercase transition-colors ${timeRange === range ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                  {t(`analytics.${range}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px] flex-1">
            {salesData.length > 0 ? <Line key={lang} data={lineData} options={lineOptions} /> : renderEmptyState()}
          </div>
        </div>
        
        {/* Category Performance */}
        <div className="brutalist-card hover:shadow-[8px_8px_0_var(--shadow-color)] transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--color-secondary)] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)] text-[#ffffff]">
                <PieChart className="w-5 h-5" />
              </div>
              <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('analytics.categoryShare')}</p>
            </div>
            <div className="flex border-2 border-[var(--border-color)] shadow-[3px_3px_0_var(--shadow-color)]">
               {['revenue', 'qty'].map((toggle) => (
                <button key={toggle} onClick={() => setDonutToggle(toggle)}
                  className={`px-3 py-1 text-[10px] font-black uppercase transition-colors ${donutToggle === toggle ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                  {t(`analytics.${toggle}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px] flex-1">
            {donutData.labels.length > 0 ? <Doughnut key={lang} data={donutData} options={donutOptions} /> : renderEmptyState(t('analytics.noData'))}
          </div>
        </div>
      </div>

      {/* CHARTS GRID 2: PROFIT COMPOSITION & PERFORMANCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Profit Breakdown Analysis */}
        <div className="brutalist-card hover:shadow-[8px_8px_0_var(--shadow-color)] transition-shadow">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[#00C853] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)]">
              <TrendingUp className="w-5 h-5 text-[#111111]" />
            </div>
            <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('analytics.profitComposition')}</p>
          </div>
          <div className="h-[350px]">
            {salesData.length > 0 ? <Bar key={lang} data={stackedBarData} options={stackedBarOptions} /> : renderEmptyState()}
          </div>
        </div>

        {/* Product Performance Grid */}
        <div className="brutalist-card flex flex-col hover:shadow-[8px_8px_0_var(--shadow-color)] transition-shadow overflow-hidden">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[#FF4081] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)]">
              <Package className="w-5 h-5 text-[#ffffff]" />
            </div>
            <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('analytics.productGrid')}</p>
          </div>
          <div className="flex-1 overflow-auto brutalist-table-wrap min-h-[300px]">
            <table className="brutalist-table w-full text-sm">
              <thead className="sticky top-0 bg-[var(--card-bg)] z-10 shadow-sm border-b-4 border-[var(--border-color)]">
                <tr>
                  <th className="cursor-pointer hover:bg-[var(--bg-secondary)]" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">{t('inventory.product')} {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="cursor-pointer hover:bg-[var(--bg-secondary)]" onClick={() => handleSort('qty')}>
                    <div className="flex items-center gap-2">{t('analytics.units')} {sortConfig.key === 'qty' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="cursor-pointer hover:bg-[var(--bg-secondary)]" onClick={() => handleSort('rev')}>
                    <div className="flex items-center gap-2">{t('analytics.revenue')} {sortConfig.key === 'rev' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="cursor-pointer hover:bg-[var(--bg-secondary)]" onClick={() => handleSort('margin')}>
                    <div className="flex items-center gap-2">{t('analytics.margin')} {sortConfig.key === 'margin' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {productGridData.length > 0 ? productGridData.slice(0, 10).map((p, i) => (
                  <tr key={p.id} className={i === 0 ? 'bg-[var(--color-brand)]/10' : ''}>
                    <td className="font-bold uppercase truncate max-w-[150px]">{p.name}</td>
                    <td className="font-black">{p.qty}</td>
                    <td className="font-bold italic">₹{p.rev.toLocaleString()}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-black border-2 border-[var(--border-color)] ${Number(p.margin) < 15 ? 'bg-[#FF4081] text-white' : 'bg-[#00C853] text-[#111111]'}`}>
                        {p.margin}%
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-10 opacity-50 font-bold uppercase tracking-widest">{t('analytics.noDataCta')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TOP CUSTOMERS ROW */}
      <div className="brutalist-card flex flex-col hover:shadow-[8px_8px_0_var(--shadow-color)] transition-shadow overflow-hidden">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[var(--border-color)]">
          <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[#00E5FF] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)]">
            <CheckCircle2 className="w-5 h-5 text-[#111111]" />
          </div>
          <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">Top Customers</p>
        </div>
        <div className="flex-1 overflow-auto brutalist-table-wrap">
          <table className="brutalist-table w-full text-sm">
            <thead className="bg-[var(--card-bg)] shadow-sm border-b-4 border-[var(--border-color)]">
              <tr>
                <th>{t('customers.name')}</th>
                <th>{t('analytics.units')}</th>
                <th>{t('analytics.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {topCustomersData.length > 0 ? topCustomersData.slice(0, 5).map((c, i) => (
                <tr key={c.id} className={i === 0 ? 'bg-[#FFD600]/10' : ''}>
                  <td className="font-bold uppercase">{c.name}</td>
                  <td className="font-black">{c.txns}</td>
                  <td className="font-bold italic">₹{c.rev.toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="text-center py-10 opacity-50 font-bold uppercase tracking-widest">No customer sales data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
