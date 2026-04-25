/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { LineChart as LineChartIcon, PieChart, TrendingUp, Info } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DB } from '../services/db';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

export function Analytics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [salesData, setSalesData] = useState([]);
  const [productsData, setProductsData] = useState([]);

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

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor, font: { family: 'Space Grotesk', size: 12, weight: '700' }, usePointStyle: true, boxWidth: 10 } },
        tooltip: {
          backgroundColor: '#000000',
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF',
          borderColor: '#FFFFFF',
          borderWidth: 2, padding: 12, cornerRadius: 0,
          displayColors: false
        }
      },
      scales: {
        x: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { display: false }, border: { color: textColor, width: 2 } },
        y: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { color: gridColor }, border: { color: textColor, width: 2 } },
      },
    }),
    [textColor, axisTextColor, gridColor]
  );

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Space Grotesk', size: 12, weight: '700' }, padding: 24, usePointStyle: true, boxWidth: 10 } },
        tooltip: {
          backgroundColor: '#000000',
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF',
          borderColor: '#FFFFFF',
          borderWidth: 2, padding: 12, cornerRadius: 0,
        }
      },
    }),
    [textColor]
  );

  const lineData = useMemo(() => {
    const dmapRev = {}, dmapProf = {};
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const lbl = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      dmapRev[lbl] = 0;
      dmapProf[lbl] = 0;
    }
    salesData.forEach((x) => {
      const d = new Date(x.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      if (dmapRev[d] !== undefined) {
        dmapRev[d] += x.amt;
        dmapProf[d] += x.profit;
      }
    });
    return {
      labels: Object.keys(dmapRev),
      datasets: [
        {
          label: t('dashboard.totalSales'),
          data: Object.values(dmapRev),
          borderColor: '#FFD600',
          backgroundColor: 'rgba(255, 214, 0, 0.1)',
          borderWidth: 4,
          tension: 0,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: isDark ? '#151515' : '#000000',
          pointBorderColor: '#FFD600',
          pointBorderWidth: 2,
        },
        {
          label: t('dashboard.netProfit'),
          data: Object.values(dmapProf),
          borderColor: '#FF4081',
          backgroundColor: 'transparent',
          borderWidth: 4,
          tension: 0,
          pointRadius: 4,
          pointBackgroundColor: isDark ? '#151515' : '#000000',
          pointBorderColor: '#FF4081',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [salesData, t]);

  const pieData = useMemo(() => {
    const cmap = {};
    salesData.forEach((txn) => {
      const prod = productsData.find((x) => x.id === txn.pid);
      const cat = prod ? prod.category : 'General';
      cmap[cat] = (cmap[cat] || 0) + txn.amt;
    });
    return {
      labels: Object.keys(cmap),
      datasets: [
        {
          data: Object.values(cmap),
          backgroundColor: ['#FFD600', '#FF4081', '#00E5FF', '#00C853', isDark ? '#333333' : '#111111'],
          borderColor: isDark ? '#ffffff' : '#000000',
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  }, [salesData, productsData]);

  const renderEmptyState = (msg) => (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-[var(--text-secondary)] opacity-30 py-20 text-center">
      <LineChartIcon className="w-16 h-16" />
      <p className="text-xl font-black uppercase tracking-widest">{msg || t('analytics.noAnalyticsData')}</p>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="brutalist-card bg-[var(--color-brand)] border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 p-12">
        <div className="max-w-xl">
          <h2 className="text-5xl font-black tracking-tighter mb-4 uppercase italic leading-none text-[#111111]">{t('analytics.businessPerformance')}</h2>
          <p className="text-lg font-bold text-[#111111]/80 leading-tight">{t("insights.headerDescription", "Advanced predictive analysis and transactional history tracking for the last 14 operative days.")}</p>
        </div>
        <div className="p-6 bg-[var(--card-bg)] border-4 border-[var(--border-color)] shadow-[6px_6px_0_var(--shadow-color)]">
          <TrendingUp className="w-12 h-12 text-[var(--text-primary)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 brutalist-card">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--color-accent)] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)]">
              <LineChartIcon className="w-5 h-5 text-[#111111]" />
            </div>
            <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('analytics.revenueVsProfit')}</p>
          </div>
          <div className="h-[400px] flex-1">
            {salesData.length > 0 ? <Line data={lineData} options={lineOptions} /> : renderEmptyState()}
          </div>
        </div>
        
        <div className="brutalist-card">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--color-secondary)] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)] text-[#ffffff]">
              <PieChart className="w-5 h-5" />
            </div>
            <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('analytics.revenueByCategory')}</p>
          </div>
          <div className="h-[400px] flex-1">
            {pieData.labels.length > 0 ? <Pie data={pieData} options={pieOptions} /> : renderEmptyState('No category data')}
          </div>
        </div>
      </div>

      <div className="p-8 border-4 border-[var(--border-color)] bg-[var(--border-color)] text-[var(--bg-primary)] flex items-center gap-8 shadow-[8px_8px_0_var(--color-accent)]">
        <div className="w-14 h-14 bg-[var(--color-accent)] border-2 border-[var(--bg-primary)] flex items-center justify-center text-[#111111] flex-shrink-0">
          <Info className="w-8 h-8" />
        </div>
        <p className="text-lg font-bold leading-tight">
          <span className="text-[var(--color-accent)] font-black uppercase tracking-widest mr-4">{t("insights.intelligenceLabel", "INTELLIGENCE:")}</span> 
          {t("insights.intelligenceMessage", "Transactional patterns indicate high volume during mid-week cycles. Optimize inventory restocking accordingly.")}
        </p>
      </div>
    </div>
  );
}
