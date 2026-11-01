import { useState, type ReactNode } from 'react';
import { AreaChart, Area, BarChart, Bar, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Table2 } from 'lucide-react';
import { FOCUS, SECTION, compactInr, inr, fmtDate, localDayKey, niceTicks, partialOldestMonth, uniqueTickFormatter, type AssetDetailData, type AssetTxn } from './format';

// ─── Balance trend (only when the data actually varies) ───

export interface BalancePoint { date: string; balance: number }

/** Sync snapshots + end-of-day balances reported on transactions, one point per day. */
export function balanceSeries(data: AssetDetailData): BalancePoint[] {
  const byDay = new Map<string, number>();
  // Keyed by the local calendar day, so a 1 am IST transaction lands on the day the ledger shows
  for (const h of data.history) byDay.set(localDayKey(h.date), h.balance);
  // transactions arrive newest first: walk oldest → newest so the day's last balance wins
  for (const t of [...data.transactions].reverse()) {
    if (t.balanceAfter !== null) byDay.set(localDayKey(t.date), t.balanceAfter);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, balance]) => ({ date, balance }));
}

export function hasMeaningfulTrend(points: BalancePoint[]): boolean {
  if (points.length < 3) return false;
  const values = points.map(p => p.balance);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return max - min > Math.max(1, Math.abs(max) * 0.002);
}

// ─── Cash flow: monthly money in vs out ───

export interface MonthFlow { key: string; label: string; in: number; out: number }

/** Fixed 3-letter months for axes (en-IN would print 'Sept'). */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Same 'YYYY-MM' key as format.monthKey. */
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export function monthlyFlows(txns: AssetTxn[], months = 6): MonthFlow[] {
  if (!txns.length) return [];
  const now = new Date();
  const buckets: MonthFlow[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: ym(d), label: MON[d.getMonth()], in: 0, out: 0 });
  }
  const index = new Map(buckets.map(b => [b.key, b]));
  for (const t of txns) {
    const d = new Date(t.date);
    const b = index.get(ym(d));
    if (!b) continue;
    if (t.type === 'CREDIT') b.in += t.amount; else b.out += t.amount;
  }
  // Start at the first month that has data, so the chart isn't padded with empty months
  const first = buckets.findIndex(b => b.in || b.out);
  return first === -1 ? [] : buckets.slice(first);
}


/**
 * Complete months only: the current (still running) month is dropped, and so is the oldest month when
 * it is probably cut off part-way (the 200 cap, or a consent range that starts mid-month).
 */
export function completeFlows(txns: AssetTxn[], capped: boolean, months = 6): MonthFlow[] {
  const partial = new Set([ym(new Date())]);
  const oldest = partialOldestMonth(txns, capped);
  if (oldest) partial.add(oldest);
  return monthlyFlows(txns, months + 1).filter(f => !partial.has(f.key)).slice(-months);
}

const monthName = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const TICK = { fontSize: 12, fill: 'var(--muted-foreground)', style: { fontVariantNumeric: 'tabular-nums' } };

