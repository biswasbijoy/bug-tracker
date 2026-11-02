'use client';

import { useEffect } from 'react';

/** Sets the browser tab title to "<title> · Tracker". */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · Tracker`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
