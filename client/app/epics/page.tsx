'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Epic, Project, Ticket, Sprint } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { statusColors } from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn, getStatusLabel } from '@/lib/utils';

const statuses = ['open', 'backlog', 'ready', 'in-progress', 'blocked', 'code-review', 'ready-for-qa', 'qa-in-progress', 'qa-failed', 'ready-for-release', 'released', 'done', 'closed', 'reopened', 'cancelled', 'stage'];

const defaultTicketForm = {
  title: '', description: '', type: 'task', epicId: '', sprintId: '',
  assignedTo: '', reporter: '', priority: 'medium', severity: 'major',
  environment: 'qa', jiraUrl: '', labels: [] as string[],
};

const priorityVariant: Record<string, 'default' | 'danger' | 'warning' | 'info' | 'primary'> = {
  highest: 'danger', high: 'warning', medium: 'info', low: 'primary', lowest: 'default',
};

export default function EpicsPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [epicTickets, setEpicTickets] = useState<Ticket[]>([]);
  const [epicTicketsLoading, setEpicTicketsLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', projectId: '' });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState(defaultTicketForm);
  const [labelInput, setLabelInput] = useState('');

  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newChecklist, setNewChecklist] = useState('');

  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  const loadEpics = async () => {
    const [epicsRes, projectsRes] = await Promise.all([
      api.get('/epics'),
      api.get('/projects'),
    ]);
    setEpics(epicsRes.data);
    setProjects(projectsRes.data);
    setLoading(false);
  };

  useEffect(() => { loadEpics(); }, []);

  const loadEpicTickets = async (epicId: string) => {
    setEpicTicketsLoading(true);
    const { data } = await api.get(`/tickets?epicId=${epicId}`);
    setEpicTickets(data);
    setEpicTicketsLoading(false);
  };

  const handleEpicClick = (epicId: string) => {
    if (expandedId === epicId) {
      setExpandedId(null);
      setEpicTickets([]);
    } else {
      setExpandedId(epicId);
      loadEpicTickets(epicId);
    }
  };

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/epics', form);
    toast.success('Epic created');
    setShowForm(false);
    setForm({ name: '', description: '', projectId: '' });
    loadEpics();
  };

  const handleDeleteEpic = async (id: string) => {
    if (!confirm('Delete this epic?')) return;
    await api.delete(`/epics/${id}`);
    toast.success('Epic deleted');
    if (expandedId === id) {
      setExpandedId(null);
      setEpicTickets([]);
    }
    loadEpics();
  };

  const openTicketForm = (epicId: string) => {
    setEditingTicket(null);
    setTicketForm({ ...defaultTicketForm, epicId });
    api.get('/sprints').then(({ data }) => setSprints(data));
    setShowTicketForm(true);
  };

  const openEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    api.get('/sprints').then(({ data }) => setSprints(data));
    setTicketForm({
      title: ticket.title,
      description: ticket.description || '',
      type: ticket.type as string,
      epicId: typeof ticket.epicId === 'string' ? ticket.epicId : ticket.epicId?._id || '',
      sprintId: typeof ticket.sprintId === 'string' ? ticket.sprintId : ticket.sprintId?._id || '',
      assignedTo: ticket.assignedTo || '',
      reporter: ticket.reporter || '',
      priority: ticket.priority as string,
      severity: ticket.severity as string,
      environment: ticket.environment as string,
      jiraUrl: ticket.jiraUrl || '',
      labels: ticket.labels,
    });
    setShowTicketForm(true);
  };

  const addLabel = () => {
    if (labelInput.trim() && !ticketForm.labels.includes(labelInput.trim())) {
      setTicketForm({ ...ticketForm, labels: [...ticketForm.labels, labelInput.trim()] });
      setLabelInput('');
    }
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const epic = epics.find(ep => ep._id === ticketForm.epicId);
      if (!epic) { toast.error('Epic not found'); return; }
      const payload = {
        ...ticketForm,
        projectId: epic.projectId,
        epicId: ticketForm.epicId || undefined,
        sprintId: ticketForm.sprintId || undefined,
      };
      if (editingTicket) {
        await api.put(`/tickets/${editingTicket._id}`, payload);
        toast.success('Ticket updated');
      } else {
        await api.post('/tickets', payload);
        toast.success('Ticket created');
      }
      setShowTicketForm(false);
      setEditingTicket(null);
      setTicketForm(defaultTicketForm);
      if (expandedId) loadEpicTickets(expandedId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save ticket');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await api.put(`/tickets/${id}`, { status: newStatus });
    toast.success('Status updated');
    if (expandedId) loadEpicTickets(expandedId);
    if (viewTicket?._id === id) {
      const { data } = await api.get(`/tickets/${id}`);
      setViewTicket(data);
    }
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

  const confirmDeleteTicket = async () => {
    if (!deleteTicketId) return;
    setDeletingTicket(true);
    await api.delete(`/tickets/${deleteTicketId}`);
    toast.success('Ticket deleted');
    setDeletingTicket(false);
    setDeleteTicketId(null);
    if (expandedId) loadEpicTickets(expandedId);
  };

  const getProjectName = (id: string) => projects.find(p => p._id === id)?.name || 'Unknown';
  const getEpicProjectId = (epicId: string) => epics.find(e => e._id === epicId)?.projectId || '';

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Epics</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Organize tickets by epics</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New Epic</Button>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Epic">
        <form onSubmit={handleCreateEpic} className="space-y-3">
          <Select
            label="Project"
            placeholder="Select project"
            options={projects.map(p => ({ value: p._id, label: p.name }))}
            value={form.projectId}
            onChange={e => setForm({ ...form, projectId: e.target.value })}
            required
          />
          <Input
            placeholder="Epic name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showTicketForm}
        onClose={() => { setShowTicketForm(false); setEditingTicket(null); setTicketForm(defaultTicketForm); setLabelInput(''); }}
        title={editingTicket ? 'Edit Ticket' : 'New Ticket'}
        size="lg"
      >
        <form onSubmit={handleSaveTicket} className="space-y-3">
          <Input
            label="Title"
            value={ticketForm.title}
            onChange={e => setTicketForm({ ...ticketForm, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={ticketForm.description}
            onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Type"
              value={ticketForm.type}
              onChange={e => setTicketForm({ ...ticketForm, type: e.target.value as any })}
              options={['story', 'task', 'bug', 'improvement', 'spike', 'technical-task', 'research', 'production-issue'].map(t => ({
                value: t, label: t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ')
              }))}
            />
            <Select
              label="Epic"
              value={ticketForm.epicId}
              onChange={e => setTicketForm({ ...ticketForm, epicId: e.target.value })}
              options={epics.filter(e => e.projectId === getEpicProjectId(ticketForm.epicId)).map(e => ({ value: e._id, label: e.name }))}
            />
            <Select
              label="Sprint"
              value={ticketForm.sprintId}
              onChange={e => setTicketForm({ ...ticketForm, sprintId: e.target.value })}
              options={[{ value: '', label: 'None' }, ...sprints.filter(s => s.projectId === getEpicProjectId(ticketForm.epicId)).map(s => ({ value: s._id, label: s.name }))]}
            />
            <Select
              label="Priority"
              value={ticketForm.priority}
              onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
              options={['highest', 'high', 'medium', 'low', 'lowest'].map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
            />
            <Select
              label="Severity"
              value={ticketForm.severity}
              onChange={e => setTicketForm({ ...ticketForm, severity: e.target.value as any })}
              options={['critical', 'major', 'minor', 'trivial'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
            <Select
              label="Environment"
              value={ticketForm.environment}
              onChange={e => setTicketForm({ ...ticketForm, environment: e.target.value as any })}
              options={['local', 'dev', 'qa', 'staging', 'uat', 'production'].map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
            />
            <Input
              label="Jira URL"
              placeholder="https://..."
              value={ticketForm.jiraUrl}
              onChange={e => setTicketForm({ ...ticketForm, jiraUrl: e.target.value })}
            />
            <Input
              label="Assigned To"
              value={ticketForm.assignedTo}
              onChange={e => setTicketForm({ ...ticketForm, assignedTo: e.target.value })}
            />
            <Input
              label="Reporter"
              value={ticketForm.reporter}
              onChange={e => setTicketForm({ ...ticketForm, reporter: e.target.value })}
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
              {ticketForm.labels.map((l, i) => (
                <Badge key={i} variant="primary">
                  {l}
                  <button type="button" onClick={() => setTicketForm({ ...ticketForm, labels: ticketForm.labels.filter((_, j) => j !== i) })} className="ml-1 hover:text-[var(--color-danger)]">&times;</button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editingTicket ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowTicketForm(false); setEditingTicket(null); setTicketForm(defaultTicketForm); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewTicket} onClose={() => setViewTicket(null)} size="lg">
        {viewTicket && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{viewTicket.ticketNo}</h2>
              <button onClick={() => setViewTicket(null)} className="p-1 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
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
                <span className="font-medium text-[var(--color-text-primary)]">{typeof viewTicket.projectId === 'string' ? getProjectName(viewTicket.projectId) : viewTicket.projectId.name}</span>
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
                    <p key={log._id || i} className="text-xs text-[var(--color-text-secondary)]">{log.action} &mdash; {new Date(log.createdAt).toLocaleString()}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTicketId}
        onClose={() => setDeleteTicketId(null)}
        onConfirm={confirmDeleteTicket}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deletingTicket}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : epics.length === 0 ? (
        <EmptyState
          title="No epics yet"
          description="Create your first epic to organize tickets."
          action={{ label: '+ New Epic', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {epics.map((epic) => {
            const isExpanded = expandedId === epic._id;
            const closedCount = epicTickets.filter(t => t.status === 'closed' || t.status === 'cancelled').length;
            const progress = epicTickets.length > 0 ? Math.round((closedCount / epicTickets.length) * 100) : 0;

            return (
              <div key={epic._id} className="border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-surface)] overflow-hidden">
                <div className="flex group">
                  <div className={cn(
                    'w-1 shrink-0 transition-colors duration-200',
                    isExpanded ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)] group-hover:bg-[var(--color-primary)]'
                  )} />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleEpicClick(epic._id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--color-border-light)] transition-colors text-left"
                    >
                      <svg className={cn(
                        'w-3 h-3 shrink-0 transition-all duration-200',
                        isExpanded ? 'text-[var(--color-primary)] rotate-90' : 'text-[var(--color-text-muted)]'
                      )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-medium text-sm transition-colors',
                            isExpanded ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'
                          )}>{epic.name}</span>
                          <span className="text-[11px] text-[var(--color-primary)] font-medium">{getProjectName(epic.projectId)}</span>
                          {epic.description && (
                            <span className="text-[11px] text-[var(--color-text-muted)] truncate hidden sm:inline">{epic.description}</span>
                          )}
                        </div>
                        {isExpanded && epicTickets.length > 0 && (
                          <div className="mt-1.5 max-w-xs">
                            <ProgressBar
                              value={progress}
                              color={progress === 100 ? 'success' : progress >= 50 ? 'primary' : 'warning'}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          'text-[11px] font-medium',
                          isExpanded && epicTickets.length > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                        )}>
                          {isExpanded ? epicTickets.length : '--'} tickets
                        </span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full',
                          epic.status === 'active'
                            ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                            : 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]'
                        )}>{epic.status}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteEpic(epic._id); }}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] text-xs p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--color-border-light)]">
                        {epicTicketsLoading ? (
                          <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">Loading tickets...</div>
                        ) : epicTickets.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-[var(--color-border-light)] bg-[var(--color-border-light)]/50">
                                  <th className="text-left py-2 px-5 text-[11px] font-medium text-[var(--color-text-muted)] w-24">Ticket</th>
                                  <th className="text-left py-2 px-2 text-[11px] font-medium text-[var(--color-text-muted)]">Title</th>
                                  <th className="text-left py-2 px-2 text-[11px] font-medium text-[var(--color-text-muted)] hidden sm:table-cell w-28">Status</th>
                                  <th className="text-left py-2 px-2 text-[11px] font-medium text-[var(--color-text-muted)] hidden md:table-cell w-20">Priority</th>
                                  <th className="text-left py-2 px-2 text-[11px] font-medium text-[var(--color-text-muted)] hidden lg:table-cell w-20">Assignee</th>
                                  <th className="text-left py-2 px-2 text-[11px] font-medium text-[var(--color-text-muted)] hidden xl:table-cell w-28">Labels</th>
                                  <th className="text-right py-2 px-2 text-[11px] font-medium text-[var(--color-text-muted)] w-20">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--color-border-light)]">
                                {epicTickets.map(ticket => (
                                  <tr
                                    key={ticket._id}
                                    onClick={() => setViewTicket(ticket)}
                                    className="hover:bg-[var(--color-border-light)] transition-colors cursor-pointer"
                                  >
                                    <td className="py-2.5 px-5">
                                      <span className="font-mono text-xs font-bold text-[var(--color-text-muted)]">{ticket.ticketNo}</span>
                                    </td>
                                    <td className="py-2.5 px-2 max-w-xs">
                                      <span
                                        className="inline-flex text-sm px-2 py-0.5 rounded truncate max-w-full"
                                        style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}
                                      >
                                        {ticket.title}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-2 hidden sm:table-cell">
                                      <select
                                        value={ticket.status}
                                        onChange={e => { e.stopPropagation(); handleStatusChange(ticket._id, e.target.value); }}
                                        onClick={e => e.stopPropagation()}
                                        style={{ backgroundColor: statusColors[ticket.status]?.bg || '#F3F4F6', color: statusColors[ticket.status]?.text || '#6B7280' }}
                                        className="text-[11px] font-medium px-2 py-1 rounded-full border border-[var(--color-border)] cursor-pointer hover:opacity-80 focus:outline-none transition-all"
                                      >
                                        {statuses.map(s => (
                                          <option key={s} value={s}>{getStatusLabel(s)}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="py-2.5 px-2 hidden md:table-cell">
                                      <Badge variant={priorityVariant[ticket.priority] || 'default'}>{ticket.priority}</Badge>
                                    </td>
                                    <td className="py-2.5 px-2 hidden lg:table-cell">
                                      {ticket.assignedTo ? (
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-5 h-5 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[10px] font-medium text-[var(--color-primary)] shrink-0">
                                            {ticket.assignedTo.charAt(0).toUpperCase()}
                                          </div>
                                          <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[80px]">{ticket.assignedTo}</span>
                                        </div>
                                      ) : <span className="text-xs text-[var(--color-text-muted)]">—</span>}
                                    </td>
                                    <td className="py-2.5 px-2 hidden xl:table-cell">
                                      {ticket.labels.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                          {ticket.labels.slice(0, 2).map((l, i) => (
                                            <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-border-light)] text-[var(--color-text-muted)] truncate max-w-[60px]">{l}</span>
                                          ))}
                                          {ticket.labels.length > 2 && <span className="text-[10px] text-[var(--color-text-muted)]">+{ticket.labels.length - 2}</span>}
                                        </div>
                                      ) : <span className="text-xs text-[var(--color-text-muted)]">—</span>}
                                    </td>
                                    <td className="py-2.5 px-2 text-right">
                                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" onClick={() => openEditTicket(ticket)}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-[var(--color-danger)]" onClick={() => setDeleteTicketId(ticket._id)}>Del</Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div>
                            <EmptyState
                              title="No tickets yet"
                              description="Create a ticket for this epic."
                              action={{ label: 'Create Ticket', onClick: () => openTicketForm(epic._id) }}
                              className="!py-4"
                            />
                          </div>
                        )}
                        {isExpanded && (
                          <div className="px-5 py-3 border-t border-[var(--color-border-light)] flex justify-end">
                            <Button size="sm" onClick={() => openTicketForm(epic._id)}>+ New Ticket</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
