import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Lock, SearchX } from 'lucide-react';
import { api } from '../services/api';
import { getFinancialAssets } from '../services/assets';
import { useAssetStore } from '../store/assetStore';
import { AppError } from '../errors/AppError';
import { ErrorCard, userFacingMessage } from '../components/errors/ErrorCard';
import {
  FOCUS, SECTION, fmtDate, labelOf, last4, parseNarration,
  type AssetDetailData, type DetailValue,
} from '../components/asset-detail/format';
import { ActivityChart, balanceSeries, completeFlows, hasMeaningfulTrend } from '../components/asset-detail/Charts';
import { TransactionList } from '../components/asset-detail/TransactionList';
import { StatusPanel, healthChecks, isFixedDeposit } from '../components/asset-detail/HealthCard';
import { WalletCard, ActionBar } from '../components/asset-detail/WalletCard';
import { KeyFacts, keyFacts } from '../components/asset-detail/KeyFacts';
import { Holdings, TermMeter, hasTerm, termHasStart } from '../components/asset-detail/TypePanels';
import { CopyButton } from '../components/asset-detail/CopyButton';

// ─── Per-type copy ───

const TYPE_LABEL: Record<string, string> = {
  DEPOSIT: 'Bank account', EQUITY: 'Demat account', MUTUAL_FUND: 'Mutual fund folio',
  INSURANCE_POLICIES: 'Insurance policy', NPS: 'NPS account', GSTN: 'GST record',
};
const VALUE_LABEL: Record<string, string> = {
  DEPOSIT: 'Available balance', EQUITY: 'Current value', MUTUAL_FUND: 'Current value',
  INSURANCE_POLICIES: 'Policy value', NPS: 'Current value',
};
const isInvestment = (t: string) => t === 'EQUITY' || t === 'MUTUAL_FUND' || t === 'NPS';
const numOf = (v: DetailValue) => (typeof v === 'number' ? v : null);
const strOf = (v: DetailValue) => (typeof v === 'string' && v ? v : null);

/** The line under the bank name on the card. */
function subLine(d: AssetDetailData): string {
  const t = d.asset.fiType;
  const type = labelOf(d.details.accountType);
  if (isFixedDeposit(d)) return type ?? 'Fixed deposit';
  if (t === 'DEPOSIT') return type && type.toLowerCase() !== 'bank account' ? `${type} · Bank account` : 'Bank account';
  if (t === 'NPS') return labelOf(d.details.tier) ? `NPS account · Tier ${labelOf(d.details.tier)}` : 'NPS account';
  if (t === 'INSURANCE_POLICIES') return strOf(d.details.planName) ?? 'Insurance policy';
  return TYPE_LABEL[t] ?? 'Account';
}

/**
 * Insurance with no surrender value shows the cover instead. The API turns a missing balance into 0,
 * so a policy with neither is "not shared" (or, for a term plan, has no cash value), never ₹0.
 */
function heroValue(d: AssetDetailData): { label: string; value: number | null; note?: string; sumAssured: boolean } {
  const sa = numOf(d.details.sumAssured);
  if (d.asset.fiType === 'INSURANCE_POLICIES' && d.asset.balance <= 0) {
    if (sa !== null && sa > 0) return { label: 'Sum assured', value: sa, sumAssured: true };
    const term = /TERM/i.test(String(d.details.accountType ?? ''));
    return { label: term ? 'Term cover' : 'Policy value', value: null, note: term ? 'No cash value' : 'Not shared', sumAssured: false };
  }
  return { label: isFixedDeposit(d) ? 'Current value' : VALUE_LABEL[d.asset.fiType] ?? 'Value', value: d.asset.balance, sumAssured: false };
}

type DetailRow = { label: string; value: string; mono?: boolean; copy?: boolean };

