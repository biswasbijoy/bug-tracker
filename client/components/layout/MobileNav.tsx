'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bars3Icon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/ui/Button';
import { useUi } from '@/store/uiStore';
import { Logo } from './Logo';
import NotificationsMenu from './NotificationsMenu';
import { SidebarContent } from './Sidebar';

/** Top bar shown below the `lg` breakpoint (the desktop sidebar is hidden there). */
export function TopBar() {
  const { setMobileNavOpen, setPaletteOpen, openNewTicket } = useUi();
  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-panel px-2 lg:hidden">
      <IconButton label="Open menu" onClick={() => setMobileNavOpen(true)}>
        <Bars3Icon className="h-5 w-5" />
      </IconButton>
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <Logo className="h-6 w-6" />
        <span className="truncate text-sm font-semibold text-fg">Tracker</span>
      </div>
      <IconButton label="Search" onClick={() => setPaletteOpen(true)}>
        <MagnifyingGlassIcon className="h-[18px] w-[18px]" />
      </IconButton>
      <NotificationsMenu />
      <IconButton label="New ticket" onClick={() => openNewTicket()} className="bg-accent text-accent-fg hover:bg-accent-hover hover:text-accent-fg">
        <PlusIcon className="h-5 w-5" strokeWidth={2.5} />
      </IconButton>
    </header>
  );
}

/** Slide-in drawer with the same navigation as the desktop sidebar. */
export default function MobileNav() {
  const open = useUi((s) => s.mobileNavOpen);
  const setOpen = useUi((s) => s.setMobileNavOpen);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="anim-fade absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="anim-slide-left absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-line bg-panel shadow-lg">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}
