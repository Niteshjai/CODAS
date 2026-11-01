import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  Search, Smartphone, ArrowLeftRight, Landmark, Banknote, CreditCard, Repeat, Percent, Receipt,
  FileText, Briefcase, ArrowDownLeft, ArrowUpRight, X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { FOCUS, SECTION, inr, fmtDate, monthHeading, monthKey, parseNarration, partialOldestMonth, txnTotals, type AssetTxn, type ParsedNarration, type TxnMode } from './format';
import { CopyButton } from './CopyButton';

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

const PAGE = 20;
/** Below this many rows there is nothing to search: no controls, no month headers. */
const TOOLS_AT = 8;
const time = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

function dayLabel(d: string) {
  const ds = new Date(d).toDateString();
  if (ds === new Date().toDateString()) return 'Today';
  if (ds === new Date(Date.now() - 86400000).toDateString()) return 'Yesterday';
  return fmtDate(d, { year: new Date(d).getFullYear() !== new Date().getFullYear() })!;
}

function useMinWidth(query: string) {
  return useSyncExternalStore(
    cb => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

const credit = 'text-emerald-700 dark:text-emerald-400';
const outlineBtn = `inline-flex h-9 items-center justify-center rounded-full border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60 ${FOCUS}`;
const signed = (t: AssetTxn) => `${t.type === 'CREDIT' ? '+' : '−'}${inr(t.amount)}`;
const rowIcon = (t: AssetTxn, p: ParsedNarration) =>
  p.mode === 'OTHER' ? (t.type === 'CREDIT' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />) : MODE_ICON[p.mode];

type Row = { t: AssetTxn; p: ParsedNarration };

export function TransactionList({ items, institutionName, capped, onRefresh, refreshing, title = 'Transactions', shortTabs = false }: {
  items: AssetTxn[];
  institutionName: string;
  capped: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  title?: string;
  /** Investment accounts: the API gives no buy/sell meaning, so tabs read plain In / Out. */
  shortTabs?: boolean;
}) {
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<AssetTxn | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const lastRow = useRef<HTMLButtonElement | null>(null);
  const isSm = useMinWidth('(min-width: 40rem)');
  const inst = institutionName || 'Your bank';
  const tools = items.length >= TOOLS_AT;
  const DayH = tools ? 'h4' : 'h3';

  const parsed = useMemo<Row[]>(() => items.map(t => ({ t, p: parseNarration(t.narration, t.mode, t.reference) })), [items]);
  const counts = useMemo(() => ({ ALL: items.length, CREDIT: items.filter(t => t.type === 'CREDIT').length, DEBIT: items.filter(t => t.type === 'DEBIT').length }), [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parsed.filter(({ t, p }) =>
      (filter === 'ALL' || t.type === filter) &&
      (!q || [t.narration, p.title, p.reference, p.handle, p.modeLabel, String(t.amount)].some(v => v?.toLowerCase().includes(q))));
  }, [parsed, filter, query]);

  // Month totals over the whole filtered set, not just the rows paginated in
  const monthTotals = useMemo(() => {
    const m = new Map<string, AssetTxn[]>();
    for (const { t } of filtered) { const k = monthKey(t.date); m.set(k, [...(m.get(k) ?? []), t]); }
    return new Map([...m].map(([k, v]) => [k, txnTotals(v)]));
  }, [filtered]);
  const partialMonth = useMemo(() => partialOldestMonth(items, capped), [items, capped]);

  const months = useMemo(() => {
    const out: { key: string; heading: string; days: { label: string; rows: Row[] }[] }[] = [];
    for (const row of filtered.slice(0, limit)) {
      const mk = monthKey(row.t.date);
      let month = out[out.length - 1];
      if (!month || month.key !== mk) { month = { key: mk, heading: monthHeading(row.t.date), days: [] }; out.push(month); }
      const dl = dayLabel(row.t.date);
      let day = month.days[month.days.length - 1];
      if (!day || day.label !== dl) { day = { label: dl, rows: [] }; month.days.push(day); }
      day.rows.push(row);
    }
    return out;
  }, [filtered, limit]);

  useEffect(() => {
    if (!focusId) return;
    document.querySelector<HTMLButtonElement>(`[data-txn="${CSS.escape(focusId)}"]`)?.focus();
    setFocusId(null);
  }, [focusId, months]);

  const filtering = !!query.trim() || filter !== 'ALL';
  const totals = filtering ? txnTotals(filtered.map(r => r.t)) : null;
  // One always-mounted live region, so result counts are announced (a region mounted with its text is often missed)
  const liveText = !filtering ? '' : filtered.length
    ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}`
    : query.trim() ? `No transactions match ${query.trim()}` : `No money ${filter === 'CREDIT' ? 'in' : 'out'} in the shared history`;
  const selected = open ? parseNarration(open.narration, open.mode, open.reference) : null;
  const tabLabel = (f: 'ALL' | 'CREDIT' | 'DEBIT') => {
    if (f === 'ALL') return 'All';
    const short = f === 'CREDIT' ? 'In' : 'Out';
    if (shortTabs) return short;
    return <><span className="hidden min-[25rem]:inline">Money {short.toLowerCase()}</span><span className="min-[25rem]:hidden">{short}</span></>;
  };

  return (
    <section aria-labelledby="txn-h" aria-busy={refreshing} className={`${SECTION} flex-1 flex flex-col p-5 sm:p-6 transition-opacity motion-reduce:transition-none ${refreshing ? 'opacity-60' : ''}`}>
      <span className="sr-only" aria-live="polite">{liveText}</span>
      <header className="flex items-baseline justify-between gap-3">
        <h2 id="txn-h" className="text-base font-semibold text-foreground">{title}</h2>
        {items.length > 0 && <span className="text-[13px] text-muted-foreground tabular-nums">{items.length} shared</span>}
      </header>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
          <span className="mx-auto mb-3 size-10 rounded-full bg-muted text-muted-foreground grid place-items-center" aria-hidden><Receipt className="size-5" /></span>
          <p className="text-sm font-semibold text-foreground">No transactions shared yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-[26rem] mx-auto">
            {inst} hasn't shared statement lines through your Account Aggregator consent. Your balance still updates on each sync.
          </p>
          <button type="button" onClick={onRefresh} disabled={refreshing} className={`mt-4 ${outlineBtn}`}>
            {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
      ) : (
        <>
          {tools && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="relative w-full sm:w-[20rem] shrink-0">
                <span className="sr-only">Search transactions</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}
                  placeholder="Search name, UPI ID, ref or amount"
                  className="w-full h-10 rounded-full border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground placeholder:text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-300 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className={`absolute right-1 top-1/2 -translate-y-1/2 size-8 rounded-full grid place-items-center text-muted-foreground hover:text-foreground ${FOCUS}`}>
                    <X className="size-4" />
                  </button>
                )}
              </label>
              <div role="group" aria-label="Show" className="flex h-10 rounded-full bg-muted p-1 w-full sm:w-auto">
                {(['ALL', 'CREDIT', 'DEBIT'] as const).map(f => (
                  <button
                    key={f} type="button" aria-pressed={filter === f}
                    onClick={() => { setFilter(f); setLimit(PAGE); }}
                    className={`flex-1 sm:flex-none whitespace-nowrap px-3 rounded-full text-[13px] font-medium transition-colors ${FOCUS} ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-foreground/70 hover:text-foreground'}`}
                  >
                    {tabLabel(f)} <span className={`tabular-nums ${filter === f ? 'text-muted-foreground' : 'text-foreground/70'}`}>{counts[f]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {totals && filtered.length > 0 && (
            <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs tabular-nums text-foreground/75">
              {filtered.length} result{filtered.length === 1 ? '' : 's'} · In {inr(totals.in, 0)} · Out {inr(totals.out, 0)}
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {query.trim() ? (
                <>
                  <p>No transactions match “{query.trim()}”</p>
                  <button type="button" onClick={() => setQuery('')} className={`mt-2 rounded text-[13px] font-semibold text-foreground underline-offset-4 hover:underline ${FOCUS}`}>Clear search</button>
                </>
              ) : (
                <p>No money {filter === 'CREDIT' ? 'in' : 'out'} in the shared history.</p>
              )}
            </div>
          ) : (
            <div className={tools ? '' : 'mt-3'}>
              {months.map(m => {
                const mt = monthTotals.get(m.key);
                return (
                  <div key={m.key}>
                    {tools && (
                      <div className="mt-6 mb-1 pb-2 flex flex-wrap items-baseline justify-between gap-x-3 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground">
                          {m.heading}{m.key === partialMonth ? <span className="font-normal text-muted-foreground"> (partial)</span> : null}
                        </h3>
                        {mt && <p className="text-xs tabular-nums text-muted-foreground">In <span className="font-medium text-foreground">{inr(mt.in, 0)}</span> · Out <span className="font-medium text-foreground">{inr(mt.out, 0)}</span></p>}
                      </div>
                    )}
                    {m.days.map(day => (
                      <div key={day.label}>
                        <DayH className="sticky top-14 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-2.5 pb-0.5 bg-card/95 backdrop-blur text-xs font-medium text-muted-foreground">
                          {day.label}
                        </DayH>
                        <ul className="pb-1">
                          {day.rows.map(({ t, p }) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                data-txn={t.id}
                                onClick={e => { lastRow.current = e.currentTarget; setOpen(t); }}
                                aria-label={`${p.title}, ${signed(t)}, ${fmtDate(t.date, { time: true })}`}
                                className={`w-[calc(100%+1rem)] min-h-16 -mx-2 px-2 flex items-center gap-3 rounded-xl text-left hover:bg-muted/60 transition-colors ${FOCUS}`}
                              >
                                <span aria-hidden className={`size-10 rounded-full grid place-items-center shrink-0 ${t.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                  {rowIcon(t, p)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium text-foreground truncate">{p.title}</span>
                                  <span className="block text-xs text-muted-foreground truncate">
                                    {p.modeLabel} · {time(t.date)}{p.reference ? ` · Ref ${p.reference}` : ''}
                                  </span>
                                </span>
                                <span className="text-right shrink-0">
                                  <span className={`block text-sm font-semibold tabular-nums whitespace-nowrap ${t.type === 'CREDIT' ? credit : 'text-foreground'}`}>{signed(t)}</span>
                                  {t.balanceAfter !== null && (
                                    <span className="hidden sm:block text-xs tabular-nums text-muted-foreground whitespace-nowrap">Bal {inr(t.balanceAfter)}</span>
                                  )}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-4"><div className="pt-3 border-t border-border space-y-3">
            {filtered.length > limit && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">Showing {limit} of {filtered.length}</span>
                <button
                  type="button"
                  onClick={() => { setFocusId(filtered[limit]?.t.id ?? null); setLimit(l => l + PAGE); }}
                  className={outlineBtn}
                >
                  Show {Math.min(PAGE, filtered.length - limit)} more
                </button>
              </div>
            )}
            {capped ? (
              <p className="text-xs text-muted-foreground">Showing the 200 most recent transactions.</p>
            ) : (!filtering && filtered.length <= limit) && (
              <p className="text-xs text-muted-foreground">That's everything {inst} has shared so far.</p>
            )}
          </div></div>
        </>
      )}

      <Sheet open={!!open} onOpenChange={o => { if (!o) setOpen(null); }}>
        <SheetContent
          side={isSm ? 'right' : 'bottom'}
          onCloseAutoFocus={e => { e.preventDefault(); lastRow.current?.focus(); }}
          className={`bg-card text-card-foreground border-border overflow-y-auto ${isSm ? 'w-full sm:max-w-[26rem]' : 'rounded-t-[1.25rem] max-h-[85vh]'}`}
        >
          {open && selected && (
            <>
              <SheetHeader className="text-left">
                <span aria-hidden className={`size-12 rounded-xl grid place-items-center ${open.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                  {rowIcon(open, selected)}
                </span>
                <SheetTitle className="text-lg font-semibold pr-8">{selected.title}</SheetTitle>
                <SheetDescription>{open.type === 'CREDIT' ? 'Money in' : 'Money out'} · {selected.modeLabel}</SheetDescription>
              </SheetHeader>
              <p className={`mt-2 text-[2rem] leading-tight font-semibold ${open.type === 'CREDIT' ? credit : 'text-foreground'}`}>{signed(open)}</p>
              <dl className="mt-4 rounded-xl border border-border divide-y divide-border">
                {([
                  ['Date & time', fmtDate(open.date, { time: true }), false],
                  ['Mode', selected.modeLabel, false],
                  ['UPI ID', selected.handle, true],
                  ['Reference', selected.reference, true],
                  ['Category', open.category, false],
                  ['Balance after', open.balanceAfter !== null ? inr(open.balanceAfter) : null, false],
                ] as [string, string | null, boolean][]).filter(([, v]) => v).map(([k, v, copy]) => (
                  <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 min-h-12">
                    <dt className="text-xs text-muted-foreground shrink-0">{k}</dt>
                    <dd className="flex items-center gap-1 min-w-0 text-sm font-medium text-foreground text-right break-all">
                      <span>{v}</span>
                      {copy && <CopyButton value={v!} label={k} />}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Bank narration</p>
                <p className="mt-1 text-[13px] font-mono text-foreground break-all">{open.narration}</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
