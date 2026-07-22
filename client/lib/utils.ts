export function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getStatusColor(status: string): string {
  return `status-${status}`;
}

export function getPriorityColor(priority: string): string {
  return `priority-${priority}`;
}

const statusLabels: Record<string, string> = {
  'open': 'Open',
  'backlog': 'Backlog',
  'ready': 'Ready',
  'in-progress': 'In Progress',
  'blocked': 'Blocked',
  'code-review': 'Code Review',
  'ready-for-qa': 'Ready for QA',
  'qa-in-progress': 'QA In Progress',
  'qa-failed': 'QA Failed',
  'ready-for-release': 'Ready for Release',
  'released': 'Released',
  'done': 'Done',
  'closed': 'Closed',
  'reopened': 'Reopened',
  'cancelled': 'Cancelled',
  'stage': 'Stage',
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] || status;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
