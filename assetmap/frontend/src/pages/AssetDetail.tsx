import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Landmark, Shield, FileText, Building2,
  ShieldCheck, ShieldAlert, Loader2, RefreshCw, Lock, Receipt, LineChart, Layers, SearchX,
} from 'lucide-react';
import { api } from '../services/api';
import { AppError } from '../errors/AppError';
import { DetailPageSkeleton, PageLoadError } from '../components/loading/DetailPageSkeleton';
import { ErrorCard } from '../components/errors/ErrorCard';

// ─── Types (GET /api/assets/financial/:id/detail) ───

type DetailValue = string | number | null;
interface AssetDetailData {
  asset: { id: string; fiType: string; institutionName: string; accountRef: string; balance: number; currency: string; fetchedAt: string };
  details: Record<string, DetailValue>;
  holdings: { name: string; units: number | null; nav: number | null; value: number | null }[];
  nominee: { status: 'registered' | 'missing' | 'in_progress' | 'unknown'; lastCheckedAt: string | null };
  history: { date: string; balance: number }[];
  transactions: { id: string; date: string; narration: string; type: 'CREDIT' | 'DEBIT'; amount: number; balanceAfter: number | null }[];
}

// ─── Formatting ───

const inr = (n: number, decimals = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const inrShort = (n: number) =>
  n >= 1e7 ? `₹${+(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${+(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(0)}K` : `₹${Math.round(n)}`;
const fmtDate = (v: string | null | undefined, withTime = false) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) });
};
const titleCase = (v: DetailValue) =>
  typeof v === 'string' ? v.replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : v;
function relativeTime(v: string) {
  const mins = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  return days < 30 ? `${days} day${days > 1 ? 's' : ''} ago` : fmtDate(v)!;
}
const daysUntil = (v: DetailValue) => {
  if (typeof v !== 'string') return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : Math.ceil((t - Date.now()) / 86400000);
};

// ─── Per-type presentation ───

const TYPE_META: Record<string, { label: string; valueLabel: string; icon: ReactNode }> = {
  DEPOSIT:            { label: 'Bank account',     valueLabel: 'Available balance', icon: <Wallet className="size-6" strokeWidth={1.75} /> },
  EQUITY:             { label: 'Stocks & demat',   valueLabel: 'Current value',     icon: <TrendingUp className="size-6" strokeWidth={1.75} /> },
  MUTUAL_FUND:        { label: 'Mutual funds',     valueLabel: 'Current value',     icon: <Building2 className="size-6" strokeWidth={1.75} /> },
  INSURANCE_POLICIES: { label: 'Insurance policy', valueLabel: 'Policy value',      icon: <Shield className="size-6" strokeWidth={1.75} /> },
  NPS:                { label: 'National Pension', valueLabel: 'Current value',     icon: <Landmark className="size-6" strokeWidth={1.75} /> },
  GSTN:               { label: 'GST record',       valueLabel: 'Value',             icon: <FileText className="size-6" strokeWidth={1.75} /> },
};
const isInvestment = (t: string) => t === 'EQUITY' || t === 'MUTUAL_FUND' || t === 'NPS';

