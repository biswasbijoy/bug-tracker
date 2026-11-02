'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Misc';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-sm',
  secondary: 'bg-subtle text-fg hover:bg-line',
  outline: 'border border-line-strong bg-panel text-fg hover:bg-subtle',
  ghost: 'text-fg-muted hover:bg-subtle hover:text-fg',
  danger: 'bg-danger text-canvas hover:opacity-90 shadow-sm',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-[13px]',
  md: 'h-9 gap-2 px-3.5 text-sm',
  lg: 'h-10 gap-2 px-5 text-sm',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** leading icon */
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : icon}
      {children}
    </button>
  );
});

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** required: icon-only buttons need an accessible name */
  label: string;
  size?: 'sm' | 'md';
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', active, className, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-subtle hover:text-fg',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        active && 'bg-subtle text-fg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
