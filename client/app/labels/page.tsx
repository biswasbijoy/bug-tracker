'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Label } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#6B7280' });

  const load = () => api.get('/labels').then(({ data }) => setLabels(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/labels', form);
    toast.success('Label created');
    setShowForm(false);
    setForm({ name: '', color: '#6B7280' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this label?')) return;
    await api.delete(`/labels/${id}`);
    toast.success('Label deleted');
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Labels</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Manage ticket labels</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<span>+</span>}>
          New Label
        </Button>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Label" size="sm">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Label name"
            placeholder="Label name"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">Choose color</span>
            </div>
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
      ) : labels.length === 0 ? (
        <EmptyState
          title="No labels yet"
          description="Create your first label to organize tickets."
          action={{ label: '+ New Label', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          {labels.map(l => (
            <Card key={l._id} hover padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full shrink-0" style={{ background: l.color }} />
                <span className="font-medium text-[var(--color-text-primary)]">{l.name}</span>
                <button
                  onClick={() => handleDelete(l._id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] ml-2 text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
