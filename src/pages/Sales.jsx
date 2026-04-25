/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Receipt, Search, Trash2, CheckCircle2, ShoppingCart, User, X, ChevronDown } from 'lucide-react';
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
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [lastTxn, setLastTxn] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  const fetchAll = () => {
    if (user?.uid) {
      setSales(DB.getSales(user.uid).slice().reverse());
      setProducts(DB.getProducts(user.uid));
      setCustomers(DB.getCustomers(user.uid));
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const filteredSales = useMemo(
    () => sales.filter((s) => s.customerName?.toLowerCase().includes(search.toLowerCase()) || s.id.toString().includes(search)),
    [sales, search]
  );

  const openBillModal = () => {
    if (!products.filter((x) => x.qty > 0).length) return toast.error('No inventory available');
    setCart([]);
    setSelectedCustomer('');
    setPaymentMethod('cash');
    setTax(0);
    setDiscount(0);
    setIsBillModalOpen(true);
  };

  const deleteSale = (id) => {
    if (!window.confirm('Void this transaction? (Inventory will not be reversed automatically in this version)')) return;
    const updated = sales.filter((s) => s.id !== id);
    DB.setSales(user.uid, updated.slice().reverse());
    setSales(updated);
    toast.success('Transaction voided');
  };

  const addToCartFast = (product) => {
    if (!product) return;
    if (product.qty <= 0) return toast.error('Product out of stock');

    const existingItem = cart.find(item => item.pid === product.id);
    if (existingItem) {
      if (existingItem.qty + 1 > product.qty) return toast.error('Insufficient stock');
      setCart(cart.map(item => item.pid === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { pid: product.id, name: product.name, price: product.sell, cost: product.cost, qty: 1, maxQty: product.qty }]);
    }
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === Number(selectedProduct));
    addToCartFast(product);
    setSelectedProduct('');
  };

  const updateCartQty = (pid, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.pid !== pid));
      return;
    }
    const item = cart.find(i => i.pid === pid);
    if (newQty > item.maxQty) return toast.error('Insufficient stock');
    setCart(cart.map(item => item.pid === pid ? { ...item, qty: newQty } : item));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartTax = (cartSubtotal * tax) / 100;
  const cartTotal = cartSubtotal + cartTax - discount;
  const cartProfit = cart.reduce((sum, item) => sum + ((item.price - item.cost) * item.qty), 0);

  const confirmSale = () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (paymentMethod === 'credit' && !selectedCustomer) return toast.error('Select a customer for Udhaar');

    // Double check inventory
    const updatedProducts = [...products];
    for (const item of cart) {
      const pIdx = updatedProducts.findIndex(p => p.id === item.pid);
      if (updatedProducts[pIdx].qty < item.qty) {
        return toast.error(`Insufficient stock for ${item.name}`);
      }
      updatedProducts[pIdx].qty -= item.qty;
    }

    let customerName = 'Walk-in Customer';
    let customerId = null;

    if (selectedCustomer) {
      const cust = customers.find(c => c.id === Number(selectedCustomer));
      if (cust) {
        customerName = cust.name;
        customerId = cust.id;
        
        // Update customer credit if Udhaar
        if (paymentMethod === 'credit') {
          const updatedCustomers = customers.map(c => {
            if (c.id === cust.id) {
              return {
                ...c,
                totalCredit: c.totalCredit + cartTotal,
                lastTxn: new Date().toISOString(),
                history: [{
                  id: Date.now(),
                  type: 'sale',
                  amount: cartTotal,
                  date: new Date().toISOString()
                }, ...(c.history || [])]
              };
            }
            return c;
          });
          DB.setCustomers(user.uid, updatedCustomers);
          setCustomers(updatedCustomers);
        }
      }
    }

    const txnId = Date.now();
    const txn = {
      id: txnId,
      customerId,
      customerName,
      items: cart,
      subtotal: cartSubtotal,
      tax,
      discount,
      amt: cartTotal, // Backwards compatible with Analytics
      profit: cartProfit, // Backwards compatible with Analytics
      paymentMethod,
      date: new Date().toISOString(),
    };

    const updatedSales = DB.getSales(user.uid);
    updatedSales.push(txn);
    DB.setSales(user.uid, updatedSales);
    setSales(updatedSales.slice().reverse());
    
    DB.setProducts(user.uid, updatedProducts);
    setProducts(updatedProducts);
    
    setLastTxn(txn);
    setIsBillModalOpen(false);
    toast.success('Invoice generated successfully');
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#FFD600', '#FF4081', '#000000'] });
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" />
          <input className="brutalist-input !pl-16 text-base py-4" placeholder={t('sales.searchReceipts')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="brutalist-btn gap-4 w-full md:w-auto px-10 py-5 text-base bg-[var(--color-secondary)] text-[#ffffff]" onClick={openBillModal}>
          <Plus className="w-7 h-7" /> <span className="uppercase">{t('billing.createInvoice')}</span>
        </button>
      </div>

      <div className="brutalist-table-wrap">
        <table className="brutalist-table">
          <thead>
            <tr>
              <th>{t('billing.invoiceId')}</th>
              <th>Customer</th>
              <th>Items</th>
              <th>{t('sales.amount')}</th>
              <th>Payment</th>
              <th>{t('sales.date')}</th>
              <th className="text-right">{t('sales.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length > 0 ? (
              filteredSales.map((s) => (
                <tr key={s.id}>
                  <td><span className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">#{s.id.toString().slice(-6)}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="text-lg font-black uppercase italic tracking-tight">{s.customerName || s.name || 'Walk-in'}</span>
                    </div>
                  </td>
                  <td><span className="font-bold text-sm bg-[var(--bg-secondary)] px-2 py-1 border-2 border-[var(--border-color)]">{s.items ? s.items.length : 1} Items</span></td>
                  <td><span className="font-black text-xl">₹{s.amt.toLocaleString()}</span></td>
                  <td>
                    <span className={`text-xs font-black uppercase border-2 border-[var(--border-color)] px-2 py-1 ${s.paymentMethod === 'credit' ? 'bg-[#FF4081] text-[#ffffff]' : 'bg-[#00C853] text-[#111111]'}`}>
                      {s.paymentMethod || 'cash'}
                    </span>
                  </td>
                  <td><span className="text-sm font-black">{new Date(s.date).toLocaleDateString()}</span></td>
                  <td className="text-right">
                    <button onClick={() => { setLastTxn(s); setIsInvoiceModalOpen(true); }} className="p-2 border-2 border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--color-secondary)] hover:text-[#ffffff] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none mr-2" title="View Invoice"><Receipt className="w-4 h-4" /></button>
                    <button onClick={() => deleteSale(s.id)} className="p-2 border-2 border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-red-500 hover:text-[#ffffff] transition-all shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-32 bg-[var(--bg-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                    <Receipt className="w-20 h-20" />
                    <p className="text-xl font-black uppercase tracking-widest">{t('sales.noSales')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* POS BILLING FULLSCREEN OVERLAY */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] overflow-y-auto overflow-x-hidden flex flex-col">
          <div className="flex flex-col max-w-[1400px] w-full mx-auto min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center py-6 px-4 xl:px-0 mb-4 border-b-4 border-[var(--border-color)]">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">New Invoice</h2>
              <button onClick={() => setIsBillModalOpen(false)} className="brutalist-btn px-6 py-2 bg-[var(--color-brand)] text-[#111111] text-sm shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-none hover:translate-y-1 hover:translate-x-1">
                <X className="w-5 h-5 inline-block mr-2" /> Close
              </button>
            </div>

            {/* Main 3-Column Grid */}
            <div className="flex-1 px-4 xl:px-0 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
              
              {/* COLUMN 1: PRODUCTS & CART (40% ≈ 5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4 h-[calc(100vh-140px)]">
                {/* Product Search */}
                <div className="relative shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input className="brutalist-input !pl-12 py-3 text-base w-full" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                </div>
                
                {/* Product Cards Grid */}
                <div className="flex-1 min-h-0 overflow-y-auto border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-3 grid grid-cols-2 gap-3 custom-scrollbar">
                  {products.filter(p => p.qty > 0 && p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                    <button key={p.id} onClick={() => addToCartFast(p)} className="text-left p-3 border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--color-brand)] transition-colors flex flex-col gap-2 min-h-[80px]">
                      <span className="font-black uppercase truncate w-full text-sm text-[var(--text-primary)]">{p.name}</span>
                      <div className="flex justify-between items-end w-full mt-auto">
                        <span className="font-bold text-[var(--text-secondary)] text-xs">Stock: {p.qty}</span>
                        <span className="font-black italic text-base text-[var(--text-primary)]">₹{p.sell}</span>
                      </div>
                    </button>
                  ))}
                  {products.filter(p => p.qty > 0 && p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                    <div className="col-span-2 text-center opacity-50 py-10 font-bold uppercase tracking-widest text-sm">No products found</div>
                  )}
                </div>

                {/* Cart */}
                <div className="flex-1 min-h-0 flex flex-col border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-[4px_4px_0_var(--shadow-color)]">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-3 border-b-2 border-[var(--border-color)] pb-2 shrink-0 flex items-center gap-2"><ShoppingCart className="w-4 h-4"/> Cart ({cart.reduce((a,b)=>a+b.qty,0)} items)</h4>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {cart.map((item) => (
                      <div key={item.pid} className="flex items-center border-2 border-[var(--border-color)] p-3 bg-[var(--bg-primary)] gap-4">
                        <div className="flex-1 overflow-hidden">
                          <p className="font-black uppercase truncate text-sm">{item.name}</p>
                          <p className="text-xs font-bold text-[var(--text-secondary)]">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center border-2 border-[var(--border-color)] bg-[var(--card-bg)] shrink-0">
                          <button onClick={() => updateCartQty(item.pid, item.qty - 1)} className="px-3 py-1 font-black text-lg hover:bg-[var(--border-color)] hover:text-[var(--bg-primary)] transition-colors">-</button>
                          <span className="font-black text-sm w-8 text-center">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.pid, item.qty + 1)} className="px-3 py-1 font-black text-lg hover:bg-[var(--border-color)] hover:text-[var(--bg-primary)] transition-colors">+</button>
                        </div>
                        <div className="shrink-0 w-24 text-right">
                          <span className="font-black text-lg">₹{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && <div className="text-center opacity-50 py-10 font-bold uppercase tracking-widest text-xs">Cart is empty</div>}
                  </div>
                </div>
              </div>

              {/* COLUMN 2: CUSTOMER & ADJUSTMENTS (33% ≈ 4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-[4px_4px_0_var(--shadow-color)]">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b-2 border-[var(--border-color)] pb-2 flex items-center gap-2"><User className="w-5 h-5"/> Customer</h3>
                  
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-2">{t('billing.selectCustomer')}</label>
                  <div className="relative">
                    <select className="brutalist-input bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm py-3 w-full appearance-none cursor-pointer" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                      <option value="">{t('billing.walkInCustomer')}</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-primary)]">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="border-4 border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-[4px_4px_0_var(--shadow-color)]">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b-2 border-[var(--border-color)] pb-2 flex items-center gap-2"><Receipt className="w-5 h-5"/> Adjustments</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-2">{t('billing.tax')} (%)</label>
                      <input className="brutalist-input py-3 text-base text-center w-full" type="number" min="0" placeholder="0" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-2">{t('billing.discount')} (₹)</label>
                      <input className="brutalist-input py-3 text-base text-center w-full" type="number" min="0" placeholder="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 3: SUMMARY & PAYMENT (25% ≈ 3 cols) */}
              <div className="lg:col-span-3">
                <div className="sticky top-0 flex flex-col border-4 border-[var(--border-color)] bg-[var(--card-bg)] shadow-[4px_4px_0_var(--shadow-color)]">
                  <div className="p-5 bg-[var(--color-brand)] border-b-4 border-[var(--border-color)]">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm font-bold text-[#111111]">
                        <span>{t('billing.subtotal')}</span>
                        <span>₹{cartSubtotal.toLocaleString()}</span>
                      </div>
                      {tax > 0 && (
                        <div className="flex justify-between items-center text-sm font-bold text-[#111111]">
                          <span>Tax ({tax}%)</span>
                          <span>+₹{cartTax.toFixed(2)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-sm font-bold text-[#111111]">
                          <span>Discount</span>
                          <span>-₹{discount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t-2 border-[#111111] pt-3">
                      <span className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-1">{t('billing.finalAmount')}</span>
                      <span className="block text-4xl font-black italic text-[#111111] leading-none tracking-tighter">₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">{t('billing.paymentMethod')}</label>
                    <div className="grid grid-cols-1 gap-2 mb-6">
                      {['cash', 'upi', 'credit'].map((method) => (
                        <button key={method} onClick={() => setPaymentMethod(method)}
                          className={`py-3 text-sm font-black uppercase border-2 border-[var(--border-color)] transition-colors ${paymentMethod === method ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--color-brand)]'}`}>
                          {t(`billing.${method}`)}
                        </button>
                      ))}
                    </div>

                    <button className="brutalist-btn w-full py-4 text-lg font-black uppercase tracking-widest bg-[#00C853] text-[#111111] transition-all border-2 border-[#111111] shadow-[4px_4px_0_#111111] hover:translate-y-1 hover:shadow-[2px_2px_0_#111111] active:translate-y-2 active:shadow-none" onClick={confirmSale}>
                      <CheckCircle2 className="w-5 h-5 inline-block mr-2" /> {t('billing.confirmPrint')}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {isInvoiceModalOpen && lastTxn && (
        <Modal isOpen={true} onClose={() => setIsInvoiceModalOpen(false)} title="Receipt">
          <div className="text-center py-6">
            <div className="w-16 h-16 border-4 border-[var(--border-color)] bg-[#00C853] flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_var(--shadow-color)]">
              <CheckCircle2 className="w-8 h-8 text-[#111111]" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Invoice Confirmed</h3>
            <p className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-8 italic">ID: {lastTxn.id}</p>
            
            <div className="border-4 border-[var(--border-color)] p-8 mb-8 text-left space-y-4 bg-[var(--card-bg)] shadow-[10px_10px_0_var(--shadow-color)]">
              <div className="flex justify-between items-center border-b-2 border-[var(--border-color)] pb-4 mb-4">
                <div>
                  <p className="text-xs font-black uppercase text-[var(--text-secondary)]">Customer</p>
                  <p className="text-lg font-black uppercase italic">{lastTxn.customerName || lastTxn.name || 'Walk-in'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase text-[var(--text-secondary)]">Payment</p>
                  <p className="text-sm font-black uppercase px-2 py-1 bg-[var(--border-color)] text-[var(--bg-primary)] inline-block mt-1">{lastTxn.paymentMethod || 'Cash'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {lastTxn.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm font-bold">
                    <span>{item.qty}x {item.name}</span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
                {!lastTxn.items && (
                  <div className="flex justify-between text-sm font-bold">
                    <span>{lastTxn.qty}x {lastTxn.name}</span>
                    <span>₹{lastTxn.amt}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-6 border-t-4 border-[var(--border-color)]">
                {lastTxn.tax > 0 && <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)] mb-1"><span>Tax</span><span>+₹{((lastTxn.subtotal * lastTxn.tax)/100).toFixed(2)}</span></div>}
                {lastTxn.discount > 0 && <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)] mb-3"><span>Discount</span><span>-₹{lastTxn.discount}</span></div>}
                <div className="flex justify-between items-center"><span className="text-lg font-black uppercase tracking-widest">Total</span><span className="text-4xl font-black italic">₹{lastTxn.amt.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="brutalist-btn w-full py-5 text-lg bg-[var(--bg-secondary)]" onClick={() => window.print()}>Print</button>
              <button className="brutalist-btn w-full py-5 text-lg bg-[var(--color-brand)] text-[#111111]" onClick={() => setIsInvoiceModalOpen(false)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
