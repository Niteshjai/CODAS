import { useMemo, useState, type ReactNode } from 'react';
import {
  Search, Smartphone, ArrowLeftRight, Landmark, Banknote, CreditCard, Repeat, Percent, Receipt,
  FileText, Briefcase, ArrowDownLeft, ArrowUpRight, X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { inr, fmtDate, parseNarration, type AssetTxn, type TxnMode } from './format';

const MODE_ICON: Record<TxnMode, ReactNode> = {
  UPI: <Smartphone className="size-4" />,
  NEFT: <ArrowLeftRight className="size-4" />,
  IMPS: <ArrowLeftRight className="size-4" />,
  RTGS: <Landmark className="size-4" />,
  ATM: <Banknote className="size-4" />,
  CARD: <CreditCard className="size-4" />,
  AUTOPAY: <Repeat className="size-4" />,
  INTEREST: <Percent className="size-4" />,
  CHARGES: <Receipt className="size-4" />,
  CHEQUE: <FileText className="size-4" />,
  SALARY: <Briefcase className="size-4" />,
  OTHER: <ArrowLeftRight className="size-4" />,
};

const PAGE = 12;
const time = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

function dayLabel(d: string) {
  const ds = new Date(d).toDateString();
  if (ds === new Date().toDateString()) return 'Today';
  if (ds === new Date(Date.now() - 86400000).toDateString()) return 'Yesterday';
  return fmtDate(d, { year: new Date(d).getFullYear() !== new Date().getFullYear() })!;
}

export function TransactionList({ items }: { items: AssetTxn[] }) {
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<AssetTxn | null>(null);

  const parsed = useMemo(() => items.map(t => ({ t, p: parseNarration(t.narration, t.mode, t.reference) })), [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parsed.filter(({ t, p }) =>
      (filter === 'ALL' || t.type === filter) &&
      (!q || [t.narration, p.title, p.reference, p.handle, p.modeLabel, String(t.amount)].some(v => v?.toLowerCase().includes(q))));
  }, [parsed, filter, query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const row of filtered.slice(0, limit)) {
      const key = dayLabel(row.t.date);
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()];
  }, [filtered, limit]);

  const selected = open ? parseNarration(open.narration, open.mode, open.reference) : null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search transactions</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}
            placeholder="Search by name, UPI ID, reference or amount"
            className="w-full h-9 rounded-full border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <div role="tablist" aria-label="Filter transactions" className="inline-flex shrink-0 rounded-full bg-muted p-1 self-start">
          {(['ALL', 'CREDIT', 'DEBIT'] as const).map(f => (
            <button
              key={f} role="tab" aria-selected={filter === f}
              onClick={() => { setFilter(f); setLimit(PAGE); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'ALL' ? 'All' : f === 'CREDIT' ? 'Money in' : 'Money out'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {query ? `No transactions match “${query}”.` : `No ${filter === 'CREDIT' ? 'money in' : 'money out'} in the shared history.`}
        </p>
      ) : (
        <>
          {groups.map(([day, rows]) => (
            <section key={day} aria-label={day}>
              <h3 className="sticky top-14 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 py-2 bg-card/95 backdrop-blur text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                {day}
              </h3>
              <ul>
                {rows.map(({ t, p }) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setOpen(t)}
                      className="w-full flex items-center gap-3 py-3 -mx-2 px-2 rounded-xl text-left hover:bg-muted/60 focus-visible:bg-muted/60 outline-none transition-colors"
                    >
                      <span className={`size-10 rounded-full grid place-items-center shrink-0 ${t.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        {p.mode === 'OTHER' ? (t.type === 'CREDIT' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />) : MODE_ICON[p.mode]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground truncate">{p.title}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {p.modeLabel} · {time(t.date)}{p.reference ? ` · Ref ${p.reference}` : ''}
                        </span>
                      </span>
                      <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                        {t.type === 'CREDIT' ? '+' : '−'}{inr(t.amount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="pt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Showing {Math.min(limit, filtered.length)} of {filtered.length}</span>
            {filtered.length > limit && (
              <button onClick={() => setLimit(l => l + PAGE)} className="rounded-full border border-border px-4 py-1.5 font-medium text-foreground hover:bg-muted transition-colors">
                Show more
              </button>
            )}
          </div>
        </>
      )}

      <Sheet open={!!open} onOpenChange={o => { if (!o) setOpen(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-[26rem] bg-card text-card-foreground border-border">
          {open && selected && (
            <>
              <SheetHeader className="text-left">
                <span className={`size-12 rounded-full grid place-items-center ${open.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                  {MODE_ICON[selected.mode]}
                </span>
                <SheetTitle className="text-lg">{selected.title}</SheetTitle>
                <SheetDescription>{open.type === 'CREDIT' ? 'Money in' : 'Money out'} · {selected.modeLabel}</SheetDescription>
              </SheetHeader>
              <p className={`mt-6 text-3xl font-semibold tabular-nums ${open.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                {open.type === 'CREDIT' ? '+' : '−'}{inr(open.amount)}
              </p>
              <dl className="mt-6 divide-y divide-border rounded-xl border border-border">
                {([
                  ['Date & time', fmtDate(open.date, { time: true })],
                  ['Mode', selected.modeLabel],
                  ['UPI ID', selected.handle],
                  ['Reference', selected.reference],
                  ['Category', open.category],
                  ['Balance after', open.balanceAfter !== null ? inr(open.balanceAfter) : null],
                ] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 px-4 py-3">
                    <dt className="text-xs text-muted-foreground shrink-0">{k}</dt>
                    <dd className="text-sm font-medium text-foreground text-right break-all">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-xl bg-muted/60 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Bank narration</p>
                <p className="mt-1 text-sm font-mono text-foreground break-all">{open.narration}</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
