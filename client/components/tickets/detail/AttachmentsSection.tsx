'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, DocumentIcon, FilmIcon, TrashIcon } from '@heroicons/react/20/solid';
import api, { FILES_BASE } from '@/services/api';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Panel, Spinner } from '@/components/ui/Misc';
import { attachmentName, cn, isImageFile } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Ticket } from '@/types';
import { attempt } from './shared';

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = 'image/*,.pdf,.log,.txt,.csv,.json,.mp4,.webm';

const fileUrl = (stored: string) => `${FILES_BASE}/uploads/${encodeURIComponent(stored)}`;

export default function AttachmentsSection({ ticket }: { ticket: Ticket }) {
  const ticketAction = useWorkspace((s) => s.ticketAction);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 25 MB`);
        continue;
      }
      const form = new FormData();
      form.append('file', file);
      setUploading((n) => n + 1);
      await attempt(
        () => ticketAction(api.post(`/tickets/${ticket._id}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } })),
        `Could not upload ${file.name}`,
        `${file.name} uploaded`
      );
      setUploading((n) => n - 1);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await attempt(
      () => ticketAction(api.delete(`/tickets/${ticket._id}/attachments/${encodeURIComponent(toDelete)}`)),
      'Could not delete the file',
      'Attachment deleted'
    );
    setDeleting(false);
    if (ok) setToDelete(null);
  };

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          Attachments
          {ticket.attachments.length > 0 && <span className="text-xs font-normal text-fg-subtle">{ticket.attachments.length}</span>}
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="ghost"
          icon={<ArrowUpTrayIcon className="h-4 w-4" />}
          onClick={() => inputRef.current?.click()}
        >
          Upload
        </Button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        aria-label="Upload attachments"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = '';
        }}
      />

      {ticket.attachments.length > 0 && (
        <ul className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ticket.attachments.map((stored) => {
            const name = attachmentName(stored);
            const image = isImageFile(name);
            const video = /\.(mp4|webm)$/i.test(name);
            return (
              <li key={stored} className="group flex min-w-0 items-center gap-3 rounded-md border border-line p-2 hover:bg-subtle/60">
                <a
                  href={fileUrl(stored)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-subtle text-fg-subtle"
                  aria-label={`Open ${name}`}
                  tabIndex={-1}
                >
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(stored)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : video ? (
                    <FilmIcon className="h-5 w-5" />
                  ) : (
                    <DocumentIcon className="h-5 w-5" />
                  )}
                </a>
                <a
                  href={fileUrl(stored)}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-fg hover:text-accent hover:underline"
                  title={name}
                >
                  {name}
                </a>
                <IconButton label={`Delete ${name}`} size="sm" onClick={() => setToDelete(stored)} className="hover:text-danger">
                  <TrashIcon className="h-4 w-4" />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
        }}
        className={cn(
          'flex min-h-16 items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-center text-[13px] transition-colors',
          dragging ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-fg-subtle'
        )}
      >
        {uploading > 0 ? (
          <>
            <Spinner /> Uploading…
          </>
        ) : (
          <span>
            Drop files here or{' '}
            <button type="button" className="font-medium text-accent hover:underline" onClick={() => inputRef.current?.click()}>
              browse
            </button>
            <span className="block text-xs">Images, PDF, log, txt, csv, json, mp4, webm · up to 25 MB</span>
          </span>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete attachment?"
        message={
          <>
            <strong className="text-fg">{toDelete ? attachmentName(toDelete) : ''}</strong> will be permanently removed from this ticket.
          </>
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Panel>
  );
}
