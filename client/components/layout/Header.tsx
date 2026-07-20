'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/lib/theme-provider';
import Avatar from '@/components/ui/Avatar';
import Tooltip from '@/components/ui/Tooltip';

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export default function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-lg border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between h-12 px-4 lg:px-5">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-secondary)]"
            aria-label="Open menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            onClick={onSearchClick}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-border-light)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
            <kbd className="ml-1 px-1 py-0.5 text-[9px] font-medium bg-[var(--color-surface)] rounded border border-[var(--color-border)]">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onSearchClick}
            className="md:hidden p-1.5 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-secondary)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-secondary)]"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </Tooltip>

          <Link
            href="/notifications"
            className="relative p-1.5 rounded-lg hover:bg-[var(--color-border-light)] text-[var(--color-text-secondary)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--color-danger)] rounded-full" />
          </Link>

          <div className="flex items-center gap-1.5 ml-1.5 pl-2 border-l border-[var(--color-border)]">
            <Avatar name={user?.name || 'U'} size="xs" />
            <button
              onClick={logout}
              className="p-1 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
