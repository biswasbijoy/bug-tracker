'use client';

import { Ticket } from '@/types';
import Badge from '@/components/ui/Badge';
import { StatusBadge, statusColors } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

interface TicketsTabProps {
  tickets: Ticket[];
  projectId: string;
  search: string;
  onRefresh: () => void;
}

const priorityVariant: Record<string, 'default' | 'danger' | 'warning' | 'info' | 'primary'> = {
  highest: 'danger', high: 'warning', medium: 'info', low: 'primary', lowest: 'default',
};

export default function TicketsTab({ tickets, projectId, search, onRefresh }: TicketsTabProps) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title={search ? 'No tickets match your search' : 'No Tickets Found'}
        description="Create your first ticket for this project."
      />
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-border-light)]">
              <th className="text-left py-2.5 px-3 text-[var(--color-text-secondary)] font-medium">#</th>
              <th className="text-left py-2.5 px-3 text-[var(--color-text-secondary)] font-medium">Title</th>
              <th className="text-left py-2.5 px-3 text-[var(--color-text-secondary)] font-medium hidden sm:table-cell">Status</th>
              <th className="text-left py-2.5 px-3 text-[var(--color-text-secondary)] font-medium hidden md:table-cell">Priority</th>
              <th className="text-left py-2.5 px-3 text-[var(--color-text-secondary)] font-medium hidden lg:table-cell">Severity</th>
              <th className="text-left py-2.5 px-3 text-[var(--color-text-secondary)] font-medium hidden lg:table-cell">Assignee</th>
              <th className="text-left py-2.5 px-3 text-[var(--color-text-secondary)] font-medium hidden xl:table-cell">Labels</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr
                key={ticket._id}
                className="border-b border-[var(--color-border-light)] hover:bg-[var(--color-border-light)] transition-colors cursor-pointer"
                onClick={() => window.open(`/tickets?search=${ticket.ticketNo}`, '_blank')}
              >
                <td className="py-2.5 px-3 font-mono text-xs font-bold text-[var(--color-text-muted)]">{ticket.ticketNo}</td>
                <td className="py-2.5 px-3 max-w-xs truncate">
                  <span className="inline-flex px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>{ticket.title}</span>
                </td>
                <td className="py-2.5 px-3 hidden sm:table-cell">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="py-2.5 px-3 hidden md:table-cell">
                  <Badge variant={priorityVariant[ticket.priority] || 'default'} size="sm">{ticket.priority}</Badge>
                </td>
                <td className="py-2.5 px-3 hidden lg:table-cell text-[var(--color-text-secondary)]">{ticket.severity}</td>
                <td className="py-2.5 px-3 hidden lg:table-cell text-[var(--color-text-secondary)]">{ticket.assignedTo || '-'}</td>
                <td className="py-2.5 px-3 hidden xl:table-cell">
                  <div className="flex gap-1">
                    {ticket.labels.slice(0, 3).map((l, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-border-light)] text-[var(--color-text-muted)]">{l}</span>
                    ))}
                    {ticket.labels.length > 3 && <span className="text-[10px] text-[var(--color-text-muted)]">+{ticket.labels.length - 3}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
