/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Receipt, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DB } from '../services/db';

export function Sales() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [lastTxn, setLastTxn] = useState(null);
  const [selProductId, setSelProductId] = useState('');
  const [selQty, setSelQty] = useState('');

  const fetchAll = () => {
    if (user?.uid) {
      setSales(DB.getSales(user.uid).slice().reverse());
      setProducts(DB.getProducts(user.uid));
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const filteredSales = useMemo(
    () => sales.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [sales, search]
  );

  const openSaleModal = () => {
    if (!products.filter((x) => x.qty > 0).length) return toast.error('No inventory available');
    setSelProductId('');
    setSelQty('');
    setIsSaleModalOpen(true);
  };

  const deleteSale = (id) => {
    if (!window.confirm('Void this transaction?')) return;
    const updated = sales.filter((s) => s.id !== id);
    DB.setSales(user.uid, updated.slice().reverse());
    setSales(updated);
    toast.success('Transaction voided');
  };

  const selectedProduct = products.find((x) => x.id === Number(selProductId));
  const qty = Number(selQty);
  const preview =
    selectedProduct && qty > 0
      ? {
          total: selectedProduct.sell * qty,
          profit: (selectedProduct.sell - selectedProduct.cost) * qty,
        }
      : null;

  const confirmSale = () => {
    const pid = Number(selProductId);
    if (!pid || !qty || qty <= 0) return toast.error('Enter valid quantity');
    const updated = [...products];
    const idx = updated.findIndex((x) => x.id === pid);
    if (qty > updated[idx].qty) return toast.error('Insufficient stock');
    updated[idx].qty -= qty;
    DB.setProducts(user.uid, updated);
    const txn = {
      id: Date.now(),
      pid,
      name: updated[idx].name,
      qty,
      amt: updated[idx].sell * qty,
      profit: (updated[idx].sell - updated[idx].cost) * qty,
      date: new Date().toISOString(),
    };
    const updatedSales = DB.getSales(user.uid);
    updatedSales.push(txn);
    DB.setSales(user.uid, updatedSales);
    setProducts(updated);
    setSales(updatedSales.slice().reverse());
    setLastTxn(txn);
    setIsSaleModalOpen(false);
    toast.success('Transaction confirmed');
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#FFD600', '#FF4081', '#000000'] });
    setIsBillModalOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          <input className="brutalist-input !pl-14" placeholder={t('search_receipts')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="brutalist-btn gap-3 w-full md:w-auto px-8 py-4 bg-[var(--color-secondary)] text-white" onClick={openSaleModal}>
          <Plus className="w-6 h-6" /> <span className="uppercase">{t('new_sale')}</span>
        </button>
      </div>

      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th>{t('product')}</th>
              <th>{t('qty')}</th>
              <th>{t('amount')}</th>
              <th>{t('profit')}</th>
              <th>{t('date')}</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length > 0 ? (
              filteredSales.map((s) => (
                <tr key={s.id}>
                  <td><span className="text-base font-black uppercase italic">{s.name}</span></td>
                  <td><span className="font-black">{s.qty}</span></td>
                  <td><span className="font-black text-lg">₹{s.amt.toLocaleString()}</span></td>
                  <td>
                    <span className="text-xs font-black uppercase border-2 border-black bg-[var(--color-success)] text-white px-2 py-1 shadow-[2px_2px_0_#000]">
                      +₹{s.profit.toLocaleString()}
                    </span>
                  </td>
                  <td><span className="text-xs font-black">{new Date(s.date).toLocaleDateString()}</span></td>
                  <td className="text-right">
                    <button onClick={() => deleteSale(s.id)} className="p-2 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0_#000] active:shadow-none"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-32 bg-gray-50">
                  <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                    <Receipt className="w-20 h-20" />
                    <p className="text-xl font-black uppercase tracking-widest">{t('no_sales')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title={t('make_sale')}
        actions={
          <div className="flex gap-4">
            <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setIsSaleModalOpen(false)}>{t('cancel')}</button>
            <button className="brutalist-btn px-10" onClick={confirmSale}>
              {t('confirm_sale')}
            </button>
          </div>
        }
      >
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-3">{t('select_product')}</label>
            <select className="brutalist-input bg-white" value={selProductId} onChange={(e) => setSelProductId(e.target.value)}>
              <option value="">Choose item…</option>
              {products.filter((x) => x.qty > 0).map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.qty})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-3">{t('sale_qty')}</label>
            <input className="brutalist-input" type="number" min="1" placeholder="0" value={selQty} onChange={(e) => setSelQty(e.target.value)} />
          </div>
          {preview && (
            <div className="p-8 border-4 border-black bg-[var(--color-brand)] shadow-[6px_6px_0_#000] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-black">Total Invoice</span>
                <span className="text-3xl font-black italic">₹{preview.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-black pt-4">
                <span className="text-xs font-black uppercase tracking-widest text-black">Net Margin</span>
                <span className="text-lg font-black text-white bg-black px-3 py-1">+₹{preview.profit.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {isBillModalOpen && lastTxn && (
        <Modal isOpen={true} onClose={() => setIsBillModalOpen(false)} title="Sale Confirmed">
          <div className="text-center py-6">
            <div className="w-24 h-24 border-4 border-black bg-[var(--color-success)] flex items-center justify-center mx-auto mb-8 shadow-[6px_6px_0_#000]">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Invoice Confirmed</h3>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-10 italic">ID: {lastTxn.id}</p>
            
            <div className="border-4 border-black p-8 mb-10 text-left space-y-6 bg-white shadow-[8px_8px_0_#000]">
              <div className="flex justify-between text-sm font-black uppercase"><span className="text-gray-500">Product</span><span>{lastTxn.name}</span></div>
              <div className="flex justify-between text-sm font-black uppercase"><span className="text-gray-500">Quantity</span><span>{lastTxn.qty}</span></div>
              <div className="pt-6 border-t-4 border-black flex justify-between items-center"><span className="text-lg font-black uppercase tracking-widest">Total</span><span className="text-4xl font-black italic">₹{lastTxn.amt.toLocaleString()}</span></div>
            </div>

            <button className="brutalist-btn w-full py-6 text-xl bg-[var(--color-brand)]" onClick={() => setIsBillModalOpen(false)}>
              Close Receipt
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
