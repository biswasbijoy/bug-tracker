'use client';

import { Ticket } from '@/types';
import { statusColors } from '@/components/ui/StatusBadge';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

interface CalendarTabProps {
  tickets: Ticket[];
}

export default function CalendarTab({ tickets }: CalendarTabProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const ticketsWithReminders = tickets.filter(t => t.reminderDate);
  const dueToday = ticketsWithReminders.filter(t => {
    const d = new Date(t.reminderDate!);
    return d.getTime() >= today.getTime() && d.getTime() < today.getTime() + 86400000;
  });
  const overdue = ticketsWithReminders.filter(t => {
    const d = new Date(t.reminderDate!);
    return d.getTime() < today.getTime() && t.status !== 'closed' && t.status !== 'cancelled';
  });
  const upcoming = ticketsWithReminders.filter(t => {
    const d = new Date(t.reminderDate!);
    return d.getTime() >= today.getTime() + 86400000 && t.status !== 'closed' && t.status !== 'cancelled';
  }).sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime());

  const summaryCards = [
    { label: 'Due Today', count: dueToday.length, color: 'text-[var(--color-warning)]' },
    { label: 'Overdue', count: overdue.length, color: 'text-[var(--color-danger)]' },
    { label: 'Upcoming', count: upcoming.length, color: 'text-[var(--color-primary)]' },
  ];

  if (ticketsWithReminders.length === 0) {
    return (
      <EmptyState
        title="No reminders"
        description="Set reminder dates on tickets to see them here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryCards.map(card => (
          <Card key={card.label} padding="sm">
            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.count}</p>
          </Card>
        ))}
      </div>

      {overdue.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-[var(--color-danger)] mb-3">Overdue</h3>
          <div className="divide-y divide-[var(--color-border-light)]">
            {overdue.map(ticket => (
              <div key={ticket._id} className="flex items-center gap-3 py-2">
                <span className="font-mono text-xs font-bold text-[var(--color-text-muted)] w-16">{ticket.ticketNo}</span>
                <span className="flex-1 truncate">
  <span className="inline-flex text-sm px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>{ticket.title}</span>
</span>
                <span className="text-xs text-[var(--color-danger)]">{formatDate(ticket.reminderDate!)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {dueToday.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-[var(--color-warning)] mb-3">Due Today</h3>
          <div className="divide-y divide-[var(--color-border-light)]">
            {dueToday.map(ticket => (
              <div key={ticket._id} className="flex items-center gap-3 py-2">
                <span className="font-mono text-xs font-bold text-[var(--color-text-muted)] w-16">{ticket.ticketNo}</span>
                <span className="flex-1 truncate">
  <span className="inline-flex text-sm px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>{ticket.title}</span>
</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Upcoming</h3>
          <div className="space-y-1">
            {upcoming.map(ticket => (
              <div key={ticket._id} className="flex items-center gap-3 py-1.5 border-b border-[var(--color-border-light)] last:border-0">
                <span className="font-mono text-xs font-bold text-[var(--color-text-muted)] w-16">{ticket.ticketNo}</span>
                <span className="flex-1 truncate">
  <span className="inline-flex text-sm px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>{ticket.title}</span>
</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatDate(ticket.reminderDate!)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
