'use client';

/**
 * Notes data + debounced autosave.
 *
 * Notes are not part of the workspace store; this hook owns them for the /notes page.
 *  - Edits apply to local state immediately and are sent with PUT /notes/:id ~800ms after typing stops.
 *  - Saves are serialised per note (one request in flight at a time) and the server response is never
 *    written back into local text, so keystrokes typed during a save are never lost or overwritten
 *    by an older response.
 *  - `flush(id)` / `flushAll()` send pending edits right away (switching notes, unmount, page unload).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import type { Note } from '@/types';
import { errorMessage } from '@/lib/utils';

export type SaveState = 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 800;

interface Meta {
  timer?: ReturnType<typeof setTimeout>;
  /** incremented on every local edit */
  ver: number;
  /** `ver` of the last snapshot the server confirmed */
  sentVer: number;
  inflight: boolean;
  gone: boolean;
}

const byUpdated = (a: Note, b: Note) => +new Date(b.updatedAt) - +new Date(a.updatedAt);

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});

  const notesRef = useRef<Note[]>([]);
  const metaRef = useRef<Record<string, Meta>>({});

  const apply = useCallback((fn: (list: Note[]) => Note[]) => {
    notesRef.current = fn(notesRef.current);
    setNotes(notesRef.current);
  }, []);

  const meta = useCallback((id: string): Meta => {
    return (metaRef.current[id] ||= { ver: 0, sentVer: 0, inflight: false, gone: false });
  }, []);

  const setSave = useCallback((id: string, state: SaveState) => {
    setSaveState((s) => (s[id] === state ? s : { ...s, [id]: state }));
  }, []);

  // ------------------------------------------------------------------ load

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Note[]>('/notes');
      apply(() => [...data].sort(byUpdated));
    } catch (err) {
      setError(errorMessage(err, 'Could not load your notes'));
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    load();
  }, [load]);

  // ------------------------------------------------------------------ save

  const flush = useCallback(
    async (id: string): Promise<void> => {
      const m = meta(id);
      clearTimeout(m.timer);
      m.timer = undefined;
      // an in-flight request re-flushes itself when it finishes if newer edits exist
      if (m.gone || m.inflight || m.ver === m.sentVer) return;
      const note = notesRef.current.find((n) => n._id === id);
      if (!note) return;

      const sending = m.ver;
      m.inflight = true;
      setSave(id, 'saving');
      try {
        await api.put(`/notes/${id}`, { title: note.title, content: note.content });
        m.sentVer = sending;
      } catch {
        m.inflight = false;
        if (!m.gone) setSave(id, 'error');
        return;
      }
      m.inflight = false;
      if (m.gone) return;
      if (m.ver !== m.sentVer) {
        await flush(id);
      } else {
        setSave(id, 'saved');
      }
    },
    [meta, setSave]
  );

  const flushAll = useCallback(() => {
    for (const id of Object.keys(metaRef.current)) {
      const m = metaRef.current[id];
      if (!m.gone && m.ver !== m.sentVer) void flush(id);
    }
  }, [flush]);

  const edit = useCallback(
    (id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) => {
      const m = meta(id);
      m.ver += 1;
      apply((list) => {
        const next = list.map((n) => (n._id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
        return next.sort(byUpdated);
      });
      setSave(id, 'saving');
      clearTimeout(m.timer);
      m.timer = setTimeout(() => void flush(id), AUTOSAVE_MS);
    },
    [apply, flush, meta, setSave]
  );

  // flush everything when leaving the page / closing the tab
  useEffect(() => {
    const onHide = () => flushAll();
    window.addEventListener('beforeunload', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('beforeunload', onHide);
      window.removeEventListener('pagehide', onHide);
      flushAll();
    };
  }, [flushAll]);

  // ------------------------------------------------------------ create / delete

  const create = useCallback(async (): Promise<Note> => {
    const { data } = await api.post<Note>('/notes', { title: '', content: '' });
    meta(data._id);
    apply((list) => [data, ...list]);
    return data;
  }, [apply, meta]);

  const remove = useCallback(
    async (id: string): Promise<void> => {
      const m = meta(id);
      clearTimeout(m.timer);
      m.gone = true; // drop any pending / in-flight save results for this note
      try {
        await api.delete(`/notes/${id}`);
      } catch (err) {
        m.gone = false;
        throw err;
      }
      apply((list) => list.filter((n) => n._id !== id));
      setSaveState((s) => {
        const { [id]: _removed, ...rest } = s;
        return rest;
      });
    },
    [apply, meta]
  );

  return { notes, loading, error, saveState, load, edit, flush, flushAll, create, remove };
}
