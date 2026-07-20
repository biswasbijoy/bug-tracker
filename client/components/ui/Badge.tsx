'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]',
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
    success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
    info: 'bg-[var(--color-info-light)] text-[var(--color-info)]',
    outline: 'border border-[var(--color-border)] text-[var(--color-text-secondary)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-[var(--color-success)]',
            variant === 'warning' && 'bg-[var(--color-warning)]',
            variant === 'danger' && 'bg-[var(--color-danger)]',
            variant === 'primary' && 'bg-[var(--color-primary)]',
            variant === 'info' && 'bg-[var(--color-info)]',
            variant === 'default' && 'bg-[var(--color-text-muted)]',
            variant === 'outline' && 'bg-[var(--color-text-muted)]'
          )}
        />
      )}
      {children}
    </span>
  );
}
