'use client';

import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/20/solid';
import { Panel } from '@/components/ui/Misc';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/lib/theme-provider';

/**
 * Miniature app mock-ups. They have to show a fixed theme regardless of the active one, so they use
 * fixed palette classes instead of the (theme-switching) semantic tokens.
 */
const PALETTES = {
  light: { canvas: 'bg-zinc-100', panel: 'bg-white', line: 'border-zinc-200', bar: 'bg-zinc-300', barSoft: 'bg-zinc-200', accent: 'bg-indigo-500' },
  dark: { canvas: 'bg-zinc-950', panel: 'bg-zinc-900', line: 'border-zinc-800', bar: 'bg-zinc-600', barSoft: 'bg-zinc-700', accent: 'bg-indigo-400' },
} as const;

function MiniApp({ mode }: { mode: keyof typeof PALETTES }) {
  const p = PALETTES[mode];
  return (
    <div className={cn('flex h-full w-full overflow-hidden', p.canvas)} aria-hidden>
      <div className={cn('w-1/4 space-y-1.5 border-r p-2', p.panel, p.line)}>
        <div className={cn('h-1.5 w-3/4 rounded-full', p.accent)} />
        <div className={cn('h-1.5 w-full rounded-full', p.barSoft)} />
        <div className={cn('h-1.5 w-5/6 rounded-full', p.barSoft)} />
        <div className={cn('h-1.5 w-2/3 rounded-full', p.barSoft)} />
      </div>
      <div className="flex-1 space-y-2 p-2">
        <div className={cn('h-1.5 w-1/3 rounded-full', p.bar)} />
        <div className={cn('space-y-1.5 rounded border p-2', p.panel, p.line)}>
          <div className={cn('h-1.5 w-full rounded-full', p.barSoft)} />
          <div className={cn('h-1.5 w-4/5 rounded-full', p.barSoft)} />
          <div className={cn('h-1.5 w-1/4 rounded-full', p.accent)} />
        </div>
      </div>
    </div>
  );
}

function Preview({ value }: { value: Theme }) {
  if (value !== 'system') return <MiniApp mode={value} />;
  // half light, half dark
  return (
    <div className="relative h-full w-full">
      <MiniApp mode="light" />
      <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-[200%]">
          <MiniApp mode="dark" />
        </div>
      </div>
    </div>
  );
}

const OPTIONS: { value: Theme; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', description: 'Bright surfaces', icon: <SunIcon className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes at night', icon: <MoonIcon className="h-4 w-4" /> },
  { value: 'system', label: 'System', description: 'Follows your device', icon: <ComputerDesktopIcon className="h-4 w-4" /> },
];

export default function AppearanceSettings() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Panel title="Theme">
      <p className="mb-4 text-[13px] text-fg-muted">
        Choose how the tracker looks. Currently showing the <span className="font-medium text-fg">{resolvedTheme}</span> theme.
      </p>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(o.value)}
              className={cn(
                'rounded-lg border bg-panel p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                active ? 'border-accent ring-2 ring-accent/25' : 'border-line-strong hover:border-fg-subtle'
              )}
            >
              <div className="h-20 overflow-hidden rounded-md border border-line">
                <Preview value={o.value} />
              </div>
              <div className="mt-2 flex items-center gap-2 px-1 pb-0.5">
                <span className={cn('shrink-0', active ? 'text-accent' : 'text-fg-subtle')}>{o.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg">{o.label}</div>
                  <div className="truncate text-xs text-fg-muted">{o.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
