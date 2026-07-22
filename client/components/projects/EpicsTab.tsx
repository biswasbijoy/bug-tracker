'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Epic, Ticket } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { StatusBadge, statusColors } from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';

interface EpicsTabProps {
  epics: Epic[];
  tickets: Ticket[];
  projectId: string;
  search: string;
  onEpicCreated: () => void;
  onTicketCreated: () => void;
  onRefresh: () => void;
}

const priorityVariant: Record<string, 'default' | 'danger' | 'warning' | 'info' | 'primary'> = {
  highest: 'danger', high: 'warning', medium: 'info', low: 'primary', lowest: 'default',
};

export default function EpicsTab({ epics, tickets, projectId, search, onEpicCreated, onTicketCreated, onRefresh }: EpicsTabProps) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const toggleEpic = (id: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getEpicTickets = (epicId: string) =>
    tickets.filter(t => t.epicId && (typeof t.epicId === 'string' ? t.epicId === epicId : t.epicId._id === epicId));

  const getAssigneeName = (ticket: Ticket) => {
    if (typeof ticket.epicId === 'object' && ticket.epicId?.name) return ticket.epicId.name;
    return ticket.assignedTo || 'Unassigned';
  };

  if (epics.length === 0) {
    return (
      <EmptyState
        title={search ? 'No epics match your search' : 'No Epics Found'}
        description="Create your first epic to organize tickets."
        action={!search ? { label: 'Create First Epic', onClick: onEpicCreated } : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {epics.map(epic => {
        const epicTickets = getEpicTickets(epic._id);
        const isExpanded = expandedEpics.has(epic._id);
        const closedCount = epicTickets.filter(t => t.status === 'closed' || t.status === 'cancelled').length;
        const progress = epicTickets.length > 0 ? Math.round((closedCount / epicTickets.length) * 100) : 0;

        return (
          <div key={epic._id} className="border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
            <button
              onClick={() => toggleEpic(epic._id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-border-light)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <svg
                  className={`w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-semibold text-sm text-[var(--color-text-primary)]">{epic.name}</span>
                {epic.description && (
                  <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline truncate">{epic.description}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[var(--color-text-muted)]">{epicTickets.length} tickets</span>
                {epicTickets.length > 0 && (
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">{progress}%</span>
                )}
              </div>
            </button>

            {epicTickets.length > 0 && (
              <div className={`border-t border-[var(--color-border-light)] ${isExpanded ? '' : 'hidden'}`}>
                <div className="px-3 py-2">
                  <ProgressBar value={progress} color={progress >= 80 ? 'success' : progress >= 40 ? 'warning' : 'primary'} size="sm" />
                </div>
                <div className="divide-y divide-[var(--color-border-light)]">
                  {epicTickets.map(ticket => (
                    <Link
                      key={ticket._id}
                      href={`/tickets?search=${ticket.ticketNo}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-border-light)] transition-colors group"
                    >
                      <span className="font-mono text-xs font-bold text-[var(--color-text-muted)] w-16 shrink-0">{ticket.ticketNo}</span>
                      <span className="flex-1 min-w-0 truncate">
                        <span className="inline-flex px-2 py-0.5 rounded group-hover:opacity-80 transition-opacity" style={{ backgroundColor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text }}>
                          {ticket.title}
                        </span>
                      </span>
                      <StatusBadge status={ticket.status} />
                      <Badge variant={priorityVariant[ticket.priority] || 'default'} size="sm">{ticket.priority}</Badge>
                      {ticket.severity && (
                        <span className="text-xs text-[var(--color-text-muted)] hidden lg:inline">{ticket.severity}</span>
                      )}
                      {ticket.assignedTo && (
                        <span className="text-xs text-[var(--color-text-secondary)] hidden lg:inline">{ticket.assignedTo}</span>
                      )}
                      {ticket.labels.length > 0 && (
                        <div className="hidden xl:flex gap-1">
                          {ticket.labels.slice(0, 2).map((l, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-border-light)] text-[var(--color-text-muted)]">{l}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isExpanded && epicTickets.length === 0 && (
              <div className={`border-t border-[var(--color-border-light)] px-4 py-6 ${isExpanded ? '' : 'hidden'}`}>
                <EmptyState
                  title="No Tickets Found"
                  description="This epic has no tickets yet."
                  action={{ label: 'Create Ticket', onClick: onTicketCreated }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
