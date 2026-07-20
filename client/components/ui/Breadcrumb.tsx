'use client';

import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <svg className="w-3 h-3 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-[var(--color-text-primary)] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
