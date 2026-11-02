'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowPathRoundedSquareIcon, CalendarDaysIcon, ChartBarIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon,
  Cog6ToothIcon, HomeIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, RectangleStackIcon, TicketIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { isOpen } from '@/lib/tickets';
import { Kbd } from '@/components/ui/Misc';
import { IconButton } from '@/components/ui/Button';
import { useWorkspace } from '@/store/workspaceStore';
import { useUi } from '@/store/uiStore';
import { Logo } from './Logo';
import NotificationsMenu from './NotificationsMenu';
import UserMenu from './UserMenu';

type Icon = React.ComponentType<{ className?: string }>;

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  count?: number;
}

interface SidebarContentProps {
  collapsed?: boolean;
  /** called after any navigation (closes the mobile drawer) */
  onNavigate?: () => void;
}

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed?: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
        collapsed && 'justify-center',
        active ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-subtle hover:text-fg'
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.count !== undefined && item.count > 0 && (
        <span className={cn('text-xs tabular-nums', active ? 'text-accent' : 'text-fg-subtle')}>{item.count}</span>
      )}
    </Link>
  );
}

export function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const tickets = useWorkspace((s) => s.tickets);
  const projects = useWorkspace((s) => s.projects);
  const { openNewTicket, setPaletteOpen, toggleSidebar } = useUi();

  const openCount = useMemo(() => tickets.filter((t) => isOpen(t.status)).length, [tickets]);
  const openByProject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tickets) if (isOpen(t.status)) map[t.projectId] = (map[t.projectId] || 0) + 1;
    return map;
  }, [tickets]);

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  const main: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/tickets', label: 'Tickets', icon: TicketIcon, count: openCount },
    { href: '/board', label: 'Board', icon: ViewColumnsIcon },
    { href: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
    { href: '/reports', label: 'Reports', icon: ChartBarIcon },
  ];
  const planning: NavItem[] = [
    { href: '/epics', label: 'Epics', icon: RectangleStackIcon },
    { href: '/sprints', label: 'Sprints', icon: ArrowPathRoundedSquareIcon },
  ];
  const bottom: NavItem[] = [
    { href: '/notes', label: 'Notes', icon: PencilSquareIcon },
    { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  const activeProjects = projects.filter((p) => p.status === 'active');

  const sectionLabel = (text: string, action?: React.ReactNode) =>
    collapsed ? (
      <div className="mx-2 my-2 h-px bg-line" />
    ) : (
      <div className="mb-1 mt-4 flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
        {text}
        {action}
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* brand + global actions */}
      <div className={cn('flex h-14 shrink-0 items-center gap-2 px-3', collapsed && 'flex-col justify-center gap-1 px-1.5')}>
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2" aria-label="Home">
          <Logo />
          {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight text-fg">Tracker</span>}
        </Link>
        {!collapsed && <NotificationsMenu />}
      </div>

      <div className={cn('shrink-0 space-y-2 px-3 pb-2', collapsed && 'px-1.5')}>
        <button
          type="button"
          onClick={() => {
            openNewTicket();
            onNavigate?.();
          }}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg shadow-sm transition-colors hover:bg-accent-hover',
            collapsed && 'justify-center px-0'
          )}
          title="New ticket (C)"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">New ticket</span>
              <span className="rounded border border-white/30 bg-white/15 px-1.5 font-mono text-[10px] leading-4 text-accent-fg">C</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setPaletteOpen(true);
            onNavigate?.();
          }}
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-md border border-line bg-panel px-2.5 text-[13px] text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted',
            collapsed && 'justify-center px-0'
          )}
          title="Search (Ctrl K)"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search…</span>
              <Kbd>Ctrl K</Kbd>
            </>
          )}
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label="Main" style={collapsed ? { paddingInline: 6 } : undefined}>
        <div className="space-y-0.5">
          {main.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>

        {sectionLabel(
          'Projects',
          <Link href="/projects?new=1" onClick={onNavigate} aria-label="New project" className="rounded p-0.5 text-fg-subtle hover:bg-subtle hover:text-fg">
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        )}
        <div className="space-y-0.5">
          {!collapsed && (
            <Link
              href="/projects"
              onClick={onNavigate}
              aria-current={pathname === '/projects' ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
                pathname === '/projects' ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-subtle hover:text-fg'
              )}
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center text-[11px]">▦</span>
              <span className="flex-1">All projects</span>
              <span className="text-xs text-fg-subtle">{activeProjects.length}</span>
            </Link>
          )}
          {activeProjects.map((p) => {
            const href = `/projects/${p._id}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={p._id}
                href={href}
                onClick={onNavigate}
                title={collapsed ? p.name : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
                  collapsed && 'justify-center',
                  active ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-subtle hover:text-fg'
                )}
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
                </span>
                {!collapsed && <span className="flex-1 truncate">{p.name}</span>}
                {!collapsed && !!openByProject[p._id] && <span className="text-xs tabular-nums text-fg-subtle">{openByProject[p._id]}</span>}
              </Link>
            );
          })}
        </div>

        {sectionLabel('Planning')}
        <div className="space-y-0.5">
          {planning.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className={cn('shrink-0 space-y-0.5 border-t border-line p-3', collapsed && 'px-1.5')}>
        {bottom.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        <div className="flex items-center gap-1 pt-1">
          <div className="min-w-0 flex-1">
            <UserMenu collapsed={collapsed} />
          </div>
          {!onNavigate && (
            <IconButton
              label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              size="sm"
              onClick={toggleSidebar}
              className={cn('hidden lg:inline-flex', collapsed && 'hidden')}
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </IconButton>
          )}
        </div>
        {collapsed && !onNavigate && (
          <IconButton label="Expand sidebar" size="sm" onClick={toggleSidebar} className="mx-auto hidden lg:inline-flex">
            <ChevronDoubleRightIcon className="h-4 w-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed);
  return (
    <aside
      className={cn(
        'hidden h-full shrink-0 border-r border-line bg-panel transition-[width] duration-200 lg:block',
        collapsed ? 'w-[60px]' : 'w-64'
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}
