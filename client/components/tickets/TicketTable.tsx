'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ChevronDownIcon, ChevronRightIcon, EllipsisHorizontalIcon, LinkIcon, PencilSquareIcon, StarIcon as StarSolid, TrashIcon,
} from '@heroicons/react/20/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Menu } from '@/components/ui/Popover';
import { PRIORITIES, STAGES, STATUSES, hueVar, isDone, priorityMeta, stageOf, statusMeta } from '@/lib/tickets';
import { cn, errorMessage } from '@/lib/utils';
import { useLookups, useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import type { Ticket } from '@/types';
import { DueBadge, LabelChip, PriorityBadge, StatusPill, TicketKey, TypeIcon } from './badges';
import type { GroupKey } from './filters';

// ---------------------------------------------------------------- grouping

interface Group {
  key: string;
  label: string;
  hue?: string;
  tickets: Ticket[];
}

function useGroups(tickets: Ticket[], group: GroupKey): Group[] {
  const { projectById, epicById } = useLookups();
  return useMemo(() => {
    if (group === 'none') return [{ key: 'all', label: '', tickets }];
    const buckets = new Map<string, Group>();
    const add = (key: string, label: string, hue: string | undefined, t: Ticket) => {
      const g = buckets.get(key) || { key, label, hue, tickets: [] };
      g.tickets.push(t);
      buckets.set(key, g);
    };
    for (const t of tickets) {
      switch (group) {
        case 'stage': {
          const s = STAGES.find((x) => x.id === stageOf(t.status))!;
          add(s.id, s.label, hueVar(s.hue), t);
          break;
        }
        case 'status': {
          const s = statusMeta(t.status);
          add(s.value, s.label, hueVar(s.hue), t);
          break;
        }
        case 'priority': {
          const p = priorityMeta(t.priority);
          add(p.value, `${p.label} priority`, hueVar(p.hue), t);
          break;
        }
        case 'project': {
          const p = projectById[t.projectId];
          add(t.projectId, p?.name || 'Unknown project', p?.color, t);
          break;
        }
        case 'epic': {
          const e = t.epicId ? epicById[t.epicId] : undefined;
          add(e?._id || 'none', e?.name || 'No epic', undefined, t);
          break;
        }
        case 'assignee':
          add(t.assignedTo || 'none', t.assignedTo || 'Unassigned', undefined, t);
          break;
      }
    }
    const order = (g: Group): number => {
      if (group === 'stage') return STAGES.findIndex((s) => s.id === g.key);
      if (group === 'status') return STATUSES.findIndex((s) => s.value === g.key);
      if (group === 'priority') return PRIORITIES.findIndex((p) => p.value === g.key);
      return 0;
    };
    const list = Array.from(buckets.values());
    if (['stage', 'status', 'priority'].includes(group)) return list.sort((a, b) => order(a) - order(b));
    return list.sort((a, b) => (a.key === 'none' ? 1 : b.key === 'none' ? -1 : a.label.localeCompare(b.label)));
  }, [tickets, group, projectById, epicById]);
}

// -------------------------------------------------------------------- row

const COLS =
  'grid-cols-[minmax(0,1fr)_auto] @2xl:grid-cols-[minmax(0,1fr)_132px_112px_96px_40px] @4xl:grid-cols-[minmax(0,1fr)_132px_112px_150px_104px_40px]';

function TicketRow({ ticket, showProject, onDelete }: { ticket: Ticket; showProject: boolean; onDelete: (t: Ticket) => void }) {
  const router = useRouter();
  const { projectById, epicById } = useLookups();
  const updateTicket = useWorkspace((s) => s.updateTicket);
  const toggleFavorite = useWorkspace((s) => s.toggleFavorite);
  const openEditTicket = useUi((s) => s.openEditTicket);

  const project = projectById[ticket.projectId];
  const epic = ticket.epicId ? epicById[ticket.epicId] : undefined;
  const done = isDone(ticket.status);

  const change = async (patch: Parameters<typeof updateTicket>[1], message: string) => {
    try {
      await updateTicket(ticket._id, patch);
      toast.success(message);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the ticket'));
    }
  };

  return (
    <div
      className={cn(
        'group relative grid items-center gap-x-3 gap-y-1.5 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-subtle/70',
        COLS
      )}
    >
      {/* title cell */}
      <div className="col-span-2 flex min-w-0 items-start gap-2.5 @2xl:col-span-1">
        <TypeIcon type={ticket.type} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <TicketKey ticketNo={ticket.ticketNo} className="shrink-0" />
            <Link
              href={`/tickets/${ticket._id}`}
              className={cn(
                'truncate text-sm font-medium after:absolute after:inset-0 after:content-[""] focus-visible:after:rounded-md',
                done ? 'text-fg-muted line-through decoration-fg-subtle/50' : 'text-fg'
              )}
              onMouseEnter={() => router.prefetch(`/tickets/${ticket._id}`)}
            >
              {ticket.title}
            </Link>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
            {showProject && project && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-[2px]" style={{ background: project.color }} />
                {project.name}
              </span>
            )}
            {epic && <span className="truncate">◆ {epic.name}</span>}
            {ticket.labels.slice(0, 2).map((l) => (
              <LabelChip key={l} name={l} />
            ))}
            {ticket.labels.length > 2 && <span>+{ticket.labels.length - 2}</span>}
            <span className="@2xl:hidden">
              <DueBadge ticket={ticket} />
            </span>
          </div>
        </div>
      </div>

      {/* status */}
      <div className="relative z-10 flex items-center gap-2 @2xl:block">
        <StatusPill
          status={ticket.status}
          onChange={(status) => change({ status }, `${ticket.ticketNo} → ${statusMeta(status).label}`)}
        />
        <span className="@2xl:hidden">
          <PriorityBadge priority={ticket.priority} onChange={(priority) => change({ priority }, `${ticket.ticketNo} priority → ${priorityMeta(priority).label}`)} iconOnly />
        </span>
      </div>

      {/* priority (md+) */}
      <div className="relative z-10 hidden @2xl:block">
        <PriorityBadge priority={ticket.priority} onChange={(priority) => change({ priority }, `${ticket.ticketNo} priority → ${priorityMeta(priority).label}`)} />
      </div>

      {/* assignee (lg+) */}
      <div className="hidden min-w-0 items-center gap-2 @4xl:flex">
        {ticket.assignedTo ? (
          <>
            <Avatar name={ticket.assignedTo} size="sm" />
            <span className="truncate text-[13px] text-fg-muted">{ticket.assignedTo}</span>
          </>
        ) : (
          <span className="text-[13px] text-fg-subtle">—</span>
        )}
      </div>

      {/* due (md+) */}
      <div className="hidden @2xl:block">
        <DueBadge ticket={ticket} />
      </div>

      {/* actions */}
      <div className="relative z-10 flex items-center justify-end @2xl:justify-center">
        <Menu
          align="end"
          width={190}
          trigger={
            <IconButton label={`Actions for ${ticket.ticketNo}`} size="sm" className="@2xl:opacity-0 @2xl:group-hover:opacity-100 @2xl:focus-visible:opacity-100 aria-expanded:opacity-100">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </IconButton>
          }
          items={[
            { label: 'Edit', icon: <PencilSquareIcon />, onSelect: () => openEditTicket(ticket) },
            {
              label: ticket.isFavorite ? 'Remove star' : 'Star',
              icon: ticket.isFavorite ? <StarSolid className="text-warning" /> : <StarOutline />,
              onSelect: () => toggleFavorite(ticket._id).catch((e) => toast.error(errorMessage(e))),
            },
            {
              label: 'Copy link',
              icon: <LinkIcon />,
              onSelect: () => {
                navigator.clipboard?.writeText(`${window.location.origin}/tickets/${ticket._id}`).then(() => toast.success('Link copied'));
              },
            },
            { type: 'separator' },
            { label: 'Delete', icon: <TrashIcon />, danger: true, onSelect: () => onDelete(ticket) },
          ]}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- table

interface TicketTableProps {
  tickets: Ticket[];
  group: GroupKey;
  /** show the project name on each row (hide inside a project) */
  showProject?: boolean;
}

export default function TicketTable({ tickets, group, showProject = true }: TicketTableProps) {
  const groups = useGroups(tickets, group);
  const deleteTicket = useWorkspace((s) => s.deleteTicket);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toDelete, setToDelete] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteTicket(toDelete._id);
      toast.success(`${toDelete.ticketNo} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the ticket'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="@container overflow-hidden rounded-lg border border-line bg-panel shadow-sm">
        {/* column headings */}
        <div className={cn('hidden gap-x-3 border-b border-line bg-subtle/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle @2xl:grid', COLS)}>
          <div className="pl-7">Ticket</div>
          <div>Status</div>
          <div>Priority</div>
          <div className="hidden @4xl:block">Assignee</div>
          <div>Due</div>
          <div />
        </div>

        {groups.map((g) => {
          const isCollapsed = !!collapsed[g.key];
          return (
            <div key={g.key}>
              {group !== 'none' && (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center gap-2 border-b border-line bg-subtle/40 px-3 py-1.5 text-left text-[13px] font-semibold text-fg hover:bg-subtle"
                >
                  {isCollapsed ? <ChevronRightIcon className="h-4 w-4 text-fg-subtle" /> : <ChevronDownIcon className="h-4 w-4 text-fg-subtle" />}
                  {g.hue && <span className="h-2 w-2 rounded-full" style={{ background: g.hue }} />}
                  {g.label}
                  <span className="text-xs font-normal text-fg-subtle">{g.tickets.length}</span>
                </button>
              )}
              {!isCollapsed && g.tickets.map((t) => <TicketRow key={t._id} ticket={t} showProject={showProject} onDelete={setToDelete} />)}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.ticketNo ?? 'ticket'}?`}
        message={
          <>
            <strong className="text-fg">{toDelete?.title}</strong> and its comments, checklist and attachments will be permanently deleted.
          </>
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
