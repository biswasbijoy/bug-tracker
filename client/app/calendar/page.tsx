'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Ticket } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

export default function CalendarPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    api.get('/tickets').then(({ data }) => {
      setTickets(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const hasReminder = tickets.filter(t => t.reminderDate);
  const upcoming = tickets.filter(t => t.reminderDate && new Date(t.reminderDate) >= today)
    .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime())
    .slice(0, 20);

  if (loading) {
    return (
      <AppLayout>
        <div className="mb-5">
          <div className="h-8 w-48 bg-[var(--color-border-light)] rounded animate-skeleton mb-2" />
          <div className="h-4 w-64 bg-[var(--color-border-light)] rounded animate-skeleton" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Calendar</h1>
        <p className="text-xs text-[var(--color-text-secondary)]">Due dates, reminders, and deployments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <Card>
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase mb-2">Upcoming Reminders</h3>
          <p className="text-xl font-bold text-[var(--color-primary)]">{hasReminder.length}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase mb-2">Due Today</h3>
          <p className="text-xl font-bold text-[var(--color-warning)]">
            {tickets.filter(t => t.reminderDate && new Date(t.reminderDate).toDateString() === today.toDateString()).length}
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase mb-2">Overdue</h3>
          <p className="text-xl font-bold text-[var(--color-danger)]">
            {tickets.filter(t => t.reminderDate && new Date(t.reminderDate) < today && !['closed', 'cancelled'].includes(t.status)).length}
          </p>
        </Card>
      </div>

      <Card padding="md">
        <h2 className="text-lg font-bold mb-4 text-[var(--color-text-primary)]">Upcoming Reminders & Events</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming reminders"
            description="Set a reminder date on any ticket to see them here."
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map(t => (
              <div key={t._id} className="flex items-center gap-4 p-3 bg-[var(--color-border-light)] rounded-[var(--radius-card)]">
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">{new Date(t.reminderDate!).getDate()}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{new Date(t.reminderDate!).toLocaleString('default', { month: 'short' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-[var(--color-text-primary)]">{t.ticketNo} - {t.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{t.status} | {t.priority}</p>
                </div>
                {t.reminderTime && <span className="text-xs text-[var(--color-text-muted)]">{t.reminderTime}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
