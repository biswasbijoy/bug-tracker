'use client';

import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Ticket } from '@/types';

/** Run an async action; toast the server's message on failure. Resolves to `undefined` when it failed. */
export async function attempt<T>(fn: () => Promise<T>, fallback: string, success?: string): Promise<T | undefined> {
  try {
    const result = await fn();
    if (success) toast.success(success);
    return result;
  } catch (err) {
    toast.error(errorMessage(err, fallback));
    return undefined;
  }
}

/** Apply a local-only change to a ticket in the store; returns a function that restores the previous state. */
export function patchTicketLocal(id: string, fn: (t: Ticket) => Ticket): () => void {
  const previous = useWorkspace.getState().tickets.find((t) => t._id === id);
  useWorkspace.setState((s) => ({ tickets: s.tickets.map((t) => (t._id === id ? fn(t) : t)) }));
  return () => {
    if (previous) useWorkspace.setState((s) => ({ tickets: s.tickets.map((t) => (t._id === id ? previous : t)) }));
  };
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

/** Text with http(s) URLs turned into links. */
export function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export const isHttpUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);
