'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState, Skeleton } from '@/components/ui/Misc';
import { PageHeader } from '@/components/ui/PageHeader';
import NoteEditor from '@/components/notes/NoteEditor';
import NoteList from '@/components/notes/NoteList';
import { useNotes } from '@/components/notes/useNotes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn, errorMessage } from '@/lib/utils';

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

function NotesApp() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get('id');

  const { notes, loading, error, saveState, load, edit, flush, create, remove } = useNotes();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selected = useMemo(() => notes.find((n) => n._id === selectedId) || null, [notes, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [notes, query]);

  const select = (id: string | null, replace = false) => {
    const url = id ? `${pathname}?id=${id}` : pathname;
    if (replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };

  // save pending edits of a note as soon as it is no longer the selected one
  useEffect(() => {
    const id = selectedId;
    return () => {
      if (id) void flush(id);
    };
  }, [selectedId, flush]);

  // keep the URL valid: unknown id → none; desktop with no selection → newest note
  useEffect(() => {
    if (loading || error) return;
    if (selected) return;
    if (isDesktop() && notes.length > 0) select(notes[0]._id, true);
    else if (selectedId) select(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, selected, selectedId, notes.length]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const note = await create();
      setQuery('');
      select(note._id);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create the note'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await remove(selected._id);
      setConfirmDelete(false);
      toast.success('Note deleted');
      select(null, true);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the note'));
    } finally {
      setDeleting(false);
    }
  };

  // ------------------------------------------------------------- error state
  if (error && notes.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-panel shadow-sm">
        <EmptyState
          title="Couldn't load your notes"
          description={`${error}. Is the API server running?`}
          action={
            <Button icon={<ArrowPathIcon className="h-4 w-4" />} onClick={load}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const showEditorOnMobile = !!selectedId;

  return (
    <>
      <div className="flex h-[calc(100dvh-14rem)] min-h-[26rem] overflow-hidden rounded-lg border border-line bg-panel shadow-sm lg:h-[calc(100dvh-12.5rem)]">
        <NoteList
          className={cn('w-full border-line md:w-72 md:shrink-0 md:border-r lg:w-80', showEditorOnMobile && 'hidden md:flex')}
          notes={filtered}
          total={notes.length}
          loading={loading}
          query={query}
          onQuery={setQuery}
          activeId={selected?._id ?? null}
          onSelect={(id) => select(id)}
          onCreate={handleCreate}
          creating={creating}
        />

        <div className={cn('min-w-0 flex-1', showEditorOnMobile ? 'flex' : 'hidden md:flex')}>
          {loading ? (
            <div className="w-full p-6" aria-busy="true" aria-label="Loading note">
              <Skeleton className="mb-4 h-7 w-1/2" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : selected ? (
            <NoteEditor
              key={selected._id}
              note={selected}
              saveState={saveState[selected._id]}
              onChange={(patch) => edit(selected._id, patch)}
              onRetry={() => void flush(selected._id)}
              onDelete={() => setConfirmDelete(true)}
              onBack={() => select(null)}
            />
          ) : (
            <EmptyState
              className="w-full"
              icon={<DocumentTextIcon />}
              title={notes.length ? 'Select a note' : 'Your notes live here'}
              description="Capture quick thoughts, test data, snippets…"
              action={
                notes.length === 0 ? (
                  <Button variant="primary" loading={creating} onClick={handleCreate}>
                    Create your first note
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this note?"
        message={
          <>
            <span className="font-medium text-fg">{selected?.title.trim() || 'Untitled note'}</span> will be permanently deleted.
            This can&apos;t be undone.
          </>
        }
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}

export default function NotesPage() {
  useDocumentTitle('Notes');
  return (
    <>
      <PageHeader title="Notes" description="Scratchpad for quick thoughts, test data and snippets. Saved automatically." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <NotesApp />
      </Suspense>
    </>
  );
}
