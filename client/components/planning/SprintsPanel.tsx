'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { differenceInCalendarDays } from 'date-fns';
import {
  CheckIcon, EllipsisHorizontalIcon, PencilSquareIcon, PlayIcon, PlusIcon, TrashIcon, FlagIcon,
} from '@heroicons/react/20/solid';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { Input, Select } from '@/components/ui/Form';
import { Menu } from '@/components/ui/Popover';
import { EmptyState } from '@/components/ui/Misc';
import { dateInputToIso, errorMessage, formatDate, pluralize, toDateInput } from '@/lib/utils';
import { isDone } from '@/lib/tickets';
import { useUi } from '@/store/uiStore';
import { useWorkspace } from '@/store/workspaceStore';
import type { Project, Sprint } from '@/types';
import { LinkButton, PlanCard } from './PlanCard';
import { ProjectDot, groupBy, useBusy } from './helpers';

type SprintStatus = Sprint['status'];

const STATUS_META: Record<SprintStatus, { label: string; tone: 'accent' | 'success' | 'neutral' }> = {
  planned: { label: 'Planned', tone: 'neutral' },
  active: { label: 'Active', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
};
const STATUS_ORDER: SprintStatus[] = ['active', 'planned', 'completed'];

const ts = (d?: string) => (d ? +new Date(d) : Number.POSITIVE_INFINITY);

function compareSprints(a: Sprint, b: Sprint) {
  const byStatus = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  if (byStatus) return byStatus;
  // finished sprints: most recent first; upcoming ones: soonest first
  if (a.status === 'completed') return (b.endDate ? +new Date(b.endDate) : 0) - (a.endDate ? +new Date(a.endDate) : 0);
  return ts(a.startDate) - ts(b.startDate) || +new Date(b.createdAt) - +new Date(a.createdAt);
}

/** "Jul 1 – Jul 14", "From Jul 1", "Until Jul 14" or null. */
export function sprintRange(s: Pick<Sprint, 'startDate' | 'endDate'>): string | null {
  if (s.startDate && s.endDate) return `${formatDate(s.startDate)} – ${formatDate(s.endDate)}`;
  if (s.startDate) return `From ${formatDate(s.startDate)}`;
  if (s.endDate) return `Until ${formatDate(s.endDate)}`;
  return null;
}

/** Days-left sentence for an active sprint, plus whether it is past its end date. */
export function sprintDaysLeft(s: Pick<Sprint, 'endDate'>): { text: string; late: boolean } | null {
  if (!s.endDate) return null;
  const days = differenceInCalendarDays(new Date(s.endDate), new Date());
  if (days < 0) return { text: `Ended ${pluralize(-days, 'day')} ago`, late: true };
  if (days === 0) return { text: 'Ends today', late: false };
  return { text: `${pluralize(days, 'day')} left`, late: false };
}

/**
 * Sprints of one project (`projectId`), or of every project grouped under project headings.
 * Used by the project workspace "Sprints" tab and the /sprints page.
 */
export default function SprintsPanel({ projectId }: { projectId?: string }) {
  const sprints = useWorkspace((s) => s.sprints);
  const projects = useWorkspace((s) => s.projects);
  const tickets = useWorkspace((s) => s.tickets);
  const saveSprint = useWorkspace((s) => s.saveSprint);
  const removeSprint = useWorkspace((s) => s.removeSprint);
  const openNewTicket = useUi((s) => s.openNewTicket);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [deleting, setDeleting] = useState<Sprint | null>(null);
  const [busy, setBusy] = useBusy();

  const stats = useMemo(() => {
    const bySprint = groupBy(tickets, (t) => t.sprintId);
    return Object.fromEntries(
      Object.entries(bySprint).map(([id, list]) => {
        const done = list.filter((t) => isDone(t.status)).length;
        return [id, { total: list.length, done, open: list.length - done }];
      })
    );
  }, [tickets]);

  const visible = useMemo(
    () => sprints.filter((x) => !projectId || x.projectId === projectId).sort(compareSprints),
    [sprints, projectId]
  );

  const groups = useMemo(() => {
    if (projectId) return [{ project: undefined as Project | undefined, sprints: visible }];
    const byProject = groupBy(visible, (x) => x.projectId);
    return projects.filter((p) => byProject[p._id]).map((p) => ({ project: p as Project | undefined, sprints: byProject[p._id] }));
  }, [visible, projects, projectId]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const setStatus = async (sprint: Sprint, status: SprintStatus, message: string) => {
    try {
      await saveSprint({ status }, sprint._id);
      toast.success(message);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update sprint'));
    }
  };

  const noProjects = projects.length === 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-fg-muted">{pluralize(visible.length, 'sprint')}</p>
        <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={openNew} disabled={noProjects}>
          New sprint
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-panel">
          <EmptyState
            icon={<FlagIcon />}
            title="No sprints yet"
            description={
              noProjects
                ? 'Create a project first — sprints are time-boxed iterations inside a project.'
                : 'Sprints are time-boxed iterations. Plan one, add tickets to it and start it when the work begins.'
            }
            action={
              noProjects ? (
                <Link href="/projects?new=1" className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">
                  New project
                </Link>
              ) : (
                <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={openNew}>
                  New sprint
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.project?._id || 'all'}>
              {g.project && (
                <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-fg">
                  <ProjectDot color={g.project.color} />
                  <Link href={`/projects/${g.project._id}`} className="hover:underline">{g.project.name}</Link>
                  <span className="font-normal text-fg-subtle">{g.sprints.length}</span>
                </h2>
              )}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {g.sprints.map((sprint) => {
                  const s = stats[sprint._id] || { total: 0, done: 0, open: 0 };
                  const meta = STATUS_META[sprint.status] || STATUS_META.planned;
                  const range = sprintRange(sprint);
                  const left = sprint.status === 'active' ? sprintDaysLeft(sprint) : null;
                  return (
                    <PlanCard
                      key={sprint._id}
                      title={sprint.name}
                      badge={<Badge tone={meta.tone}>{meta.label}</Badge>}
                      subtitle={
                        range || left ? (
                          <span className="inline-flex flex-wrap items-center gap-x-2">
                            {range && <span>{range}</span>}
                            {left && <span className={left.late ? 'font-medium text-danger' : 'font-medium text-fg'}>{left.text}</span>}
                          </span>
                        ) : (
                          <span className="text-fg-subtle">No dates set</span>
                        )
                      }
                      progress={{ done: s.done, total: s.total, hue: sprint.status === 'completed' ? 'green' : 'blue' }}
                      meta={`${s.open} open · ${s.total} total`}
                      menu={
                        <Menu
                          align="end"
                          trigger={
                            <IconButton label={`Actions for ${sprint.name}`} size="sm" className="-mr-1 -mt-0.5">
                              <EllipsisHorizontalIcon className="h-5 w-5" />
                            </IconButton>
                          }
                          items={[
                            {
                              label: 'Edit',
                              icon: <PencilSquareIcon />,
                              onSelect: () => {
                                setEditing(sprint);
                                setFormOpen(true);
                              },
                            },
                            ...(sprint.status !== 'planned'
                              ? [{ label: 'Move back to planned', onSelect: () => setStatus(sprint, 'planned', 'Sprint moved to planned') }]
                              : []),
                            { type: 'separator' as const },
                            { label: 'Delete…', icon: <TrashIcon />, danger: true, onSelect: () => setDeleting(sprint) },
                          ]}
                        />
                      }
                      actions={
                        <>
                          {sprint.status === 'planned' && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<PlayIcon className="h-4 w-4" />}
                              onClick={() => setStatus(sprint, 'active', 'Sprint started')}
                            >
                              Start sprint
                            </Button>
                          )}
                          {sprint.status === 'active' && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<CheckIcon className="h-4 w-4" />}
                              onClick={() => setStatus(sprint, 'completed', 'Sprint completed')}
                            >
                              Complete sprint
                            </Button>
                          )}
                          <LinkButton href={`/tickets?sprint=${sprint._id}&scope=all`}>View tickets</LinkButton>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<PlusIcon className="h-4 w-4" />}
                            onClick={() => openNewTicket({ projectId: sprint.projectId, sprintId: sprint._id })}
                          >
                            Add ticket
                          </Button>
                        </>
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <SprintFormDialog open={formOpen} sprint={editing} projectId={projectId} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete sprint?"
        confirmLabel="Delete sprint"
        loading={busy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await removeSprint(deleting._id);
            toast.success('Sprint deleted');
            setDeleting(null);
          } catch (err) {
            toast.error(errorMessage(err, 'Could not delete sprint'));
          } finally {
            setBusy(false);
          }
        }}
        message={
          <>
            <p>
              <strong className="text-fg">{deleting?.name}</strong> will be deleted.
            </p>
            <p className="mt-2">
              Its {pluralize(deleting ? stats[deleting._id]?.total || 0 : 0, 'ticket')} will not be deleted — they just
              lose the sprint.
            </p>
          </>
        }
      />
    </div>
  );
}

