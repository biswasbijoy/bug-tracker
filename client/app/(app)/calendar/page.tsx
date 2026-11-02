'use client';

import { useEffect, useMemo, useState } from 'react';
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Button, IconButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Form';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Tabs';
import { Agenda, DayDialog, Legend, MonthGrid } from '@/components/calendar/CalendarParts';
import { buildEvents } from '@/components/calendar/events';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useWorkspace } from '@/store/workspaceStore';

type View = 'month' | 'agenda';

/** True below the `sm` breakpoint (640px). */
function useIsPhone(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return phone;
}

export default function CalendarPage() {
  useDocumentTitle('Calendar');
  const tickets = useWorkspace((s) => s.tickets);
  const projects = useWorkspace((s) => s.projects);

  const isPhone = useIsPhone();
  const [chosen, setChosen] = useState<View | null>(null);
  const view: View = chosen ?? (isPhone ? 'agenda' : 'month');

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [project, setProject] = useState('');
  const [day, setDay] = useState<Date | null>(null);

  const events = useMemo(
    () => buildEvents(project ? tickets.filter((t) => t.projectId === project) : tickets),
    [tickets, project]
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Due dates, deployments and production releases."
        actions={
          <Segmented<View>
            value={view}
            onChange={setChosen}
            options={[
              { value: 'month', label: 'Month' },
              { value: 'agenda', label: 'Agenda' },
            ]}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {view === 'month' && (
          <>
            <div className="flex items-center gap-1">
              <IconButton label="Previous month" onClick={() => setMonth((m) => subMonths(m, 1))}>
                <ChevronLeftIcon className="h-5 w-5" />
              </IconButton>
              <IconButton label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
                <ChevronRightIcon className="h-5 w-5" />
              </IconButton>
              <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>
                Today
              </Button>
            </div>
            <h2 className="min-w-32 text-base font-semibold text-fg" aria-live="polite">
              {format(month, 'MMMM yyyy')}
            </h2>
          </>
        )}
        <div className="ml-auto w-full sm:w-56">
          <Select
            size="sm"
            aria-label="Filter by project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            options={[{ value: '', label: 'All projects' }, ...projects.map((p) => ({ value: p._id, label: p.name }))]}
          />
        </div>
      </div>

      <div className="mb-3">
        <Legend />
      </div>

      {view === 'month' ? <MonthGrid month={month} events={events} onOpenDay={setDay} /> : <Agenda events={events} />}

      <DayDialog day={day} events={events} onClose={() => setDay(null)} />
    </>
  );
}
