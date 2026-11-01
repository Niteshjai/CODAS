import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { FOCUS, SECTION, daysUntil, durationLabel, fmtDate, inr, type AssetDetailData } from './format';

const outlineBtn = `inline-flex h-9 items-center justify-center rounded-full border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60 ${FOCUS}`;
const textBtn = `rounded text-[13px] font-semibold text-foreground underline-offset-4 hover:underline ${FOCUS}`;

// ─── Term meter: where a deposit / policy is in its life ───

/** True when there is an end date to draw a term against. */
export function hasTerm(end: string | null): boolean {
  return !!end && !Number.isNaN(new Date(end).getTime());
}

/** True when the meter can show the start date too (so Details can drop Opened / Start date). */
export function termHasStart(start: string | null, end: string | null): boolean {
  if (!hasTerm(end) || !start) return false;
  const s = new Date(start).getTime();
  return Number.isFinite(s) && new Date(end!).getTime() > s;
}

/**
 * The term as a meter: elapsed share of the term, with the start and end dates under it.
 * `headline` is off when the status card already says how long is left (an FD maturing within 30 days).
 */
export function TermMeter({ kind, start, end, headline = true }: { kind: 'deposit' | 'policy'; start: string | null; end: string | null; headline?: boolean }) {
  if (!hasTerm(end)) return null;
  const endT = new Date(end!).getTime();
  const startT = start ? new Date(start).getTime() : NaN;
  const daysLeft = daysUntil(end)!;
  const done = daysLeft < 0;
  const soon = !done && daysLeft <= 30;
  const policy = kind === 'policy';
  const hasBar = termHasStart(start, end);
  const pct = done ? 100 : hasBar ? Math.round(Math.min(1, Math.max(0, (Date.now() - startT) / (endT - startT))) * 100) : 0;
  const label = policy ? 'Policy term' : 'Deposit term';
  const endWord = policy ? (done ? 'Ended' : 'Ends') : (done ? 'Matured' : 'Matures');
  const id = `term-${kind}`;

  const head = done
    ? <><CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden />{policy ? 'Term complete' : 'Matured'}</>
    : <>{soon && <AlertTriangle className="size-4 text-amber-700 dark:text-amber-300" aria-hidden />}{durationLabel(daysLeft)} left</>;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={id} className="text-xs font-medium text-muted-foreground">{label}</h3>
        {headline && <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground tabular-nums">{head}</p>}
      </div>
      {hasBar ? (
        <>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={done ? `${endWord} ${fmtDate(end)}` : `${daysLeft.toLocaleString('en-IN')} days to ${policy ? 'policy end' : 'maturity'}, ${pct}% of term elapsed`}
            aria-labelledby={id}
            className={`mt-2 h-2 rounded-full overflow-hidden ${soon ? 'bg-amber-100 dark:bg-amber-950' : 'bg-lime-100 dark:bg-lime-950'}`}
          >
            <div className={`h-full rounded-full ${soon ? 'bg-amber-500' : 'bg-[var(--ad-in)]'}`} style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0 }} />
          </div>
          <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{policy ? 'Started' : 'Opened'} <span className="text-foreground font-medium">{fmtDate(start)}</span></span>
            <span className="text-right">{endWord} <span className="text-foreground font-medium">{fmtDate(end)}</span></span>
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-foreground">
          {endWord} <span className="font-medium">{fmtDate(end)}</span>
        </p>
      )}
    </div>
  );
}

// ─── Holdings: ranked one-hue share bars (part-to-whole without a donut) ───

