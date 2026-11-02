'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { PlusIcon } from '@heroicons/react/20/solid';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { STAGES, STATUSES, hueVar, isDone, stageOf, statusMeta } from '@/lib/tickets';
import { cn, errorMessage } from '@/lib/utils';
import { useLookups, useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import type { Ticket, TicketInput } from '@/types';
import { DueBadge, LabelChip, PriorityIcon, StatusPill, TicketKey, TypeIcon } from './badges';

interface Column {
  id: string;
  label: string;
  hue: string;
  /** status given to a ticket dropped here */
  dropStatus: Ticket['status'];
  tickets: Ticket[];
}

interface BoardProps {
  tickets: Ticket[];
  /** columns per pipeline stage (5) or per exact status (16) */
  columnsBy: 'stage' | 'status';
  showProject?: boolean;
  /** applied to tickets created from a column's "+" button */
  createDefaults?: TicketInput;
}

function Card({ ticket, index, showProject, showStatus }: { ticket: Ticket; index: number; showProject: boolean; showStatus: boolean }) {
  const { projectById } = useLookups();
  const project = projectById[ticket.projectId];
  const blocked = ticket.status === 'blocked' || ticket.status === 'qa-failed';
  const done = isDone(ticket.status);
  return (
    <Draggable draggableId={ticket._id} index={index}>
      {(prov, snap) => (
        <div
          ref={prov.innerRef}
          {...prov.draggableProps}
          {...prov.dragHandleProps}
          className={cn(
            'group relative mb-2 rounded-lg border bg-panel p-3 shadow-sm transition-shadow hover:border-line-strong hover:shadow-md',
            blocked ? 'border-l-[3px] border-line border-l-danger' : 'border-line',
            snap.isDragging && 'rotate-[1.5deg] border-accent shadow-lg ring-2 ring-accent/30'
          )}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <TypeIcon type={ticket.type} />
            <TicketKey ticketNo={ticket.ticketNo} />
            {showProject && project && (
              <span className="ml-auto inline-flex min-w-0 items-center gap-1 text-[11px] text-fg-subtle">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.color }} />
                <span className="truncate">{project.name}</span>
              </span>
            )}
          </div>
          <Link
            href={`/tickets/${ticket._id}`}
            draggable={false}
            className={cn(
              'line-clamp-2 text-[13px] font-medium leading-snug after:absolute after:inset-0 after:content-[""]',
              done ? 'text-fg-muted line-through decoration-fg-subtle/50' : 'text-fg'
            )}
          >
            {ticket.title}
          </Link>
          {(showStatus || ticket.labels.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {showStatus && <StatusPill status={ticket.status} />}
              {ticket.labels.slice(0, 2).map((l) => (
                <LabelChip key={l} name={l} />
              ))}
            </div>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <PriorityIcon priority={ticket.priority} />
            <DueBadge ticket={ticket} />
            {ticket.assignedTo && (
              <span className="ml-auto">
                <Avatar name={ticket.assignedTo} size="sm" />
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function TicketBoard({ tickets, columnsBy, showProject = true, createDefaults = {} }: BoardProps) {
  const updateTicket = useWorkspace((s) => s.updateTicket);
  const openNewTicket = useUi((s) => s.openNewTicket);

  const columns = useMemo<Column[]>(() => {
    if (columnsBy === 'stage') {
      return STAGES.map((s) => ({
        id: s.id,
        label: s.label,
        hue: hueVar(s.hue),
        dropStatus: s.primaryStatus,
        tickets: tickets.filter((t) => stageOf(t.status) === s.id),
      }));
    }
    const cols: Column[] = STATUSES.map((s) => ({
      id: s.value,
      label: s.label,
      hue: hueVar(s.hue),
      dropStatus: s.value,
      tickets: tickets.filter((t) => t.status === s.value),
    }));
    // tickets carrying an unknown / legacy status still need a home
    const known = new Set<string>(STATUSES.map((s) => s.value));
    const stray = tickets.filter((t) => !known.has(t.status));
    for (const status of Array.from(new Set(stray.map((t) => t.status)))) {
      const meta = statusMeta(status);
      cols.unshift({ id: status, label: meta.label, hue: hueVar(meta.hue), dropStatus: meta.value, tickets: stray.filter((t) => t.status === status) });
    }
    return cols;
  }, [tickets, columnsBy]);

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const ticket = tickets.find((t) => t._id === draggableId);
    const target = columns.find((c) => c.id === destination.droppableId);
    if (!ticket || !target) return;
    if (columnsBy === 'stage' && stageOf(ticket.status) === destination.droppableId) return;
    try {
      await updateTicket(ticket._id, { status: target.dropStatus });
      toast.success(`${ticket.ticketNo} → ${statusMeta(target.dropStatus).label}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not move the ticket'));
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* A grid (not a horizontal scroller): the drag library supports only ONE scroll parent, and that must be the page. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(224px,1fr))] items-start gap-3 pb-4">
        {columns.map((col) => (
          <div key={col.id} className="flex min-w-0 flex-col rounded-xl bg-subtle/70">
            <div className="flex items-center gap-2 px-3 pb-1.5 pt-3">
              <span className="h-2 w-2 rounded-full" style={{ background: col.hue }} />
              <h3 className="text-[13px] font-semibold text-fg">{col.label}</h3>
              <span className="text-xs tabular-nums text-fg-subtle">{col.tickets.length}</span>
              <IconButton
                label={`Add ticket to ${col.label}`}
                size="sm"
                className="ml-auto"
                onClick={() => openNewTicket({ ...createDefaults, status: col.dropStatus })}
              >
                <PlusIcon className="h-4 w-4" />
              </IconButton>
            </div>
            <Droppable droppableId={col.id}>
              {(prov, snap) => (
                <div
                  ref={prov.innerRef}
                  {...prov.droppableProps}
                  className={cn(
                    'mx-1.5 mb-1.5 min-h-24 flex-1 rounded-lg p-1.5 transition-colors',
                    snap.isDraggingOver && 'bg-accent-soft/70 ring-1 ring-inset ring-accent/40'
                  )}
                >
                  {col.tickets.map((t, i) => (
                    <Card key={t._id} ticket={t} index={i} showProject={showProject} showStatus={columnsBy === 'stage'} />
                  ))}
                  {prov.placeholder}
                  {col.tickets.length === 0 && !snap.isDraggingOver && (
                    <div className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-fg-subtle">No tickets</div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
