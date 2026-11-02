'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArchiveBoxArrowDownIcon, ArchiveBoxXMarkIcon, FolderIcon, PencilSquareIcon, PlusIcon, TrashIcon,
} from '@heroicons/react/20/solid';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Misc';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import TicketsWorkspace from '@/components/tickets/TicketsWorkspace';
import EpicsPanel from '@/components/planning/EpicsPanel';
import ProjectActivity from '@/components/planning/ProjectActivity';
import ProjectFormDialog from '@/components/planning/ProjectFormDialog';
import ProjectOverview from '@/components/planning/ProjectOverview';
import SprintsPanel from '@/components/planning/SprintsPanel';
import { DeleteProjectDialog, ProjectDot, toggleProjectArchived } from '@/components/planning/helpers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useUi } from '@/store/uiStore';
import { useWorkspace } from '@/store/workspaceStore';
import type { Project } from '@/types';

const TAB_IDS = ['overview', 'tickets', 'board', 'epics', 'sprints', 'activity'] as const;
type TabId = (typeof TAB_IDS)[number];

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const project = useWorkspace((s) => s.projects.find((p) => p._id === id));
  useDocumentTitle(project?.name || 'Project not found');

  if (!project) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-panel">
        <EmptyState
          icon={<FolderIcon />}
          title="Project not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Link href="/projects" className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">
              Back to projects
            </Link>
          }
        />
      </div>
    );
  }

  return <ProjectWorkspace project={project} />;
}

function ProjectWorkspace({ project }: { project: Project }) {
  const router = useRouter();
  const openNewTicket = useUi((s) => s.openNewTicket);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const archived = project.status === 'archived';

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.name }]}
        title={
          <span className="flex items-center gap-2.5">
            <ProjectDot color={project.color} className="h-3 w-3" />
            <span className="truncate">{project.name}</span>
            {archived && <Badge className="shrink-0">Archived</Badge>}
          </span>
        }
        description={
          project.client || project.description ? (
            <>
              {project.client && <span className="font-medium text-fg">{project.client}</span>}
              {project.client && project.description && <span className="mx-1.5 text-fg-subtle">·</span>}
              {project.description && <span className="whitespace-pre-line">{project.description}</span>}
            </>
          ) : undefined
        }
        actions={
          <>
            <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => openNewTicket({ projectId: project._id })}>
              New ticket
            </Button>
            <Button variant="outline" icon={<PencilSquareIcon className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant="outline"
              icon={archived ? <ArchiveBoxXMarkIcon className="h-4 w-4" /> : <ArchiveBoxArrowDownIcon className="h-4 w-4" />}
              onClick={() => toggleProjectArchived(project)}
            >
              {archived ? 'Restore' : 'Archive'}
            </Button>
            <Button variant="outline" icon={<TrashIcon className="h-4 w-4" />} onClick={() => setDeleting(project)}>
              Delete
            </Button>
          </>
        }
      />

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ProjectTabs project={project} />
      </Suspense>

      <ProjectFormDialog open={editOpen} project={project} onClose={() => setEditOpen(false)} />
      <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} onDeleted={() => router.push('/projects')} />
    </>
  );
}

function ProjectTabs({ project }: { project: Project }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const allTickets = useWorkspace((s) => s.tickets);
  const epics = useWorkspace((s) => s.epics);
  const sprints = useWorkspace((s) => s.sprints);

  const tickets = useMemo(() => allTickets.filter((t) => t.projectId === project._id), [allTickets, project._id]);

  const raw = params.get('tab');
  const tab: TabId = (TAB_IDS as readonly string[]).includes(raw || '') ? (raw as TabId) : 'overview';

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tickets', label: 'Tickets', count: tickets.length },
    { id: 'board', label: 'Board' },
    { id: 'epics', label: 'Epics', count: epics.filter((e) => e.projectId === project._id).length },
    { id: 'sprints', label: 'Sprints', count: sprints.filter((s) => s.projectId === project._id).length },
    { id: 'activity', label: 'Activity' },
  ];

  // switching tabs drops list/board filters so each tab starts from its own defaults
  const select = (id: string) => router.replace(id === 'overview' ? pathname : `${pathname}?tab=${id}`, { scroll: false });

  return (
    <div>
      <Tabs tabs={tabs} value={tab} onChange={select} className="mb-5" />
      {tab === 'overview' && <ProjectOverview project={project} tickets={tickets} />}
      {tab === 'tickets' && <TicketsWorkspace mode="list" lock={{ projectId: project._id }} />}
      {tab === 'board' && <TicketsWorkspace mode="board" lock={{ projectId: project._id }} />}
      {tab === 'epics' && <EpicsPanel projectId={project._id} />}
      {tab === 'sprints' && <SprintsPanel projectId={project._id} />}
      {tab === 'activity' && <ProjectActivity tickets={tickets} />}
    </div>
  );
}
