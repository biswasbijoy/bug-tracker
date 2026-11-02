'use client';

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { EmptyState, Panel, ProgressBar } from '@/components/ui/Misc';
import { hueVar } from '@/lib/tickets';
import { truncate } from '@/lib/utils';
import type { ageBuckets, byProject, byType, openByPriority, qaSignoff, stageMix, weeklyFlow } from './stats';

const tick = { fill: 'var(--fg-subtle)', fontSize: 12 };
const axisLine = { stroke: 'var(--line)' };

// ------------------------------------------------------------------ shared

interface TipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  payload?: { fill?: string; name?: string };
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TipEntry[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs shadow-md">
      {label !== undefined && label !== '' && <div className="mb-1 font-medium text-fg">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 text-fg-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-fg">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const cursor = { fill: 'var(--subtle)', opacity: 0.6 };

function ChartPanel({
  title, empty, emptyText = 'No data for this selection yet.', summary, className, height = 240, children,
}: {
  title: string;
  empty: boolean;
  emptyText?: string;
  /** text alternative for the chart */
  summary: string;
  className?: string;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <Panel title={title} className={className}>
      {empty ? (
        <EmptyState icon={<ChartBarIcon />} title="Nothing to chart" description={emptyText} className="py-8" />
      ) : (
        <div role="img" aria-label={`${title}. ${summary}`} className="w-full" style={{ height, minHeight: 220 }}>
          {children}
        </div>
      )}
    </Panel>
  );
}

const sum = (rows: { value: number }[]) => rows.reduce((n, r) => n + r.value, 0);
const describe = (rows: { name: string; value: number }[]) =>
  rows.filter((r) => r.value > 0).map((r) => `${r.name} ${r.value}`).join(', ') || 'none';

// ------------------------------------------------------------- (a) weekly

export function FlowChart({ data, weeks }: { data: ReturnType<typeof weeklyFlow>; weeks: number }) {
  const empty = data.every((d) => d.created === 0 && d.closed === 0);
  const created = data.reduce((n, d) => n + d.created, 0);
  const closed = data.reduce((n, d) => n + d.closed, 0);
  return (
    <ChartPanel
      title={`Created vs closed, last ${weeks} weeks`}
      empty={empty}
      emptyText="No tickets were created or closed in this period."
      summary={`${created} created and ${closed} closed over ${weeks} weeks.`}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={axisLine} tickLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={cursor} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--fg-muted)' }} />
          <Bar dataKey="created" name="Created" fill="var(--c-blue)" radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Bar dataKey="closed" name="Closed" fill="var(--c-green)" radius={[3, 3, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

// -------------------------------------------------------- (b) stage donut

export function StageDonut({ data }: { data: ReturnType<typeof stageMix> }) {
  const total = sum(data);
  return (
    <Panel title="Status mix by stage">
      {total === 0 ? (
        <EmptyState icon={<ChartBarIcon />} title="Nothing to chart" description="No tickets for this selection yet." className="py-8" />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div
            role="img"
            aria-label={`Status mix by stage. ${describe(data)}.`}
            className="h-[220px] w-full min-w-0 sm:w-1/2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="var(--panel)" strokeWidth={2}>
                  {data.map((d) => (
                    <Cell key={d.id} fill={hueVar(d.hue)} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="w-full space-y-1.5 sm:w-1/2">
            {data.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-[13px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hueVar(d.hue) }} />
                <span className="text-fg-muted">{d.name}</span>
                <span className="ml-auto font-medium tabular-nums text-fg">{d.value}</span>
                <span className="w-10 text-right text-xs tabular-nums text-fg-subtle">{Math.round((d.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

// ------------------------------------------------------ (c) priority bars

export function PriorityBars({ data }: { data: ReturnType<typeof openByPriority> }) {
  return (
    <ChartPanel
      title="Open tickets by priority"
      empty={sum(data) === 0}
      emptyText="No open tickets."
      summary={describe(data)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={tick} axisLine={axisLine} tickLine={false} />
          <YAxis type="category" dataKey="name" width={70} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={cursor} />
          <Bar dataKey="value" name="Open" radius={[0, 3, 3, 0]} maxBarSize={24}>
            {data.map((d) => (
              <Cell key={d.name} fill={hueVar(d.hue)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

// ------------------------------------------------- stacked horizontal bars

function StackedBars({
  title, data, emptyText, labelWidth = 100,
}: {
  title: string;
  data: { name: string; open: number; done: number }[];
  emptyText: string;
  labelWidth?: number;
}) {
  const summary = data.map((d) => `${d.name}: ${d.open} open, ${d.done} done`).join('; ') || 'none';
  return (
    <ChartPanel
      title={title}
      empty={data.length === 0}
      emptyText={emptyText}
      summary={summary}
      height={Math.max(220, data.length * 34 + 56)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={tick} axisLine={axisLine} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={labelWidth}
            tick={tick}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={(v: string) => truncate(String(v), 16)}
          />
          <Tooltip content={<ChartTooltip />} cursor={cursor} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--fg-muted)' }} />
          <Bar dataKey="open" name="Open" stackId="a" fill="var(--c-blue)" maxBarSize={22} />
          <Bar dataKey="done" name="Done" stackId="a" fill="var(--c-green)" radius={[0, 3, 3, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export const TypeBars = ({ data }: { data: ReturnType<typeof byType> }) => (
  <StackedBars title="Tickets by type" data={data} emptyText="No tickets for this selection yet." />
);

export const ProjectBars = ({ data }: { data: ReturnType<typeof byProject> }) => (
  <StackedBars title="Open vs done by project" data={data} emptyText="No project has tickets yet." />
);

// -------------------------------------------------------------- (f) aging

export function AgeChart({ data }: { data: ReturnType<typeof ageBuckets> }) {
  return (
    <ChartPanel title="Open ticket age" empty={sum(data) === 0} emptyText="No open tickets." summary={describe(data)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="name" tick={tick} axisLine={axisLine} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={cursor} />
          <Bar dataKey="value" name="Open tickets" radius={[3, 3, 0, 0]} maxBarSize={36}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={i >= 3 ? 'var(--c-orange)' : 'var(--c-blue)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

// ------------------------------------------------------------ (g) QA signoff

export function QaSignoff({ data }: { data: ReturnType<typeof qaSignoff> }) {
  return (
    <Panel title="QA sign-off" actions={<span className="text-xs text-fg-subtle">{data.total} open tickets</span>}>
      {data.total === 0 ? (
        <EmptyState icon={<ChartBarIcon />} title="Nothing to chart" description="No open tickets." className="py-8" />
      ) : (
        <ul className="space-y-4 py-1">
          {data.rows.map((r) => {
            const pct = (r.done / data.total) * 100;
            return (
              <li key={r.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="text-fg">{r.label} completed</span>
                  <span className="tabular-nums text-fg-muted">
                    {r.done} / {data.total} <span className="text-fg-subtle">({Math.round(pct)}%)</span>
                  </span>
                </div>
                <ProgressBar value={pct} hue="green" label={`${r.label} completed: ${r.done} of ${data.total} open tickets`} className="h-2" />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
