'use client';

import { cn } from '@/lib/utils';

interface RadioProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function Radio({ name, value, checked, onChange, label, disabled }: RadioProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="relative">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={cn(
          'w-4.5 h-4.5 rounded-full border-2 transition-all duration-150 flex items-center justify-center',
          checked
            ? 'border-[var(--color-primary)]'
            : 'border-[var(--color-border)] group-hover:border-[var(--color-primary)]'
        )}>
          {checked && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
        </div>
      </div>
      {label && <span className="text-sm text-[var(--color-text-primary)]">{label}</span>}
    </label>
  );
}
