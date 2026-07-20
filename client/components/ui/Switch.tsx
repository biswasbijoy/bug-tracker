'use client';

import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function Switch({ checked, onChange, label, disabled, size = 'md' }: SwitchProps) {
  const sizes = {
    sm: { track: 'w-8 h-4.5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-10 h-6', thumb: 'w-4 h-4', translate: 'translate-x-4' },
  };

  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          sizes[size].track,
          checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200',
            sizes[size].thumb,
            checked ? sizes[size].translate : 'translate-x-0.5'
          )}
        />
      </button>
      {label && <span className="text-sm text-[var(--color-text-primary)]">{label}</span>}
    </label>
  );
}
