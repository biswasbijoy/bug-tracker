'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowRightIcon, ClockIcon } from '@heroicons/react/20/solid';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState, Panel } from '@/components/ui/Misc';
import { TicketKey } from '@/components/tickets/badges';
import { environmentMeta, priorityMeta, severityMeta, statusMeta, typeMeta } from '@/lib/tickets';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { Ticket } from '@/types';

const PAGE = 100;

interface Entry {
  key: string;
  ticketId: string;
  ticketNo: string;
  title: string;
  author: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

/** Human label for a logged value (status → its label, priority → its label …). */
function displayValue(field: string | undefined, value?: string): string {
  if (!value) return 'none';
  switch (field) {
    case 'status': return statusMeta(value).label;
    case 'priority': return priorityMeta(value).label;
    case 'type': return typeMeta(value).label;
    case 'severity': return severityMeta(value).label;
    case 'environment': return environmentMeta(value).label;
    default: return value;
  }
}

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, MMM d'));

/** Newest-first activity feed derived from the activity logs embedded in a project's tickets. */
export default function ProjectActivity({ tickets }: { tickets: Ticket[] }) {
  const [limit, setLimit] = useState(PAGE);

  const entries = useMemo<Entry[]>(
    () =>
      tickets
        .flatMap((t) =>
          (t.activityLogs || []).map((l) => ({
            key: `${t._id}-${l._id}`,
            ticketId: t._id,
            ticketNo: t.ticketNo,
            title: t.title,
            author: l.author,
            action: l.action,
            field: l.field,
            oldValue: l.oldValue,
            newValue: l.newValue,
            createdAt: l.createdAt,
          }))
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [tickets]
  );

  const shown = entries.slice(0, limit);
  const groups = useMemo(() => {
    const out: { label: string; items: Entry[] }[] = [];
    for (const e of shown) {
      const label = dayLabel(new Date(e.createdAt));
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(e);
      else out.push({ label, items: [e] });
    }
    return out;
  }, [shown]);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-panel">
        <EmptyState icon={<ClockIcon />} title="No activity yet" description="Changes to this project's tickets will show up here." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{g.label}</h3>
          <Panel flush>
            <ul className="divide-y divide-line">
              {g.items.map((e) => {
                const hasValues = e.field && (e.oldValue || e.newValue);
                return (
                  <li key={e.key} className="flex items-start gap-3 px-4 py-3">
                    <Avatar name={e.author} size="sm" className="mt-0.5" />
                    <div className="min-w-0 flex-1 text-[13px]">
                      <p className="text-fg">
                        <span className="font-medium">{e.author}</span>{' '}
                        <span className="text-fg-muted">{e.action.charAt(0).toLowerCase() + e.action.slice(1)}</span>
                        {hasValues && (
                          <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-middle">
                            <span className="rounded bg-subtle px-1.5 py-0.5 text-xs text-fg-muted line-through decoration-fg-subtle/60">
                              {displayValue(e.field, e.oldValue)}
                            </span>
                            <ArrowRightIcon className="h-3 w-3 text-fg-subtle" />
                            <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
                              {displayValue(e.field, e.newValue)}
                            </span>
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 flex min-w-0 items-center gap-2">
                        <TicketKey ticketNo={e.ticketNo} />
                        <Link href={`/tickets/${e.ticketId}`} className="min-w-0 truncate text-fg-muted hover:text-accent hover:underline">
                          {e.title}
                        </Link>
                      </p>
                    </div>
                    <time dateTime={e.createdAt} title={formatDateTime(e.createdAt)} className="shrink-0 pt-0.5 text-xs text-fg-subtle">
                      {timeAgo(e.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </section>
      ))}

      {entries.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
            Show more ({entries.length - limit} older)
          </Button>
        </div>
      )}
    </div>
  );
}
