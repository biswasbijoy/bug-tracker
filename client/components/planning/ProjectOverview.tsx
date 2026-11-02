'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Panel, ProgressBar } from '@/components/ui/Misc';
import { DueBadge, StatusPill, TicketKey } from '@/components/tickets/badges';
import { STAGES, daysUntilDue, hueVar, isOpen, sortTickets, stageOf } from '@/lib/tickets';
import { cn, pluralize, timeAgo } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Project, Ticket } from '@/types';
import { computeStats } from './helpers';
import { sprintDaysLeft, sprintRange } from './SprintsPanel';

function StatTile({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone?: 'danger' | 'warning' | 'success' }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3 shadow-sm">
      <div className="text-xs font-medium text-fg-muted">{label}</div>
      <div
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums text-fg',
          value > 0 && tone === 'danger' && 'text-danger',
          value > 0 && tone === 'warning' && 'text-warning',
          value > 0 && tone === 'success' && 'text-success'
        )}
      >
        {value}
        {suffix && <span className="text-base font-medium text-fg-subtle">{suffix}</span>}
      </div>
    </div>
  );
}

function TicketLine({ ticket, right }: { ticket: Ticket; right: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-2">
      <TicketKey ticketNo={ticket.ticketNo} className="w-14 shrink-0" />
      <Link href={`/tickets/${ticket._id}`} className="min-w-0 flex-1 truncate text-[13px] text-fg hover:text-accent hover:underline">
        {ticket.title}
      </Link>
      <div className="shrink-0">{right}</div>
    </li>
  );
}

export default function ProjectOverview({ project, tickets }: { project: Project; tickets: Ticket[] }) {
  const sprints = useWorkspace((s) => s.sprints);
  const stats = useMemo(() => computeStats(tickets), [tickets]);

  const byStage = useMemo(
    () => STAGES.map((st) => ({ ...st, count: tickets.filter((t) => stageOf(t.status) === st.id).length })),
    [tickets]
  );

  const activeSprints = sprints.filter((s) => s.projectId === project._id && s.status === 'active');
  const sprintStats = (id: string) => computeStats(tickets.filter((t) => t.sprintId === id));

  const dueSoon = useMemo(
    () =>
      tickets
        .filter((t) => {
          const d = daysUntilDue(t);
          return isOpen(t.status) && d !== null && d <= 7;
        })
        .sort((a, b) => (daysUntilDue(a) ?? 0) - (daysUntilDue(b) ?? 0)),
    [tickets]
  );
  const recent = useMemo(() => sortTickets(tickets, 'updated').slice(0, 6), [tickets]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Open" value={stats.open} />
        <StatTile label="In QA" value={stats.qa} />
        <StatTile label="Blocked" value={stats.blocked} tone="danger" />
        <StatTile label="Overdue" value={stats.overdue} tone="warning" />
        <StatTile label="Completion" value={stats.pct} suffix="%" tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Stage distribution" className="lg:col-span-2">
          {tickets.length === 0 ? (
            <p className="text-[13px] text-fg-muted">No tickets in this project yet.</p>
          ) : (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-subtle" role="img" aria-label="Tickets by pipeline stage">
                {byStage
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <div
                      key={s.id}
                      title={`${s.label}: ${s.count}`}
                      style={{ width: `${(s.count / tickets.length) * 100}%`, background: hueVar(s.hue) }}
                      className="h-full border-r border-panel last:border-r-0"
                    />
                  ))}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 2xl:grid-cols-5">
                {byStage.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-[13px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hueVar(s.hue) }} />
                    <span className="truncate text-fg-muted">{s.label}</span>
                    <span className="ml-auto font-medium tabular-nums text-fg">{s.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel title={activeSprints.length > 1 ? 'Active sprints' : 'Active sprint'}>
          {activeSprints.length === 0 ? (
            <p className="text-[13px] text-fg-muted">
              No sprint is running.{' '}
              <Link href={`/projects/${project._id}?tab=sprints`} className="text-accent hover:underline">
                Manage sprints
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {activeSprints.map((sp) => {
                const s = sprintStats(sp._id);
                const left = sprintDaysLeft(sp);
                const range = sprintRange(sp);
                return (
                  <div key={sp._id}>
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/tickets?sprint=${sp._id}&scope=all`} className="min-w-0 truncate text-sm font-semibold text-fg hover:text-accent hover:underline">
                        {sp.name}
                      </Link>
                      {left && <span className={cn('shrink-0 text-xs font-medium', left.late ? 'text-danger' : 'text-fg-muted')}>{left.text}</span>}
                    </div>
                    {range && <div className="text-xs text-fg-subtle">{range}</div>}
                    <ProgressBar value={s.pct} className="mt-2" label={`${sp.name} progress`} />
                    <div className="mt-1.5 text-xs text-fg-muted">
                      {s.done} of {pluralize(s.total, 'ticket')} done ({s.pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Due soon" flush actions={<span className="text-xs text-fg-subtle">next 7 days + overdue</span>}>
          {dueSoon.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-fg-muted">Nothing is due in the next 7 days.</p>
          ) : (
            <ul className="divide-y divide-line">
              {dueSoon.slice(0, 8).map((t) => (
                <TicketLine key={t._id} ticket={t} right={<DueBadge ticket={t} />} />
              ))}
              {dueSoon.length > 8 && (
                <li className="px-4 py-2 text-xs text-fg-subtle">+{dueSoon.length - 8} more due soon</li>
              )}
            </ul>
          )}
        </Panel>

        <Panel title="Recently updated" flush>
          {recent.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-fg-muted">No tickets yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((t) => (
                <TicketLine
                  key={t._id}
                  ticket={t}
                  right={
                    <span className="flex items-center gap-2">
                      <span className="hidden text-xs text-fg-subtle sm:inline">{timeAgo(t.updatedAt)}</span>
                      <StatusPill status={t.status} />
                    </span>
                  }
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
