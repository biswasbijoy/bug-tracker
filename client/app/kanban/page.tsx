'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import api from '@/services/api';
import { Ticket } from '@/types';
import { statusColors } from '@/components/ui/StatusBadge';
import AppLayout from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const columns = [
  { id: 'open', title: 'Open' },
  { id: 'backlog', title: 'Backlog' },
  { id: 'ready', title: 'Ready' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'code-review', title: 'Code Review' },
  { id: 'ready-for-qa', title: 'Ready for QA' },
  { id: 'qa-in-progress', title: 'QA In Progress' },
  { id: 'qa-failed', title: 'QA Failed' },
  { id: 'ready-for-release', title: 'Ready for Release' },
  { id: 'released', title: 'Released' },
  { id: 'done', title: 'Done' },
  { id: 'closed', title: 'Closed' },
  { id: 'reopened', title: 'Reopened' },
  { id: 'cancelled', title: 'Cancelled' },
  { id: 'stage', title: 'Stage' },
];

export default function KanbanPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets').then(({ data }) => {
      setTickets(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getColumnTickets = (status: string) =>
    tickets.filter(t => t.status === status);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    setTickets(prev =>
      prev.map(t => t._id === draggableId ? { ...t, status: newStatus as any } : t)
    );

    try {
      await api.put(`/tickets/${draggableId}`, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
    } catch {
      load();
      toast.error('Failed to update status');
    }
  };

  const load = () => api.get('/tickets').then(({ data }) => setTickets(data));

  return (
    <AppLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Kanban Board</h1>
        <p className="text-xs text-[var(--color-text-secondary)]">Drag and drop tickets to update status</p>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className="flex-shrink-0 w-64">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="Create your first ticket to see it on the board."
        />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
            {columns.map(col => (
              <div key={col.id} className="flex-shrink-0 w-64">
                <div className="bg-[var(--color-border-light)] rounded-t-[var(--radius-card)] px-3 py-2">
                  <h3 className="font-bold text-xs text-[var(--color-text-primary)]">{col.title}</h3>
                  <span className="text-[10px] text-[var(--color-text-secondary)]">{getColumnTickets(col.id).length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-[var(--color-bg)] rounded-b-[var(--radius-card)] p-2 min-h-[60vh] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[var(--color-primary-light)]' : ''
                      }`}
                    >
                      {getColumnTickets(col.id).map((ticket, index) => (
                        <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-[var(--color-surface)] rounded-[var(--radius-card)] p-2 mb-2 border border-[var(--color-border)] shadow-[var(--shadow-card)] transition-shadow ${
                                snapshot.isDragging ? 'shadow-[var(--shadow-card-hover)] border-[var(--color-primary)]' : ''
                              }`}
                            >
                              <p className="text-xs font-bold text-[var(--color-text-muted)] mb-1">{ticket.ticketNo}</p>
                              <p className="text-sm font-medium truncate">
                                <span className="inline-flex px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>{ticket.title}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs capitalize priority-${ticket.priority}`}>{ticket.priority}</span>
                                <span className="text-xs text-[var(--color-text-muted)]">{ticket.type}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </AppLayout>
  );
}
