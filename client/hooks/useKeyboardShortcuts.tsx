'use client';

import { useEffect, useCallback } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

let globalShortcuts: ShortcutMap = {};
let isInputFocused = false;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    globalShortcuts = { ...globalShortcuts, ...shortcuts };
    return () => {
      Object.keys(shortcuts).forEach((key) => {
        delete globalShortcuts[key];
      });
    };
  }, [shortcuts]);
}

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    const key = [
      e.ctrlKey || e.metaKey ? 'ctrl' : '',
      e.shiftKey ? 'shift' : '',
      e.altKey ? 'alt' : '',
      (e.key || '').toLowerCase(),
    ]
      .filter(Boolean)
      .join('+');

    if (globalShortcuts[key]) {
      if (isInputFocused && key !== 'escape') return;
      e.preventDefault();
      globalShortcuts[key](e);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <>{children}</>;
}
