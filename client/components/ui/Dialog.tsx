'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { IconButton } from './Button';

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  size?: keyof typeof sizes;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

let openDialogs = 0;

/** Modal dialog: bottom sheet on phones, centred card on larger screens. Esc / backdrop click closes. */
export function Dialog({ open, onClose, title, description, size = 'md', footer, children }: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    openDialogs++;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);

    // focus the first field, otherwise the panel itself
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input:not([type=hidden]), textarea, select');
      (first || panelRef.current)?.focus();
    }, 30);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      openDialogs--;
      if (openDialogs === 0) document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'anim-pop flex max-h-[92dvh] w-full flex-col rounded-t-xl border border-line bg-panel shadow-lg outline-none sm:max-h-[88dvh] sm:rounded-xl',
          sizes[size]
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1.5 mt-0.5">
            <XMarkIcon className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Delete', tone = 'danger', loading, onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="text-sm text-fg-muted">{message}</div>
    </Dialog>
  );
}
