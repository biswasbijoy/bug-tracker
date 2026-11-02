import { cn } from '@/lib/utils';
import { hueVar, type Hue } from '@/lib/tickets';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-fg-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

interface ChipProps {
  hue: Hue | string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  /** show a coloured dot before the text */
  dot?: boolean;
  bordered?: boolean;
  className?: string;
  title?: string;
}

/** Hue-tinted chip: status, priority, type, label colours all render through this. */
export function Chip({ hue, children, icon, dot, bordered, className, title }: ChipProps) {
  const value = hue.startsWith('#') || hue.startsWith('var(') ? hue : hueVar(hue);
  return (
    <span
      title={title}
      style={{ ['--hue' as string]: value }}
      className={cn(
        'chip inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium leading-4',
        bordered && 'chip-border',
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--hue)' }} />}
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

export default Badge;
