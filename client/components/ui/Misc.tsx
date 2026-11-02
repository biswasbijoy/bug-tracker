'use client';

import { cn } from '@/lib/utils';
import { hueVar, type Hue } from '@/lib/tickets';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-subtle px-1 font-mono text-[10px] font-medium text-fg-muted',
        className
      )}
    >
      {children}
    </kbd>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  hue?: Hue;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, hue = 'green', className, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-subtle', className)}
    >
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: hueVar(hue) }} />
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-fg-subtle [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-fg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  /** remove body padding (tables, lists) */
  flush?: boolean;
}

/** The standard bordered surface. */
export function Panel({ title, actions, flush, className, children, ...props }: PanelProps) {
  return (
    <section className={cn('rounded-lg border border-line bg-panel shadow-sm', className)} {...props}>
      {(title || actions) && (
        <header className="flex min-h-11 items-center justify-between gap-3 border-b border-line px-4 py-2">
          <h2 className="text-[13px] font-semibold text-fg">{title}</h2>
          {actions}
        </header>
      )}
      <div className={cn(!flush && 'p-4')}>{children}</div>
    </section>
  );
}
