'use client';

import { Fragment } from 'react';
import { Kbd, Panel } from '@/components/ui/Misc';

type Combo = { keys: string[]; join?: 'then' | 'or' | '+' };

interface Shortcut {
  label: string;
  /** alternatives, e.g. Ctrl K or / */
  combos: Combo[];
}

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: 'General',
    items: [
      { label: 'New ticket', combos: [{ keys: ['C'] }] },
      { label: 'Search & command palette', combos: [{ keys: ['Ctrl', 'K'], join: '+' }, { keys: ['/'] }] },
      { label: 'Close dialogs, menus and the palette', combos: [{ keys: ['Esc'] }] },
    ],
  },
  {
    title: 'Go to',
    items: [
      { label: 'Home', combos: [{ keys: ['G', 'D'], join: 'then' }] },
      { label: 'Tickets', combos: [{ keys: ['G', 'T'], join: 'then' }] },
      { label: 'Board', combos: [{ keys: ['G', 'B'], join: 'then' }] },
      { label: 'Projects', combos: [{ keys: ['G', 'P'], join: 'then' }] },
      { label: 'Calendar', combos: [{ keys: ['G', 'C'], join: 'then' }] },
      { label: 'Reports', combos: [{ keys: ['G', 'R'], join: 'then' }] },
    ],
  },
  {
    title: 'In the command palette',
    items: [
      { label: 'Move between results', combos: [{ keys: ['↑'] }, { keys: ['↓'] }] },
      { label: 'Open the selected result', combos: [{ keys: ['Enter'] }] },
    ],
  },
];

function Keys({ combo }: { combo: Combo }) {
  return (
    <span className="inline-flex items-center gap-1">
      {combo.keys.map((k, i) => (
        <Fragment key={k}>
          {i > 0 && combo.join && combo.join !== '+' && <span className="px-0.5 text-[11px] text-fg-subtle">{combo.join}</span>}
          {i > 0 && combo.join === '+' && <span className="text-[11px] text-fg-subtle">+</span>}
          <Kbd>{k}</Kbd>
        </Fragment>
      ))}
    </span>
  );
}

function ShortcutRow({ item }: { item: Shortcut }) {
  return (
    <li className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-fg">{item.label}</span>
      <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
        {item.combos.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-[11px] text-fg-subtle">or</span>}
            <Keys combo={c} />
          </Fragment>
        ))}
      </span>
    </li>
  );
}

export default function ShortcutsSettings() {
  return (
    <Panel title="Keyboard shortcuts">
      <p className="mb-4 text-[13px] text-fg-muted">
        Single-key shortcuts work anywhere except while you&apos;re typing in a field. On a Mac, use <Kbd>⌘</Kbd> instead of{' '}
        <Kbd>Ctrl</Kbd>.
      </p>
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{g.title}</h3>
            <ul className="divide-y divide-line">
              {g.items.map((it) => (
                <ShortcutRow key={it.label} item={it} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}
