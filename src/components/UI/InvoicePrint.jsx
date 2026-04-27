import { forwardRef } from 'react';

// A component designed strictly for printing. Hidden on screen via CSS.
export const InvoicePrint = forwardRef(({ invoice, shopDetails, type = 'a4' }, ref) => {
  if (!invoice) return null;

  const isThermal = type === 'thermal';

  return (
    <div ref={ref} className={`print-only bg-white text-black ${isThermal ? 'w-[80mm] p-2 text-xs font-sans' : 'w-full max-w-4xl p-8 font-sans'}`}>
      {/* Header */}
      <div className={`text-center border-b-2 border-black pb-4 mb-4 ${isThermal ? '' : 'border-b-4'}`}>
        <h1 className={`${isThermal ? 'text-xl font-bold uppercase' : 'text-4xl font-black uppercase tracking-tighter'}`}>
          {shopDetails?.name || 'ArthSathi Store'}
        </h1>
        <p className={`${isThermal ? 'text-[10px]' : 'text-sm font-bold uppercase mt-1'}`}>{shopDetails?.address || '123 Main Street, City'}</p>
        <p className={`${isThermal ? 'text-[10px]' : 'text-sm font-bold uppercase'}`}>{shopDetails?.phone && `Ph: ${shopDetails.phone}`}</p>
        {shopDetails?.gst && <p className={`${isThermal ? 'text-[10px]' : 'text-sm font-bold uppercase'}`}>GSTIN: {shopDetails.gst}</p>}
      </div>

      {/* Invoice Details */}
      <div className={`flex justify-between mb-4 ${isThermal ? 'text-[10px] flex-col gap-1' : 'text-sm font-bold uppercase'}`}>
        <div>
          <p>Invoice #: {invoice.id}</p>
          <p>Date: {new Date(invoice.date).toLocaleString()}</p>
        </div>
        <div className={isThermal ? '' : 'text-right'}>
          {invoice.customerName ? (
            <>
              <p>Bill To: {invoice.customerName}</p>
              <p>Ph: {invoice.customerPhone || '-'}</p>
            </>
          ) : (
            <p>Cash Walk-in</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left mb-4 border-collapse">
        <thead>
          <tr className={`border-b-2 border-black ${isThermal ? 'text-[10px]' : 'text-sm uppercase'}`}>
            <th className="py-2">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, idx) => (
            <tr key={idx} className={`border-b border-gray-300 ${isThermal ? 'text-[10px]' : 'text-sm font-bold'}`}>
              <td className="py-2">{item.name}</td>
              <td className="py-2 text-center">{item.qty}</td>
              <td className="py-2 text-right">{(item.rate || item.sell).toLocaleString()}</td>
              <td className="py-2 text-right">{(item.qty * (item.rate || item.sell)).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className={`flex flex-col items-end border-b-2 border-black pb-4 mb-4 ${isThermal ? 'text-[10px]' : 'text-sm font-bold uppercase'}`}>
        <div className="flex justify-between w-48 mb-1">
          <span>Subtotal:</span>
          <span>{(invoice.subtotal || invoice.total).toLocaleString()}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex justify-between w-48 mb-1">
            <span>Discount:</span>
            <span>-{invoice.discount.toLocaleString()}</span>
          </div>
        )}
        {invoice.tax > 0 && (
          <div className="flex justify-between w-48 mb-1">
            <span>Tax:</span>
            <span>+{invoice.tax.toLocaleString()}</span>
          </div>
        )}
        <div className={`flex justify-between w-48 mt-2 pt-2 border-t-2 border-black ${isThermal ? 'font-bold text-sm' : 'text-xl font-black'}`}>
          <span>Total:</span>
          <span>₹{(invoice.total || invoice.amt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between w-48 mt-2 text-gray-600">
          <span>Paid:</span>
          <span>₹{(invoice.paid || invoice.total).toLocaleString()}</span>
        </div>
        {(invoice.due > 0) && (
          <div className="flex justify-between w-48 text-gray-600">
            <span>Due:</span>
            <span>₹{invoice.due.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6">
        <p className={`${isThermal ? 'text-[10px] font-bold' : 'text-lg font-black uppercase'}`}>Thank you for your business!</p>
        {!isThermal && <p className="text-xs uppercase mt-2">Powered by ArthSathi POS</p>}
      </div>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';
