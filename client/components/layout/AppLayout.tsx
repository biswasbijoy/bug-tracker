'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileDrawer from './MobileDrawer';
import CommandPalette from '@/components/ui/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, user, loadUser } = useAuthStore();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [isLoading, user, router]);

  useKeyboardShortcuts({
    'ctrl+k': () => setSearchOpen(true),
    '/': () => setSearchOpen(true),
  });

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const commandItems = [
    { id: 'dashboard', label: 'Go to Dashboard', category: 'Navigation', action: () => router.push('/dashboard') },
    { id: 'projects', label: 'Go to Projects', category: 'Navigation', action: () => router.push('/projects') },
    { id: 'tickets', label: 'Go to Tickets', category: 'Navigation', action: () => router.push('/tickets') },
    { id: 'kanban', label: 'Go to Kanban Board', category: 'Navigation', action: () => router.push('/kanban') },
    { id: 'reports', label: 'Go to Reports', category: 'Navigation', action: () => router.push('/reports') },
    { id: 'calendar', label: 'Go to Calendar', category: 'Navigation', action: () => router.push('/calendar') },
    { id: 'notes', label: 'Go to Notes', category: 'Navigation', action: () => router.push('/notes') },
    { id: 'settings', label: 'Go to Settings', category: 'Navigation', action: () => router.push('/settings') },
    { id: 'new-ticket', label: 'Create New Ticket', category: 'Actions', action: () => router.push('/tickets?new=true') },
    { id: 'new-project', label: 'Create New Project', category: 'Actions', action: () => router.push('/projects?new=true') },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setMobileDrawerOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 lg:px-6 lg:py-5 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={commandItems}
        placeholder="Search or jump to..."
      />
    </div>
  );
}
