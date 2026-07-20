'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Epic, Project } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export default function EpicsPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', projectId: '' });

  const load = async () => {
    const [epicsRes, projectsRes] = await Promise.all([
      api.get('/epics'),
      api.get('/projects'),
    ]);
    setEpics(epicsRes.data);
    setProjects(projectsRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/epics', form);
    toast.success('Epic created');
    setShowForm(false);
    setForm({ name: '', description: '', projectId: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this epic?')) return;
    await api.delete(`/epics/${id}`);
    toast.success('Epic deleted');
    load();
  };

  const getProjectName = (id: string) => projects.find(p => p._id === id)?.name || 'Unknown';

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
        <form onSubmit={handleCreate} className="space-y-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {epics.map((e) => (
            <Card key={e._id} hover>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-[var(--color-text-primary)]">{e.name}</h3>
                <button onClick={() => handleDelete(e._id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] text-sm">✕</button>
              </div>
              <p className="text-xs text-[var(--color-primary)] font-medium mb-2">{getProjectName(e.projectId)}</p>
              {e.description && <p className="text-sm text-[var(--color-text-secondary)] mb-2">{e.description}</p>}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                e.status === 'active'
                  ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                  : 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]'
              )}>{e.status}</span>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
