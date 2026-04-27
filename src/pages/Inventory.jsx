/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useState } from 'react';
import { PackageOpen, Pencil, Plus, Search, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/ToastContext';
import { useTranslation } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { calcMargin, formatCurrency } from '../lib/calc';
import { isExpired, isExpiringSoon, toDateLabel } from '../lib/dates';

const SORT_FIELDS = ['name', 'qty', 'margin', 'sell', 'expiry'];
const CATEGORIES = ['All'];

export function Inventory() {
  const toast = useToast();
  const { t = (k) => k } = useTranslation();
  const { products, saveProduct, deleteProduct } = useData();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category: '', cost: '', sell: '', qty: '', low: '5', expiry: ''
  });

  // Build category list from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const matchSearch = String(p.name || '').toLowerCase().includes(String(search || '').toLowerCase());
      const matchCat = categoryFilter === 'All' || (p.category || 'General') === categoryFilter;
      return matchSearch && matchCat;
    });

    list = [...list].sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'margin') {
        aVal = calcMargin(a.cost, a.sell);
        bVal = calcMargin(b.cost, b.sell);
      } else if (sortField === 'expiry') {
        aVal = a.expiry || 'zzzz';
        bVal = b.expiry || 'zzzz';
      } else if (sortField === 'qty' || sortField === 'sell') {
        aVal = Number(a[sortField]) || 0;
        bVal = Number(b[sortField]) || 0;
      } else {
        aVal = String(a[sortField] || '').toLowerCase();
        bVal = String(b[sortField] || '').toLowerCase();
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, search, categoryFilter, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ name: '', category: '', cost: '', sell: '', qty: '', low: '5', expiry: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditId(p.id);
    setFormData({
      name: p.name, category: p.category || 'General',
      cost: p.cost, sell: p.sell, qty: p.qty,
      low: p.lowStock || 5, expiry: p.expiry || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    deleteProduct(id);
    toast.success('Product removed');
  };

  const handleSave = () => {
    const { name, cost, sell, qty, low, category, expiry } = formData;
    const c = Number(cost), s = Number(sell), q = Number(qty), l = Number(low) || 5;
    if (!name.trim()) return toast.error('Product name is required');
    if (c < 0 || s <= 0 || q < 0) return toast.error('Invalid price or quantity');

    // Duplicate check (skip self when editing)
    const isDupe = products.some(p =>
      String(p.name || '').toLowerCase() === name.trim().toLowerCase() &&
      String(p.id) !== String(editId)
    );
    if (isDupe) return toast.error('Product already exists');

    const productData = {
      name: name.trim(),
      category: (category || 'General').trim(),
      cost: c, sell: s, qty: q, lowStock: l, expiry,
    };
    saveProduct(productData, editId);
    toast.success(editId ? 'Product updated' : 'Product added');
    setIsModalOpen(false);
  };

  // Quick stock adjust
  const adjustStock = (id, delta) => {
    const p = products.find(p => String(p.id) === String(id));
    if (!p) return;
    const newQty = Math.max(0, Number(p.qty) + delta);
    saveProduct({ ...p, qty: newQty }, id);
  };

  const f = (v) => formData[v];
  const set = (k) => (e) => setFormData(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              className="brutalist-input !pl-12"
              placeholder={t('inventory.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="brutalist-input max-w-[160px]"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="brutalist-btn btn-lg gap-3 shrink-0" onClick={openAddModal}>
          <Plus className="w-5 h-5" />
          <span>{t('inventory.addProduct')}</span>
        </button>
      </div>

      {/* ── STATS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', val: products.length, color: 'var(--color-accent)' },
          { label: 'Low / Out of Stock', val: products.filter(p => Number(p.qty) <= Number(p.lowStock || 5)).length, color: 'var(--color-brand)' },
          { label: 'Expired', val: products.filter(p => isExpired(p.expiry)).length, color: 'var(--color-error)' },
          { label: 'Categories', val: categories.length - 1, color: 'var(--color-secondary)' },
        ].map(stat => (
          <div key={stat.label} className="brutalist-card flex items-center gap-3 py-3">
            <div className="w-3 h-10 shrink-0" style={{ background: stat.color }} />
            <div>
              <p className="text-2xl font-black leading-none">{stat.val}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="cursor-pointer hover:bg-[#222] select-none">
                {t('inventory.product')} <SortIcon field="name" />
              </th>
              <th>{t('inventory.category')}</th>
              <th onClick={() => handleSort('sell')} className="cursor-pointer hover:bg-[#222] select-none">
                {t('inventory.costPrice')} / {t('inventory.sellingPrice')} <SortIcon field="sell" />
              </th>
              <th onClick={() => handleSort('margin')} className="cursor-pointer hover:bg-[#222] select-none">
                Margin <SortIcon field="margin" />
              </th>
              <th onClick={() => handleSort('qty')} className="cursor-pointer hover:bg-[#222] select-none">
                {t('inventory.stock')} <SortIcon field="qty" />
              </th>
              <th onClick={() => handleSort('expiry')} className="cursor-pointer hover:bg-[#222] select-none">
                {t('inventory.expiryDate')} <SortIcon field="expiry" />
              </th>
              <th className="text-right">{t('inventory.action')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const margin = calcMargin(p.cost, p.sell);
                const expired = isExpired(p.expiry);
                const expiring = isExpiringSoon(p.expiry, 7);
                const oos = Number(p.qty) <= 0;
                const lowStock = !oos && Number(p.qty) <= Number(p.lowStock || 5);

                return (
                  <tr key={p.id}>
                    <td>
                      <span className="text-sm font-black uppercase italic tracking-tight block">{p.name}</span>
                    </td>
                    <td>
                      <span className="badge badge-neutral text-[10px]">{p.category || 'General'}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-[var(--text-secondary)] font-bold">Cost: {formatCurrency(p.cost)}</span>
                        <span className="text-sm font-black">{formatCurrency(p.sell)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge text-[11px] font-black ${margin >= 30 ? 'badge-paid' : margin >= 15 ? 'badge-partial' : 'badge-due'}`}>
                        {margin >= 0 ? '+' : ''}{margin}%
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1.5">
                        {/* Quick +/− buttons */}
                        <div className="flex items-center gap-1">
                          <button onClick={() => adjustStock(p.id, -1)}
                            className="w-6 h-6 border-2 border-[var(--border-color)] flex items-center justify-center font-black text-xs hover:bg-[var(--color-error)] hover:text-white hover:border-[var(--color-error)] transition-colors">
                            −
                          </button>
                          <span className="text-lg font-black w-8 text-center">{p.qty}</span>
                          <button onClick={() => adjustStock(p.id, 1)}
                            className="w-6 h-6 border-2 border-[var(--border-color)] flex items-center justify-center font-black text-xs hover:bg-[var(--color-success)] hover:text-white hover:border-[var(--color-success)] transition-colors">
                            +
                          </button>
                        </div>
                        {oos && <span className="badge badge-outstock text-[9px]">{t('inventory.outOfStock')}</span>}
                        {lowStock && <span className="badge badge-lowstock text-[9px]">Low Stock</span>}
                      </div>
                    </td>
                    <td>
                      {p.expiry ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold">{toDateLabel(p.expiry)}</span>
                          {expired && <span className="badge badge-expired text-[9px]">{t('inventory.expired')}</span>}
                          {expiring && !expired && <span className="badge badge-expiring text-[9px]">{t('inventory.expiringSoon')}</span>}
                        </div>
                      ) : (
                        <span className="text-[var(--text-secondary)] opacity-40">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="brutalist-btn btn-sm btn-icon bg-transparent text-[var(--text-primary)] hover:bg-[var(--color-brand)] hover:text-[#111111]"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="brutalist-btn btn-sm btn-icon bg-transparent text-[var(--text-primary)] hover:bg-[var(--color-error)] hover:text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-24">
                  <div className="flex flex-col items-center justify-center gap-4 text-[var(--text-secondary)] opacity-30">
                    <PackageOpen className="w-16 h-16" />
                    <p className="text-lg font-black uppercase tracking-widest">{t('inventory.noProducts')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD/EDIT MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? t('inventory.editProduct') : t('inventory.addProduct')}
        actions={
          <div className="flex gap-3">
            <button className="brutalist-btn brutalist-btn-ghost" onClick={() => setIsModalOpen(false)}>
              {t('inventory.cancel')}
            </button>
            <button className="brutalist-btn" onClick={handleSave}>
              {editId ? t('inventory.saveProduct') : t('inventory.addProduct')}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="section-title text-[10px]">{t('inventory.name')} *</label>
            <input className="brutalist-input" value={f('name')} onChange={set('name')} placeholder="Product name" />
          </div>
          <div className="sm:col-span-2">
            <label className="section-title text-[10px]">{t('inventory.category')}</label>
            <input className="brutalist-input" value={f('category')} onChange={set('category')} placeholder="e.g. Grocery, Electronics" />
          </div>
          <div>
            <label className="section-title text-[10px]">{t('inventory.costPrice')} (₹) *</label>
            <input type="number" min="0" className="brutalist-input text-lg font-black" value={f('cost')} onChange={set('cost')} onFocus={e => e.target.select()} />
          </div>
          <div>
            <label className="section-title text-[10px]">{t('inventory.sellingPriceRs')} *</label>
            <input type="number" min="0" className="brutalist-input text-lg font-black" value={f('sell')} onChange={set('sell')} onFocus={e => e.target.select()} />
          </div>
          <div>
            <label className="section-title text-[10px]">{t('inventory.stockQty')} *</label>
            <input type="number" min="0" className="brutalist-input text-lg font-black" value={f('qty')} onChange={set('qty')} onFocus={e => e.target.select()} />
          </div>
          <div>
            <label className="section-title text-[10px]">{t('inventory.lowStockAlert')}</label>
            <input type="number" min="1" className="brutalist-input" value={f('low')} onChange={set('low')} onFocus={e => e.target.select()} />
          </div>
          <div className="sm:col-span-2">
            <label className="section-title text-[10px]">{t('inventory.expiryDate')}</label>
            <input type="date" className="brutalist-input" value={f('expiry')} onChange={set('expiry')} />
          </div>
          {/* Live margin preview */}
          {f('cost') && f('sell') && (
            <div className="sm:col-span-2 p-3 border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Margin Preview</span>
              <span className="font-black text-lg">
                {formatCurrency(Number(f('sell')) - Number(f('cost')))}
                {' '}
                <span className={`badge text-[10px] ${calcMargin(f('cost'), f('sell')) >= 15 ? 'badge-paid' : 'badge-due'}`}>
                  {calcMargin(f('cost'), f('sell'))}%
                </span>
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
