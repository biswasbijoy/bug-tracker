'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  size = 'sm',
  showLabel,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const colors = {
    primary: 'bg-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-[var(--color-border-light)] rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[var(--color-text-secondary)] min-w-[36px] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
}
