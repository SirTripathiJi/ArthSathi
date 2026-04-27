import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, Edit, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { DB } from '../services/db';

export function Customers() {
  const { user } = useAuth();
  const toast = useToast();
  const { t = (k) => k } = useTranslation();

  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementCustomer, setSettlementCustomer] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementMethod, setSettlementMethod] = useState('Cash');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAll = () => {
    if (user?.uid) {
      setCustomers(DB.getCustomers(user.uid).slice().reverse());
      setSales(DB.getSales(user.uid));
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      String(c.name || '').toLowerCase().includes(String(search || '').toLowerCase()) ||
      String(c.phone || '').includes(search)
    );
  }, [customers, search]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName(''); setPhone(''); setAddress(''); setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setName(c.name || ''); setPhone(c.phone || ''); 
    setAddress(c.address || ''); setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const saveCustomer = () => {
    if (!name.trim() || !phone.trim()) {
      return toast.error('Name and Phone are required');
    }
    const updated = [...customers];
    if (editingCustomer) {
      const idx = updated.findIndex(c => String(c.id) === String(editingCustomer.id));
      if (idx !== -1) {
        updated[idx] = { ...editingCustomer, name, phone, address, notes };
      }
    } else {
      updated.unshift({
        id: String(DB.generateId()),
        name, phone, address, notes,
        createdAt: new Date().toISOString()
      });
    }
    
    DB.setCustomers(user.uid, updated);
    setCustomers(updated);
    setIsModalOpen(false);
    toast.success(editingCustomer ? 'Customer Updated' : 'Customer Added');
  };

  const deleteCustomer = (id) => {
    if (!window.confirm('Delete this customer? This will not delete their past invoices.')) return;
    const updated = customers.filter(c => String(c.id) !== String(id));
    DB.setCustomers(user.uid, updated);
    setCustomers(updated);
    toast.success('Customer Deleted');
  };

  const handleSettlement = () => {
    if (!settlementAmount || Number(settlementAmount) <= 0) return toast.error('Enter valid amount');
    const amount = Number(settlementAmount);
    
    const paymentRecord = {
      id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString(),
      customerId: settlementCustomer.id,
      customerName: settlementCustomer.name,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paid: amount,
      due: -amount, // Negative due to offset existing dues
      paymentMethod: settlementMethod,
      status: 'PAID',
      notes: `Settlement for ${settlementCustomer.name}`
    };

    const updatedSales = [...sales, paymentRecord];
    DB.setSales(user.uid, updatedSales);
    setSales(updatedSales);
    setIsSettlementModalOpen(false);
    setSettlementAmount('');
    toast.success(t('customers.paymentSuccess'));
  };

  const openSettlementModal = (c) => {
    setSettlementCustomer(c);
    const stats = getCustomerStats(c.id);
    setSettlementAmount(stats.totalDue.toString());
    setIsSettlementModalOpen(true);
  };

  // Helper to calculate total due from sales for a customer
  const getCustomerStats = (customerId) => {
    const customerSales = sales.filter(s => String(s.customerId) === String(customerId));
    const totalDue = customerSales.reduce((acc, s) => acc + (Number(s.due) || 0), 0);
    const totalSpent = customerSales.reduce((acc, s) => acc + (Number(s.total) || Number(s.amt) || 0), 0);
    const lastVisit = customerSales.length > 0 ? new Date(Math.max(...customerSales.map(s => new Date(s.date).getTime()))) : null;
    return { totalDue, totalSpent, lastVisit, visits: customerSales.length };
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" />
          <input className="brutalist-input !pl-16 text-base py-4" placeholder={t('customers.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="brutalist-btn gap-4 w-full md:w-auto px-10 py-5 text-base bg-[var(--color-secondary)] text-[#ffffff]" onClick={openAddModal}>
          <Plus className="w-7 h-7" /> <span className="uppercase">{t('customers.addCustomer')}</span>
        </button>
      </div>

      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th>{t('customers.customer')}</th>
              <th>{t('customers.contact')}</th>
              <th>{t('customers.khataDue')}</th>
              <th>{t('customers.lifetimeValue')}</th>
              <th>{t('customers.status')}</th>
              <th className="text-right">{t('customers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => {
                const stats = getCustomerStats(c.id);
                const isRisky = stats.totalDue > 5000; // Arbitrary threshold for neo-brutalist flair
                
                return (
                  <tr key={c.id}>
                    <td>
                      <div>
                        <span className="text-lg font-black uppercase italic tracking-tight block">{c.name}</span>
                        {stats.lastVisit && <span className="text-xs text-[var(--text-secondary)] font-bold uppercase">{t('customers.lastVisit')}: {stats.lastVisit.toLocaleDateString()}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="font-black text-sm block">{c.phone}</span>
                      <span className="text-xs text-[var(--text-secondary)] truncate w-32 block" title={c.address}>{c.address || '-'}</span>
                    </td>
                    <td>
                      <span className={`font-black text-xl ${stats.totalDue > 0 ? 'text-[var(--color-error)]' : 'text-[var(--text-primary)]'}`}>
                        ₹{stats.totalDue.toLocaleString()}
                      </span>
                    </td>
                    <td><span className="font-black text-lg">₹{stats.totalSpent.toLocaleString()}</span></td>
                    <td>
                      {stats.totalDue === 0 ? (
                         <span className="inline-flex items-center gap-1 text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--color-success)] text-[#111111] px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)]">
                           <CheckCircle2 className="w-3 h-3" /> {t('customers.clear')}
                         </span>
                      ) : isRisky ? (
                         <span className="inline-flex items-center gap-1 text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--color-error)] text-[#ffffff] px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)] animate-pulse">
                           <AlertCircle className="w-3 h-3" /> {t('customers.risky')}
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--color-warning)] text-[#111111] px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)]">
                           {t('customers.due')}
                         </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {stats.totalDue > 0 && (
                          <button onClick={() => openSettlementModal(c)} className="brutalist-btn !px-3 !py-2 bg-[var(--color-success)] text-[#111111] text-xs gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t('customers.payDues')}
                          </button>
                        )}
                        <button onClick={() => openEditModal(c)} className="p-2 border-2 border-[var(--border-color)] bg-[var(--color-brand)] text-[#111111] hover:bg-[var(--text-primary)] hover:text-[#ffffff] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteCustomer(c.id)} className="p-2 border-2 border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--color-error)] hover:text-[#ffffff] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-32 bg-[var(--bg-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                    <User className="w-20 h-20" />
                    <p className="text-xl font-black uppercase tracking-widest">{t('customers.noCustomers')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? t('customers.editCustomer') : t('customers.newCustomer')}
        actions={
          <div className="flex gap-4">
            <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setIsModalOpen(false)}>{t('customers.cancel')}</button>
            <button className="brutalist-btn px-10" onClick={saveCustomer}>
              {editingCustomer ? t('customers.update') : t('customers.save')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-2">{t('customers.fullName')} *</label>
            <input className="brutalist-input text-base py-3" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-2">{t('customers.phoneNumber')} *</label>
            <input className="brutalist-input text-base py-3" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-2">{t('customers.address')}</label>
            <textarea className="brutalist-input text-base py-3 min-h-[80px]" placeholder="Street, City" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-2">{t('customers.notes')}</label>
            <input className="brutalist-input text-base py-3" placeholder="..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Settlement Modal */}
      <Modal 
        isOpen={isSettlementModalOpen} 
        onClose={() => setIsSettlementModalOpen(false)} 
        title={t('customers.settlement')}
        actions={
          <div className="flex gap-4">
            <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setIsSettlementModalOpen(false)}>{t('customers.cancel')}</button>
            <button className="brutalist-btn px-10 bg-[var(--color-success)] text-[#111111]" onClick={handleSettlement}>
              {t('customers.confirmPayment')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] shadow-[4px_4px_0_var(--shadow-color)]">
            <p className="text-xs font-black uppercase text-[var(--text-secondary)]">Customer</p>
            <p className="text-xl font-black uppercase">{settlementCustomer?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-2">{t('customers.amountToPay')} (₹)</label>
            <input 
              type="number" 
              className="brutalist-input text-2xl py-4" 
              value={settlementAmount} 
              onChange={(e) => setSettlementAmount(e.target.value)} 
              onFocus={e => e.target.select()}
            />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-2">{t('sales.paymentMode')}</label>
            <div className="grid grid-cols-2 gap-4">
              {['Cash', 'UPI', 'Card'].map(mode => (
                <button 
                  key={mode} 
                  onClick={() => setSettlementMethod(mode)}
                  className={`brutalist-btn text-xs ${settlementMethod === mode ? 'bg-[var(--color-brand)] shadow-[2px_2px_0_var(--shadow-color)]' : 'bg-white shadow-none'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
