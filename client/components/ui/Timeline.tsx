'use client';

import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export default function Timeline({ items, className }: TimelineProps) {
  const colors = {
    primary: 'bg-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
    info: 'bg-[var(--color-info)]',
  };

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--color-border)]" />
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex gap-4">
            <div className={cn(
              'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              item.icon ? colors[item.color || 'primary'] : 'bg-[var(--color-border-light)] border-2 border-[var(--color-border)]'
            )}>
              {item.icon || (
                <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-[var(--color-text-primary)]">{item.title}</h4>
                <span className="text-xs text-[var(--color-text-muted)]">{item.date}</span>
              </div>
              {item.description && (
                <p className="text-sm text-[var(--color-text-secondary)]">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
