import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, FileBarChart, Lock, RefreshCw, ShieldCheck, ShieldPlus, ShieldQuestion } from 'lucide-react';
import { FOCUS, brandSurface, daysBetween, fmtDate, inr, last4, monogram, relativeTime, splitMoney, type AssetDetailData } from './format';

// ─── Wallet card: the account drawn the way people know it, in the bank's colour ───

export function WalletCard({ data, subLine, valueLabel, value, valueNote, refreshing }: {
  data: AssetDetailData;
  subLine: string;
  valueLabel: string;
  /** null when the institution shared no value (shown as `valueNote`, never as ₹0). */
  value: number | null;
  valueNote?: string;
  refreshing: boolean;
}) {
  const { asset } = data;
  const mono = monogram(asset.institutionName || 'Account');
  const known = ['DEPOSIT', 'EQUITY', 'MUTUAL_FUND', 'INSURANCE_POLICIES', 'NPS'].includes(asset.fiType);
  const brand = brandSurface(known ? mono.color : '#3f3f46');
  const money = splitMoney(value ?? 0);
  const len = money.rupees.length;
  const size = len <= 9 ? 'text-[2.5rem] sm:text-[3rem]' : len <= 11 ? 'text-[2.125rem] sm:text-[2.5rem]' : 'text-[1.75rem] sm:text-[2.125rem]';
  const l4 = last4(asset.accountRef);
  const stale = daysBetween(new Date(asset.fetchedAt).getTime(), Date.now()) > 7;
  const syncedAt = fmtDate(asset.fetchedAt, { time: true }) ?? '';

  return (
    <section
      aria-labelledby="acct-name"
      aria-busy={refreshing}
      style={{ '--brand': brand, background: 'linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand), black 22%) 100%)' } as CSSProperties}
      className={`relative isolate w-full max-w-[26rem] aspect-[1.586/1] rounded-[1.25rem] p-5 sm:p-6 text-white flex flex-col justify-between gap-3 transition-opacity motion-reduce:transition-none shadow-[0_1px_2px_rgb(0_0_0/0.08),0_18px_40px_-14px_color-mix(in_srgb,var(--brand)_55%,transparent)] dark:shadow-[0_18px_40px_-14px_rgb(0_0_0/0.65)] dark:ring-1 dark:ring-inset dark:ring-white/10 ${refreshing ? 'opacity-70' : ''}`}
    >
      {/* Decorations live in their own clip layer so the card itself can grow with its content */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 0% 0%, rgb(255 255 255 / .16), transparent 55%)' }} />
        <svg className="absolute -right-16 -bottom-20 size-[220px]" viewBox="0 0 220 220" fill="none" stroke="white" strokeOpacity={0.08} strokeWidth={1.5}>
          <circle cx="110" cy="110" r="108" />
          <circle cx="110" cy="110" r="80" />
          <circle cx="110" cy="110" r="52" />
        </svg>
      </div>

      <div className="flex items-start gap-3">
        <span className="h-9 min-w-9 px-1.5 shrink-0 rounded-lg bg-white/15 ring-1 ring-white/20 grid place-items-center text-xs font-bold tracking-wide" aria-hidden>
          {mono.text}
        </span>
        <div className="min-w-0 flex-1">
          <h1 id="acct-name" className="text-[15px] font-semibold leading-tight truncate">{asset.institutionName || 'Account'}</h1>
          <p className="text-[13px] text-white/80 truncate">{subLine}</p>
        </div>
        <span
          title="Shared read-only via Account Aggregator"
          aria-label="Shared read-only via Account Aggregator"
          className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/85"
        >
          <Lock className="size-3" aria-hidden /> AA
        </span>
      </div>

      <div>
        <p className="text-[13px] text-white/80">{valueLabel}</p>
        {value === null ? (
          <p className="mt-1.5 text-[1.5rem] sm:text-[1.75rem] font-semibold tracking-[-0.01em] leading-tight">{valueNote ?? 'Not shared'}</p>
        ) : (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className={`font-sans font-semibold tracking-[-0.02em] leading-none ${size}`}>
              <span className="sr-only">{inr(value)}</span>
              <span aria-hidden>
                {money.neg ? '−' : ''}{money.rupees}
                {money.paise && <span className="text-[0.5em] text-white/75 font-medium">.{money.paise}</span>}
              </span>
            </p>
            {money.neg && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">Overdrawn</span>}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        {l4 ? (
          <p className="min-w-0">
            <span aria-hidden className="font-mono text-[15px] tracking-[0.2em] text-white/90 whitespace-nowrap">
              <span className="hidden sm:inline">••••&nbsp;&nbsp;</span>••••&nbsp;&nbsp;{l4}
            </span>
            <span className="sr-only">Account ending {l4}</span>
          </p>
        ) : (
          <p className="text-[13px] text-white/80">Account number not shared</p>
        )}
        <span
          title={`Synced ${syncedAt}`}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${stale ? 'bg-amber-300 text-zinc-900' : 'bg-white/15'}`}
        >
          {stale ? <AlertTriangle className="size-3.5" aria-hidden /> : <span className="size-1.5 rounded-full bg-white" aria-hidden />}
          Synced {relativeTime(asset.fetchedAt)}
        </span>
      </div>
    </section>
  );
}

// ─── Action bar: three thumb-sized actions under the card ───

const NOMINEE_ACTION: Record<AssetDetailData['nominee']['status'], { icon: ReactNode; label: string; circle: string; attention?: boolean }> = {
  missing:     { icon: <ShieldPlus className="size-5" strokeWidth={1.75} />, label: 'Add nominee', attention: true, circle: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-rose-300' },
  in_progress: { icon: <Clock className="size-5" strokeWidth={1.75} />, label: 'Track nominee', circle: 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/15 dark:border-sky-400/30 dark:text-sky-300' },
  registered:  { icon: <ShieldCheck className="size-5" strokeWidth={1.75} />, label: 'Update nominee', circle: '' },
  unknown:     { icon: <ShieldQuestion className="size-5" strokeWidth={1.75} />, label: 'Check nominee', circle: '' },
};

const ITEM = `flex flex-col items-center gap-2 rounded-2xl py-2 min-h-[4.5rem] hover:bg-card/70 dark:hover:bg-card/60 transition-colors disabled:cursor-default ${FOCUS}`;
const CIRCLE = 'relative size-12 rounded-full grid place-items-center border shadow-[0_1px_2px_rgb(16_24_40/0.06)] dark:shadow-none';
const NEUTRAL = 'bg-card border-border text-foreground';
const LABEL = 'text-xs font-medium text-foreground text-center leading-tight';

export function ActionBar({ nominee, refreshing, onRefresh }: {
  nominee: AssetDetailData['nominee']['status'];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const n = NOMINEE_ACTION[nominee];
  return (
    <nav aria-label="Account actions" className="mt-4 grid grid-cols-3 gap-2 max-w-[26rem]">
      <Link to="/nominee" className={ITEM}>
        <span className={`${CIRCLE} ${n.circle || NEUTRAL}`}>
          {n.icon}
          {n.attention && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-rose-600 ring-2 ring-[var(--background)]" />}
        </span>
        <span className={LABEL}>{n.label}{n.attention && <span className="sr-only">, needs attention</span>}</span>
      </Link>
      <button type="button" onClick={onRefresh} disabled={refreshing} aria-busy={refreshing} className={ITEM}>
        <span className={`${CIRCLE} ${NEUTRAL}`}>
          <RefreshCw className={`size-5 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} strokeWidth={1.75} />
        </span>
        <span className={LABEL}>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
      </button>
      <Link to="/report" className={ITEM}>
        <span className={`${CIRCLE} ${NEUTRAL}`}><FileBarChart className="size-5" strokeWidth={1.75} /></span>
        <span className={LABEL}>Full report</span>
      </Link>
    </nav>
  );
}
