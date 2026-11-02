'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon, StarIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Button, IconButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Form';
import { Segmented } from '@/components/ui/Tabs';
import { PRIORITIES, SORT_OPTIONS, STAGES, STATUSES, TYPES, statusesInStage } from '@/lib/tickets';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Ticket } from '@/types';
import type { GroupKey, Scope, TicketFilterState } from './filters';

interface Props {
  filters: TicketFilterState;
  setFilters: (patch: Partial<TicketFilterState>) => void;
  clear: () => void;
  activeCount: number;
  /** tickets in the current context (used to build assignee / label option lists) */
  tickets: Ticket[];
  lock?: { projectId?: string; epicId?: string; sprintId?: string };
  /** board mode groups by stage/status only, so the group picker is limited */
  mode: 'list' | 'board';
  resultCount: number;
}

const ALL = (label: string) => ({ value: '', label });

export default function TicketFilterBar({ filters, setFilters, clear, activeCount, tickets, lock = {}, mode, resultCount }: Props) {
  const { projects, epics, sprints } = useWorkspace();
  const [search, setSearch] = useState(filters.q);
  const [more, setMore] = useState(false);

  // keep the box in sync with the URL (back/forward, clear) and push edits after a short pause
  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters({ q: search }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const assignees = useMemo(() => Array.from(new Set(tickets.map((t) => t.assignedTo).filter(Boolean) as string[])).sort(), [tickets]);
  const labels = useMemo(() => Array.from(new Set(tickets.flatMap((t) => t.labels))).sort(), [tickets]);
  const scopedProject = lock.projectId || filters.project;
  const epicOptions = epics.filter((e) => !scopedProject || e.projectId === scopedProject);
  const sprintOptions = sprints.filter((s) => !scopedProject || s.projectId === scopedProject);

  const hiddenActive = [filters.project, filters.type, filters.epic, filters.sprint, filters.label].some(Boolean);
  const showMore = more || hiddenActive;

  const statusOptions = [
    ALL('All statuses'),
    ...STAGES.flatMap((stage) => statusesInStage(stage.id).map((s) => ({ value: s.value, label: `${stage.label} · ${s.label}` }))),
  ];
  void STATUSES;

  const groupOptions: { value: GroupKey; label: string }[] =
    mode === 'board'
      ? [
          { value: 'stage', label: 'Columns: Stage' },
          { value: 'status', label: 'Columns: Status' },
        ]
      : [
          { value: 'none', label: 'No grouping' },
          { value: 'stage', label: 'Group: Stage' },
          { value: 'status', label: 'Group: Status' },
          { value: 'priority', label: 'Group: Priority' },
          { value: 'assignee', label: 'Group: Assignee' },
          ...(lock.projectId ? [] : [{ value: 'project' as GroupKey, label: 'Group: Project' }]),
          { value: 'epic', label: 'Group: Epic' },
        ];

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented<Scope>
          value={filters.scope}
          onChange={(scope) => setFilters({ scope })}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'done', label: 'Done' },
            { value: 'all', label: 'All' },
          ]}
        />
        <div className="relative min-w-44 flex-1 sm:max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by key, title, assignee…"
            aria-label="Filter tickets"
            className="h-8 w-full rounded-md border border-line-strong bg-panel pl-8 pr-2 text-[13px] text-fg placeholder:text-fg-subtle hover:border-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </div>
        <Select size="sm" aria-label="Status" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} options={statusOptions} className="w-auto min-w-36" />
        <Select
          size="sm"
          aria-label="Priority"
          value={filters.priority}
          onChange={(e) => setFilters({ priority: e.target.value })}
          options={[ALL('All priorities'), ...PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]}
          className="w-auto min-w-32"
        />
        <Select
          size="sm"
          aria-label="Assignee"
          value={filters.assignee}
          onChange={(e) => setFilters({ assignee: e.target.value })}
          options={[ALL('Anyone'), ...assignees.map((a) => ({ value: a, label: a }))]}
          className="w-auto min-w-28"
        />
        <IconButton
          label={filters.starred ? 'Showing starred only' : 'Starred only'}
          onClick={() => setFilters({ starred: !filters.starred })}
          active={filters.starred}
          className="h-8 w-8"
        >
          <StarIcon className={cn('h-4 w-4', filters.starred && 'text-warning')} />
        </IconButton>
        <Button size="sm" variant="ghost" icon={<AdjustmentsHorizontalIcon className="h-4 w-4" />} onClick={() => setMore((m) => !m)} aria-expanded={showMore}>
          {showMore ? 'Fewer' : 'More'}
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            size="sm"
            aria-label="Group by"
            value={filters.group}
            onChange={(e) => setFilters({ group: e.target.value as GroupKey })}
            options={groupOptions}
            className="w-auto min-w-36"
          />
          {mode === 'list' && (
            <Select
              size="sm"
              aria-label="Sort by"
              value={filters.sort}
              onChange={(e) => setFilters({ sort: e.target.value as TicketFilterState['sort'] })}
              options={SORT_OPTIONS.map((o) => ({ value: o.value, label: `Sort: ${o.label}` }))}
              className="w-auto min-w-40"
            />
          )}
        </div>
      </div>

      {showMore && (
        <div className="flex flex-wrap items-center gap-2">
          {!lock.projectId && (
            <Select
              size="sm"
              aria-label="Project"
              value={filters.project}
              onChange={(e) => setFilters({ project: e.target.value, epic: '', sprint: '' })}
              options={[ALL('All projects'), ...projects.map((p) => ({ value: p._id, label: p.name }))]}
              className="w-auto min-w-36"
            />
          )}
          <Select size="sm" aria-label="Type" value={filters.type} onChange={(e) => setFilters({ type: e.target.value })} options={[ALL('All types'), ...TYPES.map((t) => ({ value: t.value, label: t.label }))]} className="w-auto min-w-32" />
          {!lock.epicId && (
            <Select size="sm" aria-label="Epic" value={filters.epic} onChange={(e) => setFilters({ epic: e.target.value })} options={[ALL('All epics'), ...epicOptions.map((x) => ({ value: x._id, label: x.name }))]} className="w-auto min-w-32" />
          )}
          {!lock.sprintId && (
            <Select size="sm" aria-label="Sprint" value={filters.sprint} onChange={(e) => setFilters({ sprint: e.target.value })} options={[ALL('All sprints'), ...sprintOptions.map((x) => ({ value: x._id, label: x.name }))]} className="w-auto min-w-32" />
          )}
          <Select size="sm" aria-label="Label" value={filters.label} onChange={(e) => setFilters({ label: e.target.value })} options={[ALL('All labels'), ...labels.map((l) => ({ value: l, label: l }))]} className="w-auto min-w-28" />
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-fg-subtle" aria-live="polite">
        <span>
          {resultCount} {resultCount === 1 ? 'ticket' : 'tickets'}
        </span>
        {activeCount > 0 && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 rounded px-1 text-accent hover:underline">
            <XMarkIcon className="h-3.5 w-3.5" /> Clear {activeCount} {activeCount === 1 ? 'filter' : 'filters'}
          </button>
        )}
      </div>
    </div>
  );
}
