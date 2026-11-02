'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowTopRightOnSquareIcon, ChevronRightIcon, LinkIcon, PencilSquareIcon, StarIcon as StarSolid, TrashIcon,
} from '@heroicons/react/20/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState, Skeleton } from '@/components/ui/Misc';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage, pluralize } from '@/lib/utils';
import { useLookups, useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import { TicketKey, TypeIcon } from './badges';
import AttachmentsSection from './detail/AttachmentsSection';
import ChecklistSection from './detail/ChecklistSection';
import DescriptionSection from './detail/DescriptionSection';
import DiscussionSection from './detail/DiscussionSection';
import { InlineEdit } from './detail/InlineEdit';
import PropertiesPanel from './detail/PropertiesPanel';
import QaSection from './detail/QaSection';
import SubtasksSection from './detail/SubtasksSection';
import { attempt, isHttpUrl } from './detail/shared';

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading ticket">
      <Skeleton className="mb-3 h-4 w-56" />
      <Skeleton className="mb-2 h-7 w-2/3" />
      <Skeleton className="mb-6 h-4 w-24" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
        <Skeleton className="order-first h-72 w-full lg:order-none" />
      </div>
    </div>
  );
}

function NotFound({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      className="py-24"
      title={onRetry ? 'Could not load this ticket' : 'Ticket not found'}
      description={message || 'It may have been deleted, or the link is incorrect.'}
      action={
        <div className="flex items-center justify-center gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Link
            href="/tickets"
            className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover"
          >
            Back to tickets
          </Link>
        </div>
      }
    />
  );
}

export default function TicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const ticket = useWorkspace((s) => s.tickets.find((t) => t._id === id));
  const { updateTicket, deleteTicket, toggleFavorite, fetchTicket } = useWorkspace.getState();
  const tickets = useWorkspace((s) => s.tickets);
  const { projectById } = useLookups();
  const openEditTicket = useUi((s) => s.openEditTicket);

  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [errorText, setErrorText] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletedRef = useRef(false);

  useDocumentTitle(ticket ? `${ticket.ticketNo} ${ticket.title}` : undefined);

  // refresh from the API (populated comment authors / activity)
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchTicket(id)
      .then(() => !cancelled && setStatus('ok'))
      .catch((err) => {
        if (cancelled) return;
        const code = err?.response?.status;
        setErrorText(err?.response?.data?.message);
        setStatus(code === 404 || code === 400 ? 'notfound' : 'error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reloadKey]);

  if (!ticket) {
    if (deletedRef.current) return <DetailSkeleton />;
    if (status === 'notfound') return <NotFound />;
    if (status === 'error') return <NotFound message={errorText} onRetry={() => setReloadKey((k) => k + 1)} />;
    return <DetailSkeleton />;
  }

  const project = projectById[ticket.projectId];
  const parent = ticket.parentTicketId ? tickets.find((t) => t._id === ticket.parentTicketId) : undefined;
  const childCount = tickets.filter((t) => t.parentTicketId === ticket._id).length;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const remove = async () => {
    setDeleting(true);
    deletedRef.current = true;
    try {
      await deleteTicket(ticket._id);
    } catch (err) {
      deletedRef.current = false;
      setDeleting(false);
      toast.error(errorMessage(err, 'Could not delete the ticket'));
      return;
    }
    toast.success(`${ticket.ticketNo} deleted`);
    router.push('/tickets');
  };

  return (
    <div>
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-2 flex min-w-0 flex-wrap items-center gap-1 text-xs text-fg-subtle">
        <Link href="/tickets" className="hover:text-fg hover:underline">
          Tickets
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
        {project && (
          <>
            <Link href={`/projects/${project._id}`} className="max-w-[40vw] truncate hover:text-fg hover:underline">
              {project.name}
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
          </>
        )}
        <span className="font-mono">{ticket.ticketNo}</span>
      </nav>

      {/* title row */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
          {parent && (
            <p className="mb-1 flex min-w-0 items-center gap-1.5 text-[13px] text-fg-muted">
              <span className="shrink-0">Parent:</span>
              <Link href={`/tickets/${parent._id}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-accent hover:underline">
                <TicketKey ticketNo={parent.ticketNo} className="shrink-0" />
                <span className="truncate">{parent.title}</span>
              </Link>
            </p>
          )}
          <div className="mb-1 flex items-center gap-2">
            <TypeIcon type={ticket.type} />
            <TicketKey ticketNo={ticket.ticketNo} className="text-[13px]" />
          </div>
          <InlineEdit
            multiline
            label="Title"
            value={ticket.title}
            className="text-xl font-semibold leading-snug tracking-tight text-fg"
            onSave={(title) => updateTicket(ticket._id, { title })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <IconButton
            label={ticket.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => attempt(() => toggleFavorite(ticket._id), 'Could not update the favourite')}
            aria-pressed={ticket.isFavorite}
          >
            {ticket.isFavorite ? <StarSolid className="h-5 w-5 text-warning" /> : <StarOutline className="h-5 w-5" />}
          </IconButton>
          <Button variant="outline" icon={<PencilSquareIcon className="h-4 w-4" />} onClick={() => openEditTicket(ticket)}>
            Edit
          </Button>
          <IconButton label="Copy link" onClick={copyLink}>
            <LinkIcon className="h-4 w-4" />
          </IconButton>
          {isHttpUrl(ticket.jiraUrl) && (
            <a
              href={ticket.jiraUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-panel px-3.5 text-sm font-medium text-fg transition-colors hover:bg-subtle"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Open link
            </a>
          )}
          <IconButton label="Delete ticket" onClick={() => setConfirmDelete(true)} className="hover:text-danger">
            <TrashIcon className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* body */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <DescriptionSection ticket={ticket} />
          <SubtasksSection ticket={ticket} />
          <ChecklistSection ticket={ticket} />
          <QaSection ticket={ticket} />
          <AttachmentsSection ticket={ticket} />
          <DiscussionSection ticket={ticket} />
        </div>
        <aside className="order-first min-w-0 lg:order-none">
          <PropertiesPanel ticket={ticket} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${ticket.ticketNo}?`}
        message={
          <>
            <strong className="text-fg">{ticket.title}</strong> and its comments, checklist and attachments will be permanently deleted.
            {childCount > 0 && ` Its ${pluralize(childCount, 'sub-task')} will be detached, not deleted.`}
          </>
        }
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
