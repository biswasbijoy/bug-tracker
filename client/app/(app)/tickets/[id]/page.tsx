'use client';

import { useParams } from 'next/navigation';
import TicketDetail from '@/components/tickets/TicketDetail';

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <TicketDetail key={id} id={id} />;
}
