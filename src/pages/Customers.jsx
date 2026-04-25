/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, History, IndianRupee, Plus, Search, Trash2, Users } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DB } from '../services/db';

export function Customers() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Forms state
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Selection
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      setCustomers(DB.getCustomers(user.uid).slice().reverse());
    }
  }, [user]);

  const filteredCustomers = useMemo(
    () => customers.filter((c) => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    ),
    [customers, search]
  );

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '' });
    setIsCustomerModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone, address: customer.address || '' });
    setIsCustomerModalOpen(true);
  };

  const openPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setIsPaymentModalOpen(true);
  };

  const openHistoryModal = (customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
  };

  const saveCustomer = () => {
    if (!formData.name || !formData.phone) return toast.error('Name and Phone are required');
    
    let updated = [...customers];
    if (editingCustomer) {
      updated = updated.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c);
      toast.success('Customer updated');
    } else {
      const newCustomer = {
        id: Date.now(),
        ...formData,
        totalCredit: 0,
        lastTxn: null,
        history: [] // { id, type, amount, date, refId }
      };
      updated = [newCustomer, ...updated];
      toast.success('Customer added');
    }
    
    DB.setCustomers(user.uid, updated.slice().reverse());
    setCustomers(updated);
    setIsCustomerModalOpen(false);
  };

  const deleteCustomer = (id) => {
    const customer = customers.find(c => c.id === id);
    if (customer.totalCredit > 0) {
      return toast.error('Cannot delete customer with pending Udhaar (Credit)');
    }
    if (!window.confirm('Delete this customer?')) return;
    
    const updated = customers.filter(c => c.id !== id);
    DB.setCustomers(user.uid, updated.slice().reverse());
    setCustomers(updated);
    toast.success('Customer deleted');
  };

  const confirmPayment = () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (amount > selectedCustomer.totalCredit) return toast.error('Amount exceeds total credit');

    const updated = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          totalCredit: c.totalCredit - amount,
          lastTxn: new Date().toISOString(),
          history: [{
            id: Date.now(),
            type: 'payment',
            amount: amount,
            date: new Date().toISOString()
          }, ...(c.history || [])]
        };
      }
      return c;
    });

    DB.setCustomers(user.uid, updated.slice().reverse());
    setCustomers(updated);
    setIsPaymentModalOpen(false);
    toast.success('Payment received successfully');
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" />
          <input className="brutalist-input !pl-16 text-base py-4" placeholder={t('customers.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="brutalist-btn gap-4 w-full md:w-auto px-10 py-5 text-base bg-[var(--color-brand)] text-[#111111]" onClick={openAddModal}>
          <Plus className="w-7 h-7" /> <span className="uppercase tracking-widest">{t('customers.add')}</span>
        </button>
      </div>

      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th>{t('customers.name')}</th>
              <th>{t('customers.phone')}</th>
              <th>{t('customers.totalCredit')}</th>
              <th>{t('customers.lastTxn')}</th>
              <th className="text-right">{t('customers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td onClick={() => openEditModal(c)} className="cursor-pointer hover:underline decoration-2 underline-offset-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black uppercase italic tracking-tight">{c.name}</span>
                      {c.totalCredit > 5000 && <AlertTriangle className="w-4 h-4 text-[#FF4081]" />}
                    </div>
                  </td>
                  <td><span className="font-bold text-base">{c.phone}</span></td>
                  <td>
                    <span className={`text-xl font-black ${c.totalCredit > 0 ? 'text-[#FF4081]' : 'text-[var(--text-primary)]'}`}>
                      ₹{c.totalCredit.toLocaleString()}
                    </span>
                  </td>
                  <td><span className="text-sm font-bold">{c.lastTxn ? new Date(c.lastTxn).toLocaleDateString() : 'N/A'}</span></td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      {c.totalCredit > 0 && (
                        <button onClick={() => openPaymentModal(c)} className="p-2 border-2 border-[var(--border-color)] bg-[#00C853] text-[#111111] hover:bg-[#00E5FF] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none" title={t('customers.receivePayment')}>
                          <IndianRupee className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openHistoryModal(c)} className="p-2 border-2 border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--bg-secondary)] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none" title={t('customers.history')}>
                        <History className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCustomer(c.id)} className="p-2 border-2 border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-red-500 hover:text-[#ffffff] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-32 bg-[var(--bg-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                    <Users className="w-20 h-20" />
                    <p className="text-xl font-black uppercase tracking-widest">{t('customers.noCustomers')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Form Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={editingCustomer ? t('customers.edit') : t('customers.add')}
        actions={
          <div className="flex gap-4">
            <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setIsCustomerModalOpen(false)}>{t('customers.cancel')}</button>
            <button className="brutalist-btn px-10" onClick={saveCustomer}>{t('customers.save')}</button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('customers.name')}</label>
            <input className="brutalist-input text-base py-4" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('customers.phone')}</label>
            <input className="brutalist-input text-base py-4" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('customers.address')} (Optional)</label>
            <input className="brutalist-input text-base py-4" placeholder="123 Main St" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Receive Payment Modal */}
      {selectedCustomer && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={t('customers.receivePayment')}
          actions={
            <div className="flex gap-4">
              <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setIsPaymentModalOpen(false)}>{t('customers.cancel')}</button>
              <button className="brutalist-btn px-10 bg-[#00C853]" onClick={confirmPayment}>{t('customers.confirmPayment')}</button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="p-6 border-4 border-[var(--border-color)] bg-[var(--color-brand)] shadow-[6px_6px_0_var(--shadow-color)]">
              <p className="text-sm font-black uppercase tracking-widest text-[#111111] mb-2">{selectedCustomer.name}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#111111]">Current Udhaar</span>
                <span className="text-3xl font-black italic text-[#FF4081]">₹{selectedCustomer.totalCredit.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('customers.paymentAmount')}</label>
              <input className="brutalist-input text-base py-4" type="number" min="1" max={selectedCustomer.totalCredit} placeholder="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
          </div>
        </Modal>
      )}

      {/* History Modal */}
      {selectedCustomer && (
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={t('customers.history')}>
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6 border-b-4 border-[var(--border-color)] pb-4">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">{selectedCustomer.name}</h3>
              <span className={`px-3 py-1 border-2 border-[var(--border-color)] text-sm font-black uppercase shadow-[3px_3px_0_var(--shadow-color)] ${selectedCustomer.totalCredit > 0 ? 'bg-[#FF4081] text-white' : 'bg-[#00C853] text-[#111111]'}`}>
                Udhaar: ₹{selectedCustomer.totalCredit.toLocaleString()}
              </span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
              {selectedCustomer.history?.length > 0 ? (
                selectedCustomer.history.map(entry => (
                  <div key={entry.id} className={`p-4 border-2 border-[var(--border-color)] flex justify-between items-center shadow-[4px_4px_0_var(--shadow-color)] ${entry.type === 'payment' ? 'bg-[#00C853]/10' : 'bg-[#FF4081]/10'}`}>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider">{entry.type === 'payment' ? 'Payment Received' : 'Purchase (Udhaar)'}</p>
                      <p className="text-xs font-bold text-[var(--text-secondary)]">{new Date(entry.date).toLocaleString()}</p>
                    </div>
                    <span className={`text-xl font-black ${entry.type === 'payment' ? 'text-[#00C853]' : 'text-[#FF4081]'}`}>
                      {entry.type === 'payment' ? '-' : '+'}₹{entry.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-50 font-bold uppercase tracking-widest text-[var(--text-secondary)]">No history found</div>
              )}
            </div>

            <button className="brutalist-btn w-full mt-6" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
