import { format, startOfDay } from 'date-fns';
import { isOpen, isOverdue, priorityMeta, type Hue } from '@/lib/tickets';
import type { Ticket } from '@/types';

export type EventKind = 'due' | 'deploy' | 'production';

export interface CalEvent {
  id: string;
  kind: EventKind;
  ticket: Ticket;
  date: Date;
  /** yyyy-MM-dd (local) */
  key: string;
  hue: Hue;
  /** short description used by chips and lists, e.g. "Due", "Overdue", "Deploy", "Production" */
  label: string;
  /** done tickets' due dates are shown muted */
  muted: boolean;
}

export const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

export const KIND_LABEL: Record<EventKind, string> = { due: 'Due', deploy: 'Deployment', production: 'Production' };

/** One event per due / deployment / production date on each ticket. */
export function buildEvents(tickets: Ticket[]): CalEvent[] {
  const out: CalEvent[] = [];
  const push = (t: Ticket, kind: EventKind, iso: string | undefined, hue: Hue, label: string, muted = false) => {
    if (!iso) return;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    const date = startOfDay(d);
    out.push({ id: `${t._id}-${kind}`, kind, ticket: t, date, key: dayKey(date), hue, label, muted });
  };
  for (const t of tickets) {
    if (t.reminderDate) {
      const overdue = isOverdue(t);
      push(t, 'due', t.reminderDate, overdue ? 'red' : priorityMeta(t.priority).hue, overdue ? 'Overdue' : 'Due', !isOpen(t.status));
    }
    push(t, 'deploy', t.deploymentDate, 'blue', 'Deployment');
    push(t, 'production', t.productionDate, 'green', 'Production');
  }
  return out.sort((a, b) => +a.date - +b.date || a.ticket.ticketNo.localeCompare(b.ticket.ticketNo, undefined, { numeric: true }));
}

export function groupByDay(events: CalEvent[]): Map<string, CalEvent[]> {
  const map = new Map<string, CalEvent[]>();
  for (const e of events) {
    const list = map.get(e.key);
    if (list) list.push(e);
    else map.set(e.key, [e]);
  }
  return map;
}
