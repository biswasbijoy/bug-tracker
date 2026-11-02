'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn, errorMessage, pluralize } from '@/lib/utils';
import { isDone, isOverdue, stageOf } from '@/lib/tickets';
import { useWorkspace } from '@/store/workspaceStore';
import type { Project, Ticket } from '@/types';
import { ConfirmDialog } from '@/components/ui/Dialog';

/** Colour dot for a project (colour is user-chosen, so it is the one place raw colours are allowed). */
export function ProjectDot({ color, className }: { color?: string; className?: string }) {
  return <span aria-hidden className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', className)} style={{ background: color || 'var(--c-blue)' }} />;
}

export interface TicketStats {
  total: number;
  done: number;
  open: number;
  qa: number;
  blocked: number;
  overdue: number;
  /** 0-100 */
  pct: number;
}

export function computeStats(tickets: Ticket[]): TicketStats {
  let done = 0, open = 0, qa = 0, blocked = 0, overdue = 0;
  for (const t of tickets) {
    if (isDone(t.status)) done++;
    else {
      open++;
      if (stageOf(t.status) === 'qa') qa++;
      if (t.status === 'blocked') blocked++;
      if (isOverdue(t)) overdue++;
    }
  }
  const total = tickets.length;
  return { total, done, open, qa, blocked, overdue, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Group tickets by a key (missing key → skipped). */
export function groupBy<T>(items: T[], key: (item: T) => string | undefined): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    (out[k] ||= []).push(item);
  }
  return out;
}

export const EMPTY_STATS: TicketStats = { total: 0, done: 0, open: 0, qa: 0, blocked: 0, overdue: 0, pct: 0 };

/** Toggle active/archived on a project, with toasts. */
export async function toggleProjectArchived(project: Project) {
  const next = project.status === 'archived' ? 'active' : 'archived';
  try {
    await useWorkspace.getState().saveProject({ status: next }, project._id);
    toast.success(next === 'archived' ? 'Project archived' : 'Project restored');
  } catch (err) {
    toast.error(errorMessage(err, 'Could not update project'));
  }
}

/** Confirm dialog for deleting a project, stating exactly what is deleted with it. */
export function DeleteProjectDialog({
  project, onClose, onDeleted,
}: {
  project: Project | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const tickets = useWorkspace((s) => s.tickets);
  const epics = useWorkspace((s) => s.epics);
  const sprints = useWorkspace((s) => s.sprints);
  const removeProject = useWorkspace((s) => s.removeProject);
  const [busy, setBusy] = useBusy();

  const counts = project
    ? {
        tickets: tickets.filter((t) => t.projectId === project._id).length,
        epics: epics.filter((e) => e.projectId === project._id).length,
        sprints: sprints.filter((x) => x.projectId === project._id).length,
      }
    : { tickets: 0, epics: 0, sprints: 0 };

  return (
    <ConfirmDialog
      open={!!project}
      title="Delete project?"
      confirmLabel="Delete project"
      loading={busy}
      onClose={onClose}
      onConfirm={async () => {
        if (!project) return;
        setBusy(true);
        try {
          await removeProject(project._id);
          toast.success('Project deleted');
          onClose();
          onDeleted?.();
        } catch (err) {
          toast.error(errorMessage(err, 'Could not delete project'));
        } finally {
          setBusy(false);
        }
      }}
      message={
        <>
          <p>
            <strong className="text-fg">{project?.name}</strong> will be permanently deleted together with its{' '}
            <strong className="text-fg">{pluralize(counts.tickets, 'ticket')}</strong>,{' '}
            <strong className="text-fg">{pluralize(counts.epics, 'epic')}</strong> and{' '}
            <strong className="text-fg">{pluralize(counts.sprints, 'sprint')}</strong>.
          </p>
          <p className="mt-2">This cannot be undone. Archive the project instead if you may need it again.</p>
        </>
      }
    />
  );
}

export function useBusy() {
  return useState(false);
}

/** Read a single URL query value and update it (removing it when empty / default). Render inside <Suspense>. */
export function useQueryParam(key: string, fallback = ''): [string, (value: string) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = params.get(key) ?? fallback;
  const set = (next: string) => {
    const sp = new URLSearchParams(params.toString());
    if (!next || next === fallback) sp.delete(key);
    else sp.set(key, next);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return [value, set];
}

/** Calls `onOpen` once when the URL contains `?new=1`, then removes the parameter. Render inside <Suspense>. */
export function NewFromQuery({ onOpen }: { onOpen: () => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (params.get('new') !== '1') return;
    onOpen();
    const next = new URLSearchParams(params.toString());
    next.delete('new');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return null;
}