/** Detail rows for the side card; rows with no data from the institution are left out. */
function detailRows(d: AssetDetailData): { label: string; value: ReactNode; mono?: boolean }[] {
  const x = d.details;
  const n = (v: DetailValue) => (typeof v === 'number' ? v : null);
  const rows: { label: string; value: ReactNode | null; mono?: boolean }[] = [
    { label: 'Institution', value: d.asset.institutionName },
    { label: d.asset.fiType === 'INSURANCE_POLICIES' ? 'Policy number' : d.asset.fiType === 'NPS' ? 'PRAN' : 'Account number', value: d.asset.accountRef, mono: true },
    { label: d.asset.fiType === 'INSURANCE_POLICIES' ? 'Policy type' : 'Account type', value: titleCase(x.accountType) },
    { label: 'Status', value: titleCase(x.status) },
  ];
  if (d.asset.fiType === 'DEPOSIT') {
    rows.push(
      { label: 'IFSC', value: x.ifsc, mono: true },
      { label: 'Branch', value: x.branch },
      { label: 'Opened on', value: fmtDate(x.openedOn as string) },
    );
  }
  if (d.asset.fiType === 'INSURANCE_POLICIES') {
    rows.push(
      { label: 'Plan', value: x.planName },
      { label: 'Policy start', value: fmtDate(x.openedOn as string) },
    );
  }
  if (d.asset.fiType === 'NPS') rows.push({ label: 'Tier', value: titleCase(x.tier) });
  if (n(x.holdingsCount) && isInvestment(d.asset.fiType)) rows.push({ label: d.asset.fiType === 'MUTUAL_FUND' ? 'Schemes / folios' : 'Holdings', value: String(x.holdingsCount) });
  rows.push({ label: 'Currency', value: d.asset.currency });
  return rows.filter((r): r is { label: string; value: ReactNode; mono?: boolean } => r.value !== null && r.value !== undefined && r.value !== '');
}

/** Key figures shown under the balance: what matters most for this kind of asset. */
function keyFigures(d: AssetDetailData): { label: string; value: string; tone?: 'up' | 'down' | 'warn' }[] {
  const x = d.details;
  const n = (v: DetailValue) => (typeof v === 'number' ? v : null);
  const out: { label: string; value: string; tone?: 'up' | 'down' | 'warn' }[] = [];
  const t = d.asset.fiType;

  if (t === 'DEPOSIT') {
    if (n(x.principal) !== null) out.push({ label: 'Principal', value: inr(n(x.principal)!, 0) });
    if (n(x.interestRate) !== null) out.push({ label: 'Interest rate', value: `${n(x.interestRate)}% p.a.` });
    if (n(x.maturityAmount) !== null) out.push({ label: 'Maturity value', value: inr(n(x.maturityAmount)!, 0) });
    const days = daysUntil(x.maturityDate);
    if (x.maturityDate) out.push({ label: 'Matures on', value: `${fmtDate(x.maturityDate as string)}${days !== null ? days >= 0 ? ` · in ${days} days` : ' · matured' : ''}`, tone: days !== null && days <= 30 ? 'warn' : undefined });
  }
  if (isInvestment(t)) {
    if (n(x.investedValue) !== null) out.push({ label: 'Invested', value: inr(n(x.investedValue)!, 0) });
    if (n(x.gainLoss) !== null) {
      const g = n(x.gainLoss)!;
      out.push({ label: 'Gain / loss', value: `${g >= 0 ? '+' : '−'}${inr(Math.abs(g), 0)}${n(x.gainLossPct) !== null ? ` (${g >= 0 ? '+' : ''}${n(x.gainLossPct)}%)` : ''}`, tone: g >= 0 ? 'up' : 'down' });
    }
  }
  if (t === 'INSURANCE_POLICIES') {
    if (n(x.sumAssured) !== null) out.push({ label: 'Sum assured', value: inr(n(x.sumAssured)!, 0) });
    if (n(x.premium) !== null) out.push({ label: 'Premium', value: `${inr(n(x.premium)!, 0)}${x.premiumFrequency ? ` / ${String(titleCase(x.premiumFrequency)).toLowerCase()}` : ''}` });
    const due = daysUntil(x.nextPremiumDue);
    if (x.nextPremiumDue) out.push({ label: 'Next premium due', value: fmtDate(x.nextPremiumDue as string)!, tone: due !== null && due <= 15 ? 'warn' : undefined });
    if (x.maturityDate) out.push({ label: 'Policy ends', value: fmtDate(x.maturityDate as string)! });
  }
  return out;
}

// ─── Building blocks ───

function Card({ title, icon, action, children, className = '' }: { title?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6 ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10">
      <div className="size-10 rounded-full bg-muted text-muted-foreground grid place-items-center mb-3">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[22rem] text-balance">{body}</p>
    </div>
  );
}

