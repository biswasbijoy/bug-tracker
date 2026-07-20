'use client';

import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export default function Checkbox({ checked, onChange, label, disabled, id }: CheckboxProps) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'flex items-center gap-2.5 cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="relative">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={cn(
          'w-4.5 h-4.5 rounded border-2 transition-all duration-150 flex items-center justify-center',
          checked
            ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
            : 'border-[var(--color-border)] group-hover:border-[var(--color-primary)]'
        )}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      {label && <span className="text-sm text-[var(--color-text-primary)]">{label}</span>}
    </label>
  );
}