export function Holdings({ data, onRefresh, refreshing }: { data: AssetDetailData; onRefresh: () => void; refreshing: boolean }) {
  const [all, setAll] = useState(false);
  const [table, setTable] = useState(false);
  const mf = data.asset.fiType === 'MUTUAL_FUND';
  const noun = mf ? 'scheme' : 'holding';
  const rows = [...data.holdings].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const sum = rows.reduce((s, h) => s + (h.value ?? 0), 0);
  const count = typeof data.details.holdingsCount === 'number' ? data.details.holdingsCount : null;
  // The API sends at most 50 rows. When the institution shared more, shares are of the whole account
  // value (never of the 50 shown), and only when that value covers them.
  const partial = count !== null && count > rows.length && rows.length > 0;
  const base = partial ? (data.asset.balance >= sum ? data.asset.balance : 0) : sum;
  const showShare = rows.every(h => h.value !== null) && base > 0;
  const share = (v: number | null) => (showShare && v !== null ? Math.round((v / base) * 1000) / 10 : null);
  const visible = all ? rows : rows.slice(0, 10);
  const units = (u: number | null) => (u === null ? null : u.toLocaleString('en-IN', { maximumFractionDigits: 3 }));
  const inst = data.asset.institutionName || 'Your institution';

  return (
    <section aria-labelledby="holdings-h" className={`${SECTION} p-5 sm:p-6`}>
      <header className="flex items-baseline justify-between gap-3">
        <h2 id="holdings-h" className="text-base font-semibold text-foreground">{mf ? 'Schemes' : 'Holdings'}</h2>
        {rows.length > 0 && (
          <span className="text-[13px] text-muted-foreground tabular-nums">{partial ? `${rows.length} of ${count}` : rows.length} · by value</span>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
          <span className="mx-auto mb-3 size-10 rounded-full bg-muted text-muted-foreground grid place-items-center" aria-hidden><Layers className="size-5" /></span>
          <p className="text-sm font-semibold text-foreground">
            {count ? `${count} ${noun}${count === 1 ? '' : 's'} in this ${mf ? 'folio' : 'account'}` : 'Holdings not shared yet'}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-[26rem] mx-auto">
            {inst} shared the total value but not the {noun}-by-{noun} breakdown.
          </p>
          {!count && (
            <button type="button" onClick={onRefresh} disabled={refreshing} className={`mt-4 ${outlineBtn}`}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>
      ) : table ? (
        <div className="mt-3 max-[30rem]:overflow-x-auto">
          <table className="w-full text-[13px]">
            <caption className="sr-only">{mf ? 'Schemes' : 'Holdings'} by value</caption>
            <thead>
              <tr className="text-xs text-muted-foreground text-left">
                <th scope="col" className="font-medium py-2 pr-2">{mf ? 'Scheme' : 'Holding'}</th>
                <th scope="col" className="font-medium py-2 px-2 text-right">Units</th>
                <th scope="col" className="font-medium py-2 px-2 text-right">{mf ? 'NAV' : 'Price'}</th>
                <th scope="col" className="font-medium py-2 px-2 text-right">Value</th>
                {showShare && <th scope="col" className="font-medium py-2 pl-2 text-right">Share</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((h, i) => (
                <tr key={`${h.name}-${i}`}>
                  <th scope="row" className="py-2.5 pr-2 font-medium text-foreground text-left">{h.name}</th>
                  <td className="py-2.5 px-2 text-right tabular-nums text-muted-foreground whitespace-nowrap">{units(h.units) ?? 'Not shared'}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-muted-foreground whitespace-nowrap">{h.nav !== null ? inr(h.nav) : 'Not shared'}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{h.value !== null ? inr(h.value, 0) : 'Not shared'}</td>
                  {showShare && <td className="py-2.5 pl-2 text-right tabular-nums text-muted-foreground">{share(h.value)}%</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {visible.map((h, i) => {
            const pct = share(h.value);
            const meta = [units(h.units) !== null ? `${units(h.units)} units` : null, h.nav !== null ? `${mf ? 'NAV' : 'Price'} ${inr(h.nav)}` : null].filter(Boolean).join(' · ');
            return (
              <li key={`${h.name}-${i}`} className="py-3">
                <div className="flex justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium text-foreground line-clamp-2 sm:truncate">{h.name}</p>
                  {h.value !== null
                    ? <p className="shrink-0 text-sm font-semibold tabular-nums whitespace-nowrap text-foreground">{inr(h.value, 0)}</p>
                    : <p className="shrink-0 text-xs text-muted-foreground">Value not shared</p>}
                </div>
                {(meta || pct !== null) && (
                  <div className="mt-0.5 flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
                    <span className="truncate">{meta}</span>
                    {pct !== null && <span className="shrink-0">{pct}%{partial ? ' of total' : ''}</span>}
                  </div>
                )}
                {pct !== null && (
                  <div className="mt-2 h-1 rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-[var(--ad-in)]" style={{ width: `${pct}%`, minWidth: 4 }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {partial && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing the first {rows.length} of the {count} {noun}s {inst} shared{showShare ? '. Shares are of the whole account value.' : '.'}
        </p>
      )}

      {rows.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button type="button" aria-pressed={table} onClick={() => setTable(v => !v)} className={textBtn}>
            {table ? 'Show as bars' : 'Show as table'}
          </button>
          {!table && rows.length > 10 && (
            <button type="button" onClick={() => setAll(v => !v)} className={outlineBtn}>
              {all ? 'Show top 10' : `Show all ${rows.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
