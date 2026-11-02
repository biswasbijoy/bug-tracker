/**
 * Single source of truth for ticket vocabulary: statuses, pipeline stages, priorities, types,
 * severities, environments — labels, colours (hue tokens from globals.css) and sorting helpers.
 */
import type {
  Ticket, TicketEnvironment, TicketPriority, TicketSeverity, TicketStatus, TicketType,
} from '@/types';

export type Hue = 'gray' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'violet' | 'pink';

/** CSS value for a hue — use as `style={{ '--hue': hueVar('blue') }}` with the `.chip` class. */
export const hueVar = (hue: Hue | string): string => `var(--c-${hue})`;

// ------------------------------------------------------------------ stages

export type StageId = 'todo' | 'progress' | 'qa' | 'release' | 'done';

export interface StageMeta {
  id: StageId;
  label: string;
  hue: Hue;
  /** status a ticket gets when dropped onto this stage on the board */
  primaryStatus: TicketStatus;
}

export const STAGES: StageMeta[] = [
  { id: 'todo', label: 'To do', hue: 'gray', primaryStatus: 'open' },
  { id: 'progress', label: 'In progress', hue: 'amber', primaryStatus: 'in-progress' },
  { id: 'qa', label: 'QA', hue: 'violet', primaryStatus: 'ready-for-qa' },
  { id: 'release', label: 'Release', hue: 'teal', primaryStatus: 'ready-for-release' },
  { id: 'done', label: 'Done', hue: 'green', primaryStatus: 'done' },
];

export const stageMeta = (id: StageId): StageMeta => STAGES.find((s) => s.id === id)!;

// ---------------------------------------------------------------- statuses

export interface StatusMeta {
  value: TicketStatus;
  label: string;
  stage: StageId;
  hue: Hue;
}

export const STATUSES: StatusMeta[] = [
  { value: 'open', label: 'Open', stage: 'todo', hue: 'gray' },
  { value: 'backlog', label: 'Backlog', stage: 'todo', hue: 'gray' },
  { value: 'ready', label: 'Ready', stage: 'todo', hue: 'blue' },
  { value: 'reopened', label: 'Reopened', stage: 'todo', hue: 'orange' },
  { value: 'in-progress', label: 'In progress', stage: 'progress', hue: 'amber' },
  { value: 'code-review', label: 'Code review', stage: 'progress', hue: 'violet' },
  { value: 'blocked', label: 'Blocked', stage: 'progress', hue: 'red' },
  { value: 'ready-for-qa', label: 'Ready for QA', stage: 'qa', hue: 'blue' },
  { value: 'qa-in-progress', label: 'QA in progress', stage: 'qa', hue: 'violet' },
  { value: 'qa-failed', label: 'QA failed', stage: 'qa', hue: 'red' },
  { value: 'ready-for-release', label: 'Ready for release', stage: 'release', hue: 'teal' },
  { value: 'stage', label: 'On stage', stage: 'release', hue: 'blue' },
  { value: 'released', label: 'Released', stage: 'release', hue: 'green' },
  { value: 'done', label: 'Done', stage: 'done', hue: 'green' },
  { value: 'closed', label: 'Closed', stage: 'done', hue: 'gray' },
  { value: 'cancelled', label: 'Cancelled', stage: 'done', hue: 'gray' },
];

/** Older data may carry `to-do`; it behaves exactly like `open`. */
const LEGACY_STATUS: Record<string, StatusMeta> = {
  'to-do': { value: 'to-do', label: 'To do', stage: 'todo', hue: 'gray' },
};

const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** Never throws — unknown statuses fall back to a neutral "To do" pill. */
export function statusMeta(status: string): StatusMeta {
  return (
    STATUSES.find((s) => s.value === status) ||
    LEGACY_STATUS[status] || { value: status as TicketStatus, label: titleCase(status || 'unknown'), stage: 'todo', hue: 'gray' }
  );
}

export const stageOf = (status: string): StageId => statusMeta(status).stage;
export const isDone = (status: string) => stageOf(status) === 'done';
/** Not finished: everything except done/closed/cancelled. (`released` still counts as open work to close out.) */
export const isOpen = (status: string) => !isDone(status);
export const statusesInStage = (stage: StageId) => STATUSES.filter((s) => s.stage === stage);

// -------------------------------------------------------------- priorities

export interface PriorityMeta {
  value: TicketPriority;
  label: string;
  hue: Hue;
  rank: number; // 5 = most urgent
}

export const PRIORITIES: PriorityMeta[] = [
  { value: 'highest', label: 'Highest', hue: 'red', rank: 5 },
  { value: 'high', label: 'High', hue: 'orange', rank: 4 },
  { value: 'medium', label: 'Medium', hue: 'amber', rank: 3 },
  { value: 'low', label: 'Low', hue: 'blue', rank: 2 },
  { value: 'lowest', label: 'Lowest', hue: 'gray', rank: 1 },
];

