'use client';

import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  shortcut?: string;
  onShortcutClick?: () => void;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', shortcut, onShortcutClick, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] pl-10 pr-3 py-2 text-sm focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none transition-all"
      />
      {shortcut && (
        <button
          onClick={onShortcutClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-border-light)] rounded border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
        >
          {shortcut}
        </button>
      )}
    </div>
  );
}
