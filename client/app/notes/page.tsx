'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Note } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const load = () => api.get('/notes').then(({ data }) => setNotes(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNote) {
      await api.put(`/notes/${editingNote._id}`, { title, content });
      toast.success('Note updated');
    } else {
      await api.post('/notes', { title, content });
      toast.success('Note created');
    }
    setEditingNote(null);
    setTitle('');
    setContent('');
    load();
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await api.delete(`/notes/${id}`);
    toast.success('Note deleted');
    load();
  };

  return (
    <AppLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Personal Notes</h1>
        <p className="text-xs text-[var(--color-text-secondary)]">Your personal notebook</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <Card padding="sm">
            <form onSubmit={handleSave} className="space-y-2">
              <Input
                placeholder="Note title"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write your note..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
              />
              <div className="flex gap-2">
                <Button type="submit">
                  {editingNote ? 'Update' : 'Save'}
                </Button>
                {editingNote && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { setEditingNote(null); setTitle(''); setContent(''); }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Create your first note to get started."
            />
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <Card key={note._id}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-[var(--color-text-primary)]">{note.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(note)}
                        className="text-[var(--color-primary)] text-sm hover:underline transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="text-[var(--color-danger)] text-sm hover:underline transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">{new Date(note.updatedAt).toLocaleString()}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
