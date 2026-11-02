'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/Button';
import { Skeleton, Spinner } from '@/components/ui/Misc';
import CommandPalette from '@/components/ui/CommandPalette';
import TicketFormDialog from '@/components/tickets/TicketFormDialog';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useAuthStore } from '@/store/authStore';
import { useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import MobileNav, { TopBar } from './MobileNav';
import Sidebar from './Sidebar';

/** Loading placeholder for page content while the workspace loads. */
function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-2 h-7 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="mt-6 h-64" />
    </div>
  );
}

/**
 * Wraps every authenticated page: session gate, workspace data load, navigation chrome,
 * global dialogs and keyboard shortcuts.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, loadUser } = useAuthStore();
  const { loaded, error, load } = useWorkspace();
  const { setPaletteOpen, openNewTicket, hydrateSidebar } = useUi();

  useEffect(() => {
    loadUser();
    hydrateSidebar();
  }, [loadUser, hydrateSidebar]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useHotkeys({
    'ctrl+k': () => setPaletteOpen(true),
    '/': () => setPaletteOpen(true),
    c: () => openNewTicket(),
    'g d': () => router.push('/dashboard'),
    'g t': () => router.push('/tickets'),
    'g b': () => router.push('/board'),
    'g p': () => router.push('/projects'),
    'g c': () => router.push('/calendar'),
    'g r': () => router.push('/reports'),
  });

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas text-fg-subtle">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <a
        href="#main"
        className="sr-only z-[80] rounded-md bg-accent px-3 py-2 text-sm text-accent-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="min-h-0 flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {loaded ? (
              children
            ) : error ? (
              <div className="mx-auto mt-24 max-w-sm text-center">
                <h2 className="text-base font-semibold text-fg">Couldn&apos;t load your workspace</h2>
                <p className="mt-1 text-[13px] text-fg-muted">{error}. Is the API server running?</p>
                <Button className="mt-4" icon={<ArrowPathIcon className="h-4 w-4" />} onClick={() => load(true)}>
                  Try again
                </Button>
              </div>
            ) : (
              <WorkspaceSkeleton />
            )}
          </div>
        </main>
      </div>
      <CommandPalette />
      <TicketFormDialog />
    </div>
  );
}