function NomineeCard({ data, onAction }: { data: AssetDetailData['nominee']; onAction: () => void }) {
  const cfg = {
    registered:  { icon: <ShieldCheck className="size-5" />, tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10', title: 'Nominee registered', body: 'This account has a nominee on record with the institution.', cta: null },
    in_progress: { icon: <Loader2 className="size-5 animate-spin" />, tone: 'text-sky-600 dark:text-sky-400 bg-sky-500/10', title: 'Nominee update in progress', body: "We're tracking your nominee update with the institution.", cta: 'Track update' },
    missing:     { icon: <ShieldAlert className="size-5" />, tone: 'text-rose-600 dark:text-rose-400 bg-rose-500/10', title: 'No nominee on record', body: 'Without a nominee, your family may face a long claim process for this money.', cta: 'Add a nominee' },
    unknown:     { icon: <Shield className="size-5" />, tone: 'text-muted-foreground bg-muted', title: 'Nominee status unknown', body: "The institution didn't share nominee details. Check and update it in a few steps.", cta: 'Check nominee' },
  }[data.status];

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${cfg.tone}`}>{cfg.icon}</div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{cfg.title}</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cfg.body}</p>
          {data.lastCheckedAt && <p className="text-[11px] text-muted-foreground mt-2">Checked {relativeTime(data.lastCheckedAt)}</p>}
        </div>
      </div>
      {cfg.cta && (
        <button
          onClick={onAction}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {cfg.cta}
        </button>
      )}
    </Card>
  );
}

function ValueHistory({ history, valueLabel }: { history: AssetDetailData['history']; valueLabel: string }) {
  const points = history.map(h => ({ label: new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), full: fmtDate(h.date)!, value: h.balance }));
  if (points.length < 2) {
    return (
      <EmptyState
        icon={<LineChart className="size-5" />}
        title="Not enough history yet"
        body="AssetMap records this account's value every time it syncs. The trend appears after the next sync."
      />
    );
  }
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = last - first;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        {valueLabel} across {points.length} syncs ·{' '}
        {Math.abs(change) < 1 ? (
          <span className="font-medium text-foreground">no change since {points[0].full}</span>
        ) : (
          <>
            <span className={change > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>
              {change > 0 ? '+' : '−'}{inr(Math.abs(change), 0)}
            </span>{' '}since {points[0].full}
          </>
        )}
      </p>
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="assetHistoryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#84cc16" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={6} interval="preserveStartEnd" minTickGap={24} />
            <YAxis axisLine={false} tickLine={false} width={56} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={inrShort} tickCount={5} allowDecimals={false}
              domain={[0, (max: number) => Math.max(max * 1.15, 1)]} />
            <Tooltip
              cursor={{ stroke: 'var(--border)' }}
              content={({ active, payload }) => active && payload?.length ? (
                <div className="rounded-lg border border-border bg-popover text-popover-foreground px-3 py-2 shadow-lg">
                  <p className="text-[11px] text-muted-foreground">{payload[0].payload.full}</p>
                  <p className="text-sm font-semibold">{inr(payload[0].value as number)}</p>
                </div>
              ) : null}
            />
            <Area type="monotone" dataKey="value" stroke="#65a30d" strokeWidth={2} fill="url(#assetHistoryFill)" dot={{ r: 3, fill: '#65a30d' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Transactions({ items }: { items: AssetDetailData['transactions'] }) {
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [limit, setLimit] = useState(15);
  const shown = items.filter(t => filter === 'ALL' || t.type === filter);

  const groups = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const map = new Map<string, typeof items>();
    for (const t of shown.slice(0, limit)) {
      const ds = new Date(t.date).toDateString();
      const key = ds === today ? 'Today' : ds === yesterday ? 'Yesterday' : fmtDate(t.date)!;
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return [...map.entries()];
  }, [shown, limit]);

  if (!items.length) {
    return (
      <EmptyState
        icon={<Receipt className="size-5" />}
        title="No transactions shared yet"
        body="Transactions appear here once the bank shares them through your Account Aggregator consent."
      />
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Filter transactions" className="inline-flex rounded-full bg-muted p-1 mb-4">
        {(['ALL', 'CREDIT', 'DEBIT'] as const).map(f => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => { setFilter(f); setLimit(15); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {f === 'ALL' ? 'All' : f === 'CREDIT' ? 'Money in' : 'Money out'}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No {filter === 'CREDIT' ? 'credits' : 'debits'} in the shared history.</p>
      ) : (
        <div className="space-y-4">
          {groups.map(([day, txns]) => (
            <div key={day}>
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{day}</h3>
              <ul className="divide-y divide-border">
                {txns.map(t => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${t.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        {t.type === 'CREDIT' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.narration}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(t.date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                          {t.balanceAfter !== null && <> · Bal {inr(t.balanceAfter, 0)}</>}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {t.type === 'CREDIT' ? '+' : '−'}{inr(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {shown.length > limit && (
            <button onClick={() => setLimit(l => l + 15)} className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Show more ({shown.length - limit} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Holdings({ items, count, fiType }: { items: AssetDetailData['holdings']; count: DetailValue; fiType: string }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={<Layers className="size-5" />}
        title={typeof count === 'number' && count > 0 ? `${count} ${fiType === 'MUTUAL_FUND' ? 'schemes' : 'holdings'} in this account` : 'No holdings shared yet'}
        body="The institution shared the total value but not the line-by-line breakdown. It will appear here when they do."
      />
    );
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground text-left">
            <th className="font-medium px-1 pb-2">{fiType === 'MUTUAL_FUND' ? 'Scheme' : 'Holding'}</th>
            <th className="font-medium px-1 pb-2 text-right">Units</th>
            <th className="font-medium px-1 pb-2 text-right">{fiType === 'MUTUAL_FUND' ? 'NAV' : 'Price'}</th>
            <th className="font-medium px-1 pb-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((h, i) => (
            <tr key={`${h.name}-${i}`}>
              <td className="px-1 py-2.5 text-foreground font-medium max-w-[16rem] truncate">{h.name}</td>
              <td className="px-1 py-2.5 text-right tabular-nums text-muted-foreground">{h.units?.toLocaleString('en-IN', { maximumFractionDigits: 3 }) ?? '—'}</td>
              <td className="px-1 py-2.5 text-right tabular-nums text-muted-foreground">{h.nav !== null ? inr(h.nav) : '—'}</td>
              <td className="px-1 py-2.5 text-right tabular-nums text-foreground font-semibold">{h.value !== null ? inr(h.value, 0) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ───

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AssetDetailData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get(`/assets/financial/${id}/detail`)
      .then(res => { if (!cancelled) setData(res.data.data as AssetDetailData); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const goBack = () => (window.history.length > 2 ? navigate(-1) : navigate('/dashboard'));

  if (loading && !data) return <DetailPageSkeleton label="Loading account details" />;

  if (!data) {
    const notFound = error instanceof AppError && error.statusCode === 404;
    return (
      <PageLoadError>
        {notFound ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="size-12 rounded-full bg-muted text-muted-foreground grid place-items-center mx-auto mb-4"><SearchX className="size-6" /></div>
            <h1 className="text-lg font-semibold text-foreground">Account not found</h1>
            <p className="text-sm text-muted-foreground mt-1">It may have been removed after your latest sync.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90">
              Back to dashboard
            </button>
          </div>
        ) : (
          <ErrorCard error={error} title="We couldn't load this account" onRetry={() => setReloadKey(k => k + 1)} />
        )}
      </PageLoadError>
    );
  }

  const { asset } = data;
  const meta = TYPE_META[asset.fiType] ?? { label: asset.fiType, valueLabel: 'Value', icon: <Wallet className="size-6" strokeWidth={1.75} /> };
  const figures = keyFigures(data);
  const rows = detailRows(data);
  const showTransactions = asset.fiType === 'DEPOSIT' || data.transactions.length > 0;
  const showHoldings = asset.fiType === 'EQUITY' || asset.fiType === 'MUTUAL_FUND';

  // Balance the two columns: with no holdings/transactions the details move to the main column
  const leftIsLong = showHoldings || showTransactions;
  const detailsCard = (
    <Card title={asset.fiType === 'INSURANCE_POLICIES' ? 'Policy details' : 'Account details'} icon={<FileText className="size-4" />}>
      <dl className="divide-y divide-border">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className={`text-sm text-foreground text-right truncate ${r.mono ? 'font-mono tracking-wide' : 'font-medium'}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );

  return (
    <div className="page-gradient-bg min-h-screen text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-[72rem] px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <button
            onClick={() => setReloadKey(k => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
            aria-label="Reload account details"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Synced {relativeTime(asset.fetchedAt)}</span>
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-[72rem] px-4 sm:px-6 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Hero: who, what, how much */}
        <section className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="size-14 rounded-2xl bg-lime-300 text-zinc-900 grid place-items-center shrink-0 shadow-sm">{meta.icon}</div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">{asset.institutionName}</h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>{meta.label}</span>
                  <span aria-hidden>·</span>
                  <span className="font-mono tracking-wide">{asset.accountRef}</span>
                </p>
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{meta.valueLabel}</p>
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums mt-1">{inr(asset.balance)}</p>
              <p className="text-xs text-muted-foreground mt-1">As of {fmtDate(asset.fetchedAt, true)}</p>
            </div>
          </div>

          {figures.length > 0 && (
            <dl className="mt-5 pt-5 border-t border-border grid grid-cols-2 lg:grid-cols-4 gap-4">
              {figures.map(f => (
                <div key={f.label} className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{f.label}</dt>
                  <dd className={`mt-1 text-sm font-semibold tabular-nums ${f.tone === 'up' ? 'text-emerald-600 dark:text-emerald-400' : f.tone === 'down' ? 'text-rose-600 dark:text-rose-400' : f.tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <Card title="Value history" icon={<LineChart className="size-4" />}>
              <ValueHistory history={data.history} valueLabel={meta.valueLabel} />
            </Card>

            {showHoldings && (
              <Card title={asset.fiType === 'MUTUAL_FUND' ? 'Schemes' : 'Holdings'} icon={<Layers className="size-4" />}>
                <Holdings items={data.holdings} count={data.details.holdingsCount} fiType={asset.fiType} />
              </Card>
            )}

            {showTransactions && (
              <Card title="Recent transactions" icon={<Receipt className="size-4" />}
                action={data.transactions.length > 0 ? <span className="text-xs text-muted-foreground">{data.transactions.length} shared</span> : undefined}>
                <Transactions items={data.transactions} />
              </Card>
            )}

            {!leftIsLong && detailsCard}
          </div>

          <aside className="space-y-6 min-w-0">
            <NomineeCard data={data.nominee} onAction={() => navigate('/nominee')} />

            {leftIsLong && detailsCard}

            <Card title="Data source" icon={<Lock className="size-4" />}>
              <dl className="divide-y divide-border">
                <div className="flex items-center justify-between gap-4 pb-2.5">
                  <dt className="text-xs text-muted-foreground">Shared via</dt>
                  <dd className="text-sm font-medium text-foreground">Account Aggregator</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-xs text-muted-foreground">Last synced</dt>
                  <dd className="text-sm font-medium text-foreground">{fmtDate(asset.fetchedAt, true)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 pt-2.5">
                  <dt className="text-xs text-muted-foreground">Access</dt>
                  <dd className="text-sm font-medium text-foreground">Read-only, with your consent</dd>
                </div>
              </dl>
              <button
                onClick={() => navigate('/consent')}
                className="mt-4 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Review data-sharing consent
              </button>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
