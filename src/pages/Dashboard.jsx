/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS,
  Legend, LinearScale, LineElement, PointElement, Title, Tooltip,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Activity, AlertOctagon, ArrowUp, DollarSign,
  Package, PackageX, Receipt, TrendingUp
} from 'lucide-react';
import { StatCard } from '../components/UI/StatCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DB } from '../services/db';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

// Persistence helpers for Analysis Settings
const SETTINGS_KEY = 'arth_analysis_settings';
const DEFAULT_SETTINGS = { lowStockQty: 5, deadStockDays: 30, fastMovingSales: 5 };
const loadSettings = () => {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
  catch { return DEFAULT_SETTINGS; }
};
const saveSettings = (s) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

export function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, lang } = useLanguage();

  const [salesData, setSalesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [cardOrder, setCardOrder] = useState(['sales', 'profit', 'products', 'txns']);
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      setSalesData(DB.getSales(user.uid));
      setProductsData(DB.getProducts(user.uid));
    }
  }, [user]);

  // Re-render charts on language change by using lang as key
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const axisTextColor = isDark ? '#aaaaaa' : '#555555';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  // ----------- DERIVED METRICS (zero hardcoded assumptions) -----------
  // totalRevenue = sum of all sale amounts
  const totalSales = useMemo(() => salesData.reduce((a, x) => a + x.amt, 0), [salesData]);
  // totalProfit = sum of (sell - cost) per transaction
  const totalProfit = useMemo(() => salesData.reduce((a, x) => a + x.profit, 0), [salesData]);
  const totalProducts = productsData.length;
  const totalTxns = useMemo(() => {
    const today = new Date().toLocaleDateString();
    return salesData.filter((x) => new Date(x.date).toLocaleDateString() === today).length;
  }, [salesData]);

  // ----------- STAT CARDS -----------
  const cardsData = {
    sales:    { id: 'sales',    label: t('dashboard.totalSales'),        icon: <Receipt className="w-5 h-5" />,    value: `₹${totalSales.toLocaleString()}`,  bgAccent: '#FFD600' },
    profit:   { id: 'profit',   label: t('dashboard.netProfit'),         icon: <TrendingUp className="w-5 h-5" />, value: `₹${totalProfit.toLocaleString()}`, bgAccent: '#00C853' },
    products: { id: 'products', label: t('dashboard.productsInStock'),   icon: <Package className="w-5 h-5" />,    value: totalProducts,                       bgAccent: '#00E5FF' },
    txns:     { id: 'txns',     label: t('dashboard.transactionsToday'), icon: <Activity className="w-5 h-5" />,   value: totalTxns,                           bgAccent: '#FF4081' },
  };

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragEnter = (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setCardOrder((prev) => {
      const o = [...prev];
      const si = o.indexOf(draggedId), di = o.indexOf(targetId);
      [o[si], o[di]] = [o[di], o[si]];
      return o;
    });
  };

  // ----------- CASHFLOW (Money In = Revenue, Money Out = Cost of Goods Sold) -----------
  const cashflowData = useMemo(() => {
    const dmap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dmap[d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })] = { in: 0, out: 0 };
    }
    salesData.forEach((x) => {
      const lbl = new Date(x.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      if (dmap[lbl]) {
        // moneyIn = revenue collected from customer
        dmap[lbl].in += x.amt;
        // moneyOut = cost of goods sold (revenue - profit)
        dmap[lbl].out += (x.amt - x.profit);
      }
    });
    return {
      labels: Object.keys(dmap),
      datasets: [
        { label: t('dashboard.moneyIn'),  data: Object.values(dmap).map(v => v.in),  backgroundColor: '#00C853', borderColor: isDark ? '#ffffff' : '#000000', borderWidth: 2 },
        { label: t('dashboard.moneyOut'), data: Object.values(dmap).map(v => v.out), backgroundColor: '#FF4081', borderColor: isDark ? '#ffffff' : '#000000', borderWidth: 2 },
      ],
    };
  }, [salesData, isDark, lang]);

  const cashflowOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: textColor, font: { family: 'Space Grotesk', size: 12, weight: '700' }, usePointStyle: true, boxWidth: 10 } },
      tooltip: { backgroundColor: '#000000', titleColor: '#FFFFFF', bodyColor: '#FFFFFF', borderColor: '#FFFFFF', borderWidth: 2, padding: 12, cornerRadius: 0 },
      datalabels: { display: false }
    },
    scales: {
      x: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { display: false }, border: { color: textColor, width: 2 } },
      y: { ticks: { color: axisTextColor, font: { family: 'Space Grotesk', size: 12, weight: '700' } }, grid: { color: gridColor }, border: { color: textColor, width: 2 } },
    },
  };

  // ----------- INVENTORY HEALTH (derived from real data + user thresholds) -----------
  const inventoryHealth = useMemo(() => {
    const settings = loadSettings();
    const { lowStockQty, deadStockDays, fastMovingSales } = settings;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - deadStockDays);

    const lowStockItems = productsData.filter(p =>
      p.qty > 0 && p.qty <= lowStockQty
    );
    const deadStockItems = productsData.filter(p =>
      p.qty > 0 && !salesData.some(s => s.pid === p.id && new Date(s.date) >= cutoff)
    );
    const fastMovingItems = productsData.filter(p => {
      const recent = salesData.filter(s => s.pid === p.id && new Date(s.date) >= cutoff);
      return recent.length > fastMovingSales;
    });

    return {
      lowStockCount: lowStockItems.length,
      deadStockCount: deadStockItems.length,
      fastMovingCount: fastMovingItems.length,
      lowStockItems,
      deadStockItems,
      fastMovingItems,
    };
  }, [productsData, salesData]);

  return (
    <div className="space-y-12">

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {cardOrder.map((id) => {
          const c = cardsData[id];
          return (
            <StatCard key={c.id} id={c.id} label={c.label} icon={c.icon} value={c.value} bgAccent={c.bgAccent}
              onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={() => setDraggedId(null)} />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* CASHFLOW VISIBILITY */}
        <div className="lg:col-span-2 brutalist-card hover:shadow-[8px_8px_0_var(--shadow-color)] transition-shadow">
          <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[var(--color-brand)] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)]">
                <DollarSign className="w-5 h-5 text-[#111111]" />
              </div>
              <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('dashboard.cashflow')}</p>
            </div>
            <div className="text-xs font-black text-[#111111] border-2 border-[var(--border-color)] bg-[var(--color-brand)] px-4 py-1.5 shadow-[3px_3px_0_var(--shadow-color)]">7 {t('analytics.daily').slice(0,3).toUpperCase()}</div>
          </div>
          {salesData.length > 0 ? (
            <div className="h-[300px]">
              <Bar key={lang} data={cashflowData} options={cashflowOptions} />
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center gap-4 opacity-40">
              <DollarSign className="w-16 h-16" />
              <p className="font-black uppercase tracking-widest text-center">{t('dashboard.noTransactions')}</p>
              <p className="text-sm font-bold text-[var(--text-secondary)] text-center">{t('dashboard.addTransactionCta')}</p>
            </div>
          )}
        </div>

        {/* INVENTORY HEALTH SYSTEM */}
        <div className="brutalist-card flex flex-col hover:shadow-[8px_8px_0_var(--shadow-color)] transition-shadow">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[var(--border-color)]">
            <div className="w-10 h-10 border-2 border-[var(--border-color)] bg-[#00E5FF] flex items-center justify-center shadow-[2px_2px_0_var(--shadow-color)] text-[#111111]">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{t('dashboard.inventoryStatus')}</p>
          </div>

          {productsData.length > 0 ? (
            <div className="flex flex-col gap-4 flex-1 justify-center">
              {/* Low Stock */}
              <div className="border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-[4px_4px_0_var(--shadow-color)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#FFD600] border-2 border-[var(--border-color)] flex items-center justify-center"><AlertOctagon className="w-4 h-4 text-black"/></div>
                    <span className="font-black uppercase text-sm tracking-widest text-[var(--text-primary)]">{t('dashboard.lowStock')}</span>
                  </div>
                  <span className="text-2xl font-black">{inventoryHealth.lowStockCount}</span>
                </div>
                {inventoryHealth.lowStockCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-color)] flex flex-wrap gap-1">
                    {inventoryHealth.lowStockItems.slice(0, 3).map(p => (
                      <span key={p.id} className="text-[10px] font-black border border-[var(--border-color)] px-2 py-0.5 bg-[#FFD600]/20 text-[var(--text-primary)]">{p.name} ({p.qty})</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dead Stock */}
              <div className="border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-[4px_4px_0_var(--shadow-color)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#FF4081] border-2 border-[var(--border-color)] flex items-center justify-center"><PackageX className="w-4 h-4 text-white"/></div>
                    <span className="font-black uppercase text-sm tracking-widest text-[var(--text-primary)]">{t('dashboard.deadStock')}</span>
                  </div>
                  <span className="text-2xl font-black">{inventoryHealth.deadStockCount}</span>
                </div>
                <p className="text-[10px] mt-1 text-[var(--text-secondary)] font-bold">{`${t('settings.deadStockDays')}: ${loadSettings().deadStockDays}`}</p>
              </div>

              {/* Fast Moving */}
              <div className="border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-[4px_4px_0_var(--shadow-color)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#00C853] border-2 border-[var(--border-color)] flex items-center justify-center"><ArrowUp className="w-4 h-4 text-black"/></div>
                    <span className="font-black uppercase text-sm tracking-widest text-[var(--text-primary)]">{t('dashboard.fastMoving')}</span>
                  </div>
                  <span className="text-2xl font-black">{inventoryHealth.fastMovingCount}</span>
                </div>
                <p className="text-[10px] mt-1 text-[var(--text-secondary)] font-bold">{`>${loadSettings().fastMovingSales} ${t('analytics.units')} / 30d`}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-40 py-8">
              <Package className="w-12 h-12" />
              <p className="font-black uppercase tracking-widest text-sm text-center">{t('inventory.noProducts')}</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
