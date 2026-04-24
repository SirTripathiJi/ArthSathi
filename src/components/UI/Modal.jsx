import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, actions }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Full screen dark overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[5000] transition-opacity duration-300"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      />
      {/* Centered Modal Content */}
      <div
        className="fixed z-[5001] bg-[var(--surface)] border-4 border-[var(--border-color)] w-[90%] max-w-lg shadow-[8px_8px_0_var(--border-color)] flex flex-col animate-modal-enter"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b-4 border-[var(--border-color)] bg-[var(--color-brand)] shrink-0">
          {title && <h3 className="text-xl font-black text-[#000] uppercase italic tracking-tighter">{title}</h3>}
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border-2 border-[var(--border-color)] bg-[var(--surface2)] text-[var(--text)] shadow-[2px_2px_0_var(--border-color)] hover:bg-red-500 hover:text-white transition-all active:shadow-none"
          >
            <X className="w-5 h-5 text-inherit" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 bg-[var(--surface)] text-[var(--text)] font-semibold overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {actions && (
          <div className="px-8 pb-6 pt-4 flex gap-4 justify-end border-t-2 border-[var(--border-color)] bg-[var(--surface2)] shrink-0">
            {actions}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
