import { addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import {
  PRIORITIES, STAGES, TYPES, isDone, isOpen, isOverdue, stageOf, typeMeta, type StageId,
} from '@/lib/tickets';
import type { Project, Ticket } from '@/types';

export type Range = '30' | '90' | 'all';
const DAY = 86_400_000;

/** Closing time of a finished ticket (falls back to the last update when closedDate is missing). */
export const closedAt = (t: Ticket): number => +new Date(t.closedDate || t.updatedAt);
const createdAt = (t: Ticket): number => +new Date(t.createdAt);

export const rangeDays = (r: Range): number => (r === 'all' ? Infinity : Number(r));
export const weeksFor = (r: Range): number => (r === '30' ? 8 : 12);

export function formatDuration(ms: number): string {
  const days = ms / DAY;
  if (days >= 1) return `${days >= 10 ? Math.round(days) : Math.round(days * 10) / 10}d`;
  const hours = ms / 3_600_000;
  return hours >= 1 ? `${Math.round(hours)}h` : `${Math.max(1, Math.round(ms / 60_000))}m`;
}

export interface Kpis {
  total: number;
  open: number;
  closedInRange: number;
  avgCycleMs: number | null;
  overdue: number;
}

export function computeKpis(tickets: Ticket[], range: Range): Kpis {
  const since = Date.now() - rangeDays(range) * DAY;
  const closed = tickets.filter((t) => isDone(t.status) && closedAt(t) >= since);
  const cycles = closed.filter((t) => t.status !== 'cancelled').map((t) => closedAt(t) - createdAt(t)).filter((n) => n >= 0);
  return {
    total: tickets.length,
    open: tickets.filter((t) => isOpen(t.status)).length,
    closedInRange: closed.length,
    avgCycleMs: cycles.length ? cycles.reduce((a, b) => a + b, 0) / cycles.length : null,
    overdue: tickets.filter(isOverdue).length,
  };
}

export function weeklyFlow(tickets: Ticket[], weeks: number) {
  const first = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weeks - 1);
  const rows = Array.from({ length: weeks }, (_, i) => {
    const start = addWeeks(first, i);
    return { start: +start, end: +addWeeks(start, 1), label: format(start, 'MMM d'), created: 0, closed: 0 };
  });
  for (const t of tickets) {
    const c = createdAt(t);
    const row = rows.find((r) => c >= r.start && c < r.end);
    if (row) row.created++;
    if (isDone(t.status)) {
      const d = closedAt(t);
      const r2 = rows.find((r) => d >= r.start && d < r.end);
      if (r2) r2.closed++;
    }
  }
  return rows.map(({ label, created, closed }) => ({ label, created, closed }));
}

export function stageMix(tickets: Ticket[]) {
  return STAGES.map((s) => ({
    id: s.id as StageId,
    name: s.label,
    hue: s.hue as string,
    value: tickets.filter((t) => stageOf(t.status) === s.id).length,
  }));
}

export function openByPriority(tickets: Ticket[]) {
  const open = tickets.filter((t) => isOpen(t.status));
  return PRIORITIES.map((p) => ({ name: p.label, hue: p.hue as string, value: open.filter((t) => t.priority === p.value).length }));
}

export function byType(tickets: Ticket[]) {
  const known = TYPES.map((t) => t.value as string);
  const extra = Array.from(new Set(tickets.map((t) => t.type as string))).filter((v) => !known.includes(v));
  return [...known, ...extra]
    .map((value) => {
      const mine = tickets.filter((t) => t.type === value);
      const done = mine.filter((t) => isDone(t.status)).length;
      return { name: typeMeta(value).label, open: mine.length - done, done };
    })
    .filter((r) => r.open + r.done > 0);
}

export function byProject(tickets: Ticket[], projects: Project[]) {
  return projects
    .map((p) => {
      const mine = tickets.filter((t) => t.projectId === p._id);
      const done = mine.filter((t) => isDone(t.status)).length;
      return { name: p.name, open: mine.length - done, done };
    })
    .filter((r) => r.open + r.done > 0);
}

export function ageBuckets(tickets: Ticket[]) {
  const buckets = [
    { name: '< 3 days', max: 3, value: 0 },
    { name: '3–7 days', max: 7, value: 0 },
    { name: '1–2 weeks', max: 14, value: 0 },
    { name: '2–4 weeks', max: 28, value: 0 },
    { name: '4+ weeks', max: Infinity, value: 0 },
  ];
  const now = Date.now();
  for (const t of tickets) {
    if (!isOpen(t.status)) continue;
    const days = (now - createdAt(t)) / DAY;
    buckets.find((b) => days < b.max)!.value++;
  }
  return buckets.map(({ name, value }) => ({ name, value }));
}

export function qaSignoff(tickets: Ticket[]) {
  const open = tickets.filter((t) => isOpen(t.status));
  const count = (k: 'testCompleted' | 'regressionCompleted' | 'smokeCompleted') => open.filter((t) => t[k]).length;
  return {
    total: open.length,
    rows: [
      { label: 'Testing', done: count('testCompleted') },
      { label: 'Regression', done: count('regressionCompleted') },
      { label: 'Smoke', done: count('smokeCompleted') },
    ],
  };
}
