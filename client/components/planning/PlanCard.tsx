'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/Misc';
import type { Hue } from '@/lib/tickets';

/** Link styled like a small outline Button (for "View tickets"). */
export function LinkButton({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-7 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-line-strong bg-panel px-2.5 text-[13px] font-medium text-fg transition-colors hover:bg-subtle',
        className
      )}
    >
      {children}
    </Link>
  );
}

interface PlanCardProps {
  title: React.ReactNode;
  /** status badge (or menu trigger) next to the title */
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: string;
  /** ellipsis menu */
  menu?: React.ReactNode;
  progress: { done: number; total: number; hue?: Hue };
  /** left side of the footer (counts etc.) */
  meta?: React.ReactNode;
  /** right side of the footer (buttons) */
  actions?: React.ReactNode;
}

/** Shared card for epics and sprints. */
export function PlanCard({ title, badge, subtitle, description, menu, progress, meta, actions }: PlanCardProps) {
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <article className="rounded-lg border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 break-words text-[15px] font-semibold text-fg">{title}</h3>
            {badge}
          </div>
          {subtitle && <div className="mt-0.5 text-xs text-fg-muted">{subtitle}</div>}
        </div>
        {menu}
      </div>

      {description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-[13px] leading-5 text-fg-muted">{description}</p>}

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-fg-muted">
          <span>
            {progress.done} of {progress.total} {progress.total === 1 ? 'ticket' : 'tickets'} done
          </span>
          <span className="font-medium tabular-nums text-fg">{pct}%</span>
        </div>
        <ProgressBar value={pct} hue={progress.hue} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
        <div className="text-xs text-fg-muted">{meta}</div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </article>
  );
}
