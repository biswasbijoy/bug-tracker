'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { PlusIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  AttentionSection, FirstRun, MyQueueCard, PipelineCard, ProjectsCard, RecentCard, StatTiles,
} from '@/components/dashboard/DashboardParts';
import { computeDashboard } from '@/components/dashboard/data';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuthStore } from '@/store/authStore';
import { useUi } from '@/store/uiStore';
import { useWorkspace } from '@/store/workspaceStore';

function greeting(): string {
  const h = new Date().getHours();
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  useDocumentTitle('Home');
  const user = useAuthStore((s) => s.user);
  const tickets = useWorkspace((s) => s.tickets);
  const projects = useWorkspace((s) => s.projects);
  const openNewTicket = useUi((s) => s.openNewTicket);

  const data = useMemo(() => computeDashboard(tickets, user?.name || ''), [tickets, user?.name]);
  const first = user?.name?.trim().split(/\s+/)[0];

  return (
    <>
      <PageHeader
        title={first ? `${greeting()}, ${first}` : greeting()}
        description={format(new Date(), 'EEEE, MMMM d')}
        actions={
          <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => openNewTicket()}>
            New ticket
          </Button>
        }
      />

      {tickets.length === 0 ? (
        <FirstRun hasProjects={projects.length > 0} onNewTicket={() => openNewTicket()} />
      ) : (
        <>
          <AttentionSection data={data} />
          <StatTiles data={data} />
          <div className="mb-6">
            <PipelineCard data={data} />
          </div>
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <MyQueueCard data={data} />
            <RecentCard data={data} />
          </div>
          <ProjectsCard projects={projects} tickets={tickets} />
        </>
      )}
    </>
  );
}
