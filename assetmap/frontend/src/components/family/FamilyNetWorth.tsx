import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFamilyStore } from '../../store/familyStore';
import { assetClassLabel, cardClass, rupees, rupeesCompact } from './familyUi';

const CLASS_COLOURS = ['#65a30d', '#0891b2', '#7c3aed', '#ea580c', '#db2777', '#0d9488', '#ca8a04', '#4f46e5', '#64748b', '#16a34a', '#9333ea'];

export default function FamilyNetWorth() {
  const { netWorth, history, vault, detailsLoading } = useFamilyStore();
  const [, setSearchParams] = useSearchParams();

  const colourOf = useMemo(() => {
    const map = new Map<string, string>();
    vault?.members.forEach(m => m.userId && map.set(m.userId, m.avatarColor));
    return (userId: string) => map.get(userId) ?? '#64748b';
  }, [vault]);

  // Monthly snapshots plus today's live total, shown only once there's a real trend (≥2 points)
  const chartData = useMemo(() => {
    const points = history.map(h => ({
      label: new Date(h.month).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      value: (h.totalPaise || 0) / 100,
    }));
    if (netWorth) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const last = history[history.length - 1];
      const live = { label: 'Now', value: netWorth.totalPaise / 100 };
      // This month's snapshot is superseded by the live total; otherwise append it
      if (last && String(last.month).slice(0, 7) === thisMonth) points[points.length - 1] = live;
      else points.push(live);
    }
    return points;
  }, [history, netWorth]);

  if (!netWorth) {
    return (
      <div className={`${cardClass} p-6 h-full`} aria-busy={detailsLoading}>
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="mt-3 h-9 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-6 h-2.5 w-full rounded-full bg-muted animate-pulse" />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-muted/70 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const total = netWorth.totalPaise;
  const contributing = netWorth.members.filter(m => !m.sharesNothing && m.totalPaise > 0);
  const classes = Object.entries(netWorth.byAssetClass).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const showChart = chartData.length >= 2;

  return (
    <section className={`${cardClass} p-6 h-full flex flex-col`} aria-labelledby="family-networth-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="family-networth-title" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="size-4" />
            Combined family net worth
          </h2>
          <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mt-1.5 tabular-nums" title={rupees(total)}>
            {rupeesCompact(total)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5" />
          {contributing.length} of {netWorth.memberCount} sharing
        </span>
      </div>

      {total === 0 ? (
        <div className="mt-6 flex-1 rounded-xl border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-foreground">No shared assets yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-[22rem] text-balance">
            Balances appear here once family members link accounts and choose to share them.
          </p>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'discovery' })}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
          >
            <Search className="size-3.5" />
            Link your accounts
          </button>
        </div>
      ) : (
        <>
          {/* Who contributes what */}
          <div className="mt-5">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Share of family net worth by member">
              {contributing.map(m => (
                <div key={m.userId} style={{ width: `${(m.totalPaise / total) * 100}%`, backgroundColor: colourOf(m.userId) }} title={`${m.name}: ${rupees(m.totalPaise)}`} />
              ))}
            </div>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {netWorth.members.map(m => (
                <li key={m.userId} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: colourOf(m.userId) }} />
                    <span className="truncate text-foreground font-medium">{m.name}{m.userId === vault?.viewer.userId ? ' (you)' : ''}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {m.sharesNothing
                      ? <span className="text-muted-foreground">Private</span>
                      : <><span className="font-semibold text-foreground">{rupeesCompact(m.totalPaise)}</span><span className="text-muted-foreground"> · {Math.round((m.totalPaise / total) * 100)}%</span></>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {showChart ? (
            <div className="mt-6 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="familyNetWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} width={56} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => rupeesCompact(v * 100)} />
                  <Tooltip
                    cursor={{ stroke: 'var(--border)' }}
                    content={({ active, payload }) => active && payload?.length ? (
                      <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg">
                        <p className="text-[11px] text-muted-foreground">{payload[0].payload.label}</p>
                        <p className="text-sm font-semibold text-foreground tabular-nums">{rupees((payload[0].value as number) * 100)}</p>
                      </div>
                    ) : null}
                  />
                  <Area type="monotone" dataKey="value" stroke="#65a30d" strokeWidth={2.5} fill="url(#familyNetWorthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {/* Asset mix */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Asset mix</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {classes.map(([cls, v], i) => (
                <li key={cls}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{assetClassLabel(cls)}</span>
                    <span className="text-muted-foreground tabular-nums">{rupeesCompact(v)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, (v / total) * 100)}%`, backgroundColor: CLASS_COLOURS[i % CLASS_COLOURS.length] }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {!showChart && (
            <p className="mt-5 text-[11px] text-muted-foreground">
              A monthly trend chart appears after the first month-end snapshot.
            </p>
          )}
        </>
      )}
    </section>
  );
}
