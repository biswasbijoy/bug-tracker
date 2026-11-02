'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ArrowLeftIcon, CheckIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/20/solid';
import { Button, IconButton } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Misc';
import { cn, pluralize } from '@/lib/utils';
import type { Note } from '@/types';
import type { SaveState } from './useNotes';

interface NoteEditorProps {
  note: Note;
  saveState?: SaveState;
  onChange: (patch: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onRetry: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function SaveStatus({ state, onRetry }: { state?: SaveState; onRetry: () => void }) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle" role="status">
        <Spinner className="h-3 w-3" /> Saving…
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger" role="alert">
        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
        Couldn&apos;t save —
        <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2 hover:no-underline">
          retry
        </button>
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-fg-subtle" role="status">
        <CheckIcon className="h-3.5 w-3.5 text-success" /> Saved
      </span>
    );
  }
  return null;
}

export default function NoteEditor({ note, saveState, onChange, onRetry, onDelete, onBack }: NoteEditorProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  // a brand-new (blank) note is ready for typing straight away
  useEffect(() => {
    if (!note.title && !note.content) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note._id]);

  const { words, chars } = useMemo(() => {
    const text = note.content.trim();
    return { words: text ? text.split(/\s+/).length : 0, chars: note.content.length };
  }, [note.content]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-h-12 items-center justify-between gap-2 border-b border-line px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="md:hidden" icon={<ArrowLeftIcon className="h-4 w-4" />} onClick={onBack}>
            Back
          </Button>
          <SaveStatus state={saveState} onRetry={onRetry} />
        </div>
        <IconButton label="Delete note" onClick={onDelete} className="hover:text-danger">
          <TrashIcon className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-3 sm:px-6">
        <input
          ref={titleRef}
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Untitled note"
          aria-label="Note title"
          maxLength={200}
          className="w-full bg-transparent text-lg font-semibold tracking-tight text-fg placeholder:text-fg-subtle focus:outline-none"
        />
        <textarea
          value={note.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Start typing…"
          aria-label="Note content"
          spellCheck
          className={cn(
            'prose-plain mt-3 min-h-0 w-full flex-1 resize-none bg-transparent font-mono text-[13px] leading-relaxed text-fg',
            'placeholder:text-fg-subtle focus:outline-none'
          )}
        />
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-1.5 text-[11px] text-fg-subtle sm:px-6">
        <span>{pluralize(words, 'word')}</span>
        <span>{pluralize(chars, 'character')}</span>
      </div>
    </div>
  );
}
