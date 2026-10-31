import type { TicketStatus } from '../../services/support';

export const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 aria-[invalid=true]:border-destructive';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps every occurrence of the query's words in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter(w => w.length > 0).map(escapeRegExp);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <mark key={i} className="rounded-[3px] bg-lime-200/80 px-0.5 text-inherit dark:bg-lime-400/25">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

/** A short excerpt of `text` centred on the first matched word. */
export function excerpt(text: string, query: string, radius = 70): string {
  const first = query.trim().split(/\s+/)[0]?.toLowerCase();
  const idx = first ? text.toLowerCase().indexOf(first) : -1;
  if (idx < 0 || text.length <= radius * 2) return text.length > radius * 2 ? `${text.slice(0, radius * 2)}…` : text;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLES: Record<TicketStatus, { label: string; cls: string }> = {
  open:          { label: 'Open',             cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900' },
  awaiting_user: { label: 'Needs your reply', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  closed:        { label: 'Closed',           cls: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
