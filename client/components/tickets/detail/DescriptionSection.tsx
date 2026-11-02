'use client';

import { useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Form';
import { Kbd, Panel } from '@/components/ui/Misc';
import { useWorkspace } from '@/store/workspaceStore';
import type { Ticket } from '@/types';
import { Linkified, attempt } from './shared';

export default function DescriptionSection({ ticket }: { ticket: Ticket }) {
  const updateTicket = useWorkspace((s) => s.updateTicket);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const start = () => {
    setDraft(ticket.description || '');
    setEditing(true);
  };

  const save = async () => {
    if (draft === (ticket.description || '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await attempt(() => updateTicket(ticket._id, { description: draft }), 'Could not save the description', 'Description saved');
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <Panel
      title="Description"
      actions={
        !editing && (
          <Button size="sm" variant="ghost" icon={<PencilSquareIcon className="h-4 w-4" />} onClick={start}>
            Edit
          </Button>
        )
      }
    >
      {editing ? (
        <div className="space-y-3">
          <Textarea
            aria-label="Description"
            autoFocus
            rows={9}
            value={draft}
            placeholder="Steps to reproduce, expected vs actual result, links…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                save();
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                setEditing(false);
              }
            }}
          />
          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto hidden items-center gap-1 text-xs text-fg-subtle sm:inline-flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>Enter</Kbd> to save
            </span>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={save} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      ) : ticket.description?.trim() ? (
        <div className="prose-plain text-sm leading-relaxed text-fg">
          <Linkified text={ticket.description} />
        </div>
      ) : (
        <button type="button" onClick={start} className="w-full rounded-md py-2 text-left text-sm text-fg-subtle hover:text-fg-muted">
          Add a description…
        </button>
      )}
    </Panel>
  );
}
