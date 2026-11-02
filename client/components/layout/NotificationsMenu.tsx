'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { BellIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, NoSymbolIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { IconButton } from '@/components/ui/Button';
import { Popover } from '@/components/ui/Popover';
import { TicketKey } from '@/components/tickets/badges';
import { isDueToday, isOverdue } from '@/lib/tickets';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';

interface Alert {
  id: string;
  ticketId: string;
  ticketNo: string;
  title: string;
  reason: string;
  tone: 'danger' | 'warning';
  icon: React.ComponentType<{ className?: string }>;
}

/** "Needs attention": derived live from tickets, nothing to dismiss or sync. */
export function useAlerts(): Alert[] {
  const tickets = useWorkspace((s) => s.tickets);
  return useMemo(() => {
    const out: Alert[] = [];
    for (const t of tickets) {
      const base = { ticketId: t._id, ticketNo: t.ticketNo, title: t.title };
      if (isOverdue(t)) out.push({ ...base, id: `${t._id}-overdue`, reason: 'Overdue', tone: 'danger', icon: ClockIcon });
      else if (isDueToday(t)) out.push({ ...base, id: `${t._id}-today`, reason: 'Due today', tone: 'warning', icon: ClockIcon });
      if (t.status === 'blocked') out.push({ ...base, id: `${t._id}-blocked`, reason: 'Blocked', tone: 'danger', icon: NoSymbolIcon });
      if (t.status === 'qa-failed') out.push({ ...base, id: `${t._id}-qafail`, reason: 'QA failed', tone: 'danger', icon: XCircleIcon });
    }
    return out.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'danger' ? -1 : 1));
  }, [tickets]);
}

export default function NotificationsMenu({ className }: { className?: string }) {
  const alerts = useAlerts();
  return (
    <Popover
      align="end"
      width={340}
      trigger={
        <IconButton label={alerts.length ? `${alerts.length} items need attention` : 'Notifications'} className={cn('relative', className)}>
          <BellIcon className="h-[18px] w-[18px]" />
          {alerts.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-canvas">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </IconButton>
      }
    >
      {({ close }) => (
        <div>
          <div className="px-2.5 pb-1.5 pt-2 text-[13px] font-semibold text-fg">Needs attention</div>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center text-[13px] text-fg-muted">
              <CheckCircleIcon className="h-6 w-6 text-success" />
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {alerts.slice(0, 12).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/tickets/${a.ticketId}`}
                    onClick={close}
                    className="flex items-start gap-2.5 rounded-md px-2.5 py-2 hover:bg-subtle"
                  >
                    <a.icon className={cn('mt-0.5 h-4 w-4 shrink-0', a.tone === 'danger' ? 'text-danger' : 'text-warning')} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <TicketKey ticketNo={a.ticketNo} />
                        <span className={cn('text-xs font-medium', a.tone === 'danger' ? 'text-danger' : 'text-warning')}>{a.reason}</span>
                      </span>
                      <span className="block truncate text-[13px] text-fg">{a.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {alerts.length > 12 && (
                <li className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-fg-subtle">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  and {alerts.length - 12} more
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </Popover>
  );
}
