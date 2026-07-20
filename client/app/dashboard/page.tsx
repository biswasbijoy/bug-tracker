'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { DashboardData } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const statCards = [
  { key: 'totalTickets', label: 'Total Tickets', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'completedToday', label: 'Completed Today', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'pending', label: 'Pending', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'blocked', label: 'Blocked', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { key: 'productionPending', label: 'Production Pending', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
  { key: 'readyForTesting', label: 'Ready for Testing', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { key: 'readyForDeploy', label: 'Ready for Deploy', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10' },
  { key: 'dueToday', label: 'Due Today', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'overdue', label: 'Overdue', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <SkeletonDashboard />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Here is what&apos;s happening with your tickets today.</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
            <span>Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.key} className="hover:opacity-95 transition-opacity duration-300" padding="md">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
              <span className="text-xl font-bold text-[var(--color-text-primary)]">{String(data?.[stat.key as keyof DashboardData] ?? 0)}</span>
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Recently Updated</h2>
              <Badge variant="primary" size="sm">
                {data?.recentlyUpdated?.length ?? 0} tickets
              </Badge>
            </div>
            <Link href="/tickets" className="text-sm text-[var(--color-primary)] hover:opacity-80 font-medium hover:underline">
              View all →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Ticket', 'Title', 'Status', 'Priority', 'Updated'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recentlyUpdated?.map((ticket) => (
                <tr key={ticket._id} className="border-b border-[var(--color-border-light)] hover:bg-[var(--color-border-light)] transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-sm font-bold text-[var(--color-text-primary)]">{ticket.ticketNo}</span>
                  </td>
                  <td className="py-2.5 px-3 max-w-xs">
                    <p className="text-sm text-[var(--color-text-primary)] truncate">{ticket.title}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="py-2.5 px-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="py-2.5 px-3 text-sm text-[var(--color-text-muted)]">
                    {new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {(!data?.recentlyUpdated || data.recentlyUpdated.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-[var(--color-text-muted)]">No tickets yet</p>
                      <Link href="/tickets" className="text-sm text-[var(--color-primary)] hover:underline font-medium">Create your first ticket</Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}
