'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { LabelChip } from './badges';
import { ENVIRONMENTS, PRIORITIES, SEVERITIES, STAGES, TYPES, statusesInStage } from '@/lib/tickets';
import { dateInputToIso, errorMessage, toDateInput } from '@/lib/utils';
import { useWorkspace } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useUi } from '@/store/uiStore';
import type { TicketEnvironment, TicketInput, TicketPriority, TicketSeverity, TicketStatus, TicketType } from '@/types';

interface FormState {
  title: string;
  description: string;
  projectId: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  environment: TicketEnvironment;
  epicId: string;
  sprintId: string;
  assignedTo: string;
  reporter: string;
  reminderDate: string;
  jiraUrl: string;
  labels: string[];
  parentTicketId: string;
}

const LAST_PROJECT_KEY = 'last-project';

function readLastProject(): string {
  try {
    return localStorage.getItem(LAST_PROJECT_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * The one ticket form (create + edit). Rendered once by AppShell and driven by the ui store:
 * `useUi().openNewTicket({ projectId, epicId, … })` or `useUi().openEditTicket(ticket)`.
 */
export default function TicketFormDialog() {
  const { open, ticket, defaults } = useUi((s) => s.ticketDialog);
  const close = useUi((s) => s.closeTicketDialog);
  const user = useAuthStore((s) => s.user);
  const { projects, epics, sprints, createTicket, updateTicket } = useWorkspace();
  const allLabels = useWorkspace((s) => s.labels);

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active' || p._id === ticket?.projectId), [projects, ticket]);

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<{ title?: string; projectId?: string }>({});
  const [saving, setSaving] = useState(false);
  const [labelInput, setLabelInput] = useState('');

  // (re)initialise whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setLabelInput('');
    if (ticket) {
      setForm({
        title: ticket.title,
        description: ticket.description || '',
        projectId: ticket.projectId,
        type: ticket.type,
        status: ticket.status,
        priority: ticket.priority,
        severity: ticket.severity,
        environment: ticket.environment,
        epicId: ticket.epicId || '',
        sprintId: ticket.sprintId || '',
        assignedTo: ticket.assignedTo || '',
        reporter: ticket.reporter || '',
        reminderDate: toDateInput(ticket.reminderDate),
        jiraUrl: ticket.jiraUrl || '',
        labels: ticket.labels,
        parentTicketId: ticket.parentTicketId || '',
      });
    } else {
      const last = readLastProject();
      const fallback =
        defaults.projectId ||
        (activeProjects.some((p) => p._id === last) ? last : '') ||
        (activeProjects.length === 1 ? activeProjects[0]._id : '');
      setForm({
        title: defaults.title || '',
        description: defaults.description || '',
        projectId: fallback,
        type: defaults.type || 'task',
        status: defaults.status || 'open',
        priority: defaults.priority || 'medium',
        severity: defaults.severity || 'major',
        environment: defaults.environment || 'qa',
        epicId: defaults.epicId || '',
        sprintId: defaults.sprintId || '',
        assignedTo: defaults.assignedTo || '',
        reporter: defaults.reporter ?? user?.name ?? '',
        reminderDate: toDateInput(defaults.reminderDate),
        jiraUrl: '',
        labels: defaults.labels || [],
        parentTicketId: defaults.parentTicketId || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?._id]);

  if (!form) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const projectEpics = epics.filter((e) => e.projectId === form.projectId);
  const projectSprints = sprints.filter((s) => s.projectId === form.projectId);

  const addLabel = (raw: string) => {
    const name = raw.trim().replace(/,$/, '').trim();
    if (!name || form.labels.some((l) => l.toLowerCase() === name.toLowerCase())) return;
    set('labels', [...form.labels, name]);
    setLabelInput('');
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = 'Give the ticket a title';
    if (!form.projectId) next.projectId = 'Choose a project';
    setErrors(next);
    if (Object.keys(next).length) return;

    const input: TicketInput = {
      title: form.title.trim(),
      description: form.description,
      projectId: form.projectId,
      type: form.type,
      status: form.status,
      priority: form.priority,
      severity: form.severity,
      environment: form.environment,
      epicId: form.epicId,
      sprintId: form.sprintId,
      assignedTo: form.assignedTo.trim(),
      reporter: form.reporter.trim(),
      reminderDate: dateInputToIso(form.reminderDate),
      jiraUrl: form.jiraUrl.trim(),
      labels: form.labels,
    };
    if (form.parentTicketId) input.parentTicketId = form.parentTicketId;

    setSaving(true);
    try {
      if (ticket) {
        await updateTicket(ticket._id, input);
        toast.success('Ticket updated');
      } else {
        const created = await createTicket(input);
        try {
          localStorage.setItem(LAST_PROJECT_KEY, form.projectId);
        } catch {}
        toast.success(
          <span>
            <Link href={`/tickets/${created._id}`} className="font-mono font-semibold text-accent hover:underline">
              {created.ticketNo}
            </Link>{' '}
            created
          </span>
        );
      }
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the ticket'));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = STAGES.flatMap((stage) => statusesInStage(stage.id).map((s) => ({ value: s.value, label: `${stage.label} · ${s.label}` })));
  if (ticket?.status === 'to-do') statusOptions.unshift({ value: 'to-do', label: 'To do (legacy)' });

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title={ticket ? `Edit ${ticket.ticketNo}` : form.parentTicketId ? 'New sub-task' : 'New ticket'}
      footer={
        <>
          <span className="mr-auto hidden text-xs text-fg-subtle sm:inline">Ctrl + Enter to save</span>
          <Button variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="ticket-form" loading={saving}>
            {ticket ? 'Save changes' : 'Create ticket'}
          </Button>
        </>
      }
    >
      <form
        id="ticket-form"
        onSubmit={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
        }}
        className="space-y-4"
        noValidate
      >
        <Input
          label="Title"
          required
          autoFocus
          placeholder="What needs to be done?"
          value={form.title}
          error={errors.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <Textarea
          label="Description"
          placeholder="Steps to reproduce, expected vs actual result, links…"
          rows={4}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Project"
            required
            value={form.projectId}
            error={errors.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value, epicId: '', sprintId: '' })}
            options={[{ value: '', label: 'Select a project…' }, ...activeProjects.map((p) => ({ value: p._id, label: p.name }))]}
          />
          <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value as TicketType)} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as TicketStatus)} options={statusOptions} />
          <Select label="Priority" value={form.priority} onChange={(e) => set('priority', e.target.value as TicketPriority)} options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
          <Select label="Severity" value={form.severity} onChange={(e) => set('severity', e.target.value as TicketSeverity)} options={SEVERITIES.map((p) => ({ value: p.value, label: p.label }))} />
          <Select label="Environment" value={form.environment} onChange={(e) => set('environment', e.target.value as TicketEnvironment)} options={ENVIRONMENTS.map((p) => ({ value: p.value, label: p.label }))} />
          <Select
            label="Epic"
            value={form.epicId}
            disabled={!form.projectId}
            onChange={(e) => set('epicId', e.target.value)}
            options={[{ value: '', label: 'No epic' }, ...projectEpics.map((x) => ({ value: x._id, label: x.name }))]}
          />
          <Select
            label="Sprint"
            value={form.sprintId}
            disabled={!form.projectId}
            onChange={(e) => set('sprintId', e.target.value)}
            options={[{ value: '', label: 'No sprint' }, ...projectSprints.map((x) => ({ value: x._id, label: x.name }))]}
          />
          <Input label="Assigned to" placeholder="Name" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} />
          <Input label="Reporter" placeholder="Name" value={form.reporter} onChange={(e) => set('reporter', e.target.value)} />
          <Input label="Due date" type="date" value={form.reminderDate} onChange={(e) => set('reminderDate', e.target.value)} />
          <Input label="Link (Jira / doc)" type="url" placeholder="https://…" value={form.jiraUrl} onChange={(e) => set('jiraUrl', e.target.value)} />
        </div>

        <Field label="Labels" hint="Press Enter or comma to add. Manage colours in Settings → Labels.">
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line-strong bg-panel px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
            {form.labels.map((l) => (
              <LabelChip key={l} name={l} onRemove={() => set('labels', form.labels.filter((x) => x !== l))} />
            ))}
            <input
              value={labelInput}
              list="label-suggestions"
              onChange={(e) => {
                const v = e.target.value;
                if (v.endsWith(',')) addLabel(v);
                else setLabelInput(v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && labelInput.trim()) {
                  e.preventDefault();
                  e.stopPropagation();
                  addLabel(labelInput);
                } else if (e.key === 'Backspace' && !labelInput && form.labels.length) {
                  set('labels', form.labels.slice(0, -1));
                }
              }}
              onBlur={() => labelInput.trim() && addLabel(labelInput)}
              placeholder={form.labels.length ? '' : 'Add a label…'}
              className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-fg-subtle"
              aria-label="Add label"
            />
            <datalist id="label-suggestions">
              {allLabels.filter((l) => !form.labels.includes(l.name)).map((l) => (
                <option key={l._id} value={l.name} />
              ))}
            </datalist>
          </div>
        </Field>
      </form>
    </Dialog>
  );
}
