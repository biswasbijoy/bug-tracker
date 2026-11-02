import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  /** content below the title row (tabs, filters) */
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, actions, children, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-5', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-xs text-fg-subtle">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5" />}
              {b.href ? (
                <Link href={b.href} className="hover:text-fg hover:underline">
                  {b.label}
                </Link>
              ) : (
                <span>{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-fg">{title}</h1>
          {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