export const priorityMeta = (p: string): PriorityMeta =>
  PRIORITIES.find((x) => x.value === p) || PRIORITIES[2];

// ------------------------------------------------------------------- types

export interface TypeMeta {
  value: TicketType;
  label: string;
  hue: Hue;
}

export const TYPES: TypeMeta[] = [
  { value: 'bug', label: 'Bug', hue: 'red' },
  { value: 'task', label: 'Task', hue: 'blue' },
  { value: 'story', label: 'Story', hue: 'green' },
  { value: 'improvement', label: 'Improvement', hue: 'teal' },
  { value: 'technical-task', label: 'Technical task', hue: 'violet' },
  { value: 'spike', label: 'Spike', hue: 'pink' },
  { value: 'research', label: 'Research', hue: 'amber' },
  { value: 'production-issue', label: 'Production issue', hue: 'orange' },
];

export const typeMeta = (t: string): TypeMeta =>
  TYPES.find((x) => x.value === t) || { value: t as TicketType, label: titleCase(t || 'task'), hue: 'blue' };

// -------------------------------------------------------------- severities

export const SEVERITIES: { value: TicketSeverity; label: string; hue: Hue }[] = [
  { value: 'critical', label: 'Critical', hue: 'red' },
  { value: 'major', label: 'Major', hue: 'orange' },
  { value: 'minor', label: 'Minor', hue: 'amber' },
  { value: 'trivial', label: 'Trivial', hue: 'gray' },
];

export const severityMeta = (s: string) => SEVERITIES.find((x) => x.value === s) || SEVERITIES[1];

// ------------------------------------------------------------ environments

export const ENVIRONMENTS: { value: TicketEnvironment; label: string; hue: Hue }[] = [
  { value: 'local', label: 'Local', hue: 'gray' },
  { value: 'dev', label: 'Dev', hue: 'blue' },
  { value: 'qa', label: 'QA', hue: 'violet' },
  { value: 'staging', label: 'Staging', hue: 'amber' },
  { value: 'uat', label: 'UAT', hue: 'teal' },
  { value: 'production', label: 'Production', hue: 'red' },
];

export const environmentMeta = (e: string) =>
  ENVIRONMENTS.find((x) => x.value === e) || { value: e as TicketEnvironment, label: titleCase(e || ''), hue: 'gray' as Hue };

// --------------------------------------------------------------- due dates

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Days from today until the ticket's due date (negative = overdue). `null` when there is none. */
export function daysUntilDue(t: Pick<Ticket, 'reminderDate'>): number | null {
  if (!t.reminderDate) return null;
  return Math.round((startOfDay(new Date(t.reminderDate)) - startOfDay(new Date())) / 86_400_000);
}

export const isOverdue = (t: Pick<Ticket, 'reminderDate' | 'status'>) => {
  const d = daysUntilDue(t);
  return d !== null && d < 0 && isOpen(t.status);
};

export const isDueToday = (t: Pick<Ticket, 'reminderDate' | 'status'>) =>
  daysUntilDue(t) === 0 && isOpen(t.status);

// ----------------------------------------------------------------- sorting

export type SortKey = 'updated' | 'created' | 'priority' | 'due' | 'status' | 'title';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Newest' },
  { value: 'priority', label: 'Priority' },
  { value: 'due', label: 'Due date' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' },
];

const statusOrder = (s: string) => {
  const i = STATUSES.findIndex((x) => x.value === s);
  return i === -1 ? 0 : i;
};

export function sortTickets(tickets: Ticket[], key: SortKey): Ticket[] {
  const arr = [...tickets];
  switch (key) {
    case 'created':
      return arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case 'priority':
      return arr.sort(
        (a, b) => priorityMeta(b.priority).rank - priorityMeta(a.priority).rank || +new Date(b.updatedAt) - +new Date(a.updatedAt)
      );
    case 'due':
      return arr.sort((a, b) => {
        if (!a.reminderDate && !b.reminderDate) return 0;
        if (!a.reminderDate) return 1;
        if (!b.reminderDate) return -1;
        return +new Date(a.reminderDate) - +new Date(b.reminderDate);
      });
    case 'status':
      return arr.sort((a, b) => statusOrder(a.status) - statusOrder(b.status));
    case 'title':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return arr.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }
}

/** Numeric part of "QA-12" for natural ordering (0 when it doesn't match). */
export const ticketNumber = (t: Pick<Ticket, 'ticketNo'>) => parseInt(t.ticketNo.replace(/\D/g, ''), 10) || 0;
