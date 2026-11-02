'use client';

import Link from 'next/link';
import {
  ArrowRightIcon, CheckCircleIcon, ClockIcon, FolderPlusIcon, NoSymbolIcon, PlusIcon, RocketLaunchIcon, XCircleIcon,
} from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { EmptyState, Panel, ProgressBar } from '@/components/ui/Misc';
import { DueBadge, StatusPill, TicketKey, TypeIcon } from '@/components/tickets/badges';
import { cn, timeAgo } from '@/lib/utils';
import { hueVar, isDone, isOpen } from '@/lib/tickets';
import type { Project, Ticket } from '@/types';
import type { DashboardData } from './data';

const tileClass =
  'group block rounded-lg border border-line bg-panel p-3 shadow-sm transition-colors hover:border-line-strong hover:bg-subtle ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';

// -------------------------------------------------------- needs attention

export function AttentionSection({ data }: { data: DashboardData }) {
  const items = [
    { key: 'overdue', label: 'Overdue', count: data.overdue, href: '/tickets?sort=due', icon: ClockIcon, tone: 'danger' as const },
    { key: 'today', label: 'Due today', count: data.dueToday, href: '/tickets?sort=due', icon: ClockIcon, tone: 'warning' as const },
    { key: 'blocked', label: 'Blocked', count: data.blocked, href: '/tickets?scope=open&status=blocked', icon: NoSymbolIcon, tone: 'danger' as const },
    { key: 'qafail', label: 'QA failed', count: data.qaFailed, href: '/tickets?scope=open&status=qa-failed', icon: XCircleIcon, tone: 'danger' as const },
  ];
  const total = items.reduce((n, i) => n + i.count, 0);

  return (
    <section aria-labelledby="attention-h" className="mb-6">
      <h2 id="attention-h" className="mb-2 text-[13px] font-semibold text-fg">
        Needs attention
      </h2>
      {total === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-success-soft px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-success" />
          <p className="text-[13px] text-fg">
            <span className="font-medium">All clear.</span>{' '}
            <span className="text-fg-muted">Nothing is overdue, blocked or failing QA right now.</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {items.map((i) => {
            const tone = i.count === 0 ? 'text-fg-subtle' : i.tone === 'danger' ? 'text-danger' : 'text-warning';
            return (
              <Link key={i.key} href={i.href} className={tileClass} aria-label={`${i.label}: ${i.count}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-fg-muted">{i.label}</span>
                  <i.icon className={cn('h-4 w-4', tone)} />
                </div>
                <div className={cn('mt-1 text-2xl font-semibold tabular-nums', tone)}>{i.count}</div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------- stat tiles

export function StatTiles({ data }: { data: DashboardData }) {
  const stats = [
    { label: 'Open', value: data.open.length, href: '/tickets?scope=open' },
    { label: 'In progress', value: data.inProgress, href: '/tickets?stage=progress' },
    { label: 'In QA', value: data.inQa, href: '/tickets?stage=qa' },
    { label: 'Ready to release', value: data.readyToRelease, href: '/tickets?stage=release' },
    { label: 'Done in 7 days', value: data.doneRecently, href: '/tickets?scope=done&sort=updated' },
  ];
  return (
    <section aria-label="Ticket counts" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <Link key={s.label} href={s.href} className={tileClass} aria-label={`${s.label}: ${s.value}`}>
          <div className="text-[13px] text-fg-muted">{s.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-fg">{s.value}</div>
        </Link>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------- pipeline

export function PipelineCard({ data }: { data: DashboardData }) {
  const total = data.pipeline.reduce((n, s) => n + s.count, 0);
  const summary = data.pipeline.map((s) => `${s.label} ${s.count}`).join(', ');
  return (
    <Panel title="Pipeline" actions={<span className="hidden text-xs text-fg-subtle sm:inline">Open tickets + done in the last 7 days</span>}>
      {total === 0 ? (
        <p className="py-4 text-center text-[13px] text-fg-muted">No tickets in the pipeline yet.</p>
      ) : (
        <>
          <div role="img" aria-label={`Pipeline: ${summary}`} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
            {data.pipeline
              .filter((s) => s.count > 0)
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/tickets?stage=${s.id}&scope=all`}
                  title={`${s.label}: ${s.count}`}
                  tabIndex={-1}
                  aria-hidden
                  className="h-full min-w-1.5 transition-opacity hover:opacity-80"
                  style={{ flexGrow: s.count, flexBasis: 0, background: hueVar(s.hue) }}
                />
              ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-5">
            {data.pipeline.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/tickets?stage=${s.id}&scope=all`}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] hover:bg-subtle"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hueVar(s.hue) }} />
                  <span className="truncate text-fg-muted">{s.label}</span>
                  <span className="ml-auto font-medium tabular-nums text-fg">{s.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- my queue

function TicketLine({ t, right }: { t: Ticket; right: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 px-4 py-2 hover:bg-subtle">
      <TypeIcon type={t.type} />
      <TicketKey ticketNo={t.ticketNo} className="shrink-0" />
      <Link href={`/tickets/${t._id}`} className="min-w-0 flex-1 truncate text-[13px] text-fg hover:underline">
        {t.title}
      </Link>
      {right}
    </li>
  );
}

export function MyQueueCard({ data }: { data: DashboardData }) {
  const title = data.queueIsMine ? 'My queue' : 'Top priorities';
  return (
    <Panel
      title={title}
      flush
      actions={
        data.queueTotal > 0 && (
          <Link
            href="/tickets?sort=priority&scope=open"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            View all{data.queueTotal > data.queue.length ? ` (${data.queueTotal})` : ''}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )
      }
    >
      {data.queue.length === 0 ? (
        <EmptyState
          icon={<CheckCircleIcon />}
          title="Nothing open"
          description="No open tickets right now. Enjoy the quiet or create a new one."
          className="py-8"
        />
      ) : (
        <>
          {!data.queueIsMine && (
            <p className="border-b border-line px-4 py-1.5 text-xs text-fg-subtle">
              Nothing is assigned to you, so these are the most urgent open tickets.
            </p>
          )}
          <ul className="divide-y divide-line">
            {data.queue.map((t) => (
              <TicketLine
                key={t._id}
                t={t}
                right={
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden sm:inline">
                      <StatusPill status={t.status} />
                    </span>
                    <DueBadge ticket={t} />
                  </span>
                }
              />
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------- recent updates

export function RecentCard({ data }: { data: DashboardData }) {
  return (
    <Panel title="Recently updated" flush>
      {data.recent.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-fg-muted">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {data.recent.map((t) => (
            <TicketLine key={t._id} t={t} right={<span className="shrink-0 text-xs text-fg-subtle">{timeAgo(t.updatedAt)}</span>} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- projects

export function ProjectsCard({ projects, tickets }: { projects: Project[]; tickets: Ticket[] }) {
  const active = projects.filter((p) => p.status !== 'archived');
  return (
    <Panel
      title="Projects"
      actions={
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          All projects <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {active.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-fg-muted">No active projects.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((p) => {
            const mine = tickets.filter((t) => t.projectId === p._id);
            const done = mine.filter((t) => isDone(t.status)).length;
            const open = mine.filter((t) => isOpen(t.status)).length;
            const pct = mine.length ? (done / mine.length) * 100 : 0;
            return (
              <li key={p._id}>
                <Link
                  href={`/projects/${p._id}`}
                  className="block rounded-md border border-line p-3 transition-colors hover:border-line-strong hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className="truncate text-[13px] font-medium text-fg">{p.name}</span>
                  </div>
                  <ProgressBar value={pct} className="mt-2.5" label={`${p.name} progress`} />
                  <div className="mt-1.5 flex justify-between text-xs text-fg-subtle">
                    <span>{open} open</span>
                    <span>
                      {done} / {mine.length} done
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// --------------------------------------------------------------- first run

export function FirstRun({ hasProjects, onNewTicket }: { hasProjects: boolean; onNewTicket: () => void }) {
  return (
    <Panel>
      <EmptyState
        icon={<RocketLaunchIcon />}
        title={hasProjects ? 'Create your first ticket' : 'Welcome! Start with a project'}
        description={
          hasProjects
            ? 'You have a project but no tickets yet. Add one and this page will fill up with what needs your attention.'
            : 'Projects group your tickets. Create one first, then add tickets to track work through the pipeline.'
        }
        action={
          hasProjects ? (
            <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={onNewTicket}>
              New ticket
            </Button>
          ) : (
            <Link
              href="/projects"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover"
            >
              <FolderPlusIcon className="h-4 w-4" />
              Create a project
            </Link>
          )
        }
      />
    </Panel>
  );
}
