import { cn } from '../../lib/utils';

export function Logo({ className, variant = 'full' }) {
  return (
    <div className={cn('flex items-center gap-3 select-none group', className)}>
      {/* Boxy Logo Symbol */}
      <div className="relative flex items-center justify-center w-10 h-10 bg-[#FFD600] text-black border-3 border-black shadow-[3px_3px_0_#000] -rotate-3 transition-transform group-hover:rotate-0 flex-shrink-0">
        <span className="font-display font-black text-2xl">A</span>
      </div>

      {/* Wordmark */}
      {variant === 'full' && (
        <span className="font-display font-black text-2xl tracking-tight text-[var(--text)] uppercase italic">
          Arth<span className="text-[var(--color-secondary)]">Saathi</span>
        </span>
      )}
    </div>
  );
}