/** `term`: what the term meter already shows (its start and end dates are left out here). */
function detailItems(d: AssetDetailData, term: { start: boolean; end: boolean }): DetailRow[] {
  const x = d.details;
  const t = d.asset.fiType;
  const ins = t === 'INSURANCE_POLICIES';
  const items: { label: string; value: string | null; mono?: boolean; copy?: boolean }[] = [
    { label: ins ? 'Policy no.' : t === 'NPS' ? 'PRAN' : t === 'MUTUAL_FUND' ? 'Folio' : t === 'EQUITY' ? 'Demat' : 'Account no.', value: d.asset.accountRef && d.asset.accountRef !== '—' ? d.asset.accountRef : null, mono: true },
    { label: ins ? 'Policy type' : 'Type', value: labelOf(x.accountType) },
    { label: 'Plan', value: strOf(x.planName) },
    { label: 'IFSC', value: strOf(x.ifsc), mono: true, copy: true },
    { label: 'Branch', value: strOf(x.branch) },
    { label: 'Status', value: labelOf(x.status) },
    { label: ins ? 'Start date' : 'Opened', value: term.start ? null : fmtDate(strOf(x.openedOn)) },
    { label: ins ? 'Policy ends' : 'Maturity date', value: !term.end && (isFixedDeposit(d) || ins) ? fmtDate(strOf(x.maturityDate)) : null },
    { label: 'Tier', value: labelOf(x.tier) },
    { label: 'Nominee checked', value: fmtDate(d.nominee.lastCheckedAt) },
    { label: 'Currency', value: d.asset.currency && d.asset.currency !== 'INR' ? d.asset.currency : null },
  ];
  return items.filter((i): i is DetailRow => !!i.value);
}

function detailsTitle(t: string) {
  return t === 'INSURANCE_POLICIES' ? 'Policy details' : t === 'MUTUAL_FUND' ? 'Folio details' : t === 'EQUITY' ? 'Demat details' : 'Account details';
}

// ─── Layout pieces ───

const PAGE = 'min-h-screen bg-muted/50 dark:bg-background text-foreground [--ad-in:#4d7c0f] dark:[--ad-in:#65a30d] [--ad-out:#6366f1]';
const ROW_A = 'grid grid-cols-1 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:grid-cols-[26rem_minmax(0,1fr)] gap-4 md:gap-8 items-start';
const ROW_B = 'mt-4 md:mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_21rem] gap-4 lg:gap-6 items-start lg:items-stretch';
const MAIN = 'mx-auto max-w-[72rem] px-4 sm:px-6 pt-4 sm:pt-8 pb-[calc(3rem+env(safe-area-inset-bottom))]';

function TopBar({ onBack, crumb }: { onBack: () => void; crumb: string | null }) {
  return (
    <nav aria-label="Breadcrumb" className="sticky top-0 z-40 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[72rem] h-full px-4 sm:px-6 flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className={`sm:hidden size-11 -ml-2 shrink-0 rounded-full grid place-items-center text-foreground hover:bg-muted transition-colors ${FOCUS}`}>
          <ArrowLeft className="size-5" />
        </button>
        <button type="button" onClick={onBack} className={`hidden sm:inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted transition-colors ${FOCUS}`}>
          <ArrowLeft className="size-4" /> Back
        </button>
        {crumb && (
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            <li className="hidden sm:flex items-center gap-2 shrink-0">
              <Link to="/dashboard" className={`rounded text-muted-foreground hover:text-foreground transition-colors ${FOCUS}`}>Accounts</Link>
              <span aria-hidden className="text-muted-foreground/60">/</span>
            </li>
            <li aria-current="page" className="min-w-0 truncate font-medium text-foreground">{crumb}</li>
          </ol>
        )}
      </div>
    </nav>
  );
}

function Skeleton() {
  const b = 'bg-muted animate-pulse motion-reduce:animate-none';
  return (
    <div className={PAGE} role="status" aria-busy="true" aria-label="Loading account details">
      <TopBar onBack={() => window.history.back()} crumb={null} />
      <div className={MAIN}>
        <div className={ROW_A}>
          <div>
            <div className={`${b} w-full max-w-[26rem] aspect-[1.586/1] rounded-[1.25rem]`} />
            <div className="mt-4 grid grid-cols-3 gap-2 max-w-[26rem]">
              {[0, 1, 2].map(i => <div key={i} className="flex flex-col items-center gap-2 py-2"><div className={`${b} size-12 rounded-full`} /><div className={`${b} h-3 w-14 rounded`} /></div>)}
            </div>
          </div>
          <div className="space-y-4">
            <div className={`${b} h-44 rounded-[1.25rem]`} />
            <div className={`${b} h-24 rounded-[1.25rem]`} />
          </div>
        </div>
        <div className={ROW_B}>
          <div className={`${b} h-64 rounded-[1.25rem]`} />
          <div className={`${b} h-72 rounded-[1.25rem]`} />
        </div>
      </div>
      <span className="sr-only">Loading account details…</span>
    </div>
  );
}

