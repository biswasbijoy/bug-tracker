'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Ticket, Project, Epic, Sprint, TicketType, TicketPriority, TicketSeverity, TicketEnvironment } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import { cn, getStatusColor, getPriorityColor, getStatusLabel } from '@/lib/utils';
import { statusColors } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const statuses = ['open', 'backlog', 'ready', 'in-progress', 'blocked', 'code-review', 'ready-for-qa', 'qa-in-progress', 'qa-failed', 'ready-for-release', 'released', 'done', 'closed', 'reopened', 'cancelled', 'stage'];
const priorities = ['highest', 'high', 'medium', 'low', 'lowest'];
const severities = ['critical', 'major', 'minor', 'trivial'];
const environments = ['local', 'dev', 'qa', 'staging', 'uat', 'production'];
const types = ['story', 'task', 'bug', 'improvement', 'spike', 'technical-task', 'research', 'production-issue'];

const priorityVariant: Record<string, 'default' | 'danger' | 'warning' | 'info' | 'primary'> = {
  highest: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'primary',
  lowest: 'default',
};

const defaultForm = {
  title: '', description: '', type: 'task' as TicketType, projectId: '', epicId: '', sprintId: '',
  assignedTo: '', reporter: '', priority: 'medium' as TicketPriority, severity: 'major' as TicketSeverity,
  environment: 'qa' as TicketEnvironment, jiraUrl: '', labels: [] as string[],
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newChecklist, setNewChecklist] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    if (filterProject) params.set('projectId', filterProject);
    if (filterPriority) params.set('priority', filterPriority);

    const [ticketsRes, projectsRes] = await Promise.all([
      api.get(`/tickets?${params}`),
      api.get('/projects'),
    ]);
    setTickets(ticketsRes.data);
    setProjects(projectsRes.data);
    setLoading(false);
  }, [search, filterStatus, filterProject, filterPriority]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setEditingTicket(null);
    setForm(defaultForm);
    const [epicsRes, sprintsRes] = await Promise.all([api.get('/epics'), api.get('/sprints')]);
    setEpics(epicsRes.data);
    setSprints(sprintsRes.data);
    setShowForm(true);
  };

  const openEdit = async (ticket: Ticket) => {
    setEditingTicket(ticket);
    const [epicsRes, sprintsRes] = await Promise.all([api.get('/epics'), api.get('/sprints')]);
    setEpics(epicsRes.data);
    setSprints(sprintsRes.data);
    setForm({
      title: ticket.title,
      description: ticket.description || '',
      type: ticket.type,
      projectId: typeof ticket.projectId === 'string' ? ticket.projectId : ticket.projectId._id,
      epicId: typeof ticket.epicId === 'string' ? ticket.epicId : ticket.epicId?._id || '',
      sprintId: typeof ticket.sprintId === 'string' ? ticket.sprintId : ticket.sprintId?._id || '',
      assignedTo: ticket.assignedTo || '',
      reporter: ticket.reporter || '',
      priority: ticket.priority,
      severity: ticket.severity,
      environment: ticket.environment,
      jiraUrl: ticket.jiraUrl || '',
      labels: ticket.labels,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, epicId: form.epicId || undefined, sprintId: form.sprintId || undefined };
    try {
      if (editingTicket) {
        await api.put(`/tickets/${editingTicket._id}`, payload);
        toast.success('Ticket updated');
      } else {
        await api.post('/tickets', payload);
        toast.success('Ticket created');
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save ticket');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await api.delete(`/tickets/${deleteId}`);
    toast.success('Ticket deleted');
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await api.put(`/tickets/${id}`, { status: newStatus });
    toast.success('Status updated');
    load();
    if (viewTicket?._id === id) {
      const { data } = await api.get(`/tickets/${id}`);
      setViewTicket(data);
    }
  };

  const toggleFavorite = async (id: string) => {
    await api.patch(`/tickets/${id}/favorite`);
    load();
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !viewTicket) return;
    await api.post(`/tickets/${viewTicket._id}/comments`, { text: commentText });
    setCommentText('');
    const { data } = await api.get(`/tickets/${viewTicket._id}`);
    setViewTicket(data);
  };

  const handleAddChecklist = async () => {
    if (!newChecklist.trim() || !viewTicket) return;
    await api.post(`/tickets/${viewTicket._id}/checklist`, { text: newChecklist });
    setNewChecklist('');
    const { data } = await api.get(`/tickets/${viewTicket._id}`);
    setViewTicket(data);
  };

  const toggleChecklist = async (itemId: string) => {
    if (!viewTicket) return;
    await api.patch(`/tickets/${viewTicket._id}/checklist/${itemId}`);
    const { data } = await api.get(`/tickets/${viewTicket._id}`);
    setViewTicket(data);
  };

  const addLabel = () => {
    if (labelInput.trim() && !form.labels.includes(labelInput.trim())) {
      setForm({ ...form, labels: [...form.labels, labelInput.trim()] });
      setLabelInput('');
    }
  };

  const getProjectName = (id: any) => {
    if (typeof id === 'object' && id?.name) return id.name;
    return projects.find(p => p._id === id)?.name || 'Unknown';
  };

  const statusOptions = [{ value: '', label: 'All Status' }, ...statuses.map(s => ({ value: s, label: getStatusLabel(s) }))];
  const projectOptions = [{ value: '', label: 'All Projects' }, ...projects.map(p => ({ value: p._id, label: p.name }))];
  const priorityOptions = [{ value: '', label: 'All Priorities' }, ...priorities.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Tickets</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage all your tickets</p>
        </div>
        <Button onClick={openCreate} icon={<span>+</span>}>New Ticket</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] pl-9 pr-3 py-2 text-sm focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none transition-all"
          />
        </div>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOptions} className="w-auto min-w-[150px]" />
        <Select value={filterProject} onChange={e => setFilterProject(e.target.value)} options={projectOptions} className="w-auto min-w-[150px]" />
        <Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} options={priorityOptions} className="w-auto min-w-[150px]" />
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingTicket ? 'Edit Ticket' : 'New Ticket'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" form="ticket-form">{editingTicket ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form id="ticket-form" onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Title"
            placeholder="Ticket title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Describe the ticket..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Type"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as any })}
              options={types.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ') }))}
            />
            <Select
              label="Project"
              value={form.projectId}
              onChange={e => setForm({ ...form, projectId: e.target.value })}
              options={[{ value: '', label: 'Select project' }, ...projects.map(p => ({ value: p._id, label: p.name }))]}
              required
            />
            <Select
              label="Epic"
              value={form.epicId}
              onChange={e => setForm({ ...form, epicId: e.target.value })}
              options={[{ value: '', label: 'None' }, ...epics.filter(e => e.projectId === form.projectId).map(e => ({ value: e._id, label: e.name }))]}
            />
            <Select
              label="Sprint"
              value={form.sprintId}
              onChange={e => setForm({ ...form, sprintId: e.target.value })}
              options={[{ value: '', label: 'None' }, ...sprints.filter(s => s.projectId === form.projectId).map(s => ({ value: s._id, label: s.name }))]}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value as any })}
              options={priorities.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
            />
            <Select
              label="Severity"
              value={form.severity}
              onChange={e => setForm({ ...form, severity: e.target.value as any })}
              options={severities.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
            <Select
              label="Environment"
              value={form.environment}
              onChange={e => setForm({ ...form, environment: e.target.value as any })}
              options={environments.map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
            />
            <Input
              label="Jira URL"
              placeholder="https://..."
              value={form.jiraUrl}
              onChange={e => setForm({ ...form, jiraUrl: e.target.value })}
            />
            <Input
              label="Assigned To"
              placeholder="Assignee name"
              value={form.assignedTo}
              onChange={e => setForm({ ...form, assignedTo: e.target.value })}
            />
            <Input
              label="Reporter"
              placeholder="Reporter name"
              value={form.reporter}
              onChange={e => setForm({ ...form, reporter: e.target.value })}
            />
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add label"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addLabel}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.labels.map((l, i) => (
                <Badge key={i} variant="primary">
                  {l}
                  <button type="button" onClick={() => setForm({ ...form, labels: form.labels.filter((_, j) => j !== i) })} className="ml-1 hover:text-[var(--color-danger)] transition-colors">
                    &times;
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets found"
          description="Create your first ticket to get started."
          action={{ label: 'New Ticket', onClick: openCreate }}
        />
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setViewTicket(t)}
                className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 cursor-pointer active:opacity-80 transition-opacity"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-[var(--color-text-muted)]">{t.ticketNo}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(t._id); }}
                  >
                    {t.isFavorite ? '⭐' : '☆'}
                  </Button>
                </div>
                <p className="text-sm font-semibold mb-2">
                  <span className="inline-flex px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[t.status]?.bg, color: statusColors[t.status]?.text }}>{t.title}</span>
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">{getProjectName(t.projectId)}</p>
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <select
                    value={t.status}
                    onChange={e => { e.stopPropagation(); handleStatusChange(t._id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    style={{ backgroundColor: statusColors[t.status]?.bg || '#F3F4F6', color: statusColors[t.status]?.text || '#6B7280' }}
                    className="text-[11px] font-medium px-2 py-1 rounded-full border border-[var(--color-border)] cursor-pointer hover:opacity-80 focus:outline-none transition-all"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                  <Badge variant={priorityVariant[t.priority] || 'default'}>{t.priority}</Badge>
                  <Badge variant="default">{t.type}</Badge>
                </div>
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--color-border-light)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-danger)]"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(t._id); }}
                  >
                    Del
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-border-light)]">
                  <th className="text-left py-2 px-2 text-[var(--color-text-secondary)] font-medium">#</th>
                  <th className="text-left py-2 px-2 text-[var(--color-text-secondary)] font-medium">Title</th>
                  <th className="text-left py-2 px-2 text-[var(--color-text-secondary)] font-medium">Project</th>
                  <th className="text-left py-2 px-2 text-[var(--color-text-secondary)] font-medium">Status</th>
                  <th className="text-left py-2 px-2 text-[var(--color-text-secondary)] font-medium">Priority</th>
                  <th className="text-left py-2 px-2 text-[var(--color-text-secondary)] font-medium">Type</th>
                  <th className="text-right py-2 px-2 text-[var(--color-text-secondary)] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-[var(--color-border-light)] hover:bg-[var(--color-border-light)] cursor-pointer transition-colors"
                    onClick={() => setViewTicket(t)}
                  >
                    <td className="py-2 px-2 font-medium text-[var(--color-text-primary)]">{t.ticketNo}</td>
                    <td className="py-2 px-2 max-w-xs truncate">
                      <span className="inline-flex px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[t.status]?.bg, color: statusColors[t.status]?.text }}>{t.title}</span>
                    </td>
                    <td className="py-2 px-2 text-[var(--color-text-secondary)]">{getProjectName(t.projectId)}</td>
                    <td className="py-2 px-2">
                      <select
                        value={t.status}
                        onChange={e => { e.stopPropagation(); handleStatusChange(t._id, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        style={{ backgroundColor: statusColors[t.status]?.bg || '#F3F4F6', color: statusColors[t.status]?.text || '#6B7280' }}
                        className="text-[11px] font-medium px-2 py-1 rounded-full border border-[var(--color-border)] cursor-pointer hover:opacity-80 focus:outline-none transition-all"
                      >
                        {statuses.map(s => (
                          <option key={s} value={s}>{getStatusLabel(s)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant={priorityVariant[t.priority] || 'default'}>{t.priority}</Badge>
                    </td>
                    <td className="py-2 px-2 text-[var(--color-text-secondary)]">{t.type}</td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(t._id); }}
                        >
                          {t.isFavorite ? '⭐' : '☆'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--color-danger)]"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(t._id); }}
                        >
                          Del
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      <Modal
        isOpen={!!viewTicket}
        onClose={() => setViewTicket(null)}
        size="lg"
      >
        {viewTicket && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{viewTicket.ticketNo}</h2>
              <button
                onClick={() => setViewTicket(null)}
                className="p-1 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Close dialog"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <select
                  value={viewTicket.status}
                  onChange={e => handleStatusChange(viewTicket._id, e.target.value)}
                  style={{ backgroundColor: statusColors[viewTicket.status]?.bg || '#F3F4F6', color: statusColors[viewTicket.status]?.text || '#6B7280' }}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--color-border)] cursor-pointer hover:opacity-80 focus:outline-none transition-all"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </select>
                <Badge variant={priorityVariant[viewTicket.priority] || 'default'}>{viewTicket.priority}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{viewTicket.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--color-text-secondary)]">Project:</span>{' '}
                <span className="font-medium text-[var(--color-text-primary)]">{getProjectName(viewTicket.projectId)}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">Type:</span>{' '}
                <span className="font-medium text-[var(--color-text-primary)]">{viewTicket.type}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">Severity:</span>{' '}
                <span className="font-medium text-[var(--color-text-primary)]">{viewTicket.severity}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">Environment:</span>{' '}
                <span className="font-medium text-[var(--color-text-primary)]">{viewTicket.environment}</span>
              </div>
              {viewTicket.jiraUrl && (
                <div className="col-span-2">
                  <span className="text-[var(--color-text-secondary)]">Jira:</span>{' '}
                  <a href={viewTicket.jiraUrl} target="_blank" className="text-[var(--color-primary)] hover:underline ml-1">{viewTicket.jiraUrl}</a>
                </div>
              )}
              {viewTicket.assignedTo && (
                <div>
                  <span className="text-[var(--color-text-secondary)]">Assigned:</span>{' '}
                  <span className="font-medium text-[var(--color-text-primary)]">{viewTicket.assignedTo}</span>
                </div>
              )}
              {viewTicket.reporter && (
                <div>
                  <span className="text-[var(--color-text-secondary)]">Reporter:</span>{' '}
                  <span className="font-medium text-[var(--color-text-primary)]">{viewTicket.reporter}</span>
                </div>
              )}
              {viewTicket.releaseVersion && (
                <div>
                  <span className="text-[var(--color-text-secondary)]">Release:</span>{' '}
                  <span className="font-medium text-[var(--color-text-primary)]">{viewTicket.releaseVersion}</span>
                </div>
              )}
            </div>

            {viewTicket.description && (
              <p className="text-sm text-[var(--color-text-secondary)]">{viewTicket.description}</p>
            )}

            {viewTicket.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewTicket.labels.map((l, i) => (
                  <Badge key={i} variant="primary">{l}</Badge>
                ))}
              </div>
            )}

            <div className="border-t border-[var(--color-border)] pt-4">
              <h3 className="font-bold text-sm mb-2 text-[var(--color-text-primary)]">Checklist</h3>
              <div className="space-y-1.5 mb-3">
                {viewTicket.checklist.map((item) => (
                  <label key={item._id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--color-text-primary)]">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklist(item._id!)}
                      className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <span className={cn(item.completed && 'line-through text-[var(--color-text-muted)]')}>{item.text}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newChecklist}
                  onChange={e => setNewChecklist(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}
                  placeholder="Add checklist item"
                  className="flex-1 text-xs"
                />
                <Button variant="secondary" size="sm" onClick={handleAddChecklist}>Add</Button>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-4">
              <h3 className="font-bold text-sm mb-2 text-[var(--color-text-primary)]">Comments ({viewTicket.comments.length})</h3>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {viewTicket.comments.map((c, i) => (
                  <div key={c._id || i} className="bg-[var(--color-border-light)] rounded-lg p-3 text-sm">
                    <p className="text-[var(--color-text-primary)]">{c.text}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add comment..."
                  className="flex-1 text-xs"
                />
                <Button size="sm" onClick={handleAddComment}>Send</Button>
              </div>
            </div>

            {viewTicket.activityLogs && viewTicket.activityLogs.length > 0 && (
              <div className="border-t border-[var(--color-border)] pt-4">
                <h3 className="font-bold text-sm mb-2 text-[var(--color-text-primary)]">Activity</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {viewTicket.activityLogs.map((log, i) => (
                    <p key={log._id || i} className="text-xs text-[var(--color-text-secondary)]">
                      {log.action} &mdash; {new Date(log.createdAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
