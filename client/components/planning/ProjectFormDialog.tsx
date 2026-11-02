'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { cn, errorMessage } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import type { Project } from '@/types';

/** Preset swatches for the colour picker (user-chosen project colours are stored as hex). */
export const PROJECT_COLORS = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#64748B',
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** project to edit; omit / null to create */
  project?: Project | null;
  onSaved?: (project: Project) => void;
}

export default function ProjectFormDialog({ open, onClose, project, onSaved }: Props) {
  const saveProject = useWorkspace((s) => s.saveProject);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // reset the form each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setName(project?.name || '');
    setClient(project?.client || '');
    setDescription(project?.description || '');
    setColor(project?.color || PROJECT_COLORS[0]);
    setError('');
    setSaving(false);
  }, [open, project]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveProject(
        { name: name.trim(), client: client.trim(), description: description.trim(), color },
        project?._id
      );
      toast.success(project ? 'Project updated' : 'Project created');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, project ? 'Could not update project' : 'Could not create project'));
      setSaving(false);
    }
  };

  const formId = 'project-form';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'New project'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>
            {project ? 'Save changes' : 'Create project'}
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
          placeholder="e.g. Customer portal"
          maxLength={120}
        />
        <Input label="Client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Optional" maxLength={120} />
        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
        />
        <Field label="Colour">
          <div className="flex flex-wrap items-center gap-2">
            {PROJECT_COLORS.map((c) => {
              const selected = c.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  aria-pressed={selected}
                  style={{ background: c }}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-panel transition-shadow',
                    selected ? 'ring-2 ring-fg' : 'hover:ring-2 hover:ring-line-strong'
                  )}
                >
                  {selected && <CheckIcon className="h-4 w-4" />}
                </button>
              );
            })}
            <label
              className="relative ml-1 flex h-7 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-2 text-xs text-fg-muted hover:bg-subtle"
              title="Pick a custom colour"
            >
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#3B82F6'}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Custom colour"
                className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="font-mono uppercase">{color}</span>
            </label>
          </div>
        </Field>
      </form>
    </Dialog>
  );
}
