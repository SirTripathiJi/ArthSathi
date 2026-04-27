import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DB } from '../services/db';

export function Transactions() {
  const { user } = useAuth();
  
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PAID, DUE

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
        
      const matchStatus = filterStatus === 'ALL' || (s.status || (s.due > 0 ? 'DUE' : 'PAID')) === filterStatus;
      
      return matchSearch && matchStatus;
    });
  }, [sales, search, filterStatus]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" />
          <input className="brutalist-input !pl-16 text-base py-4" placeholder="SEARCH INV OR CUSTOMER..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-4">
          {['ALL', 'PAID', 'DUE'].map(status => (
            <button 
              key={status}
              className={`brutalist-btn px-6 py-4 text-sm ${filterStatus === status ? 'bg-[var(--color-brand)] text-[#111111]' : 'bg-[var(--card-bg)] text-[var(--text-primary)]'}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th>INVOICE</th>
              <th>CUSTOMER</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>PAID / DUE</th>
              <th>STATUS</th>
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
                      {status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--color-success)] text-[#111111] px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)]">
                          <CheckCircle2 className="w-3 h-3" /> PAID
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
                <td colSpan="6" className="text-center py-32 bg-[var(--bg-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                    <FileText className="w-20 h-20" />
                    <p className="text-xl font-black uppercase tracking-widest">NO TRANSACTIONS FOUND</p>
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
