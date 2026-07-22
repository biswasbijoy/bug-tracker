'use client';

import { ActivityItem } from '@/types';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';

interface ActivityTabProps {
  activity: ActivityItem[];
}

export default function ActivityTab({ activity }: ActivityTabProps) {
  if (activity.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Activity logs will appear here as tickets are updated."
      />
    );
  }

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h3>
      <div className="space-y-0">
        {activity.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 py-2.5 border-b border-[var(--color-border-light)] last:border-0">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-[var(--color-text-muted)]">{item.ticketNo}</span>
                <span className="text-sm text-[var(--color-text-primary)] truncate">{item.ticketTitle}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {item.action}
                {item.field && <span> on <span className="font-medium">{item.field}</span></span>}
                {item.oldValue && item.newValue && (
                  <span>: <span className="line-through text-[var(--color-text-muted)]">{item.oldValue}</span> → <span className="font-medium">{item.newValue}</span></span>
                )}
              </p>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] shrink-0">{formatRelativeTime(item.createdAt)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
