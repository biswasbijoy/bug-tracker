'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { Project, Epic, Ticket } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge, PriorityBadge, statusColors } from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { cn, getStatusLabel } from '@/lib/utils';

function FolderIcon({ color, open }: { color: string; open: boolean }) {
  return (
    <svg viewBox="0 0 48 36" className="w-16 h-12 shrink-0" fill="none">
      {open ? (
        <>
          <path d="M2 8a4 4 0 014-4h12l4 4h20a4 4 0 014 4v18a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" fill={color} opacity="0.85" />
          <path d="M2 10a4 4 0 014-4h12l4 4h20a4 4 0 014 4v16a4 4 0 01-4 4H6a4 4 0 01-4-4V10z" fill={color} />
        </>
      ) : (
        <>
          <path d="M2 6a4 4 0 014-4h12l4 4h20a4 4 0 014 4v20a4 4 0 01-4 4H6a4 4 0 01-4-4V6z" fill={color} opacity="0.85" />
          <path d="M2 8a4 4 0 014-4h12l4 4h20a4 4 0 014 4v18a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" fill={color} />
        </>
      )}
    </svg>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '#3B82F6', client: '' });
  const [showEpicModal, setShowEpicModal] = useState(false);
  const [epicForm, setEpicForm] = useState({ name: '', description: '' });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '', description: '', type: 'task', epicId: '', sprintId: '',
    assignedTo: '', reporter: '', priority: 'medium', severity: 'major',
    environment: 'qa', labels: [] as string[],
  });
  const [labelInput, setLabelInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newChecklist, setNewChecklist] = useState('');

  const statuses = ['open', 'backlog', 'ready', 'in-progress', 'blocked', 'code-review', 'ready-for-qa', 'qa-in-progress', 'qa-failed', 'ready-for-release', 'released', 'done', 'closed', 'reopened', 'cancelled', 'stage'];

  const load = useCallback(async () => {
    try {
      const [projectRes, epicsRes, ticketsRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/epics?projectId=${projectId}`),
        api.get(`/tickets?projectId=${projectId}`),
      ]);
      setProject(projectRes.data);
      setEpics(epicsRes.data);
      setTickets(ticketsRes.data);
    } catch {
      toast.error('Failed to load project');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put(`/projects/${projectId}`, editForm);
    toast.success('Project updated');
    setShowEditModal(false);
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await api.delete(`/projects/${projectId}`);
    toast.success('Project deleted');
    router.push('/projects');
  };

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/epics', { ...epicForm, projectId });
    toast.success('Epic created');
    setShowEpicModal(false);
    setEpicForm({ name: '', description: '' });
    load();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/tickets', { ...ticketForm, projectId, epicId: ticketForm.epicId || undefined });
    toast.success('Ticket created');
    setShowTicketModal(false);
    setTicketForm({
      title: '', description: '', type: 'task', epicId: '', sprintId: '',
      assignedTo: '', reporter: '', priority: 'medium', severity: 'major',
      environment: 'qa', labels: [],
    });
    load();
  };

  const openTicket = async (ticket: Ticket) => {
    setViewTicket(ticket);
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    await api.put(`/tickets/${id}`, { status: newStatus });
    toast.success('Status updated');
    const { data } = await api.get(`/tickets?projectId=${projectId}`);
    setTickets(data);
    if (viewTicket?._id === id) {
      const { data: updated } = await api.get(`/tickets/${id}`);
      setViewTicket(updated);
    }
  };

  const addTicketLabel = () => {
    if (labelInput.trim() && !ticketForm.labels.includes(labelInput.trim())) {
      setTicketForm({ ...ticketForm, labels: [...ticketForm.labels, labelInput.trim()] });
      setLabelInput('');
    }
  };

  const toggleEpic = (id: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getTickets = (epicId: string) =>
    tickets.filter(t => t.epicId && (typeof t.epicId === 'string' ? t.epicId === epicId : (t.epicId as any)._id === epicId));

  const totalTickets = tickets.length;
  const closedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'cancelled').length;
  const completionPct = totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-6 w-48 bg-[var(--color-border-light)] rounded animate-skeleton" />
          <div className="h-24 bg-[var(--color-border-light)] rounded-[var(--radius-card)] animate-skeleton" />
          <div className="h-64 bg-[var(--color-border-light)] rounded-[var(--radius-card)] animate-skeleton" />
        </div>
      </AppLayout>
    );
  }

  if (!project) return null;

  return (
    <AppLayout>
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
        className="mb-4"
      />

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <FolderIcon color={project.color} open />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[var(--color-text-muted)]">
                {project.client && <span>Client: {project.client}</span>}
                <span>Status: <span className={project.status === 'active' ? 'text-[var(--color-success)] font-medium' : ''}>{project.status}</span></span>
                <span>{epics.length} epics</span>
                <span>{totalTickets} tickets</span>
                {totalTickets > 0 && <span>{completionPct}% complete</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => { setEditForm({ name: project.name, description: project.description || '', color: project.color, client: project.client || '' }); setShowEditModal(true); }}>Edit</Button>
            {project.status === 'active' && (
              <Button variant="outline" size="sm" onClick={async () => { await api.put(`/projects/${projectId}`, { status: 'archived' }); toast.success('Archived'); load(); }}>Archive</Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>Delete</Button>
            <Button size="sm" onClick={() => { setEpicForm({ name: '', description: '' }); setShowEpicModal(true); }}>+ Epic</Button>
            <Button size="sm" onClick={() => { setTicketForm(prev => ({ ...prev, epicId: '' })); setShowTicketModal(true); }}>+ Ticket</Button>
          </div>
        </div>
      </div>

      {epics.length === 0 ? (
        <EmptyState
          title="No epics yet"
          description="Create an epic to organize tickets in this project."
          action={{ label: 'Create Epic', onClick: () => { setEpicForm({ name: '', description: '' }); setShowEpicModal(true); } }}
        />
      ) : (
        <div className="space-y-3">
          {epics.map(epic => {
            const epicTickets = getTickets(epic._id);
            const isExpanded = expandedEpics.has(epic._id);
            const epicClosed = epicTickets.filter(t => t.status === 'closed' || t.status === 'cancelled').length;
            const progress = epicTickets.length > 0 ? Math.round((epicClosed / epicTickets.length) * 100) : 0;

            return (
              <div key={epic._id} className="border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
                <div className="flex group">
                  <div className={cn(
                    'w-1 shrink-0 transition-colors duration-200',
                    isExpanded ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)] group-hover:bg-[var(--color-primary)]'
                  )} />
                  <div className="flex-1 min-w-0">
                <button
                  onClick={() => toggleEpic(epic._id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-border-light)] transition-colors text-left group"
                >
                  <svg className={cn(
                    'w-3.5 h-3.5 shrink-0 transition-all duration-200',
                    isExpanded ? 'text-[var(--color-primary)] rotate-90' : 'text-[var(--color-text-muted)]'
                  )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-semibold text-sm transition-colors',
                        isExpanded ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'
                      )}>{epic.name}</span>
                      {epic.description && (
                        <span className="text-xs text-[var(--color-text-muted)] truncate hidden sm:inline">{epic.description}</span>
                      )}
                    </div>
                    {epicTickets.length > 0 && (
                      <div className="mt-2 max-w-xs">
                        <ProgressBar
                          value={progress}
                          color={progress === 100 ? 'success' : progress >= 50 ? 'primary' : 'warning'}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                      <span className={cn(
                        'font-medium',
                        epicTickets.length > 0 ? 'text-[var(--color-text-primary)]' : ''
                      )}>{epicTickets.length}</span>
                      <span>tickets</span>
                    </div>
                    {epicTickets.length > 0 && (
                      <div className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        progress === 100 ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' :
                        progress >= 50 ? 'bg-blue-50 text-blue-600' :
                        'bg-[var(--color-warning-light)] text-[var(--color-warning)]'
                      )}>
                        {progress}%
                      </div>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--color-border-light)]">
                    {epicTickets.length > 0 ? (
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
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border-light)]">
                            {epicTickets.map(ticket => (
                              <tr key={ticket._id} onClick={() => openTicket(ticket)} className="hover:bg-[var(--color-border-light)] transition-colors cursor-pointer">
                                <td className="py-2.5 px-5">
                                  <span className="font-mono text-xs font-bold text-[var(--color-text-muted)]">{ticket.ticketNo}</span>
                                </td>
                                <td className="py-2.5 px-2 max-w-xs">
                                  <span className="inline-flex text-sm px-2 py-0.5 rounded truncate max-w-full" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>{ticket.title}</span>
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
                                  <PriorityBadge priority={ticket.priority} />
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-5 py-4">
                        <p className="text-xs text-[var(--color-text-muted)] text-center">
                          No tickets yet.{' '}
                          <button
                            onClick={() => { setTicketForm(prev => ({ ...prev, epicId: epic._id })); setShowTicketModal(true); }}
                            className="text-[var(--color-primary)] hover:underline font-medium"
                          >
                            Create one
                          </button>
                        </p>
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

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <form onSubmit={handleEdit} className="space-y-3">
          <Input label="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
          <Input label="Description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
          <div className="flex gap-3 items-end">
            <input type="color" value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })} className="w-12 h-10 rounded cursor-pointer border border-[var(--color-border)]" />
            <Input label="Client" value={editForm.client} onChange={e => setEditForm({ ...editForm, client: e.target.value })} className="flex-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEpicModal} onClose={() => setShowEpicModal(false)} title="New Epic">
        <form onSubmit={handleCreateEpic} className="space-y-3">
          <Input label="Name" value={epicForm.name} onChange={e => setEpicForm({ ...epicForm, name: e.target.value })} required />
          <Input label="Description" value={epicForm.description} onChange={e => setEpicForm({ ...epicForm, description: e.target.value })} />
          <div className="flex gap-2 pt-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowEpicModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} title="New Ticket" size="lg">
        <form onSubmit={handleCreateTicket} className="space-y-3">
          <Input label="Title" value={ticketForm.title} onChange={e => setTicketForm({ ...ticketForm, title: e.target.value })} required />
          <Textarea label="Description" value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} rows={3} />
          <div className="grid grid-cols-2 gap-2">
            <select value={ticketForm.epicId} onChange={e => setTicketForm({ ...ticketForm, epicId: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-3 py-2 text-sm">
              <option value="">No Epic</option>
              {epics.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
            <select value={ticketForm.type} onChange={e => setTicketForm({ ...ticketForm, type: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-3 py-2 text-sm">
              {['story', 'task', 'bug', 'improvement', 'spike', 'technical-task', 'research', 'production-issue'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ')}</option>
              ))}
            </select>
            <select value={ticketForm.priority} onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-3 py-2 text-sm">
              {['highest', 'high', 'medium', 'low', 'lowest'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select value={ticketForm.severity} onChange={e => setTicketForm({ ...ticketForm, severity: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-3 py-2 text-sm">
              {['critical', 'major', 'minor', 'trivial'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={ticketForm.environment} onChange={e => setTicketForm({ ...ticketForm, environment: e.target.value })} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-3 py-2 text-sm">
              {['local', 'dev', 'qa', 'staging', 'uat', 'production'].map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
            <Input label="Assigned To" value={ticketForm.assignedTo} onChange={e => setTicketForm({ ...ticketForm, assignedTo: e.target.value })} />
            <Input label="Reporter" value={ticketForm.reporter} onChange={e => setTicketForm({ ...ticketForm, reporter: e.target.value })} />
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Add label" value={labelInput} onChange={e => setLabelInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTicketLabel())} className="flex-1" />
              <Button type="button" variant="secondary" onClick={addTicketLabel}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ticketForm.labels.map((l, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  {l}
                  <button type="button" onClick={() => setTicketForm({ ...ticketForm, labels: ticketForm.labels.filter((_, j) => j !== i) })} className="ml-1 hover:text-[var(--color-danger)]">&times;</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowTicketModal(false)}>Cancel</Button>
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
                <PriorityBadge priority={viewTicket.priority} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{viewTicket.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--color-text-secondary)]">Project:</span>{' '}<span className="font-medium text-[var(--color-text-primary)]">{typeof viewTicket.projectId === 'string' ? project?.name : viewTicket.projectId.name}</span></div>
              <div><span className="text-[var(--color-text-secondary)]">Type:</span>{' '}<span className="font-medium text-[var(--color-text-primary)]">{viewTicket.type}</span></div>
              <div><span className="text-[var(--color-text-secondary)]">Severity:</span>{' '}<span className="font-medium text-[var(--color-text-primary)]">{viewTicket.severity}</span></div>
              <div><span className="text-[var(--color-text-secondary)]">Environment:</span>{' '}<span className="font-medium text-[var(--color-text-primary)]">{viewTicket.environment}</span></div>
              {viewTicket.assignedTo && <div><span className="text-[var(--color-text-secondary)]">Assigned:</span>{' '}<span className="font-medium text-[var(--color-text-primary)]">{viewTicket.assignedTo}</span></div>}
              {viewTicket.reporter && <div><span className="text-[var(--color-text-secondary)]">Reporter:</span>{' '}<span className="font-medium text-[var(--color-text-primary)]">{viewTicket.reporter}</span></div>}
            </div>

            {viewTicket.description && <p className="text-sm text-[var(--color-text-secondary)]">{viewTicket.description}</p>}

            {viewTicket.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewTicket.labels.map((l, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">{l}</span>
                ))}
              </div>
            )}

            <div className="border-t border-[var(--color-border)] pt-4">
              <h3 className="font-bold text-sm mb-2 text-[var(--color-text-primary)]">Checklist</h3>
              <div className="space-y-1.5 mb-3">
                {viewTicket.checklist.map((item) => (
                  <label key={item._id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--color-text-primary)]">
                    <input type="checkbox" checked={item.completed} onChange={() => toggleChecklist(item._id!)} className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                    <span className={cn(item.completed && 'line-through text-[var(--color-text-muted)]')}>{item.text}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newChecklist} onChange={e => setNewChecklist(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChecklist()} placeholder="Add checklist item" className="flex-1 text-xs" />
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
                <Input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} placeholder="Add comment..." className="flex-1 text-xs" />
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
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project and all its tickets? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </AppLayout>
  );
}
