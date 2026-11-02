import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg shadow-sm', className)}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12.5l4.2 4.2L19 7.5" />
      </svg>
    </span>
  );
}
