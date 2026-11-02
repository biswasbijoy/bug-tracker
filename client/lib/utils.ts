import { format, formatDistanceToNowStrict, isThisYear } from 'date-fns';

export function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}

const parse = (d: string | Date) => (d instanceof Date ? d : new Date(d));

/** "Jul 29" this year, "Jul 29, 2025" otherwise. */
export function formatDate(date: string | Date): string {
  const d = parse(date);
  return format(d, isThisYear(d) ? 'MMM d' : 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  const d = parse(date);
  return format(d, isThisYear(d) ? 'MMM d, h:mm a' : 'MMM d, yyyy, h:mm a');
}

/** "3h ago", "2d ago", "just now" */
export function timeAgo(date: string | Date): string {
  const d = parse(date);
  if (Date.now() - d.getTime() < 45_000) return 'just now';
  return `${formatDistanceToNowStrict(d)} ago`;
}

/** Value for <input type="date"> (local date, not UTC). */
export function toDateInput(date?: string | Date | null): string {
  if (!date) return '';
  const d = parse(date);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'yyyy-MM-dd');
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Stable pick from a list based on a string (avatar colours etc.). */
export function pickBy<T>(key: string, list: T[]): T {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

export function truncate(str: string, length: number): string {
  return str.length <= length ? str : `${str.slice(0, length - 1)}…`;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Extract an API error message from an unknown thrown value. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

/** Original file name from a stored upload name ("<unique>__<name>"). */
export function attachmentName(stored: string): string {
  const i = stored.indexOf('__');
  return i === -1 ? stored : stored.slice(i + 2);
}

export const isImageFile = (name: string) => /\.(png|jpe?g|gif|webp)$/i.test(name);

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** "2026-11-05" (from <input type="date">) → ISO string at local noon, so the calendar day survives any timezone. */
export function dateInputToIso(value: string): string {
  return value ? new Date(`${value}T12:00:00`).toISOString() : '';
}
