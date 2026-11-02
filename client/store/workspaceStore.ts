'use client';

/**
 * Workspace store: one cache for tickets, projects, epics, sprints and labels, shared by every page.
 * All mutations go through here so lists, boards, the sidebar and the command palette stay in sync.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import api from '@/services/api';
import type { Epic, Label, Project, Sprint, Ticket, TicketInput } from '@/types';

// ----------------------------------------------------------- normalisation

type Ref = string | { _id: string } | null | undefined;
const refId = (r: Ref): string | undefined => (r && typeof r === 'object' ? r._id : r || undefined);

/** API ticket (populated refs, comment authors as objects) → client Ticket. */
export function normalizeTicket(raw: any): Ticket {
  return {
    ...raw,
    projectId: refId(raw.projectId) as string,
    epicId: refId(raw.epicId),
    sprintId: refId(raw.sprintId),
    parentTicketId: refId(raw.parentTicketId),
    labels: raw.labels || [],
    tags: raw.tags || [],
    attachments: raw.attachments || [],
    checklist: (raw.checklist || []).map((c: any) => ({ _id: String(c._id), text: c.text, completed: !!c.completed })),
    comments: (raw.comments || []).map((c: any) => ({
      _id: String(c._id),
      text: c.text,
      author: c.userId?.name || 'Unknown',
      createdAt: c.createdAt,
    })),
    activityLogs: (raw.activityLogs || []).map((l: any) => ({
      _id: String(l._id),
      action: l.action,
      field: l.field,
      oldValue: l.oldValue,
      newValue: l.newValue,
      author: l.userId?.name || 'Unknown',
      createdAt: l.createdAt,
    })),
  } as Ticket;
}

const normalizeEpic = (raw: any): Epic => ({ ...raw, projectId: refId(raw.projectId) as string });
const normalizeSprint = (raw: any): Sprint => ({ ...raw, projectId: refId(raw.projectId) as string });

/** Apply a TicketInput locally (empty string clears optional fields). */
function applyPatch(ticket: Ticket, patch: TicketInput): Ticket {
  const next: any = { ...ticket };
  for (const [k, v] of Object.entries(patch)) next[k] = v === '' || v === null ? undefined : v;
  return next as Ticket;
}

// ------------------------------------------------------------------- store

interface WorkspaceState {
  tickets: Ticket[];
  projects: Project[];
  epics: Epic[];
  sprints: Sprint[];
  labels: Label[];
  loaded: boolean;
  loading: boolean;
  error: string | null;

  load: (force?: boolean) => Promise<void>;
  reset: () => void;

  createTicket: (input: TicketInput) => Promise<Ticket>;
  updateTicket: (id: string, patch: TicketInput) => Promise<Ticket>;
  deleteTicket: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  fetchTicket: (id: string) => Promise<Ticket>;
  /** Replace a ticket with a fresh API response (used after comments/checklist/attachments calls). */
  ticketAction: (request: Promise<{ data: any }>) => Promise<Ticket>;

  saveProject: (input: Partial<Project>, id?: string) => Promise<Project>;
  removeProject: (id: string) => Promise<void>;
  saveEpic: (input: Partial<Epic>, id?: string) => Promise<Epic>;
  removeEpic: (id: string) => Promise<void>;
  saveSprint: (input: Partial<Sprint>, id?: string) => Promise<Sprint>;
  removeSprint: (id: string) => Promise<void>;
  saveLabel: (input: Partial<Label>, id?: string) => Promise<Label>;
  removeLabel: (id: string) => Promise<void>;
}

