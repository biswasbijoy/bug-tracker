import { STAGES, isDone, isDueToday, isOpen, isOverdue, priorityMeta, stageOf, type StageId } from '@/lib/tickets';
import type { Ticket } from '@/types';

const DAY = 86_400_000;

/** When a finished ticket was closed (falls back to the last update). */
export const closedAt = (t: Ticket): number => +new Date(t.closedDate || t.updatedAt);

/** Priority (most urgent first), then due date (soonest first, none last). */
export function byPriorityThenDue(a: Ticket, b: Ticket): number {
  const p = priorityMeta(b.priority).rank - priorityMeta(a.priority).rank;
  if (p) return p;
  const da = a.reminderDate ? +new Date(a.reminderDate) : Infinity;
  const db = b.reminderDate ? +new Date(b.reminderDate) : Infinity;
  return da - db;
}

export interface DashboardData {
  open: Ticket[];
  overdue: number;
  dueToday: number;
  blocked: number;
  qaFailed: number;
  inProgress: number;
  inQa: number;
  readyToRelease: number;
  doneRecently: number;
  pipeline: { id: StageId; label: string; hue: string; count: number }[];
  queue: Ticket[];
  queueTotal: number;
  queueIsMine: boolean;
  recent: Ticket[];
}

export function computeDashboard(tickets: Ticket[], userName: string): DashboardData {
  const since = Date.now() - 7 * DAY;
  const open = tickets.filter((t) => isOpen(t.status));
  const doneRecent = tickets.filter((t) => isDone(t.status) && closedAt(t) >= since);

  const stageCount = (id: StageId) => open.filter((t) => stageOf(t.status) === id).length;
  const pipeline = STAGES.map((s) => ({
    id: s.id,
    label: s.label,
    hue: s.hue as string,
    count: s.id === 'done' ? doneRecent.length : stageCount(s.id),
  }));

  const me = userName.trim().toLowerCase();
  const mine = me ? open.filter((t) => (t.assignedTo || '').trim().toLowerCase() === me) : [];
  const queueIsMine = mine.length > 0;
  const source = queueIsMine ? mine : open;

  return {
    open,
    overdue: tickets.filter(isOverdue).length,
    dueToday: tickets.filter(isDueToday).length,
    blocked: open.filter((t) => t.status === 'blocked').length,
    qaFailed: open.filter((t) => t.status === 'qa-failed').length,
    inProgress: stageCount('progress'),
    inQa: stageCount('qa'),
    readyToRelease: stageCount('release'),
    doneRecently: doneRecent.length,
    pipeline,
    queue: [...source].sort(byPriorityThenDue).slice(0, 8),
    queueTotal: source.length,
    queueIsMine,
    recent: [...tickets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 8),
  };
}

