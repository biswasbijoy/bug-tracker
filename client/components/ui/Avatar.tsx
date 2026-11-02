import { cn, initials, pickBy } from '@/lib/utils';
import { hueVar } from '@/lib/tickets';

const HUES = ['blue', 'violet', 'teal', 'pink', 'orange', 'green', 'amber'] as const;

const sizes = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function Avatar({ name, size = 'md', className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  const hue = pickBy(name || '?', [...HUES]);
  return (
    <span
      aria-hidden
      title={name}
      style={{ ['--hue' as string]: hueVar(hue) }}
      className={cn('chip inline-flex shrink-0 items-center justify-center rounded-full font-semibold', sizes[size], className)}
    >
      {initials(name || '?')}
    </span>
  );
}

export default Avatar;