const upsert = <T extends { _id: string }>(list: T[], item: T, atStart = true): T[] =>
  list.some((x) => x._id === item._id)
    ? list.map((x) => (x._id === item._id ? item : x))
    : atStart
      ? [item, ...list]
      : [...list, item];

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  tickets: [],
  projects: [],
  epics: [],
  sprints: [],
  labels: [],
  loaded: false,
  loading: false,
  error: null,

  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true, error: null });
    try {
      const [tickets, projects, epics, sprints, labels] = await Promise.all([
        api.get('/tickets'),
        api.get('/projects'),
        api.get('/epics'),
        api.get('/sprints'),
        api.get('/labels'),
      ]);
      set({
        tickets: tickets.data.map(normalizeTicket),
        projects: projects.data,
        epics: epics.data.map(normalizeEpic),
        sprints: sprints.data.map(normalizeSprint),
        labels: labels.data,
        loaded: true,
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false, error: err?.response?.data?.message || 'Could not load your workspace' });
    }
  },

  reset: () =>
    set({ tickets: [], projects: [], epics: [], sprints: [], labels: [], loaded: false, loading: false, error: null }),

  // ---- tickets

  createTicket: async (input) => {
    const { data } = await api.post('/tickets', input);
    const ticket = normalizeTicket(data);
    set((s) => ({ tickets: [ticket, ...s.tickets] }));
    return ticket;
  },

  updateTicket: async (id, patch) => {
    const previous = get().tickets.find((t) => t._id === id);
    if (previous) {
      set((s) => ({ tickets: s.tickets.map((t) => (t._id === id ? applyPatch(t, patch) : t)) }));
    }
    try {
      const { data } = await api.put(`/tickets/${id}`, patch);
      const ticket = normalizeTicket(data);
      set((s) => ({ tickets: upsert(s.tickets, ticket) }));
      return ticket;
    } catch (err) {
      if (previous) set((s) => ({ tickets: s.tickets.map((t) => (t._id === id ? previous : t)) }));
      throw err;
    }
  },

  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`);
    set((s) => ({
      tickets: s.tickets
        .filter((t) => t._id !== id)
        .map((t) => (t.parentTicketId === id ? { ...t, parentTicketId: undefined } : t)),
    }));
  },

  toggleFavorite: async (id) => {
    const previous = get().tickets.find((t) => t._id === id);
    if (!previous) return;
    set((s) => ({ tickets: s.tickets.map((t) => (t._id === id ? { ...t, isFavorite: !t.isFavorite } : t)) }));
    try {
      await api.patch(`/tickets/${id}/favorite`);
    } catch (err) {
      set((s) => ({ tickets: s.tickets.map((t) => (t._id === id ? previous : t)) }));
      throw err;
    }
  },

  fetchTicket: async (id) => {
    const { data } = await api.get(`/tickets/${id}`);
    const ticket = normalizeTicket(data);
    set((s) => ({ tickets: upsert(s.tickets, ticket) }));
    return ticket;
  },

  ticketAction: async (request) => {
    const { data } = await request;
    const ticket = normalizeTicket(data);
    set((s) => ({ tickets: upsert(s.tickets, ticket) }));
    return ticket;
  },

  // ---- projects

  saveProject: async (input, id) => {
    const { data } = id ? await api.put(`/projects/${id}`, input) : await api.post('/projects', input);
    set((s) => ({ projects: upsert(s.projects, data, !id) }));
    return data;
  },

  removeProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((s) => ({
      projects: s.projects.filter((p) => p._id !== id),
      tickets: s.tickets.filter((t) => t.projectId !== id),
      epics: s.epics.filter((e) => e.projectId !== id),
      sprints: s.sprints.filter((x) => x.projectId !== id),
    }));
  },

  // ---- epics

  saveEpic: async (input, id) => {
    const { data } = id ? await api.put(`/epics/${id}`, input) : await api.post('/epics', input);
    const epic = normalizeEpic(data);
    set((s) => ({ epics: upsert(s.epics, epic, !id) }));
    return epic;
  },

  removeEpic: async (id) => {
    await api.delete(`/epics/${id}`);
    set((s) => ({
      epics: s.epics.filter((e) => e._id !== id),
      tickets: s.tickets.map((t) => (t.epicId === id ? { ...t, epicId: undefined } : t)),
    }));
  },

  // ---- sprints

  saveSprint: async (input, id) => {
    const { data } = id ? await api.put(`/sprints/${id}`, input) : await api.post('/sprints', input);
    const sprint = normalizeSprint(data);
    set((s) => ({ sprints: upsert(s.sprints, sprint, !id) }));
    return sprint;
  },

  removeSprint: async (id) => {
    await api.delete(`/sprints/${id}`);
    set((s) => ({
      sprints: s.sprints.filter((x) => x._id !== id),
      tickets: s.tickets.map((t) => (t.sprintId === id ? { ...t, sprintId: undefined } : t)),
    }));
  },

  // ---- labels

  saveLabel: async (input, id) => {
    const { data } = id ? await api.put(`/labels/${id}`, input) : await api.post('/labels', input);
    set((s) => ({ labels: upsert(s.labels, data, !id).sort((a, b) => a.name.localeCompare(b.name)) }));
    return data;
  },

  removeLabel: async (id) => {
    await api.delete(`/labels/${id}`);
    set((s) => ({ labels: s.labels.filter((l) => l._id !== id) }));
  },
}));

// ----------------------------------------------------------------- lookups

/** Id → entity maps, memoised on the store arrays. */
export function useLookups() {
  const projects = useWorkspace((s) => s.projects);
  const epics = useWorkspace((s) => s.epics);
  const sprints = useWorkspace((s) => s.sprints);
  const labels = useWorkspace((s) => s.labels);
  const tickets = useWorkspace((s) => s.tickets);

  return useMemo(
    () => ({
      projectById: Object.fromEntries(projects.map((p) => [p._id, p])) as Record<string, Project | undefined>,
      epicById: Object.fromEntries(epics.map((e) => [e._id, e])) as Record<string, Epic | undefined>,
      sprintById: Object.fromEntries(sprints.map((x) => [x._id, x])) as Record<string, Sprint | undefined>,
      labelByName: Object.fromEntries(labels.map((l) => [l.name.toLowerCase(), l])) as Record<string, Label | undefined>,
      ticketById: Object.fromEntries(tickets.map((t) => [t._id, t])) as Record<string, Ticket | undefined>,
    }),
    [projects, epics, sprints, labels, tickets]
  );
}
