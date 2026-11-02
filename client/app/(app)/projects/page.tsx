'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArchiveBoxArrowDownIcon, ArchiveBoxXMarkIcon, EllipsisHorizontalIcon, FolderIcon, PencilSquareIcon, PlusIcon, TrashIcon,
} from '@heroicons/react/20/solid';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Form';
import { Menu } from '@/components/ui/Popover';
import { EmptyState, ProgressBar } from '@/components/ui/Misc';
import { PageHeader } from '@/components/ui/PageHeader';
import { DeleteProjectDialog, EMPTY_STATS, NewFromQuery, computeStats, groupBy, toggleProjectArchived } from '@/components/planning/helpers';
import ProjectFormDialog from '@/components/planning/ProjectFormDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn, pluralize } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Project } from '@/types';

export default function ProjectsPage() {
  useDocumentTitle('Projects');
  const projects = useWorkspace((s) => s.projects);
  const tickets = useWorkspace((s) => s.tickets);
  const epics = useWorkspace((s) => s.epics);

  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const stats = useMemo(() => {
    const byProject = groupBy(tickets, (t) => t.projectId);
    return Object.fromEntries(Object.entries(byProject).map(([id, list]) => [id, computeStats(list)]));
  }, [tickets]);
  const epicCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const e of epics) out[e.projectId] = (out[e.projectId] || 0) + 1;
    return out;
  }, [epics]);

  const archivedCount = projects.filter((p) => p.status === 'archived').length;
  const visible = projects.filter((p) => showArchived || p.status !== 'archived');

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project with its progress at a glance."
        actions={
          <>
            {archivedCount > 0 && (
              <Checkbox
                label={`Show archived (${archivedCount})`}
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="mr-1 text-[13px] text-fg-muted"
              />
            )}
            <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={openNew}>
              New project
            </Button>
          </>
        }
      />

      <Suspense fallback={null}>
        <NewFromQuery onOpen={openNew} />
      </Suspense>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-panel">
          <EmptyState
            icon={<FolderIcon />}
            title={projects.length === 0 ? 'No projects yet' : 'No active projects'}
            description={
              projects.length === 0
                ? 'Projects group tickets, epics and sprints for a product or client.'
                : 'All your projects are archived. Show archived projects or create a new one.'
            }
            action={
              <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={openNew}>
                New project
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              stats={stats[p._id] || EMPTY_STATS}
              epicCount={epicCounts[p._id] || 0}
              onEdit={() => {
                setEditing(p);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog open={formOpen} project={editing} onClose={() => setFormOpen(false)} />
      <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

// ------------------------------------------------------------------- card

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'danger' | 'warning' }) {
  return (
    <div className="min-w-0">
      <div className={cn('text-base font-semibold tabular-nums text-fg', value > 0 && tone === 'danger' && 'text-danger', value > 0 && tone === 'warning' && 'text-warning')}>
        {value}
      </div>
      <div className="truncate text-[11px] text-fg-subtle">{label}</div>
    </div>
  );
}

function ProjectCard({
  project, stats, epicCount, onEdit, onDelete,
}: {
  project: Project;
  stats: ReturnType<typeof computeStats>;
  epicCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const archived = project.status === 'archived';
  return (
    <article className={cn('flex flex-col rounded-lg border border-line bg-panel p-4 shadow-sm transition-colors hover:border-line-strong', archived && 'opacity-75')}>
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded" style={{ background: project.color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/projects/${project._id}`} className="truncate text-[15px] font-semibold text-fg hover:text-accent hover:underline">
              {project.name}
            </Link>
            {archived && <Badge>Archived</Badge>}
          </div>
          {project.client && <p className="truncate text-xs text-fg-subtle">{project.client}</p>}
        </div>
        <Menu
          align="end"
          trigger={
            <IconButton label={`Actions for ${project.name}`} size="sm" className="-mr-1 -mt-0.5">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </IconButton>
          }
          items={[
            { label: 'Edit', icon: <PencilSquareIcon />, onSelect: onEdit },
            archived
              ? { label: 'Restore', icon: <ArchiveBoxXMarkIcon />, onSelect: () => toggleProjectArchived(project) }
              : { label: 'Archive', icon: <ArchiveBoxArrowDownIcon />, onSelect: () => toggleProjectArchived(project) },
            { type: 'separator' },
            { label: 'Delete…', icon: <TrashIcon />, danger: true, onSelect: onDelete },
          ]}
        />
      </div>

      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-fg-muted">
        {project.description || <span className="text-fg-subtle">No description</span>}
      </p>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-fg-muted">
          <span>
            {stats.done} of {pluralize(stats.total, 'ticket')} done
          </span>
          <span className="font-medium tabular-nums text-fg">{stats.pct}%</span>
        </div>
        <ProgressBar value={stats.pct} label={`${project.name} completion`} />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 border-t border-line pt-3">
        <Stat label="Open" value={stats.open} />
        <Stat label="In QA" value={stats.qa} />
        <Stat label="Blocked" value={stats.blocked} tone="danger" />
        <Stat label="Overdue" value={stats.overdue} tone="warning" />
        <Stat label="Epics" value={epicCount} />
      </div>
    </article>
  );
}
