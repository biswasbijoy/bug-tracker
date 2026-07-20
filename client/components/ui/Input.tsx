'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  floating?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, icon, floating, id, type, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    if (floating && label) {
      const isActive = focused || hasValue;
      return (
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] z-10">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'peer w-full bg-[var(--color-surface)] border rounded-[var(--radius-input)] px-3 pt-5 pb-2 text-sm transition-all duration-150',
              'placeholder-transparent',
              icon && 'pl-9',
              error
                ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
              'focus:outline-none',
              className
            )}
            placeholder={label}
            onFocus={() => setFocused(true)}
            onBlur={(e) => { setFocused(false); setHasValue(!!e.target.value); props.onBlur?.(e); }}
            onChange={(e) => { setHasValue(!!e.target.value); props.onChange?.(e); }}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-3 transition-all duration-150 pointer-events-none z-10',
              icon && 'left-9',
              isActive
                ? 'top-1.5 text-[10px] text-[var(--color-text-secondary)]'
                : 'top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]',
              focused && !error && 'text-[var(--color-primary)]',
              error && 'text-[var(--color-danger)]'
            )}
          >
            {label}
          </label>
          {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
          {helper && !error && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-primary)]">
            {label}
            {props.required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'w-full bg-[var(--color-surface)] border rounded-[var(--radius-input)] px-3 py-2 text-sm transition-all duration-150',
              icon && 'pl-9',
              error
                ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
              'focus:outline-none',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        {helper && !error && <p className="text-xs text-[var(--color-text-muted)]">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
