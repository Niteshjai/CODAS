import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { compactInr, inr, fmtDate, niceTicks, uniqueTickFormatter, type AssetDetailData, type AssetTxn } from './format';

// ─── Balance trend (only when the data actually varies) ───

export interface BalancePoint { date: string; balance: number }

/** Sync snapshots + end-of-day balances reported on transactions, one point per day. */
export function balanceSeries(data: AssetDetailData): BalancePoint[] {
  const byDay = new Map<string, number>();
  for (const h of data.history) byDay.set(h.date.slice(0, 10), h.balance);
  // transactions arrive newest first: walk oldest → newest so the day's last balance wins
  for (const t of [...data.transactions].reverse()) {
    if (t.balanceAfter !== null) byDay.set(new Date(t.date).toISOString().slice(0, 10), t.balanceAfter);
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

export function BalanceTrend({ points }: { points: BalancePoint[] }) {
  const values = points.map(p => p.balance);
  const ticks = niceTicks(Math.min(...values), Math.max(...values), 4);
  const fmt = uniqueTickFormatter(ticks);
  const chart = points.map(p => ({ label: fmtDate(p.date, { year: false })!, full: fmtDate(p.date)!, value: p.balance }));
  const change = values[values.length - 1] - values[0];

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        <span className={change >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
          {change >= 0 ? '+' : '−'}{inr(Math.abs(change), 0)}
        </span>{' '}since {chart[0].full}
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#84cc16" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={6} />
            <YAxis axisLine={false} tickLine={false} width={60} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]}
              tickFormatter={fmt} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <Tooltip cursor={{ stroke: 'var(--border)' }} content={({ active, payload }) => active && payload?.length ? (
              <div className="rounded-lg border border-border bg-popover text-popover-foreground px-3 py-2 shadow-lg">
                <p className="text-[11px] text-muted-foreground">{payload[0].payload.full}</p>
                <p className="text-sm font-semibold tabular-nums">{inr(payload[0].value as number)}</p>
              </div>
            ) : null} />
            <Area type="monotone" dataKey="value" stroke="#65a30d" strokeWidth={2} fill="url(#balanceTrendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Cash flow: monthly money in vs out ───

export interface MonthFlow { key: string; label: string; in: number; out: number }

export function monthlyFlows(txns: AssetTxn[], months = 6): MonthFlow[] {
  if (!txns.length) return [];
  const now = new Date();
  const buckets: MonthFlow[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-IN', { month: 'short' }), in: 0, out: 0 });
  }
  const index = new Map(buckets.map(b => [b.key, b]));
  for (const t of txns) {
    const d = new Date(t.date);
    const b = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!b) continue;
    if (t.type === 'CREDIT') b.in += t.amount; else b.out += t.amount;
  }
  // Start at the first month that has data, so the chart isn't padded with empty months
  const first = buckets.findIndex(b => b.in || b.out);
  return first === -1 ? [] : buckets.slice(first);
}

export function CashFlow({ flows }: { flows: MonthFlow[] }) {
  const avgIn = flows.reduce((s, f) => s + f.in, 0) / flows.length;
  const avgOut = flows.reduce((s, f) => s + f.out, 0) / flows.length;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-lime-500" />Money in · avg {compactInr(avgIn)}/mo</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />Money out · avg {compactInr(avgOut)}/mo</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={flows} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barGap={3} barCategoryGap="28%">
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={6} />
            <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.5 }} content={({ active, payload, label }) => active && payload?.length ? (
              <div className="rounded-lg border border-border bg-popover text-popover-foreground px-3 py-2 shadow-lg text-xs space-y-0.5">
                <p className="text-muted-foreground">{label}</p>
                <p className="tabular-nums"><span className="text-emerald-600 dark:text-emerald-400">In</span> {inr(payload[0].payload.in, 0)}</p>
                <p className="tabular-nums"><span className="text-muted-foreground">Out</span> {inr(payload[0].payload.out, 0)}</p>
              </div>
            ) : null} />
            <Bar dataKey="in" fill="#84cc16" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="out" fill="var(--muted-foreground)" fillOpacity={0.45} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
