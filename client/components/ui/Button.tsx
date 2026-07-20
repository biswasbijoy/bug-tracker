'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, iconPosition = 'left', children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm',
      secondary: 'bg-[var(--color-border-light)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]',
      danger: 'bg-[var(--color-danger)] text-white hover:opacity-90 shadow-sm',
      ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-text-primary)]',
      outline: 'border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-light)]',
      success: 'bg-[var(--color-success)] text-white hover:opacity-90 shadow-sm',
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-xs rounded-[8px] gap-1.5',
      md: 'h-8 px-3 text-sm rounded-[10px] gap-2',
      lg: 'h-10 px-4 text-base rounded-[10px] gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon && iconPosition === 'left' ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
