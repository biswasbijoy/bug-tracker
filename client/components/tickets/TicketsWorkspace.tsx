'use client';

import { useMemo } from 'react';
import { PlusIcon, TicketIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import { useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import type { Ticket } from '@/types';
import { applyFilters, filterAndSort, useTicketFilters, type GroupKey } from './filters';
import TicketBoard from './TicketBoard';
import TicketFilterBar from './TicketFilterBar';
import TicketTable from './TicketTable';

interface Props {
  /** list (grouped table) or board (kanban) */
  mode: 'list' | 'board';
  /** restrict to a project / epic / sprint (project workspace, epic detail …) */
  lock?: Partial<Pick<Ticket, 'projectId' | 'epicId' | 'sprintId'>>;
}

/**
 * Filter bar + list/board of tickets. Used by /tickets, /board and the project workspace tabs;
 * filter, sort and grouping state lives in the URL query string.
 */
export default function TicketsWorkspace({ mode, lock = {} }: Props) {
  const allTickets = useWorkspace((s) => s.tickets);
  const openNewTicket = useUi((s) => s.openNewTicket);

  const { filters, setFilters, clear, activeCount } = useTicketFilters(
    mode === 'board' ? { group: 'stage', scope: 'all' } : { group: 'stage', scope: 'open' }
  );

  // tickets inside the locked context (before user filters) — also feeds the option lists
  const contextTickets = useMemo(
    () => applyFilters(allTickets, { ...filters, scope: 'all', q: '', stage: '', status: '', priority: '', type: '', assignee: '', project: '', epic: '', sprint: '', label: '', starred: false }, lock),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTickets, lock.projectId, lock.epicId, lock.sprintId]
  );
  const visible = useMemo(() => filterAndSort(allTickets, filters, lock), [allTickets, filters, lock.projectId, lock.epicId, lock.sprintId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createDefaults = { projectId: lock.projectId, epicId: lock.epicId, sprintId: lock.sprintId };
  const columnsBy: 'stage' | 'status' = filters.group === 'status' ? 'status' : 'stage';
  const listGroup: GroupKey = filters.group;

  return (
    <div>
      <TicketFilterBar
        filters={filters}
        setFilters={setFilters}
        clear={clear}
        activeCount={activeCount}
        tickets={contextTickets}
        lock={lock}
        mode={mode}
        resultCount={visible.length}
      />

      {contextTickets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-panel">
          <EmptyState
            icon={<TicketIcon />}
            title="No tickets yet"
            description="Create your first ticket to start tracking work."
            action={
              <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => openNewTicket(createDefaults)}>
                New ticket
              </Button>
            }
          />
        </div>
      ) : visible.length === 0 && mode === 'list' ? (
        <div className="rounded-lg border border-line bg-panel">
          <EmptyState
            icon={<TicketIcon />}
            title="No tickets match"
            description="Try removing a filter or searching for something else."
            action={
              <Button onClick={clear}>Clear filters</Button>
            }
          />
        </div>
      ) : mode === 'list' ? (
        <TicketTable tickets={visible} group={listGroup} showProject={!lock.projectId} />
      ) : (
        <TicketBoard tickets={visible} columnsBy={columnsBy} showProject={!lock.projectId} createDefaults={createDefaults} />
      )}
    </div>
  );
}
