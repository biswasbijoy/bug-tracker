'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Form';
import { Skeleton } from '@/components/ui/Misc';
import EpicsPanel from '@/components/planning/EpicsPanel';
import { useQueryParam } from '@/components/planning/helpers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useWorkspace } from '@/store/workspaceStore';

function EpicsContent() {
  const projects = useWorkspace((s) => s.projects);
  const [project, setProject] = useQueryParam('project');
  const projectId = projects.some((p) => p._id === project) ? project : undefined;

  return (
    <>
      <PageHeader
        title="Epics"
        description="Larger pieces of work that group related tickets."
        actions={
          <Select
            aria-label="Filter by project"
            size="sm"
            wrapperClassName="w-full min-w-48 sm:w-56"
            value={projectId || ''}
            onChange={(e) => setProject(e.target.value)}
            options={[{ value: '', label: 'All projects' }, ...projects.map((p) => ({ value: p._id, label: p.status === 'archived' ? `${p.name} (archived)` : p.name }))]}
          />
        }
      />
      <EpicsPanel projectId={projectId} />
    </>
  );
}

export default function EpicsPage() {
  useDocumentTitle('Epics');
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <EpicsContent />
    </Suspense>
  );
}
