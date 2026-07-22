'use client';

import { TicketStatus, TicketPriority } from '@/types';

export const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  'open': { bg: '#DBEAFE', text: '#1D4ED8', label: 'Open' },
  'backlog': { bg: '#E2E8F0', text: '#475569', label: 'Backlog' },
  'ready': { bg: '#CFFAFE', text: '#0E7490', label: 'Ready' },
  'in-progress': { bg: '#FEF3C7', text: '#B45309', label: 'In Progress' },
  'blocked': { bg: '#FEE2E2', text: '#B91C1C', label: 'Blocked' },
  'code-review': { bg: '#EDE9FE', text: '#6D28D9', label: 'Code Review' },
  'ready-for-qa': { bg: '#E0F2FE', text: '#0369A1', label: 'Ready for QA' },
  'qa-in-progress': { bg: '#CCFBF1', text: '#0F766E', label: 'QA In Progress' },
  'qa-failed': { bg: '#FFE4E6', text: '#BE123C', label: 'QA Failed' },
  'ready-for-release': { bg: '#ECFCCB', text: '#4D7C0F', label: 'Ready for Release' },
  'released': { bg: '#DCFCE7', text: '#15803D', label: 'Released' },
  'done': { bg: '#BBF7D0', text: '#166534', label: 'Done' },
  'closed': { bg: '#E5E7EB', text: '#374151', label: 'Closed' },
  'reopened': { bg: '#FED7AA', text: '#C2410C', label: 'Reopened' },
  'cancelled': { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
  'stage': { bg: '#E0F2FE', text: '#0369A1', label: 'Stage' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = statusColors[status] || { bg: '#F3F4F6', text: '#6B7280', label: status };
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: color.bg,
        color: color.text,
        whiteSpace: 'nowrap',
        lineHeight: '1.25rem',
      }}
    >
      {color.label}
    </span>
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
  const variantStyles: Record<string, React.CSSProperties> = {
    danger: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
    warning: { backgroundColor: '#FEF3C7', color: '#B45309' },
    success: { backgroundColor: '#DCFCE7', color: '#15803D' },
    default: { backgroundColor: '#F3F4F6', color: '#6B7280' },
    outline: { backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' },
  };
  const style = variantStyles[config.variant] || variantStyles.default;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        ...style,
        whiteSpace: 'nowrap',
        lineHeight: '1.25rem',
      }}
    >
      {config.label}
    </span>
  );
}
