'use client';

import Badge from './Badge';
import { TicketStatus, TicketPriority } from '@/types';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig: Record<TicketStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' }> = {
  'to-do': { label: 'To Do', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'primary' },
  'qa': { label: 'QA', variant: 'warning' },
  'ready-for-qa': { label: 'Ready for QA', variant: 'success' },
  'retest': { label: 'Retest', variant: 'danger' },
  'blocked': { label: 'Blocked', variant: 'danger' },
  'ready-for-deploy': { label: 'Ready for Deploy', variant: 'info' },
  'production': { label: 'Production', variant: 'primary' },
  'closed': { label: 'Closed', variant: 'success' },
  'cancelled': { label: 'Cancelled', variant: 'outline' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['to-do'];
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const priorityConfig: Record<TicketPriority, { label: string; variant: 'default' | 'danger' | 'warning' | 'success' | 'outline' }> = {
  highest: { label: 'Highest', variant: 'danger' },
  high: { label: 'High', variant: 'danger' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'success' },
  lowest: { label: 'Lowest', variant: 'outline' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig['medium'];
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
