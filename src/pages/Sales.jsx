import { useEffect, useMemo, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Receipt, Search, Trash2, CheckCircle2, Printer, X, ShoppingCart, User } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DB } from '../services/db';
import { InvoicePrint } from '../components/UI/InvoicePrint';

export function Sales() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  
  // Invoice Details
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [paid, setPaid] = useState('');
  const [notes, setNotes] = useState('');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const [lastInvoice, setLastInvoice] = useState(null);
  const printRef = useRef(null);

  // Item Modal State
  const [searchItem, setSearchItem] = useState('');
  
  // Custom Item Modal State
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const fetchAll = () => {
    if (user?.uid) {
      setProducts(DB.getProducts(user.uid));
      setCustomers(DB.getCustomers(user.uid));
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  // Cart Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const totalMargin = cart.reduce((acc, item) => acc + (item.qty * (item.rate - (item.cost || 0))), 0);
  const taxAmount = (subtotal - discount) * (taxPercent / 100);
  const finalTotal = subtotal - discount + taxAmount;
  const paidAmount = paid === '' ? finalTotal : Number(paid);
  const dueAmount = Math.max(0, finalTotal - paidAmount);

  const addToCart = (product) => {
    if (product.qty <= 0 && !product.isCustom) return toast.error('Out of stock');
    
    setCart(prev => {
      const existing = prev.find(p => String(p.id) === String(product.id));
      if (existing) {
        if (!product.isCustom && existing.qty + 1 > product.qty) {
          toast.error('Cannot add more than available stock');
          return prev;
        }
        return prev.map(p => String(p.id) === String(product.id) ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        rate: product.sell || product.rate, 
        cost: product.cost || 0,
        qty: 1,
        isCustom: product.isCustom || false
      }];
    });
    toast.success(`${product.name} added`);
  };

  const addCustomCharge = () => {
    if (!customName || !customPrice) return toast.error('Enter valid details');
    addToCart({
      id: 'custom_' + Date.now(),
      name: customName,
      rate: Number(customPrice),
      cost: 0,
      qty: 1,
      isCustom: true
    });
    setIsCustomItemModalOpen(false);
    setCustomName('');
    setCustomPrice('');
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(p => {
      if (String(p.id) === String(id)) {
        const newQty = p.qty + delta;
        if (newQty <= 0) return null; // will be filtered out
        const stockProduct = products.find(prod => String(prod.id) === String(id));
        if (!p.isCustom && stockProduct && newQty > stockProduct.qty) {
          toast.error('Exceeds available stock');
          return p;
        }
        return { ...p, qty: newQty };
      }
      return p;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(p => String(p.id) !== String(id)));

  const clearCart = () => {
    if (!window.confirm('Clear all items?')) return;
    setCart([]);
    setCustomerId('');
    setDiscount(0);
    setTaxPercent(0);
    setPaid('');
    setNotes('');
  };

  const confirmSale = () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (dueAmount > 0 && !customerId) return toast.error('Udhaar (Due) requires a customer to be selected.');

    const selectedCustomer = customers.find(c => c.id === customerId);
    
    // Deduct Inventory
    const updatedProducts = [...products];
    cart.forEach(item => {
      if (!item.isCustom) {
        const pIdx = updatedProducts.findIndex(p => String(p.id) === String(item.id));
        if (pIdx > -1) {
          updatedProducts[pIdx].qty -= item.qty;
        }
      }
    });

    const invoice = {
      id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString(),
      customerId,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in',
      customerPhone: selectedCustomer ? selectedCustomer.phone : '',
      items: cart,
      subtotal,
      discount,
      taxPercent,
      tax: taxAmount,
      total: finalTotal,
      paid: paidAmount,
      due: dueAmount,
      profit: totalMargin - discount, // Simplified profit calculation
      notes,
      status: dueAmount > 0 ? 'DUE' : 'PAID'
    };

    const existingSales = DB.getSales(user.uid);
    existingSales.push(invoice);
    
    DB.setProducts(user.uid, updatedProducts);
    DB.setSales(user.uid, existingSales);
    
    setProducts(updatedProducts);
    setLastInvoice(invoice);
    setIsReceiptModalOpen(true);
    
    // Reset Form
    setCart([]);
    setCustomerId('');
    setDiscount(0);
    setTaxPercent(0);
    setPaid('');
    setNotes('');
    
    toast.success('Invoice Generated Successfully');
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#FFD600', '#FF4081', '#000000'] });
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => String(p.name || '').toLowerCase().includes(String(searchItem || '').toLowerCase())),
  [products, searchItem]);

  return (
    <div className="space-y-6">
      {/* Hidden Print Component */}
      <InvoicePrint ref={printRef} invoice={lastInvoice} type="thermal" shopDetails={{ name: user?.store || 'My Shop' }} />

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Area: Billing Actions */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-wrap gap-4">
            <button className="brutalist-btn flex-1 gap-2" onClick={() => setIsItemModalOpen(true)}>
              <Search className="w-5 h-5" /> FIND ITEM
            </button>
            <button className="brutalist-btn bg-[var(--color-secondary)] text-white flex-1 gap-2" onClick={() => setIsCustomItemModalOpen(true)}>
              <Plus className="w-5 h-5" /> EXTRA CHARGE
            </button>
          </div>

          <div className="brutalist-card space-y-4">
            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-[var(--border-color)] pb-2">
              <User className="w-6 h-6" /> CUSTOMER DETAILS
            </h3>
            <div>
              <select className="brutalist-input py-3" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in Customer (No Khata)</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
            </div>
            {customerId && (
              <p className="text-sm font-bold text-[var(--color-secondary)] uppercase">
                * Any unpaid amount will be added to this customer's khata.
              </p>
            )}
          </div>
        </div>

        {/* Right Area: Cart & Checkout */}
        <div className="flex-[2] border-4 border-[var(--border-color)] bg-[var(--card-bg)] shadow-[8px_8px_0_var(--shadow-color)] flex flex-col min-h-[600px]">
          <div className="p-4 border-b-4 border-[var(--border-color)] bg-[var(--color-brand)] flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase flex items-center gap-2 text-[#111111]">
              <ShoppingCart className="w-6 h-6" /> CURRENT BILL
            </h2>
            <button onClick={clearCart} className="text-sm font-black uppercase underline hover:text-[var(--color-error)] text-[#111111]">Clear All</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-secondary)]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20">
                <Receipt className="w-24 h-24 mb-4" />
                <p className="text-xl font-black uppercase">Cart is Empty</p>
                <p className="font-bold">Add items to start billing</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white border-2 border-[var(--border-color)] p-3 shadow-[2px_2px_0_var(--shadow-color)]">
                  <div className="flex-1">
                    <p className="font-black uppercase text-lg leading-none mb-1">{item.name}</p>
                    <p className="text-sm font-bold text-[var(--text-secondary)]">₹{item.rate.toLocaleString()} / unit</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-secondary)]">
                      <button className="px-3 py-1 font-black hover:bg-[var(--color-brand)]" onClick={() => updateCartQty(item.id, -1)}>-</button>
                      <span className="px-3 py-1 font-black text-lg border-x-2 border-[var(--border-color)]">{item.qty}</span>
                      <button className="px-3 py-1 font-black hover:bg-[var(--color-brand)]" onClick={() => updateCartQty(item.id, 1)}>+</button>
                    </div>
                    <div className="w-24 text-right font-black text-xl">
                      ₹{(item.qty * item.rate).toLocaleString()}
                    </div>
                    <button className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white border-2 border-transparent hover:border-[var(--border-color)] transition-all" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Checkout */}
          <div className="p-6 border-t-4 border-[var(--border-color)] bg-white space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm font-black uppercase">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-color)] pb-1">
                <span>Subtotal</span>
                <span className="text-lg">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-color)] pb-1">
                <span>Discount (₹)</span>
                <input type="number" className="w-20 border-2 border-[var(--border-color)] px-1 text-right outline-none" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} />
              </div>
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--border-color)] pb-1">
                <span>Tax GST (%)</span>
                <input type="number" className="w-20 border-2 border-[var(--border-color)] px-1 text-right outline-none" value={taxPercent} onChange={e => setTaxPercent(Number(e.target.value) || 0)} />
              </div>
              <div className="flex items-center justify-between bg-[var(--color-brand)] border-2 border-[var(--border-color)] p-1 px-2 text-[#111111]">
                <span>TOTAL</span>
                <span className="text-xl">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Paid Amount (₹)</label>
                <input type="number" placeholder={finalTotal.toString()} className="brutalist-input py-2 text-xl" value={paid} onChange={e => setPaid(e.target.value)} />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex justify-between items-end border-b-4 border-[var(--border-color)] pb-1">
                  <span className="text-sm font-black uppercase text-[var(--color-error)]">DUE (UDHAAR)</span>
                  <span className="text-3xl font-black text-[var(--color-error)]">₹{dueAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button className="brutalist-btn w-full py-5 text-xl mt-4" onClick={confirmSale}>
              CONFIRM & GENERATE INVOICE
            </button>
          </div>
        </div>
      </div>

      {/* Select Item Modal */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="ADD ITEM TO BILL"
        actions={<button className="brutalist-btn w-full" onClick={() => setIsItemModalOpen(false)}>DONE</button>}>
        <div className="space-y-4">
          <input className="brutalist-input py-3" placeholder="Search Inventory..." value={searchItem} onChange={e => setSearchItem(e.target.value)} autoFocus />
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredProducts.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 border-2 border-[var(--border-color)] hover:bg-[var(--color-brand)] cursor-pointer" onClick={() => addToCart(p)}>
                <div>
                  <p className="font-black uppercase">{p.name}</p>
                  <p className="text-sm font-bold">Stock: {p.qty} | ₹{p.sell}</p>
                </div>
                <Plus className="w-6 h-6" />
              </div>
            ))}
            {filteredProducts.length === 0 && <p className="text-center font-bold py-4 uppercase">No items found</p>}
          </div>
        </div>
      </Modal>

      {/* Custom Item Modal */}
      <Modal isOpen={isCustomItemModalOpen} onClose={() => setIsCustomItemModalOpen(false)} title="ADD EXTRA CHARGE"
        actions={
          <div className="flex gap-4">
            <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setIsCustomItemModalOpen(false)}>CANCEL</button>
            <button className="brutalist-btn px-8" onClick={addCustomCharge}>ADD</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-black uppercase tracking-wider mb-2">Charge Name</label>
            <input className="brutalist-input py-3" placeholder="Delivery, Labor, Custom Item..." value={customName} onChange={e => setCustomName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wider mb-2">Amount (₹)</label>
            <input type="number" className="brutalist-input py-3" placeholder="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {isReceiptModalOpen && lastInvoice && (
        <Modal isOpen={true} onClose={() => setIsReceiptModalOpen(false)} title="INVOICE GENERATED">
          <div className="text-center py-4">
            <div className="w-20 h-20 border-4 border-[var(--border-color)] bg-[var(--color-success)] flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_var(--shadow-color)]">
              <CheckCircle2 className="w-10 h-10 text-[#111111]" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">₹{lastInvoice.total.toLocaleString()}</h3>
            <p className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6">INV: {lastInvoice.id}</p>
            
            <div className="flex gap-4">
              <button className="brutalist-btn flex-1 bg-[var(--color-accent)] text-[#111111] gap-2" onClick={handlePrint}>
                <Printer className="w-5 h-5" /> PRINT RECIEPT
              </button>
              <button className="brutalist-btn flex-1 gap-2" onClick={() => setIsReceiptModalOpen(false)}>
                <X className="w-5 h-5" /> CLOSE
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
