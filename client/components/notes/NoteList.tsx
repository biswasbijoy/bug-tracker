'use client';

import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { EmptyState, Skeleton } from '@/components/ui/Misc';
import { cn, timeAgo } from '@/lib/utils';
import type { Note } from '@/types';

/** First non-empty line of the note body, for the list preview. */
export const notePreview = (content: string) =>
  content
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean) || '';

interface NoteListProps {
  notes: Note[];
  total: number;
  loading: boolean;
  query: string;
  onQuery: (q: string) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  creating: boolean;
  className?: string;
}

export function NoteListSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-busy="true" aria-label="Loading notes">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="px-4 py-3">
          <Skeleton className="mb-2 h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </li>
      ))}
    </ul>
  );
}

export default function NoteList({
  notes, total, loading, query, onQuery, activeId, onSelect, onCreate, creating, className,
}: NoteListProps) {
  return (
    <aside className={cn('flex min-h-0 flex-col', className)} aria-label="Notes">
      <div className="space-y-2 border-b border-line p-3">
        <Button variant="primary" className="w-full" icon={<PlusIcon className="h-4 w-4" />} loading={creating} onClick={onCreate}>
          New note
        </Button>
        <Input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search notes…"
          aria-label="Search notes"
          icon={<MagnifyingGlassIcon />}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <NoteListSkeleton />
        ) : total === 0 ? (
          <EmptyState
            icon={<DocumentTextIcon />}
            title="No notes yet"
            description="Capture quick thoughts, test data, snippets…"
          />
        ) : notes.length === 0 ? (
          <EmptyState icon={<MagnifyingGlassIcon />} title="No matching notes" description={`Nothing matches “${query}”.`} />
        ) : (
          <ul className="divide-y divide-line">
            {notes.map((n) => {
              const active = n._id === activeId;
              const preview = notePreview(n.content);
              return (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(n._id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'block w-full px-4 py-3 text-left transition-colors',
                      active ? 'bg-accent-soft' : 'hover:bg-subtle'
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cn('truncate text-sm font-medium', n.title.trim() ? 'text-fg' : 'text-fg-muted italic')}>
                        {n.title.trim() || 'Untitled note'}
                      </span>
                      <span className="shrink-0 text-[11px] text-fg-subtle">{timeAgo(n.updatedAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-fg-muted">{preview || 'No additional text'}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
