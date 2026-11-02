'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isDone, sortTickets, stageOf, statusMeta, type SortKey, type StageId } from '@/lib/tickets';
import type { Ticket } from '@/types';

export type Scope = 'open' | 'done' | 'all';
export type GroupKey = 'none' | 'stage' | 'status' | 'priority' | 'project' | 'epic' | 'assignee';

export interface TicketFilterState {
  q: string;
  scope: Scope;
  stage: '' | StageId;
  status: string;
  priority: string;
  type: string;
  assignee: string;
  project: string;
  epic: string;
  sprint: string;
  label: string;
  starred: boolean;
  sort: SortKey;
  group: GroupKey;
}

export const DEFAULT_FILTERS: TicketFilterState = {
  q: '',
  scope: 'open',
  stage: '',
  status: '',
  priority: '',
  type: '',
  assignee: '',
  project: '',
  epic: '',
  sprint: '',
  label: '',
  starred: false,
  sort: 'updated',
  group: 'stage',
};

const KEYS = Object.keys(DEFAULT_FILTERS) as (keyof TicketFilterState)[];

/** Keys that narrow results (everything except the presentation options sort/group/scope). */
const FILTER_KEYS: (keyof TicketFilterState)[] = ['q', 'stage', 'status', 'priority', 'type', 'assignee', 'project', 'epic', 'sprint', 'label', 'starred'];

/**
 * Filter + sort + group state kept in the URL query string (shareable, survives reload and back/forward).
 * `defaults` lets a page start from a different baseline (e.g. board has group=stage, list group=none).
 */
export function useTicketFilters(defaults: Partial<TicketFilterState> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const base = useMemo(() => ({ ...DEFAULT_FILTERS, ...defaults }), [JSON.stringify(defaults)]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = useMemo<TicketFilterState>(() => {
    const out: any = { ...base };
    for (const key of KEYS) {
      const raw = params.get(key);
      if (raw === null) continue;
      out[key] = typeof base[key] === 'boolean' ? raw === '1' : raw;
    }
    return out;
  }, [params, base]);

  const setFilters = useCallback(
    (patch: Partial<TicketFilterState>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        // a value equal to the baseline needs no query param; anything else is stored explicitly
        if (value === (base as any)[key]) next.delete(key);
        else next.set(key, value === true ? '1' : value === false ? '0' : String(value));
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, base, router, pathname]
  );

  const clear = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    for (const key of FILTER_KEYS) next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, router, pathname]);

  const activeCount = FILTER_KEYS.filter((k) => filters[k] !== base[k]).length;

  return { filters, setFilters, clear, activeCount };
}

/** Applies scope + filters (not sorting). `lock` forces a project/epic/sprint regardless of the URL. */
export function applyFilters(tickets: Ticket[], f: TicketFilterState, lock: Partial<Pick<Ticket, 'projectId' | 'epicId' | 'sprintId'>> = {}): Ticket[] {
  const q = f.q.trim().toLowerCase();
  return tickets.filter((t) => {
    if (lock.projectId && t.projectId !== lock.projectId) return false;
    if (lock.epicId && t.epicId !== lock.epicId) return false;
    if (lock.sprintId && t.sprintId !== lock.sprintId) return false;
    if (f.scope === 'open' && isDone(t.status)) return false;
    if (f.scope === 'done' && !isDone(t.status)) return false;
    if (f.stage && stageOf(t.status) !== f.stage) return false;
    if (f.status && statusMeta(t.status).value !== f.status && t.status !== f.status) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.type && t.type !== f.type) return false;
    if (f.assignee && (t.assignedTo || '') !== f.assignee) return false;
    if (f.project && t.projectId !== f.project) return false;
    if (f.epic && t.epicId !== f.epic) return false;
    if (f.sprint && t.sprintId !== f.sprint) return false;
    if (f.label && !t.labels.includes(f.label)) return false;
    if (f.starred && !t.isFavorite) return false;
    if (q) {
      const hay = `${t.ticketNo} ${t.title} ${t.description || ''} ${t.assignedTo || ''} ${t.labels.join(' ')}`.toLowerCase();
      if (!q.split(/\s+/).every((tok) => hay.includes(tok))) return false;
    }
    return true;
  });
}

export const filterAndSort = (
  tickets: Ticket[],
  f: TicketFilterState,
  lock: Partial<Pick<Ticket, 'projectId' | 'epicId' | 'sprintId'>> = {}
) => sortTickets(applyFilters(tickets, f, lock), f.sort);
