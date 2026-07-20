'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Project } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', client: '' });

  const load = () => api.get('/projects').then(({ data }) => setProjects(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/projects', form);
    toast.success('Project created');
    setShowForm(false);
    setForm({ name: '', description: '', color: '#3B82F6', client: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await api.delete(`/projects/${id}`);
    toast.success('Project deleted');
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Projects</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Manage your projects</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New Project</Button>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            placeholder="Project name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3">
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer border border-[var(--color-border)]"
            />
            <Input
              placeholder="Client name"
              value={form.client}
              onChange={e => setForm({ ...form, client: e.target.value })}
              className="flex-1"
            />
          </div>
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
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          action={{ label: '+ New Project', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p._id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: p.color }}>
                    {p.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)]">{p.name}</h3>
                    {p.client && <p className="text-xs text-[var(--color-text-secondary)]">{p.client}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(p._id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] text-sm">✕</button>
              </div>
              {p.description && <p className="text-sm text-[var(--color-text-secondary)] mb-3">{p.description}</p>}
              <span className="text-xs text-[var(--color-text-muted)]">Created {new Date(p.createdAt).toLocaleDateString()}</span>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
