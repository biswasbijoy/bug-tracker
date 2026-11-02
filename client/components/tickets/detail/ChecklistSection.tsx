'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import api from '@/services/api';
import { Button, IconButton } from '@/components/ui/Button';
import { Checkbox, Input } from '@/components/ui/Form';
import { Panel, ProgressBar } from '@/components/ui/Misc';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Ticket } from '@/types';
import { attempt, patchTicketLocal } from './shared';

export default function ChecklistSection({ ticket }: { ticket: Ticket }) {
  const ticketAction = useWorkspace((s) => s.ticketAction);
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  const total = ticket.checklist.length;
  const done = ticket.checklist.filter((c) => c.completed).length;

  const add = async () => {
    const value = text.trim();
    if (!value || adding) return;
    setAdding(true);
    const ok = await attempt(() => ticketAction(api.post(`/tickets/${ticket._id}/checklist`, { text: value })), 'Could not add the item');
    setAdding(false);
    if (ok) setText('');
  };

  const toggle = async (itemId: string, completed: boolean) => {
    const revert = patchTicketLocal(ticket._id, (t) => ({
      ...t,
      checklist: t.checklist.map((c) => (c._id === itemId ? { ...c, completed } : c)),
    }));
    const ok = await attempt(
      () => ticketAction(api.patch(`/tickets/${ticket._id}/checklist/${itemId}`, { completed })),
      'Could not update the item'
    );
    if (!ok) revert();
  };

  const remove = async (itemId: string) => {
    const revert = patchTicketLocal(ticket._id, (t) => ({ ...t, checklist: t.checklist.filter((c) => c._id !== itemId) }));
    const ok = await attempt(() => ticketAction(api.delete(`/tickets/${ticket._id}/checklist/${itemId}`)), 'Could not delete the item');
    if (!ok) revert();
  };

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          Checklist
          {total > 0 && (
            <span className="text-xs font-normal text-fg-subtle">
              {done}/{total}
            </span>
          )}
        </span>
      }
    >
      {total > 0 && <ProgressBar value={(done / total) * 100} label="Checklist progress" className="mb-3" />}
      {total > 0 && (
        <ul className="mb-3 space-y-0.5">
          {ticket.checklist.map((item) => (
            <li key={item._id} className="group flex items-start gap-2 rounded-md px-1.5 py-1 hover:bg-subtle">
              <Checkbox
                checked={item.completed}
                onChange={(e) => toggle(item._id, e.target.checked)}
                aria-label={item.text}
                className="mt-0.5"
              />
              <span className={cn('min-w-0 flex-1 text-sm [overflow-wrap:anywhere]', item.completed ? 'text-fg-subtle line-through' : 'text-fg')}>
                {item.text}
              </span>
              <IconButton
                label="Delete item"
                size="sm"
                onClick={() => remove(item._id)}
                className="-my-0.5 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                <TrashIcon className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          aria-label="New checklist item"
          placeholder="Add a checklist item…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          wrapperClassName="min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" icon={<PlusIcon className="h-4 w-4" />} disabled={!text.trim()} loading={adding}>
          Add
        </Button>
      </form>
    </Panel>
  );
}
