'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckIcon, PencilSquareIcon, PlusIcon, TagIcon, TrashIcon } from '@heroicons/react/20/solid';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Form';
import { EmptyState, Panel } from '@/components/ui/Misc';
import { LabelChip } from '@/components/tickets/badges';
import { cn, errorMessage, pluralize } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Label } from '@/types';

/** User-chosen label colours (stored as hex on the label). */
export const LABEL_COLORS = [
  '#2563eb', '#7c3aed', '#0f766e', '#15803d', '#a16207',
  '#c2570c', '#c62828', '#be185d', '#62636d', '#0891b2',
];

const sameColor = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function Swatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const colors = LABEL_COLORS.some((c) => sameColor(c, value)) ? LABEL_COLORS : [value, ...LABEL_COLORS];
  return (
    <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
      {colors.map((c) => {
        const active = sameColor(c, value);
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={c}
            onClick={() => onChange(c)}
            style={{ background: c }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform hover:scale-110',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel',
              active && 'ring-2 ring-fg ring-offset-2 ring-offset-panel'
            )}
          >
            {active && <CheckIcon className="h-4 w-4" />}
          </button>
        );
      })}
    </div>
  );
}

interface LabelDialogProps {
  /** label being edited; `null` creates a new one */
  label: Label | null;
  open: boolean;
  labels: Label[];
  onClose: () => void;
}

function LabelDialog({ label, open, labels, onClose }: LabelDialogProps) {
  // remount the form each time the dialog opens
  return open ? <LabelForm key={label?._id || 'new'} label={label} labels={labels} onClose={onClose} /> : null;
}

function LabelForm({ label, labels, onClose }: Omit<LabelDialogProps, 'open'>) {
  const saveLabel = useWorkspace((s) => s.saveLabel);
  const [name, setName] = useState(label?.name || '');
  const [color, setColor] = useState(label?.color || LABEL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const duplicate = labels.some((l) => l._id !== label?._id && l.name.toLowerCase() === trimmed.toLowerCase());
  const error = duplicate ? `A label named “${trimmed}” already exists` : undefined;
  const unchanged = !!label && trimmed === label.name && sameColor(color, label.color);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || duplicate || unchanged) return;
    setSaving(true);
    try {
      await saveLabel({ name: trimmed, color }, label?._id);
      // tickets reference labels by name: keep them pointing at the renamed label
      if (label && label.name !== trimmed) {
        const { tickets, updateTicket } = useWorkspace.getState();
        const old = label.name.toLowerCase();
        const affected = tickets.filter((t) => t.labels.some((l) => l.toLowerCase() === old));
        await Promise.allSettled(
          affected.map((t) =>
            updateTicket(t._id, { labels: t.labels.map((l) => (l.toLowerCase() === old ? trimmed : l)) })
          )
        );
      }
      toast.success(label ? 'Label updated' : 'Label created');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the label'));
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={label ? 'Edit label' : 'New label'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="label-form" variant="primary" loading={saving} disabled={!trimmed || duplicate || unchanged}>
            {label ? 'Save' : 'Create label'}
          </Button>
        </>
      }
    >
      <form id="label-form" onSubmit={submit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="e.g. regression"
          required
          error={error}
          hint={label ? 'Tickets using this label are renamed too.' : undefined}
        />
        <div>
          <div className="mb-1.5 text-xs font-medium text-fg-muted">Colour</div>
          <Swatches value={color} onChange={setColor} />
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium text-fg-muted">Preview</div>
          <PreviewChip name={trimmed || 'label'} color={color} />
        </div>
      </form>
    </Dialog>
  );
}

/** Chip preview with a not-yet-saved colour (LabelChip looks the colour up by saved name). */
function PreviewChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      style={{ ['--hue' as string]: color }}
      className="chip chip-border inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium leading-4"
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--hue)' }} />
      {name}
    </span>
  );
}

export default function LabelsSettings() {
  const labels = useWorkspace((s) => s.labels);
  const tickets = useWorkspace((s) => s.tickets);
  const removeLabel = useWorkspace((s) => s.removeLabel);

  const [dialog, setDialog] = useState<{ open: boolean; label: Label | null }>({ open: false, label: null });
  const [toDelete, setToDelete] = useState<Label | null>(null);
  const [deleting, setDeleting] = useState(false);

  const usage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tickets) {
      for (const name of Array.from(new Set(t.labels.map((l) => l.toLowerCase())))) map[name] = (map[name] || 0) + 1;
    }
    return map;
  }, [tickets]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await removeLabel(toDelete._id);
      toast.success('Label deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the label'));
    } finally {
      setDeleting(false);
    }
  };

  const deletedCount = toDelete ? usage[toDelete.name.toLowerCase()] || 0 : 0;

  return (
    <>
      <Panel
        title={`Labels${labels.length ? ` · ${labels.length}` : ''}`}
        flush
        actions={
          <Button size="sm" variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setDialog({ open: true, label: null })}>
            New label
          </Button>
        }
      >
        {labels.length === 0 ? (
          <EmptyState
            icon={<TagIcon />}
            title="No labels yet"
            description="Labels give tickets a colour-coded tag such as “regression” or “customer-reported”. Typing a new label on a ticket works too."
            action={
              <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setDialog({ open: true, label: null })}>
                Create a label
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {labels.map((l) => {
              const count = usage[l.name.toLowerCase()] || 0;
              return (
                <li key={l._id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: l.color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <LabelChip name={l.name} />
                  </div>
                  <span className="shrink-0 text-xs text-fg-subtle">{pluralize(count, 'ticket')}</span>
                  <div className="flex shrink-0 items-center">
                    <IconButton label={`Edit label ${l.name}`} onClick={() => setDialog({ open: true, label: l })}>
                      <PencilSquareIcon className="h-4 w-4" />
                    </IconButton>
                    <IconButton label={`Delete label ${l.name}`} className="hover:text-danger" onClick={() => setToDelete(l)}>
                      <TrashIcon className="h-4 w-4" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <LabelDialog
        open={dialog.open}
        label={dialog.label}
        labels={labels}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete label?"
        message={
          <>
            The label <span className="font-medium text-fg">{toDelete?.name}</span> will be removed from your label list.
            {deletedCount > 0
              ? ` ${pluralize(deletedCount, 'ticket')} will keep the text label, shown without a colour.`
              : ' No tickets use it.'}
          </>
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
