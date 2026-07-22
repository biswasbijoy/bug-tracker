'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Ticket } from '@/types';
import { statusColors } from '@/components/ui/StatusBadge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface KanbanTabProps {
  projectId: string;
}

const columns = [
  { id: 'open', label: 'Open' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'ready', label: 'Ready' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'code-review', label: 'Code Review' },
  { id: 'ready-for-qa', label: 'Ready for QA' },
  { id: 'qa-in-progress', label: 'QA In Progress' },
  { id: 'qa-failed', label: 'QA Failed' },
  { id: 'ready-for-release', label: 'Ready for Release' },
  { id: 'released', label: 'Released' },
  { id: 'done', label: 'Done' },
  { id: 'closed', label: 'Closed' },
  { id: 'reopened', label: 'Reopened' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'stage', label: 'Stage' },
];

const priorityVariant: Record<string, 'default' | 'danger' | 'warning' | 'info' | 'primary'> = {
  highest: 'danger', high: 'warning', medium: 'info', low: 'primary', lowest: 'default',
};

export default function KanbanTab({ projectId }: KanbanTabProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tickets?projectId=${projectId}`)
      .then(({ data }) => setTickets(data))
      .finally(() => setLoading(false));
  }, [projectId]);

  const getColumnTickets = (status: string) =>
    tickets.filter(t => t.status === status);

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const updated = [...tickets];
    const idx = updated.findIndex(t => t._id === draggableId);
    if (idx === -1) return;
    updated[idx] = { ...updated[idx], status: destination.droppableId as any };
    setTickets(updated);

    try {
      await api.put(`/tickets/${draggableId}`, { status: destination.droppableId });
      toast.success(`Ticket moved to ${columns.find(c => c.id === destination.droppableId)?.label}`);
    } catch {
      toast.error('Failed to move ticket');
      setTickets(tickets);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {columns.slice(0, 5).map(col => (
          <div key={col.id} className="bg-[var(--color-border-light)] rounded-[var(--radius-card)] p-3 h-48 animate-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map(col => {
            const colTickets = getColumnTickets(col.id);
            return (
              <div key={col.id} className="w-56 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{col.label}</h3>
                  <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-border-light)] px-1.5 py-0.5 rounded-full">{colTickets.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] rounded-[var(--radius-card)] p-2 space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[var(--color-primary-light)]' : 'bg-[var(--color-border-light)]'
                      }`}
                    >
                      {colTickets.map((ticket, index) => (
                        <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-3 shadow-sm ${
                                snapshot.isDragging ? 'shadow-md rotate-2' : ''
                              }`}
                            >
                              <p className="font-mono text-[10px] font-bold text-[var(--color-text-muted)] mb-1">{ticket.ticketNo}</p>
                              <p className="text-xs font-medium mb-2 line-clamp-2">
                                <span className="inline-flex px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>{ticket.title}</span>
                              </p>
                              <div className="flex items-center gap-1">
                                <Badge variant={priorityVariant[ticket.priority] || 'default'} size="sm">{ticket.priority}</Badge>
                                {ticket.assignedTo && (
                                  <span className="text-[10px] text-[var(--color-text-muted)] truncate ml-auto">{ticket.assignedTo}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colTickets.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-xs text-[var(--color-text-muted)]">No tickets</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    </div>
  );
}