function TooltipBox({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-border bg-popover text-popover-foreground px-3 py-2 shadow-lg">{children}</div>;
}

// ─── Balance: single-series area, end dot + direct label ───

const DAY = 86400000;
const dayStart = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

/** Evenly spaced x ticks: month starts across the range (thinned to ≤ 7), or weekly ticks under two months. */
function timeTicks(t0: number, t1: number): { ticks: number[]; fmt: (v: number) => string } {
  const a = new Date(t0);
  const spansYears = a.getFullYear() !== new Date(t1).getFullYear();
  const starts: number[] = [];
  for (let d = new Date(a.getFullYear(), a.getMonth() + (a.getDate() === 1 ? 0 : 1), 1); d.getTime() <= t1; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    starts.push(d.getTime());
  }
  if (starts.length >= 2) {
    const step = Math.ceil(starts.length / 7);
    return {
      ticks: starts.filter((_, i) => i % step === 0),
      fmt: v => { const d = new Date(v); return spansYears && d.getMonth() === 0 ? `Jan ’${String(d.getFullYear()).slice(2)}` : MON[d.getMonth()]; },
    };
  }
  const ticks: number[] = [];
  const stepDays = t1 - t0 > 28 * DAY ? 14 : 7;
  for (let t = t0; t <= t1; t += stepDays * DAY) ticks.push(t);
  return { ticks, fmt: v => { const d = new Date(v); return `${d.getDate()} ${MON[d.getMonth()]}`; } };
}

function BalancePlot({ points }: { points: BalancePoint[] }) {
  const values = points.map(p => p.balance);
  const ticks = niceTicks(Math.min(...values), Math.max(...values), 4);
  const fmt = uniqueTickFormatter(ticks);
  const chart = points.map(p => ({ t: dayStart(p.date), full: fmtDate(p.date)!, value: p.balance }));
  const last = chart.length - 1;
  const x = timeTicks(chart[0].t, chart[last].t);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chart} margin={{ top: 12, right: 56, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="t" type="number" scale="time" domain={[chart[0].t, chart[last].t]} ticks={x.ticks} tickFormatter={x.fmt} interval={0} axisLine={false} tickLine={false} tick={TICK} dy={6} />
        <YAxis axisLine={false} tickLine={false} width={64} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]} tickFormatter={fmt} tick={TICK} />
        <Tooltip
          cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
          content={({ active, payload }) => active && payload?.length ? (
            <TooltipBox>
              <p className="text-xs text-muted-foreground">{payload[0].payload.full}</p>
              <p className="text-sm font-semibold tabular-nums">{inr(payload[0].value as number)}</p>
            </TooltipBox>
          ) : null}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--ad-in)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="var(--ad-in)"
          fillOpacity={0.1}
          isAnimationActive={false}
          activeDot={{ r: 4, fill: 'var(--ad-in)', stroke: 'var(--card)', strokeWidth: 2 }}
          dot={(p: { cx?: number; cy?: number; index?: number }) => p.index === last && p.cx !== undefined && p.cy !== undefined ? (
            <g key="end">
              <circle cx={p.cx} cy={p.cy} r={4} fill="var(--ad-in)" stroke="var(--card)" strokeWidth={2} />
              {/* In the right margin beside the end dot, so it never sits on the line */}
              <text x={p.cx + 9} y={p.cy} dominantBaseline="central" textAnchor="start" fontSize={12} fontWeight={600} fill="var(--foreground)">
                {compactInr(chart[last].value)}
              </text>
            </g>
          ) : <g key={`d${p.index}`} />}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Cash flow: grouped in/out bars on one axis ───

function FlowPlot({ flows }: { flows: MonthFlow[] }) {
  const max = Math.max(...flows.flatMap(f => [f.in, f.out]), 1);
  const ticks = niceTicks(0, max, 3);
  const fmt = uniqueTickFormatter(ticks);
  const last = flows.length - 1;
  // Direct labels on the latest month only. The pair is anchored outward (in → right-aligned to its bar,
  // out → left-aligned to its bar) so two labels wider than 20px bars never overlap.
  const endLabel = (side: 'in' | 'out') => (p: { x?: number | string; y?: number | string; width?: number | string; value?: unknown; index?: number }) =>
    p.index === last && Number(p.value) > 0 ? (
      <text
        x={side === 'in' ? Number(p.x) + Number(p.width) - 2 : Number(p.x) + 2}
        y={Number(p.y) - 6}
        textAnchor={side === 'in' ? 'end' : 'start'}
        fontSize={12}
        fill="var(--muted-foreground)"
      >
        {compactInr(Number(p.value))}
      </text>
    ) : null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={flows} margin={{ top: 20, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} dy={6} />
        <YAxis axisLine={false} tickLine={false} width={56} ticks={ticks} domain={[0, ticks[ticks.length - 1]]} tickFormatter={fmt} tick={TICK} />
        <Tooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const f = payload[0].payload as MonthFlow;
            const net = f.in - f.out;
            return (
              <TooltipBox>
                <p className="text-xs text-muted-foreground">{monthName(f.key)}</p>
                <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-[13px] tabular-nums">
                  <dt className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--ad-in)]" aria-hidden />In</dt><dd className="text-right font-semibold">{inr(f.in, 0)}</dd>
                  <dt className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--ad-out)]" aria-hidden />Out</dt><dd className="text-right font-semibold">{inr(f.out, 0)}</dd>
                  <dt className="text-muted-foreground">Net</dt><dd className="text-right font-semibold">{net >= 0 ? '+' : '−'}{inr(Math.abs(net), 0)}</dd>
                </dl>
              </TooltipBox>
            );
          }}
        />
        <Bar dataKey="in" name="Money in" fill="var(--ad-in)" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false}>
          <LabelList dataKey="in" content={endLabel('in')} />
        </Bar>
        <Bar dataKey="out" name="Money out" fill="var(--ad-out)" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false}>
          <LabelList dataKey="out" content={endLabel('out')} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Activity chart card: toggle + table view ───

type View = 'balance' | 'flow';

