'use client';

import { useEffect, useRef } from 'react';

type Handler = (e: KeyboardEvent) => void;

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  if (!t) return false;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable;
};

/**
 * Global keyboard shortcuts.
 *  - keys are lower-case `e.key` values, optionally prefixed with `ctrl+` (⌘ also counts)
 *  - plain keys are ignored while typing in a field; `ctrl+` combos always fire
 *  - two-key sequences use a space: `"g d"` (press g, then d within 1s)
 */
export function useHotkeys(map: Record<string, Handler>) {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    let pending: string | null = null;
    let timer: ReturnType<typeof setTimeout>;

    const onKey = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if (!key || key === 'control' || key === 'meta' || key === 'shift' || key === 'alt') return;
      const mod = e.ctrlKey || e.metaKey;
      const handlers = mapRef.current;

      if (mod) {
        const h = handlers[`ctrl+${key}`];
        if (h) {
          e.preventDefault();
          h(e);
        }
        return;
      }
      if (e.altKey || isTyping(e.target)) return;

      if (pending) {
        const h = handlers[`${pending} ${key}`];
        pending = null;
        clearTimeout(timer);
        if (h) {
          e.preventDefault();
          h(e);
          return;
        }
      }

      const hasSequence = Object.keys(handlers).some((k) => k.startsWith(`${key} `));
      if (hasSequence) {
        pending = key;
        clearTimeout(timer);
        timer = setTimeout(() => (pending = null), 1000);
        return;
      }
      const h = handlers[key];
      if (h) {
        e.preventDefault();
        h(e);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, []);
}
