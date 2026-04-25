import { cn } from '../../lib/utils';

export function Logo({ className, variant = 'full', size = 'md' }) {
  const sm = size === 'sm';
  return (
    <div className={cn('flex items-center select-none group min-w-0', sm ? 'gap-2' : 'gap-3', className)}>
      {/* Icon box */}
      <div className={cn(
        'relative flex items-center justify-center bg-[var(--color-brand)] border-[var(--border-color)] -rotate-3 transition-transform group-hover:rotate-0 flex-shrink-0',
        sm ? 'w-8 h-8 border-2 shadow-[2px_2px_0_var(--shadow-color)]' : 'w-11 h-11 border-[3px] shadow-[3px_3px_0_var(--shadow-color)]'
      )}>
        <span className={cn('font-display font-black text-[#111111]', sm ? 'text-base' : 'text-xl')}>A</span>
      </div>

      {/* Wordmark */}
      {variant === 'full' && (
        <div className={cn(
          'font-display font-black text-[var(--text-primary)] uppercase italic truncate min-w-0 flex-1',
          sm ? 'text-base tracking-tight' : 'text-xl tracking-tight'
        )}>
          Arth<span className="text-[var(--color-secondary)]">Saathi</span>
        </div>
      )}
    </div>
  );
}
