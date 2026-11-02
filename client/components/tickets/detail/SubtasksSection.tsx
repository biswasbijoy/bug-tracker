'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { Panel, ProgressBar } from '@/components/ui/Misc';
import { isDone, ticketNumber } from '@/lib/tickets';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import type { Ticket } from '@/types';
import { StatusPill, TicketKey, TypeIcon } from '../badges';
import { attempt } from './shared';

export default function SubtasksSection({ ticket }: { ticket: Ticket }) {
  const tickets = useWorkspace((s) => s.tickets);
  const updateTicket = useWorkspace((s) => s.updateTicket);
  const openNewTicket = useUi((s) => s.openNewTicket);

  const children = useMemo(
    () => tickets.filter((t) => t.parentTicketId === ticket._id).sort((a, b) => ticketNumber(a) - ticketNumber(b)),
    [tickets, ticket._id]
  );
  const done = children.filter((c) => isDone(c.status)).length;

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          Sub-tasks
          {children.length > 0 && (
            <span className="text-xs font-normal text-fg-subtle">
              {done}/{children.length} done
            </span>
          )}
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="ghost"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() =>
            openNewTicket({
              parentTicketId: ticket._id,
              projectId: ticket.projectId,
              epicId: ticket.epicId,
              sprintId: ticket.sprintId,
            })
          }
        >
          Add sub-task
        </Button>
      }
      flush={children.length > 0}
    >
      {children.length === 0 ? (
        <p className="text-sm text-fg-subtle">No sub-tasks. Break this ticket down into smaller pieces of work.</p>
      ) : (
        <>
          <div className="border-b border-line px-4 py-3">
            <ProgressBar value={(done / children.length) * 100} label="Sub-task progress" />
          </div>
          <ul>
            {children.map((c) => (
              <li key={c._id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-line px-4 py-2 last:border-b-0">
                <TypeIcon type={c.type} />
                <TicketKey ticketNo={c.ticketNo} className="shrink-0" />
                <Link
                  href={`/tickets/${c._id}`}
                  className={cn(
                    'min-w-0 flex-1 basis-40 text-sm [overflow-wrap:anywhere] hover:text-accent hover:underline',
                    isDone(c.status) ? 'text-fg-muted line-through' : 'text-fg'
                  )}
                >
                  {c.title}
                </Link>
                <StatusPill
                  status={c.status}
                  onChange={(status) => attempt(() => updateTicket(c._id, { status }), 'Could not change the status')}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
