'use client';

import { useMemo, useState } from 'react';
import { TrashIcon } from '@heroicons/react/20/solid';
import { ArrowRightIcon } from '@heroicons/react/16/solid';
import api from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Form';
import { Kbd, Panel } from '@/components/ui/Misc';
import { Tabs } from '@/components/ui/Tabs';
import { environmentMeta, priorityMeta, severityMeta, statusMeta, typeMeta } from '@/lib/tickets';
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useWorkspace } from '@/store/workspaceStore';
import type { ActivityLog, Ticket } from '@/types';
import { PriorityIcon } from '../badges';
import { Linkified, attempt } from './shared';

const DATE_FIELDS = ['reminderDate', 'deploymentDate', 'productionDate'];
const BOOL_FIELDS = ['testCompleted', 'regressionCompleted', 'smokeCompleted'];

/** One old/new value of an activity entry, rendered according to the field it belongs to. */
function LogValue({ field, value }: { field?: string; value?: string }) {
  if (!value) return <span className="italic text-fg-subtle">None</span>;
  switch (field) {
    case 'status': {
      const m = statusMeta(value);
      return (
        <Chip hue={m.hue} dot>
          {m.label}
        </Chip>
      );
    }
    case 'priority': {
      const m = priorityMeta(value);
      return (
        <span className="inline-flex items-center gap-1 font-medium text-fg">
          <PriorityIcon priority={value} />
          {m.label}
        </span>
      );
    }
    case 'type':
      return <Chip hue={typeMeta(value).hue}>{typeMeta(value).label}</Chip>;
    case 'severity':
      return <Chip hue={severityMeta(value).hue}>{severityMeta(value).label}</Chip>;
    case 'environment':
      return (
        <Chip hue={environmentMeta(value).hue} bordered>
          {environmentMeta(value).label}
        </Chip>
      );
    default:
      break;
  }
  if (field && DATE_FIELDS.includes(field) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return <span className="font-medium text-fg">{formatDate(new Date(`${value.slice(0, 10)}T12:00:00`))}</span>;
  }
  if (field && BOOL_FIELDS.includes(field)) {
    return <span className="font-medium text-fg">{value === 'true' ? 'Signed off' : 'Not signed off'}</span>;
  }
  return <span className="font-medium text-fg [overflow-wrap:anywhere]">{value}</span>;
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const hasValues = log.oldValue !== undefined || log.newValue !== undefined;
  return (
    <li className="relative pb-4 pl-5 last:pb-0 before:absolute before:bottom-[-6px] before:left-[3px] before:top-3.5 before:w-px before:bg-line last:before:hidden">
      <span className="absolute left-0 top-1.5 h-[7px] w-[7px] rounded-full bg-fg-subtle" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] text-fg-muted">
          <span className="font-medium text-fg">{log.author}</span> · {log.action}
        </p>
        {hasValues && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-fg-muted">
            <LogValue field={log.field} value={log.oldValue} />
            <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
            <LogValue field={log.field} value={log.newValue} />
          </p>
        )}
        <time dateTime={log.createdAt} title={formatDateTime(log.createdAt)} className="mt-0.5 block text-xs text-fg-subtle">
          {timeAgo(log.createdAt)}
        </time>
      </div>
    </li>
  );
}

export default function DiscussionSection({ ticket }: { ticket: Ticket }) {
  const ticketAction = useWorkspace((s) => s.ticketAction);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activity = useMemo(
    () => [...ticket.activityLogs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [ticket.activityLogs]
  );

  const post = async () => {
    const value = text.trim();
    if (!value || posting) return;
    setPosting(true);
    const ok = await attempt(() => ticketAction(api.post(`/tickets/${ticket._id}/comments`, { text: value })), 'Could not post the comment');
    setPosting(false);
    if (ok) setText('');
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await attempt(
      () => ticketAction(api.delete(`/tickets/${ticket._id}/comments/${toDelete}`)),
      'Could not delete the comment',
      'Comment deleted'
    );
    setDeleting(false);
    if (ok) setToDelete(null);
  };

  return (
    <Panel flush>
      <Tabs
        className="px-2"
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
        tabs={[
          { id: 'comments', label: 'Comments', count: ticket.comments.length },
          { id: 'activity', label: 'Activity', count: ticket.activityLogs.length },
        ]}
      />
      <div className="p-4">
        {tab === 'comments' ? (
          <div className="space-y-5">
            {ticket.comments.length > 0 && (
              <ul className="space-y-4">
                {ticket.comments.map((c) => (
                  <li key={c._id} className="group flex gap-3">
                    <Avatar name={c.author} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="font-medium text-fg">{c.author}</span>
                        <time dateTime={c.createdAt} title={formatDateTime(c.createdAt)} className="text-xs text-fg-subtle">
                          {timeAgo(c.createdAt)}
                        </time>
                        <IconButton
                          label="Delete comment"
                          size="sm"
                          onClick={() => setToDelete(c._id)}
                          className="-my-1 ml-auto hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                      <div className="prose-plain mt-0.5 text-sm leading-relaxed text-fg">
                        <Linkified text={c.text} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-3">
              <Avatar name={user?.name || 'You'} size="md" className="hidden sm:inline-flex" />
              <div className="min-w-0 flex-1 space-y-2">
                <Textarea
                  aria-label="Add a comment"
                  rows={3}
                  placeholder="Write a comment…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      post();
                    }
                  }}
                />
                <div className="flex items-center justify-end gap-2">
                  <span className="mr-auto hidden items-center gap-1 text-xs text-fg-subtle sm:inline-flex">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Enter</Kbd> to post
                  </span>
                  <Button variant="primary" size="sm" onClick={post} disabled={!text.trim()} loading={posting}>
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-fg-subtle">No activity recorded yet.</p>
        ) : (
          <ul>
            {activity.map((log) => (
              <ActivityItem key={log._id} log={log} />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete comment?"
        message="This comment will be permanently deleted."
        loading={deleting}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </Panel>
  );
}
