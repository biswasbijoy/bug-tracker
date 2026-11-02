'use client';

import { forwardRef, useId } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

export const controlClass =
  'w-full rounded-md border border-line-strong bg-panel text-sm text-fg placeholder:text-fg-subtle ' +
  'transition-colors hover:border-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 ' +
  'disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-70';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error wrapper. */
export function Field({ label, hint, error, required, className, htmlFor, children }: FieldProps) {
  return (
    <div className={cn('block', className)}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-fg-muted">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** leading icon inside the control */
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, className, wrapperClassName, id, required, ...props },
  ref
) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={wrapperClassName}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-fg-subtle [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          className={cn(controlClass, 'h-9 px-3', icon && 'pl-9', error && 'border-danger', className)}
          {...props}
        />
      </div>
    </Field>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, id, required, rows = 4, ...props },
  ref
) {
  const auto = useId();
  const taId = id || auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={taId} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={taId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        className={cn(controlClass, 'min-h-[2.25rem] resize-y px-3 py-2 leading-relaxed', error && 'border-danger', className)}
        {...props}
      />
    </Field>
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  wrapperClassName?: string;
  /** compact (filter bars) */
  size?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, className, wrapperClassName, id, required, size = 'md', ...props },
  ref
) {
  const auto = useId();
  const selId = id || auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={selId} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={selId}
          required={required}
          aria-invalid={!!error}
          className={cn(
            controlClass,
            'appearance-none pl-3 pr-8',
            size === 'sm' ? 'h-8 text-[13px]' : 'h-9',
            error && 'border-danger',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronUpDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
      </div>
    </Field>
  );
});

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...props },
  ref
) {
  const auto = useId();
  const cbId = id || auto;
  return (
    <label htmlFor={cbId} className={cn('inline-flex cursor-pointer select-none items-center gap-2 text-sm text-fg', className)}>
      <input ref={ref} id={cbId} type="checkbox" className="h-4 w-4 cursor-pointer rounded accent-accent" {...props} />
      {label}
    </label>
  );
});
