'use client';

import { useState } from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Switch from '@/components/ui/Switch';
import { TicketStatus, TicketPriority, TicketEnvironment } from '@/types';

interface FilterValues {
  status: TicketStatus[];
  priority: TicketPriority[];
  environment: TicketEnvironment[];
  dateFrom: string;
  dateTo: string;
  projectId: string;
  epicId: string;
  sprintId: string;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterValues;
  onApply: (filters: FilterValues) => void;
  projects?: { _id: string; name: string }[];
  epics?: { _id: string; name: string }[];
  sprints?: { _id: string; name: string }[];
}

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'ready', label: 'Ready' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'code-review', label: 'Code Review' },
  { value: 'ready-for-qa', label: 'Ready for QA' },
  { value: 'qa-in-progress', label: 'QA In Progress' },
  { value: 'qa-failed', label: 'QA Failed' },
  { value: 'ready-for-release', label: 'Ready for Release' },
  { value: 'released', label: 'Released' },
  { value: 'done', label: 'Done' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'stage', label: 'Stage' },
];

const priorityOptions = [
  { value: 'highest', label: 'Highest' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'lowest', label: 'Lowest' },
];

const environmentOptions = [
  { value: 'local', label: 'Local' },
  { value: 'dev', label: 'Dev' },
  { value: 'qa', label: 'QA' },
  { value: 'staging', label: 'Staging' },
  { value: 'uat', label: 'UAT' },
  { value: 'production', label: 'Production' },
];

export default function FilterPanel({ isOpen, onClose, filters, onApply, projects = [], epics = [], sprints = [] }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>({ ...filters });

  const handleMultiToggle = (field: 'status' | 'priority' | 'environment', value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: prev[field].includes(value as never)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value as never],
    }));
  };

  const handleClear = () => {
    setLocalFilters({
      status: [],
      priority: [],
      environment: [],
      dateFrom: '',
      dateTo: '',
      projectId: '',
      epicId: '',
      sprintId: '',
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const activeFilterCount =
    localFilters.status.length +
    localFilters.priority.length +
    localFilters.environment.length +
    (localFilters.dateFrom ? 1 : 0) +
    (localFilters.dateTo ? 1 : 0) +
    (localFilters.projectId ? 1 : 0) +
    (localFilters.epicId ? 1 : 0) +
    (localFilters.sprintId ? 1 : 0);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Filters ${activeFilterCount > 0 ? `(${activeFilterCount})` : ''}`} side="right" size="md">
      <div className="space-y-6">
        {/* Status */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Status</h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleMultiToggle('status', opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  localFilters.status.includes(opt.value as TicketStatus)
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Priority</h4>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleMultiToggle('priority', opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  localFilters.priority.includes(opt.value as TicketPriority)
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Environment */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Environment</h4>
          <div className="flex flex-wrap gap-2">
            {environmentOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleMultiToggle('environment', opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  localFilters.environment.includes(opt.value as TicketEnvironment)
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Date Range</h4>
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="From"
              value={localFilters.dateFrom}
              onChange={(date) => setLocalFilters((prev) => ({ ...prev, dateFrom: date }))}
            />
            <DatePicker
              label="To"
              value={localFilters.dateTo}
              onChange={(date) => setLocalFilters((prev) => ({ ...prev, dateTo: date }))}
              min={localFilters.dateFrom}
            />
          </div>
        </div>

        {/* Project */}
        {projects.length > 0 && (
          <Select
            label="Project"
            value={localFilters.projectId}
            onChange={(e) => setLocalFilters((prev) => ({ ...prev, projectId: e.target.value }))}
            options={projects.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="All Projects"
          />
        )}

        {/* Epic */}
        {epics.length > 0 && (
          <Select
            label="Epic"
            value={localFilters.epicId}
            onChange={(e) => setLocalFilters((prev) => ({ ...prev, epicId: e.target.value }))}
            options={epics.map((e) => ({ value: e._id, label: e.name }))}
            placeholder="All Epics"
          />
        )}

        {/* Sprint */}
        {sprints.length > 0 && (
          <Select
            label="Sprint"
            value={localFilters.sprintId}
            onChange={(e) => setLocalFilters((prev) => ({ ...prev, sprintId: e.target.value }))}
            options={sprints.map((s) => ({ value: s._id, label: s.name }))}
            placeholder="All Sprints"
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Clear All
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
