import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { DB } from '../services/db';

export function Transactions() {
  const { user } = useAuth();
  const { t = (k) => k } = useTranslation();
  
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PAID, DUE
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, MONTH, DAY
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  const fetchAll = () => {
    if (user?.uid) {
      setSales(DB.getSales(user.uid).slice().reverse()); // Newest first
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchSearch = 
        String(s.id || '').toLowerCase().includes(String(search || '').toLowerCase()) || 
        String(s.customerName || s.name || '').toLowerCase().includes(String(search || '').toLowerCase());
        
      const matchStatus = filterStatus === 'ALL' || 
        (s.status === filterStatus) || 
        (filterStatus === 'DUE' && (s.status === 'PARTIAL' || s.due > 0)) ||
        (filterStatus === 'PAID' && (s.status === 'PAID' && s.due <= 0));

      const sDate = new Date(s.date);
      let matchDate = true;
      if (dateFilter === 'DAY') {
        matchDate = s.date.startsWith(selectedDate);
      } else if (dateFilter === 'MONTH') {
        matchDate = s.date.startsWith(selectedMonth);
      }
      
      return matchSearch && matchStatus && matchDate;
    });
  }, [sales, search, filterStatus, dateFilter, selectedDate, selectedMonth]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" />
          <input className="brutalist-input !pl-16 text-base py-4" placeholder={t('transactions.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          {/* Status Filters */}
          <div className="flex border-4 border-[var(--border-color)] bg-[var(--card-bg)] shadow-[4px_4px_0_var(--shadow-color)] overflow-hidden">
            {['ALL', 'PAID', 'DUE'].map(status => (
              <button 
                key={status}
                className={`px-4 py-2 text-xs font-black uppercase transition-all ${filterStatus === status ? 'bg-[var(--color-brand)] text-[#111111]' : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                onClick={() => setFilterStatus(status)}
              >
                {t(`transactions.filter${status.charAt(0) + status.slice(1).toLowerCase()}`)}
              </button>
            ))}
          </div>

          {/* Date Filters */}
          <div className="flex border-4 border-[var(--border-color)] bg-[var(--card-bg)] shadow-[4px_4px_0_var(--shadow-color)] overflow-hidden">
            {['ALL', 'MONTH', 'DAY'].map(type => (
              <button 
                key={type}
                className={`px-4 py-2 text-xs font-black uppercase transition-all ${dateFilter === type ? 'bg-[var(--color-secondary)] text-[#ffffff]' : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                onClick={() => setDateFilter(type)}
              >
                {t(`transactions.filter${type.charAt(0) + type.slice(1).toLowerCase()}`)}
              </button>
            ))}
          </div>

          {dateFilter === 'DAY' && (
            <input type="date" className="brutalist-input !py-2 !px-4 text-xs font-black w-auto shadow-[4px_4px_0_var(--shadow-color)]" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          )}
          {dateFilter === 'MONTH' && (
            <input type="month" className="brutalist-input !py-2 !px-4 text-xs font-black w-auto shadow-[4px_4px_0_var(--shadow-color)]" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
          )}
        </div>
      </div>

      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th>{t('transactions.invoice')}</th>
              <th>{t('transactions.customer')}</th>
              <th>{t('transactions.date')}</th>
              <th>{t('transactions.total')}</th>
              <th>{t('transactions.paidDue')}</th>
              <th>{t('transactions.mode')}</th>
              <th>{t('transactions.status')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length > 0 ? (
              filteredSales.map((s) => {
                const total = s.total || s.amt || 0;
                const due = s.due || 0;
                const paid = total - due;
                const status = due > 0 ? 'DUE' : 'PAID';

                return (
                  <tr key={s.id}>
                    <td>
                      <span className="text-sm font-black uppercase tracking-widest block">{s.id}</span>
                      <span className="text-xs font-bold text-[var(--text-secondary)]">{s.items?.length || 1} items</span>
                    </td>
                    <td>
                      <span className="text-lg font-black uppercase italic tracking-tight">{s.customerName || s.name || 'Walk-in'}</span>
                    </td>
                    <td><span className="text-sm font-black">{new Date(s.date).toLocaleDateString()}</span></td>
                    <td><span className="font-black text-xl">₹{total.toLocaleString()}</span></td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-[var(--color-success)]">Paid: ₹{paid.toLocaleString()}</span>
                        {due > 0 && <span className="text-sm font-bold text-[var(--color-error)]">Due: ₹{due.toLocaleString()}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] font-black uppercase px-2 py-1 border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-[2px_2px_0_var(--shadow-color)]">
                        {s.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td>
                      {s.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--color-success)] text-[#111111] px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)]">
                          <CheckCircle2 className="w-3 h-3" /> PAID
                        </span>
                      ) : s.status === 'PARTIAL' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--color-brand)] text-[#111111] px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)]">
                          <AlertCircle className="w-3 h-3" /> PARTIAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--color-error)] text-[#ffffff] px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)] animate-pulse">
                          <AlertCircle className="w-3 h-3" /> UDHAAR
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-32 bg-[var(--bg-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                    <FileText className="w-20 h-20" />
                    <p className="text-xl font-black uppercase tracking-widest">{t('transactions.noTransactions')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
