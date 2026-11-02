'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cn, errorMessage } from '@/lib/utils';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<unknown> | void;
  /** used in messages and as the accessible name */
  label: string;
  placeholder?: string;
  allowEmpty?: boolean;
  /** wrapping textarea (titles) instead of a single-line input */
  multiline?: boolean;
  /** typography for both the display and the editor, so toggling does not shift the layout */
  className?: string;
}

/** Click-to-edit text. Enter / blur saves, Esc cancels. */
export function InlineEdit({ value, onSave, label, placeholder = 'Empty', allowEmpty, multiline, className }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const done = useRef(false);

  const fit = () => {
    const el = ref.current;
    if (el && multiline) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    el?.focus();
    el?.select();
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const start = () => {
    done.current = false;
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    done.current = true;
    setEditing(false);
  };

  const commit = async () => {
    if (done.current) return;
    done.current = true;
    const next = draft.trim();
    setEditing(false);
    if (next === value.trim()) return;
    if (!next && !allowEmpty) {
      toast.error(`${label} can't be empty`);
      return;
    }
    try {
      await onSave(next);
    } catch (err) {
      toast.error(errorMessage(err, `Could not update ${label.toLowerCase()}`));
    }
  };

  const box = 'block w-full rounded-md px-1.5 py-0.5 text-left [overflow-wrap:anywhere]';

  return (
    <div className="-mx-1.5 min-w-0">
      {editing ? (
        multiline ? (
          <textarea
            ref={ref}
            rows={1}
            value={draft}
            aria-label={label}
            onChange={(e) => {
              setDraft(e.target.value.replace(/\n/g, ' '));
              fit();
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                cancel();
              }
            }}
            className={cn(box, 'resize-none overflow-hidden bg-panel outline-none ring-2 ring-accent/40', className)}
          />
        ) : (
          <input
            ref={ref}
            value={draft}
            aria-label={label}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                cancel();
              }
            }}
            className={cn(box, 'bg-panel outline-none ring-2 ring-accent/40', className)}
          />
        )
      ) : (
        <button
          type="button"
          onClick={start}
          title={`Edit ${label.toLowerCase()}`}
          className={cn(box, 'cursor-text transition-colors hover:bg-subtle', !value && 'text-fg-subtle', className)}
        >
          {value || placeholder}
        </button>
      )}
    </div>
  );
}
