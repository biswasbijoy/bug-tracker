'use client';

import { useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export default function Drawer({ isOpen, onClose, title, children, side = 'right', size = 'md' }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[480px]',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      />
      <div
        className={cn(
          'relative bg-[var(--color-surface)] h-full shadow-[var(--shadow-dialog)] flex flex-col animate-slide-in-right',
          side === 'right' ? 'ml-auto' : '',
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Close drawer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
