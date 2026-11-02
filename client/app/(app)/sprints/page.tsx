'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Form';
import { Skeleton } from '@/components/ui/Misc';
import SprintsPanel from '@/components/planning/SprintsPanel';
import { useQueryParam } from '@/components/planning/helpers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useWorkspace } from '@/store/workspaceStore';

function SprintsContent() {
  const projects = useWorkspace((s) => s.projects);
  const [project, setProject] = useQueryParam('project');
  const projectId = projects.some((p) => p._id === project) ? project : undefined;

  return (
    <>
      <PageHeader
        title="Sprints"
        description="Time-boxed iterations: plan, start and complete them."
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
      <SprintsPanel projectId={projectId} />
    </>
  );
}

export default function SprintsPage() {
  useDocumentTitle('Sprints');
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <SprintsContent />
    </Suspense>
  );
}
