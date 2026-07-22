'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Project } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { cn, formatRelativeTime } from '@/lib/utils';

interface ProjectStats {
  epicCount: number;
  ticketCount: number;
  openCount: number;
  closedCount: number;
}

function FolderIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 36" className="w-10 h-8 sm:w-12 sm:h-9 shrink-0" fill="none">
      <path d="M2 6a4 4 0 014-4h12l4 4h20a4 4 0 014 4v20a4 4 0 01-4 4H6a4 4 0 01-4-4V6z" fill={color} opacity="0.85" />
      <path d="M2 8a4 4 0 014-4h12l4 4h20a4 4 0 014 4v18a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" fill={color} />
    </svg>
  );
}

function ActionMenu({ projectId, onAction }: { projectId: string; onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const items = [
    { label: 'Open', action: 'open' },
    { label: 'Edit', action: 'edit' },
    { label: 'Archive', action: 'archive' },
    { label: 'Delete', action: 'delete', danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open); }}
        className="p-1 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-dialog)] shadow-[var(--shadow-dialog)] py-1 z-50 animate-scale-in">
          {items.map(item => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onAction(item.action); }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-sm transition-colors',
                item.danger
                  ? 'text-[var(--color-danger)] hover:bg-red-50'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-border-light)]'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', client: '' });
  const [editTarget, setEditTarget] = useState<Project | null>(null);

  const load = async () => {
    const { data: projs } = await api.get('/projects');
    setProjects(projs);
    if (projs.length > 0) {
      const [{ data: epics }, { data: tickets }] = await Promise.all([
        api.get('/epics'),
        api.get('/tickets'),
      ]);
      const s: Record<string, ProjectStats> = {};
      for (const p of projs) {
        const pid = p._id;
        const projEpics = epics.filter((e: any) => e.projectId === pid);
        const projTickets = tickets.filter((t: any) => {
          const tp = typeof t.projectId === 'string' ? t.projectId : t.projectId?._id;
          return tp === pid;
        });
        s[pid] = {
          epicCount: projEpics.length,
          ticketCount: projTickets.length,
          openCount: projTickets.filter((t: any) => !['closed', 'cancelled'].includes(t.status)).length,
          closedCount: projTickets.filter((t: any) => t.status === 'closed').length,
        };
      }
      setStats(s);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/projects', form);
    toast.success('Project created');
    setShowForm(false);
    setForm({ name: '', description: '', color: '#3B82F6', client: '' });
    load();
  };

  const handleAction = async (action: string, project: Project) => {
    switch (action) {
      case 'open':
        router.push(`/projects/${project._id}`);
        break;
      case 'edit':
        setEditTarget(project);
        setForm({ name: project.name, description: project.description || '', color: project.color, client: project.client || '' });
        setShowForm(true);
        break;
      case 'archive':
        await api.put(`/projects/${project._id}`, { status: project.status === 'active' ? 'archived' : 'active' });
        toast.success(project.status === 'active' ? 'Archived' : 'Restored');
        load();
        break;
      case 'delete':
        if (confirm('Delete this project and all its data?')) {
          await api.delete(`/projects/${project._id}`);
          toast.success('Deleted');
          load();
        }
        break;
    }
  };

  let filtered = projects;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q));
  }
  if (statusFilter) {
    filtered = filtered.filter(p => p.status === statusFilter);
  }
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return 0;
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Projects</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage your projects</p>
        </div>
        <Button onClick={() => { setEditTarget(null); setForm({ name: '', description: '', color: '#3B82F6', client: '' }); setShowForm(true); }}>+ New Project</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
        >
          <option value="name">Name</option>
          <option value="created">Newest</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditTarget(null); }} title={editTarget ? 'Edit Project' : 'New Project'}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (editTarget) {
            await api.put(`/projects/${editTarget._id}`, form);
            toast.success('Project updated');
          } else {
            await api.post('/projects', form);
            toast.success('Project created');
          }
          setShowForm(false);
          setEditTarget(null);
          setForm({ name: '', description: '', color: '#3B82F6', client: '' });
          load();
        }} className="space-y-3">
          <Input placeholder="Project name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3">
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-12 h-10 rounded cursor-pointer border border-[var(--color-border)]" />
            <Input placeholder="Client name" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="flex-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editTarget ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditTarget(null); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 space-y-3">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || statusFilter ? 'No projects match your filters' : 'No projects yet'}
          description="Create your first project to get started."
          action={!search && !statusFilter ? { label: '+ New Project', onClick: () => { setEditTarget(null); setForm({ name: '', description: '', color: '#3B82F6', client: '' }); setShowForm(true); } } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const s = stats[p._id] || { epicCount: 0, ticketCount: 0, openCount: 0, closedCount: 0 };
            return (
              <Link key={p._id} href={`/projects/${p._id}`} className="block">
                <div className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 sm:p-5 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-primary)] transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <FolderIcon color={p.color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{p.name}</h3>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Created by {user?.name || 'Unknown'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            'text-[11px] font-medium px-2 py-0.5 rounded-full',
                            p.status === 'active'
                              ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                              : 'bg-[var(--color-border-light)] text-[var(--color-text-muted)]'
                          )}>
                            ● {p.status}
                          </span>
                          <ActionMenu projectId={p._id} onAction={(action) => handleAction(action, p)} />
                        </div>
                      </div>
                      {p.description && (
                        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1.5 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">{s.epicCount} Epics</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-border-light)] text-[var(--color-text-secondary)]">{s.ticketCount} Tickets</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{s.openCount} Open</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">{s.closedCount} Completed</span>
                      </div>
                    </div>
                    <span className="hidden sm:block text-xs text-[var(--color-text-muted)] shrink-0 whitespace-nowrap pt-0.5">{formatRelativeTime(p.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
