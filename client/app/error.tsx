'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-fg">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">{error.message || 'An unexpected error occurred.'}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
