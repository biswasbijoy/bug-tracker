'use client';

import {
  ArrowTrendingUpIcon, BoltIcon, BookmarkIcon, BugAntIcon, CheckCircleIcon, ChevronDoubleDownIcon,
  ChevronDoubleUpIcon, ChevronDownIcon, ChevronUpIcon, FireIcon, MagnifyingGlassIcon, Bars2Icon,
  WrenchScrewdriverIcon, ClockIcon,
} from '@heroicons/react/20/solid';
import { cn, formatDate } from '@/lib/utils';
import {
  PRIORITIES, STAGES, daysUntilDue, environmentMeta, hueVar, isOpen, priorityMeta, severityMeta,
  statusMeta, statusesInStage, typeMeta,
} from '@/lib/tickets';
import type { Ticket, TicketPriority, TicketStatus } from '@/types';
import { Chip } from '@/components/ui/Badge';
import { Menu, type MenuEntry } from '@/components/ui/Popover';
import { useLookups } from '@/store/workspaceStore';

// ------------------------------------------------------------------- key

export function TicketKey({ ticketNo, className }: { ticketNo: string; className?: string }) {
  return <span className={cn('font-mono text-xs font-medium text-fg-subtle', className)}>{ticketNo}</span>;
}

// ------------------------------------------------------------------ type

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bug: BugAntIcon,
  task: CheckCircleIcon,
  story: BookmarkIcon,
  improvement: ArrowTrendingUpIcon,
  'technical-task': WrenchScrewdriverIcon,
  spike: BoltIcon,
  research: MagnifyingGlassIcon,
  'production-issue': FireIcon,
};

export function TypeIcon({ type, className }: { type: string; className?: string }) {
  const meta = typeMeta(type);
  const Icon = TYPE_ICONS[type] || CheckCircleIcon;
  return (
    <span
      title={meta.label}
      style={{ ['--hue' as string]: hueVar(meta.hue) }}
      className={cn('chip inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded', className)}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}

export function TypeChip({ type }: { type: string }) {
  const meta = typeMeta(type);
  return (
    <Chip hue={meta.hue} icon={<TypeIcon type={type} className="!h-3.5 !w-3.5 !bg-transparent" />}>
      {meta.label}
    </Chip>
  );
}

// ---------------------------------------------------------------- status

function statusMenuItems(current: string, onChange: (s: TicketStatus) => void): MenuEntry[] {
  const items: MenuEntry[] = [];
  for (const stage of STAGES) {
    items.push({ type: 'heading', label: stage.label });
    for (const s of statusesInStage(stage.id)) {
      items.push({
        label: s.label,
        hue: hueVar(s.hue),
        selected: s.value === current,
        onSelect: () => onChange(s.value),
      });
    }
  }
  return items;
}

interface StatusPillProps {
  status: string;
  /** when set, the pill becomes a menu to change the status */
  onChange?: (status: TicketStatus) => void;
  className?: string;
}

export function StatusPill({ status, onChange, className }: StatusPillProps) {
  const meta = statusMeta(status);
  const pill = (
    <Chip hue={meta.hue} dot className={className}>
      {meta.label}
    </Chip>
  );
  if (!onChange) return pill;
  return (
    <Menu
      items={statusMenuItems(status, onChange)}
      trigger={
        <button type="button" aria-label={`Status: ${meta.label}. Change status`} className="rounded-md outline-offset-2 hover:brightness-95">
          {pill}
        </button>
      }
    />
  );
}

// -------------------------------------------------------------- priority

const PRIORITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  highest: ChevronDoubleUpIcon,
  high: ChevronUpIcon,
  medium: Bars2Icon,
  low: ChevronDownIcon,
  lowest: ChevronDoubleDownIcon,
};

export function PriorityIcon({ priority, className }: { priority: string; className?: string }) {
  const meta = priorityMeta(priority);
  const Icon = PRIORITY_ICONS[meta.value] || Bars2Icon;
  return (
    <span title={`${meta.label} priority`} style={{ color: hueVar(meta.hue) }} className={cn('inline-flex shrink-0', className)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

interface PriorityBadgeProps {
  priority: string;
  onChange?: (priority: TicketPriority) => void;
  /** icon only (dense lists) */
  iconOnly?: boolean;
}

export function PriorityBadge({ priority, onChange, iconOnly }: PriorityBadgeProps) {
  const meta = priorityMeta(priority);
  const body = iconOnly ? (
    <PriorityIcon priority={priority} />
  ) : (
    <span className="inline-flex items-center gap-1 text-[13px] text-fg">
      <PriorityIcon priority={priority} />
      {meta.label}
    </span>
  );
  if (!onChange) return body;
  return (
    <Menu
      items={PRIORITIES.map((p) => ({
        label: p.label,
        icon: <PriorityIcon priority={p.value} />,
        selected: p.value === priority,
        onSelect: () => onChange(p.value),
      }))}
      trigger={
        <button type="button" aria-label={`Priority: ${meta.label}. Change priority`} className="rounded-md px-1 py-0.5 hover:bg-subtle">
          {body}
        </button>
      }
    />
  );
}

// ------------------------------------------------- severity / environment

export function SeverityChip({ severity }: { severity: string }) {
  const meta = severityMeta(severity);
  return <Chip hue={meta.hue}>{meta.label}</Chip>;
}

export function EnvironmentChip({ environment }: { environment: string }) {
  const meta = environmentMeta(environment);
  return (
    <Chip hue={meta.hue} bordered>
      {meta.label}
    </Chip>
  );
}

// ---------------------------------------------------------------- labels

export function LabelChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  const { labelByName } = useLookups();
  const color = labelByName[name.toLowerCase()]?.color;
  return (
    <Chip hue={color || 'gray'} dot bordered>
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove label ${name}`}
          className="-mr-0.5 ml-0.5 rounded text-current opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </Chip>
  );
}

// -------------------------------------------------------------- due date

/** "Overdue · Jul 3" / "Today" / "Tomorrow" / "Aug 5". Renders nothing when there is no due date. */
export function DueBadge({ ticket, className }: { ticket: Pick<Ticket, 'reminderDate' | 'status'>; className?: string }) {
  const days = daysUntilDue(ticket);
  if (days === null || !ticket.reminderDate) return null;
  const open = isOpen(ticket.status);
  let text = formatDate(ticket.reminderDate);
  let tone = 'text-fg-muted';
  if (open && days < 0) {
    text = `Overdue · ${text}`;
    tone = 'text-danger';
  } else if (open && days === 0) {
    text = 'Today';
    tone = 'text-warning';
  } else if (open && days === 1) {
    text = 'Tomorrow';
  }
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium', tone, className)}>
      <ClockIcon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}