// ------------------------------------------------------------------ dialog

function SprintFormDialog({
  open, onClose, sprint, projectId,
}: {
  open: boolean;
  onClose: () => void;
  sprint: Sprint | null;
  projectId?: string;
}) {
  const projects = useWorkspace((s) => s.projects);
  const saveSprint = useWorkspace((s) => s.saveSprint);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState<SprintStatus>('planned');
  const [project, setProject] = useState('');
  const [errors, setErrors] = useState<{ name?: string; end?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(sprint?.name || '');
    setStart(toDateInput(sprint?.startDate));
    setEnd(toDateInput(sprint?.endDate));
    setStatus(sprint?.status || 'planned');
    setProject(sprint?.projectId || projectId || projects.find((p) => p.status === 'active')?._id || projects[0]?._id || '');
    setErrors({});
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sprint, projectId]);

  const projectOptions = projects
    .filter((p) => p.status === 'active' || p._id === project)
    .map((p) => ({ value: p._id, label: p.name }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (start && end && end < start) next.end = 'End date must be on or after the start date';
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!project) {
      toast.error('Choose a project');
      return;
    }
    setSaving(true);
    try {
      const body = { name: name.trim(), status, startDate: dateInputToIso(start), endDate: dateInputToIso(end) };
      await saveSprint(sprint ? body : { ...body, projectId: project }, sprint?._id);
      toast.success(sprint ? 'Sprint updated' : 'Sprint created');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, sprint ? 'Could not update sprint' : 'Could not create sprint'));
      setSaving(false);
    }
  };

  const formId = 'sprint-form';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={sprint ? 'Edit sprint' : 'New sprint'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>
            {sprint ? 'Save changes' : 'Create sprint'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <Input
          label="Name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
          }}
          error={errors.name}
          placeholder="e.g. Sprint 12"
          maxLength={120}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Start date" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input
            label="End date"
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => {
              setEnd(e.target.value);
              if (errors.end) setErrors((x) => ({ ...x, end: undefined }));
            }}
            error={errors.end}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SprintStatus)}
            options={(['planned', 'active', 'completed'] as SprintStatus[]).map((s) => ({ value: s, label: STATUS_META[s].label }))}
          />
          {!projectId && (
            <Select
              label="Project"
              required
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={!!sprint}
              hint={sprint ? 'A sprint cannot move to another project' : undefined}
              options={projectOptions}
            />
          )}
        </div>
      </form>
    </Dialog>
  );
}