// ─── Page ───

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setAssets = useAssetStore(s => s.setAssets);
  const [data, setData] = useState<AssetDetailData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get(`/assets/financial/${id}/detail`)
      .then(res => { if (!cancelled) setData(res.data.data as AssetDetailData); })
      .catch(err => { if (!cancelled) { setError(err); setData(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const capped = (data?.transactions.length ?? 0) >= 200;
  const series = useMemo(() => (data ? balanceSeries(data) : []), [data]);
  const flows = useMemo(() => (data ? completeFlows(data.transactions, capped) : []), [data, capped]);

  const goBack = () => (window.history.length > 2 ? navigate(-1) : navigate('/dashboard'));
  const openNominee = () => navigate('/nominee');

  // Re-sync through the user's active AA consent. A sync replaces the snapshot rows,
  // so the account comes back with a new id: find it again by type + bank + last 4 digits.
  const refresh = async () => {
    if (!data || refreshing) return;
    setRefreshing(true);
    setAnnounce('');
    const l4 = (s: string) => s.replace(/[^0-9]/g, '').slice(-4);
    try {
      await api.post('/assets/refresh', {});
      const list = await getFinancialAssets();
      if (Array.isArray(list)) setAssets(list);
      const match = list.find(a => a.fiType === data.asset.fiType && a.institutionName === data.asset.institutionName && l4(a.accountRef) === l4(data.asset.accountRef));
      toast.success('Account refreshed', { description: 'Latest balance and transactions loaded.' });
      setAnnounce('Account refreshed');
      if (match && match.id !== data.asset.id) navigate(`/asset/${match.id}`, { replace: true });
      else setReloadKey(k => k + 1);
    } catch (err) {
      const status = err instanceof AppError ? err.statusCode : null;
      if (status === 403) {
        toast.error('Data-sharing consent needed', { description: 'Renew your Account Aggregator consent to refresh.', action: { label: 'Renew', onClick: () => navigate('/consent') } });
      } else if (status !== null && status < 500) {
        toast.error("Couldn't refresh", { description: userFacingMessage(err) });
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !data) return <Skeleton />;

  if (!data) {
    const notFound = error instanceof AppError && error.statusCode === 404;
    return (
      <div className={PAGE}>
        <TopBar onBack={goBack} crumb={null} />
        <main className="px-4 sm:px-6">
          {notFound ? (
            <div className={`${SECTION} p-8 text-center max-w-[28rem] mx-auto mt-16`}>
              <div className="size-12 rounded-full bg-muted text-muted-foreground grid place-items-center mx-auto mb-4" aria-hidden><SearchX className="size-6" /></div>
              <h1 className="text-lg font-semibold text-foreground">Account not found</h1>
              <p className="text-sm text-muted-foreground mt-1">It may have been replaced by your latest sync.</p>
              <button type="button" onClick={() => navigate('/dashboard')} className={`mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 text-white dark:bg-lime-300 dark:text-zinc-900 px-5 text-sm font-semibold hover:opacity-90 ${FOCUS}`}>
                Back to dashboard
              </button>
            </div>
          ) : (
            <div className="max-w-[28rem] mx-auto mt-16">
              <ErrorCard error={error} title="We couldn't load this account" onRetry={() => setReloadKey(k => k + 1)} />
            </div>
          )}
        </main>
      </div>
    );
  }

  const { asset } = data;
  const t = asset.fiType;
  const fd = isFixedDeposit(data);
  const ins = t === 'INSURANCE_POLICIES';
  const savings = t === 'DEPOSIT' && !fd;
  const hero = heroValue(data);
  const checks = healthChecks(data, { nominee: openNominee, refresh: () => void refresh(), refreshing });
  const l4 = last4(asset.accountRef);
  const crumb = `${asset.institutionName || TYPE_LABEL[t] || 'Account'}${l4 ? ` ••${l4}` : ''}`;

  // Deposit / policy term: drawn once, as the footer of the facts card. Its dates leave Details,
  // and its "time left" is dropped when the status card already leads with the maturity.
  const termStart = strOf(data.details.openedOn);
  const termEnd = fd || ins ? strOf(data.details.maturityDate) : null;
  const showTerm = hasTerm(termEnd);
  const term = showTerm && (
    <TermMeter kind={ins ? 'policy' : 'deposit'} start={termStart} end={termEnd} headline={!checks.some(c => c.key === 'maturity')} />
  );

  // A single fact is not worth a card of its own: it joins Details instead.
  const facts = keyFacts(data, hero.sumAssured);
  const factsCard = facts.length >= 2 || showTerm;
  const items: DetailRow[] = [
    ...detailItems(data, { start: showTerm && termHasStart(termStart, termEnd), end: showTerm }),
    ...(factsCard ? [] : facts.map(f => ({ label: f.label, value: f.sub ? `${f.value} · ${f.sub}` : f.value }))),
  ];

  const showBalance = hasMeaningfulTrend(series);
  const showFlow = savings && flows.length >= 2;
  const showChart = showBalance || showFlow;
  const showTransactions = savings || data.transactions.length > 0;
  const allInterest = data.transactions.length > 0 && data.transactions.every(tx => parseNarration(tx.narration, tx.mode).mode === 'INTEREST');
  const chart = showChart && (
    <ActivityChart
      key={asset.id}
      series={showBalance ? series : []}
      flows={showFlow ? flows : []}
      balanceTitle={isInvestment(t) ? 'Value over time' : 'Balance'}
      refreshing={refreshing}
    />
  );

  // Nothing for the history column (an FD or policy with no shared entries): Details runs full width
  // in two columns instead of forming a tall, narrow aside beside an empty column.
  const historyEmpty = !showChart && !isInvestment(t) && !showTransactions;
  const details = (wide: boolean) => (
    <section aria-labelledby="details-h" className={`${SECTION} p-5 sm:p-6 min-w-0 ${wide ? '' : 'lg:sticky lg:top-20'}`}>
      <h2 id="details-h" className="text-base font-semibold text-foreground">{detailsTitle(t)}</h2>
      <dl className={`mt-3 ${wide ? 'grid sm:grid-cols-2 sm:gap-x-10' : ''}`}>
        {items.map(i => (
          <div key={i.label} className="flex items-center justify-between gap-4 py-3 min-h-12 border-t border-border">
            <dt className="text-[13px] text-muted-foreground shrink-0">{i.label}</dt>
            <dd className="flex min-w-0 items-center justify-end gap-1">
              <span className={`truncate font-medium text-foreground text-right ${i.mono ? 'font-mono text-[0.9375rem] tracking-[0.02em]' : 'text-sm'}`}>{i.value}</span>
              {i.copy && <span className="-my-2 -mr-2 sm:-my-1 sm:-mr-1.5"><CopyButton value={i.value} label={i.label} /></span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="pt-4 border-t border-border flex gap-2 text-xs leading-relaxed text-muted-foreground">
        <Lock className="size-3.5 mt-0.5 shrink-0" aria-hidden />
        <span>Read-only via Setu Account Aggregator. AssetMap can't move money. Synced {fmtDate(asset.fetchedAt, { time: true })}.</span>
      </p>
    </section>
  );

  return (
    <div className={PAGE}>
      <TopBar onBack={goBack} crumb={crumb} />

      <main className={`${MAIN} animate-in fade-in duration-300 motion-reduce:animate-none`}>
        <span className="sr-only" aria-live="polite">{announce}</span>

        {/* Row A: the account and what needs doing */}
        <div className={ROW_A}>
          <div className="min-w-0">
            <WalletCard data={data} subLine={subLine(data)} valueLabel={hero.label} value={hero.value} valueNote={hero.note} refreshing={refreshing} />
            <ActionBar nominee={data.nominee.status} refreshing={refreshing} onRefresh={() => void refresh()} />
          </div>
          <div className="min-w-0 space-y-4">
            <StatusPanel checks={checks} data={data} />
            {factsCard && <KeyFacts facts={facts} term={term} label={fd ? 'Deposit terms' : ins ? 'Policy terms' : 'Key facts'} />}
          </div>
        </div>

        {/* Row B: history and reference */}
        {historyEmpty ? (
          <div className="mt-4 md:mt-8">{details(true)}</div>
        ) : (
          <div className={ROW_B}>
            <div className="min-w-0 flex flex-col gap-4 lg:gap-6">
              {chart}
              {isInvestment(t) && <Holdings data={data} onRefresh={() => void refresh()} refreshing={refreshing} />}
              {showTransactions && (
                <TransactionList
                  items={data.transactions}
                  institutionName={asset.institutionName}
                  capped={capped}
                  onRefresh={() => void refresh()}
                  refreshing={refreshing}
                  title={fd && allInterest ? 'Interest & payouts' : 'Transactions'}
                  shortTabs={isInvestment(t)}
                />
              )}
            </div>
            <div className="min-w-0">{details(false)}</div>
          </div>
        )}
      </main>
    </div>
  );
}
