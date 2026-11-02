'use client';

import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Underline tabs; scrolls horizontally on narrow screens. */
export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line', className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors',
              active ? 'text-fg shadow-[inset_0_-2px_0_0_var(--accent)]' : 'text-fg-muted hover:text-fg'
            )}
          >
            {t.icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{t.icon}</span>}
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-[11px] leading-4', active ? 'bg-accent-soft text-accent' : 'bg-subtle text-fg-subtle')}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  options: { value: T; label?: string; icon?: React.ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/** Compact either-or switch (view mode, grouping, theme…). */
export function Segmented<T extends string>({ options, value, onChange, size = 'md', className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" className={cn('inline-flex rounded-md border border-line bg-subtle p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.title || o.label}
            title={o.title || o.label}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-2.5 text-[13px] font-medium transition-colors [&>svg]:h-4 [&>svg]:w-4',
              size === 'sm' ? 'h-6' : 'h-7',
              active ? 'bg-panel text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
