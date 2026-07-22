'use client';

import { Ticket, Project } from '@/types';
import Card from '@/components/ui/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ReportsTabProps {
  tickets: Ticket[];
  project: Project;
}

const STATUS_COLORS: Record<string, string> = {
  'open': '#1D4ED8', 'backlog': '#475569', 'ready': '#0E7490',
  'in-progress': '#B45309', 'blocked': '#B91C1C', 'code-review': '#6D28D9',
  'ready-for-qa': '#0369A1', 'qa-in-progress': '#0F766E', 'qa-failed': '#BE123C',
  'ready-for-release': '#4D7C0F', 'released': '#15803D', 'done': '#166534',
  'closed': '#374151', 'reopened': '#C2410C', 'cancelled': '#6B7280',
  'stage': '#0369A1',
};

const PRIORITY_COLORS: Record<string, string> = {
  highest: '#DC2626', high: '#F97316', medium: '#F59E0B', low: '#22C55E', lowest: '#6B7280',
};

export default function ReportsTab({ tickets, project }: ReportsTabProps) {
  const byStatus = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const byPriority = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(byStatus).map(([name, value]) => ({
    name: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value,
    fill: STATUS_COLORS[name] || '#6B7280',
  }));

  const priorityData = Object.entries(byPriority).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: PRIORITY_COLORS[name] || '#6B7280',
  }));

  if (tickets.length === 0) {
    return (
      <Card padding="md">
        <div className="text-center py-12">
          <p className="text-sm text-[var(--color-text-secondary)]">No ticket data to display reports.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Tickets by Status</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Tickets by Priority</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={priorityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
            <Tooltip />
            <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Status Breakdown</h3>
        <div className="space-y-2">
          {statusData.map(item => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-sm text-[var(--color-text-primary)] flex-1">{item.name}</span>
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">{item.value}</span>
              <div className="w-24 h-1.5 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(item.value / tickets.length) * 100}%`, backgroundColor: item.fill }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-light)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Total Tickets</span>
            <span className="text-lg font-bold text-[var(--color-text-primary)]">{tickets.length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-light)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Open</span>
            <span className="text-lg font-bold text-[var(--color-primary)]">{tickets.filter(t => !['closed', 'cancelled'].includes(t.status)).length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-light)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Closed</span>
            <span className="text-lg font-bold text-[var(--color-success)]">{tickets.filter(t => t.status === 'closed').length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-light)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Blocked</span>
            <span className="text-lg font-bold text-[var(--color-danger)]">{tickets.filter(t => t.status === 'blocked').length}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-[var(--color-text-secondary)]">Bugs</span>
            <span className="text-lg font-bold text-[var(--color-warning)]">{tickets.filter(t => t.type === 'bug').length}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
