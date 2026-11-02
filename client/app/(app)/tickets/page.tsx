'use client';

import { Suspense } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import NewTicketFromQuery from '@/components/tickets/NewTicketFromQuery';
import TicketsWorkspace from '@/components/tickets/TicketsWorkspace';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useUi } from '@/store/uiStore';

export default function TicketsPage() {
  useDocumentTitle('Tickets');
  const openNewTicket = useUi((s) => s.openNewTicket);

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Everything you're tracking, grouped by pipeline stage."
        actions={
          <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => openNewTicket()}>
            New ticket
          </Button>
        }
      />
      <Suspense fallback={null}>
        <NewTicketFromQuery />
        <TicketsWorkspace mode="list" />
      </Suspense>
    </>
  );
}
