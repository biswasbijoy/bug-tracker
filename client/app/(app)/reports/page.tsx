'use client';

import { useMemo, useState } from 'react';
import { Select } from '@/components/ui/Form';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Tabs';
import {
  AgeChart, FlowChart, PriorityBars, ProjectBars, QaSignoff, StageDonut, TypeBars,
} from '@/components/reports/ReportCharts';
import {
  ageBuckets, byProject, byType, computeKpis, formatDuration, openByPriority, qaSignoff, stageMix, weeklyFlow, weeksFor,
  type Range,
} from '@/components/reports/stats';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';

function Kpi({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'danger' }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3 shadow-sm">
      <div className="text-[13px] text-fg-muted">{label}</div>
      <div className={cn('mt-1 text-2xl font-semibold tabular-nums', tone === 'danger' ? 'text-danger' : 'text-fg')}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-fg-subtle">{hint}</div>}
    </div>
  );
}

export default function ReportsPage() {
  useDocumentTitle('Reports');
  const allTickets = useWorkspace((s) => s.tickets);
  const projects = useWorkspace((s) => s.projects);

  const [project, setProject] = useState('');
  const [range, setRange] = useState<Range>('30');

  const tickets = useMemo(
    () => (project ? allTickets.filter((t) => t.projectId === project) : allTickets),
    [allTickets, project]
  );
  const scopedProjects = useMemo(() => (project ? projects.filter((p) => p._id === project) : projects), [projects, project]);

  const kpis = useMemo(() => computeKpis(tickets, range), [tickets, range]);
  const weeks = weeksFor(range);
  const flow = useMemo(() => weeklyFlow(tickets, weeks), [tickets, weeks]);
  const stages = useMemo(() => stageMix(tickets), [tickets]);
  const priorities = useMemo(() => openByPriority(tickets), [tickets]);
  const types = useMemo(() => byType(tickets), [tickets]);
  const perProject = useMemo(() => byProject(tickets, scopedProjects), [tickets, scopedProjects]);
  const ages = useMemo(() => ageBuckets(tickets), [tickets]);
  const qa = useMemo(() => qaSignoff(tickets), [tickets]);

  const rangeLabel = range === 'all' ? 'all time' : `last ${range} days`;

  return (
    <>
      <PageHeader title="Reports" description="Throughput, mix and ageing, computed live from your tickets.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-56">
            <Select
              size="sm"
              aria-label="Project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              options={[{ value: '', label: 'All projects' }, ...projects.map((p) => ({ value: p._id, label: p.name }))]}
            />
          </div>
          <Segmented<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>
      </PageHeader>

      <section aria-label="Key numbers" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Total tickets" value={kpis.total} />
        <Kpi label="Open" value={kpis.open} />
        <Kpi label="Closed" value={kpis.closedInRange} hint={rangeLabel} />
        <Kpi
          label="Avg. cycle time"
          value={kpis.avgCycleMs === null ? '—' : formatDuration(kpis.avgCycleMs)}
          hint={kpis.avgCycleMs === null ? 'No closed tickets' : `created to closed, ${rangeLabel}`}
        />
        <Kpi label="Overdue now" value={kpis.overdue} tone={kpis.overdue > 0 ? 'danger' : undefined} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <FlowChart data={flow} weeks={weeks} />
        <StageDonut data={stages} />
        <PriorityBars data={priorities} />
        <TypeBars data={types} />
        <ProjectBars data={perProject} />
        <AgeChart data={ages} />
        <QaSignoff data={qa} />
      </div>
    </>
  );
}
