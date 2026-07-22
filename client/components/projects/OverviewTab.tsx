'use client';

import { Project, ProjectOverview } from '@/types';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatRelativeTime } from '@/lib/utils';

interface OverviewTabProps {
  overview: ProjectOverview;
  project: Project;
}

export default function OverviewTab({ overview, project }: OverviewTabProps) {
  const statCards = [
    { label: 'Total Epics', value: overview.epicCount, color: 'primary' as const },
    { label: 'Total Tickets', value: overview.totalTickets, color: 'primary' as const },
    { label: 'Open Tickets', value: overview.openTickets, color: 'info' as const },
    { label: 'Closed Tickets', value: overview.closedTickets, color: 'success' as const },
    { label: 'Blocked Tickets', value: overview.blockedTickets, color: 'danger' as const },
    { label: 'Production Pending', value: overview.productionPending, color: 'warning' as const },
    { label: 'Due Today', value: overview.ticketsDueToday, color: 'primary' as const },
    { label: 'Overdue', value: overview.overdueTickets, color: 'danger' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(stat => (
          <Card key={stat.label} padding="sm">
            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold text-[var(--color-${stat.color})]`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Completion Progress</h3>
        <ProgressBar value={overview.completionPercentage} color={overview.completionPercentage >= 80 ? 'success' : overview.completionPercentage >= 40 ? 'warning' : 'primary'} size="md" showLabel />
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{overview.closedTickets} of {overview.totalTickets} tickets closed</p>
      </Card>

      {overview.recentlyUpdated.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {overview.recentlyUpdated.slice(0, 8).map(ticket => (
              <div key={ticket._id} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-light)] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-[var(--color-text-muted)] shrink-0">{ticket.ticketNo}</span>
                  <span className="text-sm text-[var(--color-text-primary)] truncate">{ticket.title}</span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">{formatRelativeTime(ticket.updatedAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
