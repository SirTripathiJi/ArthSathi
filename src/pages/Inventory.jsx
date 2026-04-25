/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { PackageOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DB } from '../services/db';

export function Inventory() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);

  const [formData, setFormData] = useState({ name: '', category: '', cost: '', sell: '', qty: '', low: '5', expiry: '' });

  const fetchProducts = () => { if (user?.uid) setProducts(DB.getProducts(user.uid)); };
  useEffect(() => { fetchProducts(); }, [user]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const openAddModal = () => {
    setEditIndex(-1);
    setFormData({ name: '', category: '', cost: '', sell: '', qty: '', low: '5', expiry: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (id) => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const p = products[idx];
    setEditIndex(idx);
    setFormData({ name: p.name, category: p.category, cost: p.cost, sell: p.sell, qty: p.qty, low: p.lowStock, expiry: p.expiry || '' });
    setIsModalOpen(true);
  };

  const deleteProduct = (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    const newProducts = products.filter((p) => p.id !== id);
    DB.setProducts(user.uid, newProducts);
    setProducts(newProducts);
    toast.success('Product removed');
  };

  const handleSave = () => {
    const { name, category, cost, sell, qty, low, expiry } = formData;
    const c = Number(cost), s = Number(sell), q = Number(qty), l = Number(low) || 5;

    if (!name || c <= 0 || s <= 0 || q < 0) return toast.error('Invalid entry');

    const updatedProducts = [...products];

    if (editIndex >= 0) {
      updatedProducts[editIndex] = { ...updatedProducts[editIndex], name, category: category || 'General', cost: c, sell: s, qty: q, lowStock: l, expiry };
      toast.success('Product updated');
    } else {
      if (updatedProducts.find((p) => p.name.toLowerCase() === name.toLowerCase())) return toast.error('Product already exists');
      updatedProducts.push({ id: Date.now(), name, category: category || 'General', cost: c, sell: s, qty: q, lowStock: l, expiry });
      toast.success('Product added');
    }

    DB.setProducts(user.uid, updatedProducts);
    setProducts(updatedProducts);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" />
          <input 
            placeholder={t('search_products')} 
            className="brutalist-input !pl-16 text-base py-4" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <button className="brutalist-btn gap-4 w-full md:w-auto px-10 py-5 text-base" onClick={openAddModal}>
          <Plus className="w-7 h-7" /> <span className="uppercase">{t('add_product')}</span>
        </button>
      </div>

      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th>{t('item')}</th>
              <th>{t('category')}</th>
              <th>{t('cost')}</th>
              <th>{t('price')}</th>
              <th>{t('stock')}</th>
              <th>{t('expiry')}</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let isExpired = false;
                let isExpiringSoon = false;
                if (p.expiry) {
                  const expDate = new Date(p.expiry);
                  isExpired = expDate < today;
                  if (!isExpired) {
                    const diffTime = Math.abs(expDate - today);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    isExpiringSoon = diffDays <= 7;
                  }
                }

                return (
                  <tr key={p.id}>
                    <td><span className="text-lg font-black uppercase italic tracking-tight">{p.name}</span></td>
                    <td><span className="text-xs font-black uppercase border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1">{p.category}</span></td>
                    <td className="text-base font-bold">₹{p.cost}</td>
                    <td className="text-base font-bold">₹{p.sell}</td>
                    <td>
                      <div className="flex flex-col gap-2">
                        <span className="text-xl font-black">{p.qty}</span>
                        {p.qty <= 0 ? (
                          <span className="text-xs font-black uppercase bg-red-500 text-[#ffffff] px-2.5 py-1 border-2 border-[var(--border-color)]">{t('out_of_stock')}</span>
                        ) : p.qty <= p.lowStock ? (
                          <span className="text-xs font-black uppercase bg-[var(--color-brand)] text-[#111111] px-2.5 py-1 border-2 border-[var(--border-color)]">Low Stock</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      {p.expiry ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold">{new Date(p.expiry).toLocaleDateString()}</span>
                          {isExpired && <span className="text-xs font-black uppercase bg-red-500 text-[#ffffff] px-2.5 py-1 border-2 border-[var(--border-color)]">Expired</span>}
                          {isExpiringSoon && <span className="text-xs font-black uppercase bg-[var(--color-brand)] text-[#111111] px-2.5 py-1 border-2 border-[var(--border-color)]">Soon</span>}
                        </div>
                      ) : (
                        <span className="opacity-30">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEditModal(p.id)} className="p-2 border-2 border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--color-brand)] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 border-2 border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-red-500 hover:text-[#ffffff] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-32 bg-[var(--bg-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                    <PackageOpen className="w-20 h-20" />
                    <p className="text-xl font-black uppercase tracking-widest">{t('no_products')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editIndex >= 0 ? t('edit_product') : t('add_product')}
        actions={
          <div className="flex gap-4">
            <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
            <button className="brutalist-btn px-10" onClick={handleSave}>{t('save_product')}</button>
          </div>
        }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('name')}</label>
            <input className="brutalist-input text-base py-4" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('category')}</label>
            <input className="brutalist-input text-base py-4" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('cost')}</label>
            <input type="number" className="brutalist-input text-base py-4" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('selling_price')}</label>
            <input type="number" className="brutalist-input text-base py-4" value={formData.sell} onChange={(e) => setFormData({ ...formData, sell: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('quantity')}</label>
            <input type="number" className="brutalist-input text-base py-4" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">Low Stock Alert</label>
            <input type="number" className="brutalist-input text-base py-4" value={formData.low} onChange={(e) => setFormData({ ...formData, low: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('expiry_date')}</label>
            <input type="date" className="brutalist-input text-base py-4" value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
