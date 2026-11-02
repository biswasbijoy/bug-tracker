'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Input, Select } from '@/components/ui/Form';
import { Panel } from '@/components/ui/Misc';
import { ENVIRONMENTS, SEVERITIES, TYPES } from '@/lib/tickets';
import { cn, dateInputToIso, formatDateTime, toDateInput } from '@/lib/utils';
import { useLookups, useWorkspace } from '@/store/workspaceStore';
import type { Ticket, TicketEnvironment, TicketInput, TicketSeverity, TicketType } from '@/types';
import { DueBadge, LabelChip, PriorityBadge, StatusPill } from '../badges';
import { InlineEdit } from './InlineEdit';
import { attempt } from './shared';

function Row({ label, children, stacked }: { label: string; children: React.ReactNode; stacked?: boolean }) {
  return (
    <div className={cn('py-1.5', stacked ? 'space-y-1.5' : 'grid grid-cols-[92px_minmax(0,1fr)] items-start gap-x-2')}>
      <div className={cn('text-xs font-medium text-fg-muted', !stacked && 'pt-1.5')}>{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const dateInputClass = 'h-8 text-[13px]';

function LabelsEditor({ ticket, onChange }: { ticket: Ticket; onChange: (labels: string[]) => void }) {
  const allLabels = useWorkspace((s) => s.labels);
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const name = raw.trim().replace(/,$/, '').trim();
    setInput('');
    if (!name || ticket.labels.some((l) => l.toLowerCase() === name.toLowerCase())) return;
    onChange([...ticket.labels, name]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line-strong bg-panel px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
      {ticket.labels.map((l) => (
        <LabelChip key={l} name={l} onRemove={() => onChange(ticket.labels.filter((x) => x !== l))} />
      ))}
      <input
        value={input}
        list="detail-label-suggestions"
        aria-label="Add label"
        placeholder={ticket.labels.length ? '' : 'Add a label…'}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(',')) add(v);
          else setInput(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            add(input);
          } else if (e.key === 'Backspace' && !input && ticket.labels.length) {
            onChange(ticket.labels.slice(0, -1));
          }
        }}
        onBlur={() => input.trim() && add(input)}
        className="min-w-20 flex-1 bg-transparent py-0.5 text-[13px] outline-none placeholder:text-fg-subtle"
      />
      <datalist id="detail-label-suggestions">
        {allLabels
          .filter((l) => !ticket.labels.some((x) => x.toLowerCase() === l.name.toLowerCase()))
          .map((l) => (
            <option key={l._id} value={l.name} />
          ))}
      </datalist>
    </div>
  );
}

