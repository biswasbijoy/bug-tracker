'use client';

import { useRouter } from 'next/navigation';
import { ArrowRightStartOnRectangleIcon, Cog6ToothIcon, ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/20/solid';
import { Avatar } from '@/components/ui/Avatar';
import { Popover } from '@/components/ui/Popover';
import { Segmented } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/lib/theme-provider';
import { useAuthStore } from '@/store/authStore';

export default function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  if (!user) return null;

  return (
    <Popover
      width={248}
      trigger={
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-subtle',
            collapsed && 'justify-center'
          )}
          aria-label="Account menu"
        >
          <Avatar name={user.name} size="md" />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-fg">{user.name}</span>
              <span className="block truncate text-xs text-fg-subtle">{user.email}</span>
            </span>
          )}
        </button>
      }
    >
      {({ close }) => (
        <div className="space-y-1">
          <div className="px-2.5 pb-1 pt-2">
            <div className="truncate text-[13px] font-semibold text-fg">{user.name}</div>
            <div className="truncate text-xs text-fg-subtle">{user.email}</div>
          </div>
          <div className="px-2.5 py-1.5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Theme</div>
            <Segmented<Theme>
              size="sm"
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', icon: <SunIcon />, title: 'Light' },
                { value: 'dark', icon: <MoonIcon />, title: 'Dark' },
                { value: 'system', icon: <ComputerDesktopIcon />, title: 'System' },
              ]}
            />
          </div>
          <div className="h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              close();
              router.push('/settings');
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-fg hover:bg-subtle"
          >
            <Cog6ToothIcon className="h-4 w-4 text-fg-subtle" /> Settings
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              logout();
              router.replace('/auth');
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-danger hover:bg-subtle"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </Popover>
  );
}
