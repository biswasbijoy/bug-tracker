'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ChevronDownIcon, EllipsisHorizontalIcon, PencilSquareIcon, PlusIcon, RectangleStackIcon, TrashIcon,
} from '@heroicons/react/20/solid';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { Menu } from '@/components/ui/Popover';
import { EmptyState } from '@/components/ui/Misc';
import { errorMessage, pluralize } from '@/lib/utils';
import { isDone } from '@/lib/tickets';
import { useUi } from '@/store/uiStore';
import { useWorkspace } from '@/store/workspaceStore';
import type { Epic, Project } from '@/types';
import { LinkButton, PlanCard } from './PlanCard';
import { ProjectDot, groupBy, useBusy } from './helpers';

type EpicStatus = Epic['status'];

const STATUS_META: Record<EpicStatus, { label: string; tone: 'accent' | 'success' | 'neutral' }> = {
  active: { label: 'Active', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};
const STATUS_ORDER: EpicStatus[] = ['active', 'completed', 'archived'];

/**
 * Epics of one project (`projectId`), or of every project grouped under project headings.
 * Used by the project workspace "Epics" tab and the /epics page.
 */
export default function EpicsPanel({ projectId }: { projectId?: string }) {
  const epics = useWorkspace((s) => s.epics);
  const projects = useWorkspace((s) => s.projects);
  const tickets = useWorkspace((s) => s.tickets);
  const saveEpic = useWorkspace((s) => s.saveEpic);
  const removeEpic = useWorkspace((s) => s.removeEpic);
  const openNewTicket = useUi((s) => s.openNewTicket);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Epic | null>(null);
  const [deleting, setDeleting] = useState<Epic | null>(null);
  const [busy, setBusy] = useBusy();

  const stats = useMemo(() => {
    const byEpic = groupBy(tickets, (t) => t.epicId);
    return Object.fromEntries(
      Object.entries(byEpic).map(([id, list]) => {
        const done = list.filter((t) => isDone(t.status)).length;
        return [id, { total: list.length, done, open: list.length - done }];
      })
    );
  }, [tickets]);

  const visible = useMemo(
    () =>
      epics
        .filter((e) => !projectId || e.projectId === projectId)
        .sort(
          (a, b) =>
            STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
    [epics, projectId]
  );

  const groups = useMemo(() => {
    if (projectId) return [{ project: undefined as Project | undefined, epics: visible }];
    const byProject = groupBy(visible, (e) => e.projectId);
    return projects.filter((p) => byProject[p._id]).map((p) => ({ project: p as Project | undefined, epics: byProject[p._id] }));
  }, [visible, projects, projectId]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const setStatus = async (epic: Epic, status: EpicStatus) => {
    if (epic.status === status) return;
    try {
      await saveEpic({ status }, epic._id);
      toast.success(`Epic marked ${STATUS_META[status].label.toLowerCase()}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update epic'));
    }
  };

  const noProjects = projects.length === 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-fg-muted">{pluralize(visible.length, 'epic')}</p>
        <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={openNew} disabled={noProjects}>
          New epic
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-panel">
          <EmptyState
            icon={<RectangleStackIcon />}
            title="No epics yet"
            description={
              noProjects
                ? 'Create a project first — epics group related tickets inside a project.'
                : 'Epics group related tickets into a larger piece of work, like a feature or initiative.'
            }
            action={
              noProjects ? (
                <Link href="/projects?new=1" className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">
                  New project
                </Link>
              ) : (
                <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={openNew}>
                  New epic
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
                  <span className="font-normal text-fg-subtle">{g.epics.length}</span>
                </h2>
              )}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {g.epics.map((epic) => {
                  const s = stats[epic._id] || { total: 0, done: 0, open: 0 };
                  const meta = STATUS_META[epic.status] || STATUS_META.active;
                  return (
                    <PlanCard
                      key={epic._id}
                      title={epic.name}
                      badge={
                        <Menu
                          items={STATUS_ORDER.map((st) => ({
                            label: STATUS_META[st].label,
                            selected: st === epic.status,
                            onSelect: () => setStatus(epic, st),
                          }))}
                          trigger={
                            <button type="button" aria-label={`Status: ${meta.label}. Change status`} className="rounded-full outline-offset-2 hover:brightness-95">
                              <Badge tone={meta.tone}>
                                {meta.label}
                                <ChevronDownIcon className="-mr-0.5 h-3 w-3" />
                              </Badge>
                            </button>
                          }
                        />
                      }
                      description={epic.description}
                      progress={{ done: s.done, total: s.total, hue: epic.status === 'completed' ? 'green' : 'blue' }}
                      meta={`${s.open} open · ${s.total} total`}
                      menu={
                        <Menu
                          align="end"
                          trigger={
                            <IconButton label={`Actions for ${epic.name}`} size="sm" className="-mr-1 -mt-0.5">
                              <EllipsisHorizontalIcon className="h-5 w-5" />
                            </IconButton>
                          }
                          items={[
                            {
                              label: 'Edit',
                              icon: <PencilSquareIcon />,
                              onSelect: () => {
                                setEditing(epic);
                                setFormOpen(true);
                              },
                            },
                            { type: 'separator' },
                            { label: 'Delete…', icon: <TrashIcon />, danger: true, onSelect: () => setDeleting(epic) },
                          ]}
                        />
                      }
                      actions={
                        <>
                          <LinkButton href={`/tickets?epic=${epic._id}&scope=all`}>View tickets</LinkButton>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<PlusIcon className="h-4 w-4" />}
                            onClick={() => openNewTicket({ projectId: epic.projectId, epicId: epic._id })}
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

      <EpicFormDialog open={formOpen} epic={editing} projectId={projectId} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete epic?"
        confirmLabel="Delete epic"
        loading={busy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await removeEpic(deleting._id);
            toast.success('Epic deleted');
            setDeleting(null);
          } catch (err) {
            toast.error(errorMessage(err, 'Could not delete epic'));
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
              lose the epic.
            </p>
          </>
        }
      />
    </div>
  );
}

// ------------------------------------------------------------------ dialog

function EpicFormDialog({
  open, onClose, epic, projectId,
}: {
  open: boolean;
  onClose: () => void;
  epic: Epic | null;
  projectId?: string;
}) {
  const projects = useWorkspace((s) => s.projects);
  const saveEpic = useWorkspace((s) => s.saveEpic);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EpicStatus>('active');
  const [project, setProject] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(epic?.name || '');
    setDescription(epic?.description || '');
    setStatus(epic?.status || 'active');
    setProject(epic?.projectId || projectId || projects.find((p) => p.status === 'active')?._id || projects[0]?._id || '');
    setError('');
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, epic, projectId]);

  const projectOptions = projects
    .filter((p) => p.status === 'active' || p._id === project)
    .map((p) => ({ value: p._id, label: p.name }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!project) {
      toast.error('Choose a project');
      return;
    }
    setSaving(true);
    try {
      await saveEpic(
        epic
          ? { name: name.trim(), description: description.trim(), status }
          : { name: name.trim(), description: description.trim(), status, projectId: project },
        epic?._id
      );
      toast.success(epic ? 'Epic updated' : 'Epic created');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, epic ? 'Could not update epic' : 'Could not create epic'));
      setSaving(false);
    }
  };

  const formId = 'epic-form';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={epic ? 'Edit epic' : 'New epic'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>
            {epic ? 'Save changes' : 'Create epic'}
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
            if (error) setError('');
          }}
          error={error}
          placeholder="e.g. Checkout redesign"
          maxLength={120}
        />
        <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EpicStatus)}
            options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))}
          />
          {!projectId && (
            <Select
              label="Project"
              required
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={!!epic}
              hint={epic ? 'An epic cannot move to another project' : undefined}
              options={projectOptions}
            />
          )}
        </div>
      </form>
    </Dialog>
  );
}
