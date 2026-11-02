'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ArrowPathRoundedSquareIcon, CalendarDaysIcon, ChartBarIcon, Cog6ToothIcon, FolderIcon, HomeIcon,
  MagnifyingGlassIcon, MoonIcon, PencilSquareIcon, PlusIcon, RectangleStackIcon, TicketIcon, ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-provider';
import { useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import { TicketKey, TypeIcon } from '@/components/tickets/badges';
import { Kbd } from './Misc';

interface Item {
  id: string;
  group: 'Actions' | 'Go to' | 'Projects' | 'Tickets';
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

const ic = 'h-4 w-4';

/** Ctrl/⌘ K: jump to any page, project or ticket, or run an action. */
export default function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const openNewTicket = useUi((s) => s.openNewTicket);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const tickets = useWorkspace((s) => s.tickets);
  const projects = useWorkspace((s) => s.projects);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const go = (href: string) => () => router.push(href);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      { id: 'a-ticket', group: 'Actions', label: 'Create ticket', hint: 'C', icon: <PlusIcon className={ic} />, keywords: 'new add', run: () => openNewTicket() },
      { id: 'a-project', group: 'Actions', label: 'Create project', icon: <FolderIcon className={ic} />, keywords: 'new add', run: go('/projects?new=1') },
      {
        id: 'a-theme',
        group: 'Actions',
        label: resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: <MoonIcon className={ic} />,
        keywords: 'dark light appearance',
        run: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      },
      { id: 'n-home', group: 'Go to', label: 'Home', hint: 'G D', icon: <HomeIcon className={ic} />, run: go('/dashboard') },
      { id: 'n-tickets', group: 'Go to', label: 'Tickets', hint: 'G T', icon: <TicketIcon className={ic} />, run: go('/tickets') },
      { id: 'n-board', group: 'Go to', label: 'Board', hint: 'G B', icon: <ViewColumnsIcon className={ic} />, keywords: 'kanban', run: go('/board') },
      { id: 'n-projects', group: 'Go to', label: 'Projects', hint: 'G P', icon: <FolderIcon className={ic} />, run: go('/projects') },
      { id: 'n-epics', group: 'Go to', label: 'Epics', icon: <RectangleStackIcon className={ic} />, run: go('/epics') },
      { id: 'n-sprints', group: 'Go to', label: 'Sprints', icon: <ArrowPathRoundedSquareIcon className={ic} />, run: go('/sprints') },
      { id: 'n-cal', group: 'Go to', label: 'Calendar', hint: 'G C', icon: <CalendarDaysIcon className={ic} />, run: go('/calendar') },
      { id: 'n-reports', group: 'Go to', label: 'Reports', hint: 'G R', icon: <ChartBarIcon className={ic} />, keywords: 'analytics charts', run: go('/reports') },
      { id: 'n-notes', group: 'Go to', label: 'Notes', icon: <PencilSquareIcon className={ic} />, run: go('/notes') },
      { id: 'n-settings', group: 'Go to', label: 'Settings', icon: <Cog6ToothIcon className={ic} />, keywords: 'profile labels theme', run: go('/settings') },
    ];
    const projectItems: Item[] = projects
      .filter((p) => p.status === 'active')
      .map((p) => ({
        id: `p-${p._id}`,
        group: 'Projects',
        label: p.name,
        icon: <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />,
        run: go(`/projects/${p._id}`),
      }));
    const ticketItems: Item[] = [...tickets]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .map((t) => ({
        id: `t-${t._id}`,
        group: 'Tickets',
        label: t.title,
        hint: t.ticketNo,
        icon: <TypeIcon type={t.type} />,
        keywords: `${t.ticketNo} ${t.assignedTo || ''} ${t.labels.join(' ')}`,
        run: go(`/tickets/${t._id}`),
      }));
    return [...base, ...projectItems, ...ticketItems];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, projects, resolvedTheme]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...items.filter((i) => i.group !== 'Tickets' && i.group !== 'Projects'), ...items.filter((i) => i.group === 'Tickets').slice(0, 5)];
    const tokens = q.split(/\s+/);
    return items
      .filter((i) => {
        const hay = `${i.label} ${i.hint || ''} ${i.keywords || ''} ${i.group}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 30);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!mounted || !open) return null;

  const choose = (item?: Item) => {
    if (!item) return;
    setOpen(false);
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let lastGroup = '';
  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="anim-pop flex max-h-[70dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-lg"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <MagnifyingGlassIcon className="h-[18px] w-[18px] text-fg-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets, projects, pages…"
            className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
            aria-label="Search"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] text-fg-muted">Nothing found for “{query}”</div>
          ) : (
            results.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {showGroup && (
                    <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">{item.group}</div>
                  )}
                  <button
                    type="button"
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-fg',
                      i === active && 'bg-subtle'
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-fg-subtle">{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.hint &&
                      (item.group === 'Tickets' ? <TicketKey ticketNo={item.hint} /> : <span className="text-xs text-fg-subtle">{item.hint}</span>)}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