export default function PropertiesPanel({ ticket }: { ticket: Ticket }) {
  const updateTicket = useWorkspace((s) => s.updateTicket);
  const epics = useWorkspace((s) => s.epics);
  const sprints = useWorkspace((s) => s.sprints);
  const { projectById, epicById, sprintById } = useLookups();
  const [showMore, setShowMore] = useState(false);

  const project = projectById[ticket.projectId];

  const save = (patch: TicketInput) => attempt(() => updateTicket(ticket._id, patch), 'Could not update the ticket');

  const epicOptions = useMemo(() => {
    const list = epics.filter((e) => e.projectId === ticket.projectId).map((e) => ({ value: e._id, label: e.name }));
    if (ticket.epicId && !list.some((o) => o.value === ticket.epicId)) {
      list.push({ value: ticket.epicId, label: epicById[ticket.epicId]?.name || 'Unknown epic' });
    }
    return [{ value: '', label: 'None' }, ...list];
  }, [epics, ticket.projectId, ticket.epicId, epicById]);

  const sprintOptions = useMemo(() => {
    const list = sprints.filter((s) => s.projectId === ticket.projectId).map((s) => ({ value: s._id, label: s.name }));
    if (ticket.sprintId && !list.some((o) => o.value === ticket.sprintId)) {
      list.push({ value: ticket.sprintId, label: sprintById[ticket.sprintId]?.name || 'Unknown sprint' });
    }
    return [{ value: '', label: 'None' }, ...list];
  }, [sprints, ticket.projectId, ticket.sprintId, sprintById]);

  return (
    <Panel title="Properties">
      <div className="-my-1.5 divide-y divide-line">
        <div>
          <Row label="Status">
            <StatusPill status={ticket.status} onChange={(status) => save({ status })} />
          </Row>
          <Row label="Priority">
            <PriorityBadge priority={ticket.priority} onChange={(priority) => save({ priority })} />
          </Row>
          <Row label="Assignee">
            <InlineEdit
              label="Assignee"
              value={ticket.assignedTo || ''}
              placeholder="Unassigned"
              allowEmpty
              className="text-[13px]"
              onSave={(v) => updateTicket(ticket._id, { assignedTo: v })}
            />
          </Row>
          <Row label="Due date">
            <Input
              type="date"
              aria-label="Due date"
              className={dateInputClass}
              value={toDateInput(ticket.reminderDate)}
              onChange={(e) => save({ reminderDate: dateInputToIso(e.target.value) })}
            />
            {ticket.reminderDate && <DueBadge ticket={ticket} className="mt-1" />}
          </Row>
        </div>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="flex w-full items-center justify-between py-2 text-xs font-medium text-fg-muted hover:text-fg lg:hidden"
        >
          {showMore ? 'Fewer properties' : 'More properties'}
          <ChevronDownIcon className={cn('h-4 w-4 transition-transform', showMore && 'rotate-180')} />
        </button>

        <div className={cn(showMore ? 'block' : 'hidden', 'lg:block')}>
          <Row label="Project">
            {project ? (
              <Link href={`/projects/${project._id}`} className="inline-flex max-w-full items-center gap-2 pt-1 text-[13px] text-fg hover:text-accent hover:underline">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: project.color }} />
                <span className="truncate">{project.name}</span>
              </Link>
            ) : (
              <span className="text-[13px] text-fg-subtle">Unknown project</span>
            )}
          </Row>
          <Row label="Type">
            <Select aria-label="Type" size="sm" value={ticket.type} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} onChange={(e) => save({ type: e.target.value as TicketType })} />
          </Row>
          <Row label="Severity">
            <Select aria-label="Severity" size="sm" value={ticket.severity} options={SEVERITIES.map((t) => ({ value: t.value, label: t.label }))} onChange={(e) => save({ severity: e.target.value as TicketSeverity })} />
          </Row>
          <Row label="Environment">
            <Select aria-label="Environment" size="sm" value={ticket.environment} options={ENVIRONMENTS.map((t) => ({ value: t.value, label: t.label }))} onChange={(e) => save({ environment: e.target.value as TicketEnvironment })} />
          </Row>
          <Row label="Epic">
            <Select aria-label="Epic" size="sm" value={ticket.epicId || ''} options={epicOptions} onChange={(e) => save({ epicId: e.target.value })} />
          </Row>
          <Row label="Sprint">
            <Select aria-label="Sprint" size="sm" value={ticket.sprintId || ''} options={sprintOptions} onChange={(e) => save({ sprintId: e.target.value })} />
          </Row>
          <Row label="Reporter">
            <InlineEdit
              label="Reporter"
              value={ticket.reporter || ''}
              placeholder="Unknown"
              allowEmpty
              className="text-[13px]"
              onSave={(v) => updateTicket(ticket._id, { reporter: v })}
            />
          </Row>
          <Row label="Labels" stacked>
            <LabelsEditor ticket={ticket} onChange={(labels) => save({ labels })} />
          </Row>
        </div>

        <div className={cn(showMore ? 'block' : 'hidden', 'lg:block')}>
          <div className="pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Release</div>
          <Row label="Deployment">
            <Input
              type="date"
              aria-label="Deployment date"
              className={dateInputClass}
              value={toDateInput(ticket.deploymentDate)}
              onChange={(e) => save({ deploymentDate: dateInputToIso(e.target.value) })}
            />
          </Row>
          <Row label="Version">
            <InlineEdit
              label="Release version"
              value={ticket.releaseVersion || ''}
              placeholder="Not set"
              allowEmpty
              className="font-mono text-[13px]"
              onSave={(v) => updateTicket(ticket._id, { releaseVersion: v })}
            />
          </Row>
          <Row label="Production">
            <Input
              type="date"
              aria-label="Production date"
              className={dateInputClass}
              value={toDateInput(ticket.productionDate)}
              onChange={(e) => save({ productionDate: dateInputToIso(e.target.value) })}
            />
          </Row>
        </div>

        <dl className="space-y-1 pt-3 text-xs text-fg-subtle">
          <div className="flex justify-between gap-3">
            <dt>Created</dt>
            <dd className="text-right text-fg-muted">{formatDateTime(ticket.createdAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Updated</dt>
            <dd className="text-right text-fg-muted">{formatDateTime(ticket.updatedAt)}</dd>
          </div>
          {ticket.closedDate && (
            <div className="flex justify-between gap-3">
              <dt>Closed</dt>
              <dd className="text-right text-fg-muted">{formatDateTime(ticket.closedDate)}</dd>
            </div>
          )}
        </dl>
      </div>
    </Panel>
  );
}
