import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, actions }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[5000] flex items-center justify-center p-6 animate-brutal-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="bg-white border-4 border-black w-full max-w-lg shadow-[8px_8px_0_#000] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b-4 border-black bg-[var(--color-brand)]">
          {title && <h3 className="text-xl font-black text-black uppercase italic tracking-tighter">{title}</h3>}
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0_#000] hover:bg-red-500 hover:text-white transition-all active:shadow-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 bg-white text-black font-semibold">{children}</div>

        {/* Footer */}
        {actions && (
          <div className="px-8 pb-8 pt-4 flex gap-4 justify-end border-t-2 border-black bg-[var(--surface2)]">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
