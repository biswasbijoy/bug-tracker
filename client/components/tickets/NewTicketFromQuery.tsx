'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUi } from '@/store/uiStore';
import type { TicketInput } from '@/types';

/** Opens the "new ticket" dialog when the URL contains `?new=1`, then removes the parameter. Render inside <Suspense>. */
export default function NewTicketFromQuery({ defaults }: { defaults?: TicketInput }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openNewTicket = useUi((s) => s.openNewTicket);

  useEffect(() => {
    if (params.get('new') !== '1') return;
    openNewTicket(defaults);
    const next = new URLSearchParams(params.toString());
    next.delete('new');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return null;
}
