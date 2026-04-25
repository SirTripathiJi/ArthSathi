/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS,
  Legend, LinearScale, LineElement, PointElement, Title, Tooltip,
} from 'chart.js';
import { BarChart3, Package, Receipt, TrendingUp, Activity } from 'lucide-react';
import { StatCard } from '../components/UI/StatCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DB } from '../services/db';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

export function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [salesData, setSalesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalTxns, setTotalTxns] = useState(0);
  const [cardOrder, setCardOrder] = useState(['sales', 'profit', 'products', 'txns']);
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      const s = DB.getSales(user.uid);
      const p = DB.getProducts(user.uid);
      setSalesData(s);
      setTotalSales(s.reduce((a, x) => a + x.amt, 0));
      setTotalProfit(s.reduce((a, x) => a + x.profit, 0));
      setTotalProducts(p.length);
      const today = new Date().toLocaleDateString();
      setTotalTxns(s.filter((x) => new Date(x.date).toLocaleDateString() === today).length);
    }
  }, [user]);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const axisTextColor = isDark ? '#aaaaaa' : '#555555';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const chartOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#FFFFFF',
        borderWidth: 2, padding: 12, cornerRadius: 0,
        titleFont: { family: 'Space Grotesk', weight: '700', size: 14 },
        bodyFont: { family: 'Space Grotesk', size: 14 },
        displayColors: false
      },
    },
    scales: {
      x: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { display: false }, border: { color: textColor, width: 2 } },
      y: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { color: gridColor }, border: { color: textColor, width: 2 } },
    },
  }), [textColor, axisTextColor, gridColor]);

  const doughnutOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { 
          color: textColor, 
          font: { family: 'Space Grotesk', size: 14, weight: '700' }, 
          padding: 24, 
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8
        } 
      },
    },
  }), [textColor]);

  const barChartData = useMemo(() => {
    const dmap = {};
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dmap[d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })] = 0; }
    salesData.forEach((x) => { const d = new Date(x.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); if (dmap[d] !== undefined) dmap[d] += x.amt; });
    return {
      labels: Object.keys(dmap),
      datasets: [{
        label: t('total_sales'), data: Object.values(dmap),
        backgroundColor: '#FFD600',
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 2,
        barThickness: 30,
      }],
    };
  }, [salesData, t]);

  const topProductsData = useMemo(() => {
    const pmap = {};
    salesData.forEach((x) => { pmap[x.name] = (pmap[x.name] || 0) + x.amt; });
    const sorted = Object.entries(pmap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      labels: sorted.map((x) => x[0]),
      datasets: [{ 
        data: sorted.map((x) => x[1]), 
        backgroundColor: ['#FFD600', '#FF4081', '#00E5FF', '#00C853', isDark ? '#333333' : '#FFFFFF'], 
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 2,
        hoverOffset: 10 
      }],
    };
  }, [salesData]);

  const cardsData = {
    sales:    { id: 'sales',    label: t('total_sales'),        icon: <Receipt className="w-5 h-5" />,    value: `₹${totalSales.toLocaleString()}`, bgAccent: '#FFD600' },
    profit:   { id: 'profit',   label: t('net_profit'),         icon: <TrendingUp className="w-5 h-5" />, value: `₹${totalProfit.toLocaleString()}`, bgAccent: '#00C853' },
    products: { id: 'products', label: t('products_in_stock'),  icon: <Package className="w-5 h-5" />,    value: totalProducts,                      bgAccent: '#00E5FF' },
    txns:     { id: 'txns',     label: t('transactions_today'), icon: <Activity className="w-5 h-5" />,   value: totalTxns,                          bgAccent: '#FF4081' },
  };

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragEnter = (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setCardOrder((prev) => { const o = [...prev]; const si = o.indexOf(draggedId), di = o.indexOf(targetId); [o[si], o[di]] = [o[di], o[si]]; return o; });
  };

  return (
    <div className="space-y-12">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {cardOrder.map((id) => {
          const c = cardsData[id];
          return (
            <StatCard key={c.id} id={c.id} label={c.label} icon={c.icon} value={c.value} bgAccent={c.bgAccent}
                onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={() => setDraggedId(null)} />
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="brutalist-card">
          <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--color-brand)] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)]">
                <BarChart3 className="w-5 h-5 text-[#111111]" />
              </div>
              <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('sales_7_days')}</p>
            </div>
            <div className="text-xs font-black text-[#111111] border-2 border-[var(--border-color)] bg-[var(--color-brand)] px-4 py-1.5 shadow-[3px_3px_0_var(--shadow-color)]">WEEKLY</div>
          </div>
          <div className="h-[300px]"><Bar data={barChartData} options={chartOptions} /></div>
        </div>

        <div className="brutalist-card">
          <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--color-secondary)] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)] text-[#ffffff]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('top_products')}</p>
            </div>
            <div className="text-xs font-black text-[var(--bg-primary)] border-2 border-[var(--border-color)] bg-[var(--border-color)] px-4 py-1.5 shadow-[3px_3px_0_var(--shadow-color)]">MARKET</div>
          </div>
          <div className="h-[300px]">
            {topProductsData.labels.length > 0 ? (
              <Doughnut data={topProductsData} options={doughnutOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-6 text-[var(--text-secondary)] opacity-50">
                <Package className="w-16 h-16" />
                <p className="font-black uppercase tracking-widest">{t('no_sales_data')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
