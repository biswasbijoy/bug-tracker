'use client';

import { Checkbox } from '@/components/ui/Form';
import { Panel, ProgressBar } from '@/components/ui/Misc';
import { useWorkspace } from '@/store/workspaceStore';
import type { Ticket, TicketInput } from '@/types';
import { attempt } from './shared';

const ITEMS: { key: 'testCompleted' | 'regressionCompleted' | 'smokeCompleted'; label: string }[] = [
  { key: 'testCompleted', label: 'Test completed' },
  { key: 'regressionCompleted', label: 'Regression completed' },
  { key: 'smokeCompleted', label: 'Smoke completed' },
];

export default function QaSection({ ticket }: { ticket: Ticket }) {
  const updateTicket = useWorkspace((s) => s.updateTicket);
  const signed = ITEMS.filter((i) => ticket[i.key]).length;

  const set = (patch: TicketInput) => attempt(() => updateTicket(ticket._id, patch), 'Could not update the sign-off');

  return (
    <Panel
      title="QA sign-off"
      actions={
        <span className="text-xs font-normal text-fg-subtle">
          {signed} of {ITEMS.length} signed off
        </span>
      }
    >
      <ProgressBar
        value={(signed / ITEMS.length) * 100}
        label="QA sign-off progress"
        hue={signed === ITEMS.length ? 'green' : 'violet'}
        className="mb-3"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
        {ITEMS.map((i) => (
          <Checkbox key={i.key} label={i.label} checked={!!ticket[i.key]} onChange={(e) => set({ [i.key]: e.target.checked })} />
        ))}
      </div>
    </Panel>
  );
}
