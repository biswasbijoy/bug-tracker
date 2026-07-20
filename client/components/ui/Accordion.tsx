'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export default function Accordion({ items, allowMultiple = false, defaultOpen = [], className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div key={item.id} className="border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-border-light)] transition-colors"
            >
              <div className="flex items-center gap-2">
                {item.icon}
                {item.title}
              </div>
              <svg
                className={cn('w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform duration-200', isOpen && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 text-sm text-[var(--color-text-secondary)] animate-slide-up">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
