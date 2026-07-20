'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useNotificationStore } from '@/store/notificationStore';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Notifications</h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Stay updated on your tickets</p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title="No notifications"
            description="You're all caught up! Notifications about your tickets will appear here."
          />
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] divide-y divide-[var(--color-border-light)]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
                  notification.read ? 'opacity-60' : 'hover:bg-[var(--color-border-light)]'
                }`}
              >
                <Avatar name={notification.title} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? 'font-normal' : 'font-medium'} text-[var(--color-text-primary)]`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
