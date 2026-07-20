'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Ticket } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets').then(({ data }) => {
      setTickets(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const projectCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    const name = typeof t.projectId === 'object' ? t.projectId.name : 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const projectData = Object.entries(projectCounts).map(([name, count]) => ({ name, count }));

  const weeklyData = [
    { name: 'Mon', count: 3 },
    { name: 'Tue', count: 5 },
    { name: 'Wed', count: 2 },
    { name: 'Thu', count: 7 },
    { name: 'Fri', count: 4 },
    { name: 'Sat', count: 1 },
    { name: 'Sun', count: 0 },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="mb-5">
          <div className="h-8 w-40 bg-[var(--color-border-light)] rounded animate-skeleton mb-2" />
          <div className="h-4 w-60 bg-[var(--color-border-light)] rounded animate-skeleton" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
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
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Reports</h1>
        <p className="text-xs text-[var(--color-text-secondary)]">Analytics and productivity insights</p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No data to report"
          description="Create some tickets to see analytics and insights here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <Card padding="sm">
              <h2 className="text-lg font-bold mb-4 text-[var(--color-text-primary)]">Tickets by Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="sm">
              <h2 className="text-lg font-bold mb-4 text-[var(--color-text-primary)]">Tickets by Project</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card padding="sm">
            <h2 className="text-lg font-bold mb-4 text-[var(--color-text-primary)]">Weekly Activity</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </AppLayout>
  );
}
