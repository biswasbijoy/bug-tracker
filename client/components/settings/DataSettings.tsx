'use client';

import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, CircleStackIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Misc';
import { useWorkspace } from '@/store/workspaceStore';

export default function DataSettings() {
  const projects = useWorkspace((s) => s.projects);
  const epics = useWorkspace((s) => s.epics);
  const sprints = useWorkspace((s) => s.sprints);
  const tickets = useWorkspace((s) => s.tickets);
  const labels = useWorkspace((s) => s.labels);

  const counts = [
    { label: 'Projects', value: projects.length },
    { label: 'Epics', value: epics.length },
    { label: 'Sprints', value: sprints.length },
    { label: 'Tickets', value: tickets.length },
    { label: 'Labels', value: labels.length },
  ];

  const exportJson = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        projects,
        epics,
        sprints,
        tickets,
        labels,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Export downloaded');
    } catch {
      toast.error('Could not create the export');
    }
  };

  return (
    <div className="space-y-5">
      <Panel title="Your data">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {counts.map((c) => (
            <div key={c.label} className="rounded-md border border-line bg-subtle px-3 py-2.5">
              <dd className="text-xl font-semibold tabular-nums text-fg">{c.value}</dd>
              <dt className="text-xs text-fg-muted">{c.label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex gap-3 rounded-md border border-line p-3 text-[13px] text-fg-muted">
          <CircleStackIcon className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
          <p>
            Everything is stored in your local MongoDB database, by default{' '}
            <code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs text-fg">mongodb://localhost:27017/ticket-tracker</code>
            , configured in <code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs text-fg">server/.env</code>. Nothing is sent to
            any external service.
          </p>
        </div>
      </Panel>

      <Panel title="Export">
        <p className="mb-3 max-w-xl text-[13px] text-fg-muted">
          Download a JSON snapshot of your projects, epics, sprints, tickets and labels. Notes are not included.
        </p>
        <Button variant="primary" icon={<ArrowDownTrayIcon className="h-4 w-4" />} onClick={exportJson}>
          Export everything as JSON
        </Button>
      </Panel>
    </div>
  );
}
