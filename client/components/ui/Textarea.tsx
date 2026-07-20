'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, maxLength, showCount, id, value, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-[var(--color-text-primary)]">
            {label}
            {props.required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          className={cn(
            'w-full bg-[var(--color-surface)] border rounded-[var(--radius-input)] px-3 py-2 text-sm resize-y min-h-[80px] transition-all duration-150',
            error
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
            'focus:outline-none',
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {(error || helper) && (
            <p className={cn('text-xs', error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]')}>
              {error || helper}
            </p>
          )}
          {showCount && maxLength && (
            <p className="text-xs text-[var(--color-text-muted)] ml-auto">
              {String(value || '').length}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
