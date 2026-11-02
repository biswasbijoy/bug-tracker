'use client';

import Link from 'next/link';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, Panel } from '@/components/ui/Misc';
import { PriorityIcon, StatusPill, TicketKey, TypeIcon } from '@/components/tickets/badges';
import { cn } from '@/lib/utils';
import { hueVar } from '@/lib/tickets';
import { KIND_LABEL, dayKey, groupByDay, type CalEvent } from './events';

const WEEK_OPTS = { weekStartsOn: 1 as const };

// ------------------------------------------------------------------ legend

export function Legend() {
  const items = [
    { hue: 'amber', label: 'Due date (colour = priority)' },
    { hue: 'red', label: 'Overdue' },
    { hue: 'blue', label: 'Deployment' },
    { hue: 'green', label: 'Production' },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted" aria-label="Legend">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: hueVar(i.hue) }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

// -------------------------------------------------------------------- chip

function EventChip({ e }: { e: CalEvent }) {
  return (
    <Link
      href={`/tickets/${e.ticket._id}`}
      title={`${e.label}: ${e.ticket.ticketNo} ${e.ticket.title}`}
      style={{ ['--hue' as string]: hueVar(e.hue) }}
      className={cn(
        'chip relative z-10 flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-4 hover:brightness-95',
        e.muted && 'opacity-60'
      )}
    >
      <span className="shrink-0 font-mono font-medium">{e.ticket.ticketNo}</span>
      <span className={cn('truncate', e.muted && 'line-through')}>{e.ticket.title}</span>
    </Link>
  );
}

// -------------------------------------------------------------- month grid

interface MonthGridProps {
  month: Date;
  events: CalEvent[];
  onOpenDay: (day: Date) => void;
}

export function MonthGrid({ month, events, onOpenDay }: MonthGridProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTS),
  });
  const byDay = groupByDay(events);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-sm">
      <div className="grid grid-cols-7 border-b border-line bg-subtle text-center text-xs font-medium text-fg-muted" aria-hidden>
        {days.slice(0, 7).map((d) => (
          <div key={d.getDay()} className="py-1.5">
            <span className="sm:hidden">{format(d, 'EEEEE')}</span>
            <span className="hidden sm:inline">{format(d, 'EEE')}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const list = byDay.get(dayKey(d)) || [];
          const inMonth = isSameMonth(d, month);
          const today = isToday(d);
          const shown = list.slice(0, 3);
          const more = list.length - shown.length;
          return (
            <div
              key={dayKey(d)}
              className={cn(
                'relative flex min-h-[64px] min-w-0 flex-col gap-0.5 border-line p-1 sm:min-h-[112px] sm:gap-1 sm:p-1.5',
                i % 7 !== 6 && 'border-r',
                i < days.length - 7 && 'border-b',
                !inMonth && 'bg-subtle/60'
              )}
            >
              <button
                type="button"
                onClick={() => onOpenDay(d)}
                aria-label={`${format(d, 'EEEE, MMMM d')}${list.length ? `, ${list.length} event${list.length === 1 ? '' : 's'}` : ''}`}
                className="absolute inset-0 z-0 hover:bg-subtle/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50"
              />
              <span
                className={cn(
                  'pointer-events-none relative z-10 inline-flex h-6 min-w-6 items-center justify-center self-start rounded-full px-1 text-xs font-medium',
                  today ? 'bg-accent text-accent-fg' : inMonth ? 'text-fg' : 'text-fg-subtle'
                )}
              >
                {format(d, 'd')}
              </span>

              {/* wide screens: chips */}
              <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                {shown.map((e) => (
                  <EventChip key={e.id} e={e} />
                ))}
                {more > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(d)}
                    className="relative z-10 self-start rounded px-1 text-[11px] font-medium text-fg-muted hover:text-fg hover:underline"
                  >
                    +{more} more
                  </button>
                )}
              </div>

              {/* phones: dots */}
              {list.length > 0 && (
                <div className="pointer-events-none relative z-10 flex flex-wrap gap-0.5 px-0.5 sm:hidden" aria-hidden>
                  {list.slice(0, 4).map((e) => (
                    <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: hueVar(e.hue) }} />
                  ))}
                  {list.length > 4 && <span className="text-[9px] leading-[6px] text-fg-subtle">+</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------- event rows

function EventRow({ e, onNavigate }: { e: CalEvent; onNavigate?: () => void }) {
  return (
    <li className="flex items-center gap-2.5 px-3 py-2 hover:bg-subtle">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hueVar(e.hue) }} aria-hidden />
      <TypeIcon type={e.ticket.type} />
      <TicketKey ticketNo={e.ticket.ticketNo} className="shrink-0" />
      <Link
        href={`/tickets/${e.ticket._id}`}
        onClick={onNavigate}
        className={cn('min-w-0 flex-1 truncate text-[13px] text-fg hover:underline', e.muted && 'text-fg-muted line-through')}
      >
        {e.ticket.title}
      </Link>
      <span className="hidden shrink-0 text-xs text-fg-muted sm:inline">{e.kind === 'due' ? e.label : KIND_LABEL[e.kind]}</span>
      <span className="hidden shrink-0 sm:inline">
        <StatusPill status={e.ticket.status} />
      </span>
      <PriorityIcon priority={e.ticket.priority} />
    </li>
  );
}

// -------------------------------------------------------------- day dialog

export function DayDialog({ day, events, onClose }: { day: Date | null; events: CalEvent[]; onClose: () => void }) {
  const list = day ? events.filter((e) => e.key === dayKey(day)) : [];
  return (
    <Dialog
      open={!!day}
      onClose={onClose}
      title={day ? format(day, 'EEEE, MMMM d, yyyy') : ''}
      description={`${list.length} ${list.length === 1 ? 'event' : 'events'}`}
      size="md"
    >
      {list.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-fg-muted">Nothing scheduled for this day.</p>
      ) : (
        <ul className="-mx-3 divide-y divide-line">
          {list.map((e) => (
            <EventRow key={e.id} e={e} onNavigate={onClose} />
          ))}
        </ul>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ agenda

export function Agenda({ events }: { events: CalEvent[] }) {
  const todayKey = dayKey(new Date());
  const overdue = events.filter((e) => e.kind === 'due' && e.hue === 'red');
  const upcoming = events.filter((e) => e.key >= todayKey);
  const groups = Array.from(groupByDay(upcoming).entries());

  if (overdue.length === 0 && groups.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={<CalendarDaysIcon />}
          title="Nothing coming up"
          description="Due dates, deployments and production dates will appear here once tickets have them."
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <Panel title={<span className="text-danger">Overdue</span>} flush>
          <ul className="divide-y divide-line">
            {overdue.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </ul>
        </Panel>
      )}
      {groups.map(([key, list]) => {
        const date = list[0].date;
        return (
          <Panel
            key={key}
            flush
            title={
              <span className={cn(isToday(date) && 'text-accent')}>
                {isToday(date) ? 'Today' : format(date, 'EEEE')}
                <span className="ml-2 font-normal text-fg-muted">{format(date, 'MMM d')}</span>
              </span>
            }
          >
            <ul className="divide-y divide-line">
              {list.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </ul>
          </Panel>
        );
      })}
    </div>
  );
}
