'use client';

import { cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

interface PopoverProps {
  /** the element that opens the popover; it receives onClick / aria props */
  trigger: React.ReactElement<any>;
  children: React.ReactNode | ((api: { close: () => void }) => React.ReactNode);
  align?: 'start' | 'end';
  /** extra classes on the floating panel */
  className?: string;
  /** panel width in px (defaults to content width, min 10rem) */
  width?: number;
  disabled?: boolean;
}

/**
 * Floating panel rendered in a portal with fixed positioning, so it is never clipped by
 * `overflow` containers (tables, boards, dialogs). Flips above the trigger when there is no room below.
 */
export function Popover({ trigger, children, align = 'start', className, width, disabled }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; ready: boolean }>({ top: 0, left: 0, ready: false });
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const place = useCallback(() => {
    const t = triggerRef.current;
    const p = panelRef.current;
    if (!t || !p) return;
    const r = t.getBoundingClientRect();
    const pw = p.offsetWidth;
    const ph = p.offsetHeight;
    const margin = 8;
    let left = align === 'end' ? r.right - pw : r.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
    let top = r.bottom + 4;
    if (top + ph > window.innerHeight - margin && r.top - ph - 4 > margin) top = r.top - ph - 4;
    setPos({ top, left, ready: true });
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
    else setPos((p) => ({ ...p, ready: false }));
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, close]);

  if (!isValidElement(trigger)) return null;
  const el = trigger as React.ReactElement<any>;

  const triggerEl = cloneElement(el, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const orig = el.props.ref as any; // React 19: ref is a regular prop
      if (typeof orig === 'function') orig(node);
      else if (orig) orig.current = node;
    },
    'aria-haspopup': 'true',
    'aria-expanded': open,
    onClick: (e: React.MouseEvent) => {
      el.props.onClick?.(e);
      if (disabled) return;
      e.stopPropagation();
      setOpen((o) => !o);
    },
  });

  return (
    <>
      {triggerEl}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, left: pos.left, width, visibility: pos.ready ? 'visible' : 'hidden' }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'anim-pop fixed z-[60] min-w-40 max-w-[calc(100vw-16px)] rounded-lg border border-line bg-panel p-1 shadow-lg',
              className
            )}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </div>,
          document.body
        )}
    </>
  );
}

// -------------------------------------------------------------------- menu

export type MenuEntry =
  | { type?: 'item'; label: string; icon?: React.ReactNode; onSelect: () => void; selected?: boolean; danger?: boolean; hue?: string; hint?: string; disabled?: boolean }
  | { type: 'heading'; label: string }
  | { type: 'separator' };

interface MenuProps extends Omit<PopoverProps, 'children'> {
  items: MenuEntry[];
  maxHeight?: number;
}

/** A Popover containing a keyboard-navigable list of actions / choices. */
export function Menu({ items, maxHeight = 340, ...popover }: MenuProps) {
  return (
    <Popover {...popover}>
      {({ close }) => (
        <div role="menu" className="overflow-y-auto" style={{ maxHeight }} onKeyDown={menuKeyDown}>
          {items.map((entry, i) => {
            if (entry.type === 'separator') return <div key={i} className="my-1 h-px bg-line" />;
            if (entry.type === 'heading')
              return (
                <div key={i} className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  {entry.label}
                </div>
              );
            return (
              <button
                key={i}
                role="menuitem"
                type="button"
                disabled={entry.disabled}
                onClick={() => {
                  entry.onSelect();
                  close();
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors',
                  'hover:bg-subtle focus:bg-subtle focus:outline-none disabled:opacity-50',
                  entry.danger ? 'text-danger' : 'text-fg'
                )}
              >
                {entry.hue ? (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.hue }} />
                ) : entry.icon ? (
                  <span className="shrink-0 text-fg-subtle [&>svg]:h-4 [&>svg]:w-4">{entry.icon}</span>
                ) : null}
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                {entry.hint && <span className="text-xs text-fg-subtle">{entry.hint}</span>}
                {entry.selected && <CheckIcon className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

function menuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not(:disabled)'));
  if (!items.length) return;
  e.preventDefault();
  const idx = items.indexOf(document.activeElement as HTMLButtonElement);
  const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
  items[next].focus();
}