export function ActivityChart({ series, flows, balanceTitle = 'Balance', refreshing = false }: {
  /** Pass [] when the balance trend doesn't qualify. */
  series: BalancePoint[];
  /** Pass [] when cash flow doesn't qualify. */
  flows: MonthFlow[];
  balanceTitle?: string;
  refreshing?: boolean;
}) {
  const hasBalance = series.length > 0;
  const hasFlow = flows.length > 0;
  const [view, setView] = useState<View>(hasBalance ? 'balance' : 'flow');
  const [table, setTable] = useState(false);
  if (!hasBalance && !hasFlow) return null;
  const active: View = view === 'balance' && hasBalance ? 'balance' : hasFlow ? 'flow' : 'balance';
  const title = active === 'balance' ? balanceTitle : 'Cash flow';

  const first = series[0];
  const delta = hasBalance ? series[series.length - 1].balance - first.balance : 0;
  const avgIn = hasFlow ? flows.reduce((s, f) => s + f.in, 0) / flows.length : 0;
  const avgOut = hasFlow ? flows.reduce((s, f) => s + f.out, 0) / flows.length : 0;

  return (
    <section aria-labelledby="activity-h" aria-busy={refreshing} className={`${SECTION} p-5 sm:p-6 transition-opacity motion-reduce:transition-none ${refreshing ? 'opacity-60' : ''}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="activity-h" className="text-base font-semibold text-foreground">{title}</h2>
          {active === 'balance' ? (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-foreground tabular-nums">
              {delta >= 0
                ? <ArrowUpRight className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
                : <ArrowDownRight className="size-4 text-rose-700 dark:text-rose-400" aria-hidden />}
              {delta >= 0 ? '+' : '−'}{inr(Math.abs(delta), 0)}
              <span className="text-muted-foreground">since {fmtDate(first.date, { year: false })}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-[13px] text-muted-foreground">Last {flows.length} months</p>
          )}
        </div>
        <div className="flex items-center gap-2 max-sm:w-full">
          {hasBalance && hasFlow && (
            <div role="group" aria-label="Chart" className="inline-flex h-9 rounded-full bg-muted p-1 max-sm:flex-1">
              {(['balance', 'flow'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={active === v}
                  onClick={() => setView(v)}
                  className={`px-3 rounded-full text-[13px] font-medium transition-colors max-sm:flex-1 ${FOCUS} ${active === v ? 'bg-card text-foreground shadow-sm' : 'text-foreground/70 hover:text-foreground'}`}
                >
                  {v === 'balance' ? balanceTitle : 'Cash flow'}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            aria-pressed={table}
            aria-label="Table view"
            title="Table view"
            onClick={() => setTable(t => !t)}
            className={`ml-auto size-9 shrink-0 rounded-full grid place-items-center border transition-colors ${FOCUS} ${table ? 'bg-muted text-foreground border-border' : 'border-border text-foreground/70 hover:text-foreground hover:bg-muted'}`}
          >
            <Table2 className="size-4" />
          </button>
        </div>
      </header>

      {active === 'flow' && !table && (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground" aria-label="Legend">
          <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--ad-in)]" aria-hidden />Money in · avg {compactInr(avgIn)}/mo</li>
          <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--ad-out)]" aria-hidden />Money out · avg {compactInr(avgOut)}/mo</li>
        </ul>
      )}

      <div className={`mt-3 h-[12rem] sm:h-[14rem] ${table ? 'overflow-y-auto' : ''}`}>
        {table ? (
          <table className="w-full text-[13px]">
            <caption className="sr-only">{title} as a table</caption>
            <thead className="sticky top-0 bg-card">
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-2 text-left font-medium">{active === 'balance' ? 'Date' : 'Month'}</th>
                {active === 'balance' ? (
                  <th scope="col" className="py-2 pl-2 text-right font-medium">Balance</th>
                ) : (
                  <>
                    <th scope="col" className="py-2 px-2 text-right font-medium">Money in</th>
                    <th scope="col" className="py-2 px-2 text-right font-medium">Money out</th>
                    <th scope="col" className="py-2 pl-2 text-right font-medium">Net</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {active === 'balance'
                ? [...series].reverse().map(p => (
                  <tr key={p.date}>
                    <th scope="row" className="py-2 pr-2 text-left font-normal text-foreground">{fmtDate(p.date)}</th>
                    <td className="py-2 pl-2 text-right font-medium text-foreground">{inr(p.balance)}</td>
                  </tr>
                ))
                : [...flows].reverse().map(f => (
                  <tr key={f.key}>
                    <th scope="row" className="py-2 pr-2 text-left font-normal text-foreground">{monthName(f.key)}</th>
                    <td className="py-2 px-2 text-right text-foreground">{inr(f.in, 0)}</td>
                    <td className="py-2 px-2 text-right text-foreground">{inr(f.out, 0)}</td>
                    <td className="py-2 pl-2 text-right font-medium text-foreground">{f.in - f.out >= 0 ? '+' : '−'}{inr(Math.abs(f.in - f.out), 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : active === 'balance' ? <BalancePlot points={series} /> : <FlowPlot flows={flows} />}
      </div>
    </section>
  );
}
