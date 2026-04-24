import { useRef } from 'react';

export function StatCard({ label, value, icon, bgAccent, onDragStart, onDragEnter, onDragEnd, id }) {
  const cardRef = useRef(null);

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={(e) => { cardRef.current.style.opacity = '0.3'; e.dataTransfer.setData('text/plain', id); onDragStart?.(id); }}
      onDragEnd={() => { cardRef.current.style.opacity = '1'; onDragEnd?.(); }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => onDragEnter?.(id)}
      className="brutalist-card cursor-grab active:cursor-grabbing select-none relative overflow-hidden flex flex-col justify-between min-h-[160px]"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Brutalist color block */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 border-l-4 border-b-4 border-black"
        style={{ backgroundColor: bgAccent }}
      />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-black text-black uppercase tracking-widest leading-tight">{label}</span>
        <div className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0_#000]">
          {icon}
        </div>
      </div>
      
      <div className="relative z-10 mt-6">
        <div className="text-3xl font-black text-black leading-none uppercase tracking-tighter">{value}</div>
        <div className="mt-4 h-4 w-full border-2 border-black bg-white shadow-[2px_2px_0_#000] overflow-hidden">
          <div 
            className="h-full border-r-2 border-black"
            style={{ backgroundColor: bgAccent, width: '45%' }}
          />
        </div>
      </div>
    </div>
  );
}
