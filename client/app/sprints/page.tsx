'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Sprint, Project } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', projectId: '', startDate: '', endDate: '' });

  const load = async () => {
    const [sprintsRes, projectsRes] = await Promise.all([
      api.get('/sprints'),
      api.get('/projects'),
    ]);
    setSprints(sprintsRes.data);
    setProjects(projectsRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/sprints', form);
    toast.success('Sprint created');
    setShowForm(false);
    setForm({ name: '', projectId: '', startDate: '', endDate: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sprint?')) return;
    await api.delete(`/sprints/${id}`);
    toast.success('Sprint deleted');
    load();
  };

  const getProjectName = (id: string) => projects.find(p => p._id === id)?.name || 'Unknown';

  const statusStyles: Record<string, string> = {
    active: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    completed: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Sprints</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Manage your sprints</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<span>+</span>}>
          New Sprint
        </Button>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Sprint" size="sm">
        <form onSubmit={handleCreate} className="space-y-3">
          <Select
            label="Project"
            required
            placeholder="Select project"
            value={form.projectId}
            onChange={e => setForm({ ...form, projectId: e.target.value })}
            options={projects.map(p => ({ value: p._id, label: p.name }))}
          />
          <Input
            label="Sprint name"
            placeholder="e.g. Sprint 10"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <div className="flex gap-2">
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End date"
              type="date"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
        </div>
      ) : sprints.length === 0 ? (
        <EmptyState
          title="No sprints yet"
          description="Create your first sprint to get started."
          action={{ label: '+ New Sprint', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sprints.map((s) => (
            <Card key={s._id} hover>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-[var(--color-text-primary)]">{s.name}</h3>
                <button
                  onClick={() => handleDelete(s._id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-[var(--color-primary)] font-medium mb-2">{getProjectName(s.projectId)}</p>
              <div className="flex gap-4 text-xs text-[var(--color-text-secondary)] mb-2">
                {s.startDate && <span>Start: {new Date(s.startDate).toLocaleDateString()}</span>}
                {s.endDate && <span>End: {new Date(s.endDate).toLocaleDateString()}</span>}
              </div>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                statusStyles[s.status] ?? 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]',
              )}>
                {s.status}
              </span>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
