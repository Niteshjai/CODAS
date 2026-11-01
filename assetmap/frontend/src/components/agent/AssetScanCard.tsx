import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertOctagon, AlertTriangle, CheckCheck, CheckCircle2, ChevronDown, CircleSlash, Info,
  Layers, RefreshCw, ScanSearch, Sparkles, TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { userFacingMessage } from '../errors/ErrorCard';
import { AppError } from '../../errors/AppError';
import {
  errorStatus, getAgentAnomalies, requestAgentRun, resolveAgentAnomaly, retryAfterSeconds,
  type AgentAnomaly, type AgentRun, type AgentStatus, type AnomalySeverity,
} from '../../services/agent';
import { useAgentStatus, useNow } from './useAgentStatus';

/* ═══════════════════════════════════════════════════
   Asset organiser card (Overview tab).
   Is my portfolio being organised right now, when was it last scanned, what changed,
   and does anything need a look? Every number comes from GET /api/agent/status.
   ═══════════════════════════════════════════════════ */

const ANOMALIES_ANCHOR = 'agent-anomalies';

// ── Plain-language copy ──────────────────────────────

const STAGES = [
  { label: 'Gathering your data',        match: /^(initiali[sz]|load|fetch|read)/i },
  { label: 'Organising your assets',     match: /normali[sz]|classif|organi[sz]/i },
  { label: 'Removing duplicates',        match: /dedup|duplicate/i },
  { label: 'Checking for anything unusual', match: /enrich|anomal|insight|(^|_)ai(_|$)/i },
  { label: 'Saving your portfolio',      match: /inject|save|persist|write|final|done/i },
];

const STEP_WORDS: Record<string, string> = {
  initialising: 'Getting ready',
  initializing: 'Getting ready',
  fetch_aa_data: 'Reading your bank and investment accounts',
  load_aa_data: 'Reading your bank and investment accounts',
  fetch_land_data: 'Checking your land records',
  load_land_data: 'Checking your land records',
  fetch_unclaimed: 'Checking unclaimed asset results',
  load_unclaimed: 'Checking unclaimed asset results',
  fetch_documents: 'Checking your DigiLocker documents',
  fetch_mca_data: 'Checking company records',
};

const SOURCE_WORDS: Record<string, string> = {
  setu_aa: 'bank and investment accounts',
  fetch_aa_data: 'bank and investment accounts',
  load_aa_data: 'bank and investment accounts',
  surepass: 'land records',
  fetch_land_data: 'land records',
  load_land_data: 'land records',
  iepf_epfo: 'unclaimed asset results',
  fetch_unclaimed: 'unclaimed asset results',
  load_unclaimed: 'unclaimed asset results',
  digilocker: 'DigiLocker documents',
  fetch_documents: 'DigiLocker documents',
  mca21: 'company records',
  fetch_mca_data: 'company records',
};

const TRIGGER_WORDS: Record<string, string> = {
  consent_granted: 'after you linked your accounts',
  data_updated: 'after new data arrived',
  user_refresh: 'started by you',
  cron_scheduled: 'routine daily check',
  manual_admin: 'started by our support team',
};

const ANOMALY_WORDS: Record<string, string> = {
  sudden_balance_drop: 'Sudden drop in balance',
  new_unknown_account: "A new account we hadn't seen before",
  land_mutation_detected: 'A change in your land records',
  large_transaction: 'An unusually large transaction',
  dormant_account_activated: 'A dormant account became active',
  value_spike: 'An unusual jump in value',
  suspicious_pattern: 'An unusual pattern of activity',
  duplicate_suspected: 'A possible duplicate record',
};

const SEVERITY: Record<AnomalySeverity, { icon: typeof Info; tone: string }> = {
  critical: { icon: AlertOctagon,  tone: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300' },
  warning:  { icon: AlertTriangle, tone: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' },
  info:     { icon: Info,          tone: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300' },
};

const isAiStep = (step: string) => STAGES[3].match.test(step);

function stageIndex(step: string | null): number {
  if (!step) return -1;
  return STAGES.findIndex(s => s.match.test(step));
}

function stepInWords(step: string | null): string {
  if (!step) return 'Getting ready';
  if (STEP_WORDS[step]) return STEP_WORDS[step];
  const i = stageIndex(step);
  return i >= 0 ? STAGES[i].label : 'Organising your assets';
}

/** "land records and company records" from the run's failed steps (AI steps are reported separately). */
function failedSourcesInWords(run: AgentRun): string | null {
  const names = run.stepsFailed.filter(s => !isAiStep(s)).map(s => SOURCE_WORDS[s] ?? 'some of your data');
  const unique = [...new Set(names)];
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];
  return `${unique.slice(0, -1).join(', ')} and ${unique[unique.length - 1]}`;
}

function relativeTime(iso: string | null, now: number): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const min = Math.floor(Math.max(0, now - t) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function durationInWords(ms: number | null): string | null {
  if (ms == null || ms < 0) return null;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${Math.max(1, s)}s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m} min ${s % 60}s` : `${m} min`;
}

function waitInWords(seconds: number): string {
  if (seconds < 90) return 'in a minute or so';
  const min = Math.ceil(seconds / 60);
  if (min < 60) return `in about ${min} min`;
  const h = Math.floor(min / 60);
  return `in about ${h} h${min % 60 ? ` ${min % 60} min` : ''}`;
}

const assetClassInWords = (c: string | null) =>
  c ? c.toLowerCase().replace(/_/g, ' ').replace(/^\w/, ch => ch.toUpperCase()) : null;

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;

type View = 'never' | 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';

function viewOf(status: AgentStatus): View {
  const run = status.latestRun;
  if (!run) return status.inFlight ? 'queued' : 'never';
  if (status.inFlight) return run.status === 'running' ? 'running' : 'queued';
  if (run.status === 'queued' || run.status === 'running') return run.status; // defensive: inFlight lagging
  return run.status;
}

const BADGE: Record<View, { label: string; className: string }> = {
  never:     { label: 'Not scanned yet', className: 'bg-muted text-muted-foreground' },
  queued:    { label: 'Waiting to start', className: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300' },
  running:   { label: 'Scanning', className: 'bg-lime-300/40 text-lime-900 dark:bg-lime-400/15 dark:text-lime-300' },
  completed: { label: 'Up to date', className: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300' },
  partial:   { label: 'Partly refreshed', className: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' },
  failed:    { label: "Didn't finish", className: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300' },
  cancelled: { label: 'Stopped', className: 'bg-muted text-muted-foreground' },
};

// ── Card ─────────────────────────────────────────────

export default function AssetScanCard() {
  const { status, error, loading, refresh, setStatus } = useAgentStatus();
  const now = useNow();
  const location = useLocation();
  const [starting, setStarting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const wasInFlight = useRef<boolean | null>(null);

  // Deep link (/dashboard?tab=overview#agent-anomalies) opens the "needs a look" list
  useEffect(() => {
    if (location.hash === `#${ANOMALIES_ANCHOR}`) setShowAnomalies(true);
  }, [location.hash]);

  // Re-enable Rescan exactly when the rate-limit window ends
  useEffect(() => {
    if (cooldownUntil == null) return;
    const id = window.setTimeout(() => setCooldownUntil(null), Math.max(0, cooldownUntil - Date.now()));
    return () => window.clearTimeout(id);
  }, [cooldownUntil]);

  // Tell the user when a scan they watched finishes
  useEffect(() => {
    if (!status) return;
    const prev = wasInFlight.current;
    wasInFlight.current = status.inFlight;
    if (prev !== true || status.inFlight) return;
    const run = status.latestRun;
    if (run?.status === 'completed' || run?.status === 'partial') {
      const changed = run.recordsCreated + run.recordsUpdated;
      toast.success('Your portfolio is organised', {
        description: changed > 0
          ? `${plural(run.recordsCreated, 'new asset')}, ${plural(run.recordsUpdated, 'update')}.`
          : 'Everything was already up to date.',
      });
    } else if (run?.status === 'failed') {
      toast.error("The scan didn't finish", { description: 'Your assets are unchanged. You can try again.' });
    }
  }, [status]);

  const startScan = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      const result = await requestAgentRun();
      if (result.deduped) {
        toast.info('A scan is already on its way', { description: "We'll update this card as it runs." });
      }
      // Show the queued state at once, then let polling take over
      setStatus(prev => (prev ? { ...prev, inFlight: true } : prev));
      void refresh();
    } catch (err) {
      const httpStatus = errorStatus(err);
      if (httpStatus === 402) return; // api.ts already opened the upgrade prompt
      if (httpStatus === 429) {
        const wait = retryAfterSeconds(err);
        if (wait != null) setCooldownUntil(Date.now() + wait * 1000);
        toast.info('You can rescan again later', {
          description: wait != null
            ? `You've used your rescans for now. Try again ${waitInWords(wait)}.`
            : "You've used your rescans for now. Please try again later.",
        });
        return;
      }
      toast.error("Couldn't start a rescan", { description: userFacingMessage(err) });
    } finally {
      setStarting(false);
    }
  }, [starting, refresh, setStatus]);

  // ── Loading / load error ──
  if (!status) {
    if (loading) {
      return (
        <CardShell>
          <div className="flex items-center gap-4 animate-pulse" aria-busy="true" aria-label="Loading scan status">
            <div className="size-11 rounded-2xl bg-zinc-300/60 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 max-w-full rounded bg-zinc-300/60 dark:bg-white/10" />
              <div className="h-3 w-72 max-w-full rounded bg-zinc-300/50 dark:bg-white/5" />
            </div>
          </div>
        </CardShell>
      );
    }
    return (
      <CardShell>
        <CardTitle />
        <div className="mt-4">
          <ErrorNotice
            error={error}
            title="We couldn't check your portfolio scan"
            isRetrying={retrying}
            onRetry={() => {
              setRetrying(true);
              void refresh().finally(() => setRetrying(false));
            }}
          />
        </div>
      </CardShell>
    );
  }

  const view = viewOf(status);
  const run = status.latestRun;
  const inFlight = view === 'queued' || view === 'running';
  // Cleared by a timer when the window ends; Date.now() keeps the wait exact between minute ticks
  const cooling = cooldownUntil != null;
  const coolingSeconds = cooling ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;
  const lastScanned = relativeTime(
    run && !inFlight && (run.status === 'completed' || run.status === 'partial') ? run.completedAt : status.lastSuccessfulAt,
    now,
  );

  const subtitle = (() => {
    if (view === 'never') return 'Brings everything you have linked into one clean, organised list.';
    if (inFlight) {
      return lastScanned ? `Updating now · last finished ${lastScanned}` : 'Your first scan is in progress';
    }
    if (view === 'failed' || view === 'cancelled') {
      return lastScanned ? `Last successful scan ${lastScanned}` : 'No scan has finished yet';
    }
    const took = durationInWords(run?.durationMs ?? null);
    const bits = [
      lastScanned ? `Last scanned ${lastScanned}` : null,
      took ? `took ${took}` : null,
      run ? TRIGGER_WORDS[run.triggerType] : null,
    ].filter(Boolean);
    return bits.join(' · ');
  })();

  const rescanLabel = view === 'never' ? 'Scan now' : view === 'failed' ? 'Try again' : 'Rescan';

  return (
    <CardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="size-11 shrink-0 rounded-2xl bg-zinc-900 dark:bg-white/10 text-lime-300 grid place-items-center shadow-sm">
            <ScanSearch className={cn('size-5', view === 'running' && 'motion-safe:animate-pulse')} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="text-lg font-semibold text-foreground leading-tight">Portfolio scan</h3>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', BADGE[view].className)}>
                {inFlight && <span className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" aria-hidden="true" />}
                {BADGE[view].label}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => { void startScan(); }}
            disabled={inFlight || starting || cooling}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-10 px-5 text-sm font-medium shadow-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RefreshCw className={cn('size-4', (inFlight || starting) && 'motion-safe:animate-spin')} strokeWidth={2} />
            {inFlight ? 'Scanning…' : starting ? 'Starting…' : rescanLabel}
          </button>
          {cooling && (
            <p className="text-[12px] text-muted-foreground text-center sm:text-right" role="status">
              You can rescan again {waitInWords(coolingSeconds)}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mt-5 pt-5 border-t border-zinc-300/70 dark:border-white/5">
        {view === 'never' && <NeverScanned />}
        {inFlight && <InProgress run={view === 'running' ? run : null} queued={view === 'queued'} status={status} now={now} />}
        {(view === 'completed' || view === 'partial') && run && (
          <>
            {view === 'partial' && <PartialNotice run={run} />}
            <RunStats status={status} run={run} />
          </>
        )}
        {view === 'failed' && <FailedNotice status={status} now={now} />}
        {view === 'cancelled' && (
          <Notice tone="info" icon={CircleSlash} title="Your last scan was stopped before it finished">
            A newer scan took its place or it was cancelled. Your assets are unchanged — press Rescan to run it again.
          </Notice>
        )}

        {status.openAnomalies > 0 && (
          <Anomalies
            count={status.openAnomalies}
            open={showAnomalies}
            onToggle={() => setShowAnomalies(o => !o)}
            onResolved={() => setStatus(prev => (prev ? { ...prev, openAnomalies: Math.max(0, prev.openAnomalies - 1) } : prev))}
            now={now}
          />
        )}
      </div>
    </CardShell>
  );
}

// ── Pieces ───────────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Portfolio scan"
      className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27] dark:via-[#21253A] dark:to-[#1A1D27] shadow-[inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-none backdrop-blur-xl rounded-[24px] p-5 sm:p-6 border border-zinc-300 dark:border-[#2E3148]"
    >
      {children}
    </section>
  );
}

function CardTitle() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="size-11 shrink-0 rounded-2xl bg-zinc-900 dark:bg-white/10 text-lime-300 grid place-items-center shadow-sm">
        <ScanSearch className="size-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-foreground leading-tight">Portfolio scan</h3>
    </div>
  );
}

/** ErrorCard's friendly copy, laid out to wrap inside the card (the compact ErrorCard truncates on phones). */
function ErrorNotice({ error, title, onRetry, isRetrying }: {
  error: unknown; title: string; onRetry: () => void; isRetrying: boolean;
}) {
  const tone = error instanceof AppError && error.category === 'network' ? 'warning' : 'danger';
  return (
    <div
      role="alert"
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border p-3.5 sm:p-4"
      style={{ background: `var(--tone-${tone}-bg)`, borderColor: `var(--tone-${tone}-border)` }}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <TriangleAlert className="size-4.5 mt-0.5 shrink-0" style={{ color: `var(--tone-${tone}-fg)` }} strokeWidth={2} />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: `var(--tone-${tone}-fg)` }}>{title}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/80">{userFacingMessage(error)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="self-start sm:self-center ml-7.5 sm:ml-0 shrink-0 inline-flex items-center gap-2 rounded-full bg-foreground text-background h-9 px-4 text-sm font-semibold shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <RefreshCw className={cn('size-4', isRetrying && 'motion-safe:animate-spin')} />
        {isRetrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  );
}

function NeverScanned() {
  const points = [
    { icon: Layers, title: 'Brings it together', body: 'Your linked bank and investment accounts, land records and unclaimed asset results, in one list.' },
    { icon: CheckCheck, title: 'Cleans it up', body: 'Merges duplicates so each asset appears once, with the latest details.' },
    { icon: Sparkles, title: 'Flags what matters', body: 'Points out anything unusual, like a sudden drop in balance, for you to review.' },
  ];
  return (
    <div>
      <p className="text-sm text-foreground">
        You haven't run a scan yet. It uses only the data you've already shared with AssetMap, and takes a few moments.
      </p>
      <ul className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {points.map(p => (
          <li key={p.title} className="flex items-start gap-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/70 dark:border-white/5 p-3.5">
            <span className="size-8 shrink-0 rounded-xl bg-lime-100 dark:bg-lime-400/10 text-lime-800 dark:text-lime-300 grid place-items-center">
              <p.icon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-foreground">{p.title}</span>
              <span className="block text-[12px] leading-relaxed text-muted-foreground">{p.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InProgress({ run, queued, status, now }: { run: AgentRun | null; queued: boolean; status: AgentStatus; now: number }) {
  const current = queued ? -1 : stageIndex(run?.currentStep ?? null);
  const words = queued ? 'Waiting for its turn to start' : stepInWords(run?.currentStep ?? null);
  const started = relativeTime(queued ? run?.queuedAt ?? null : run?.startedAt ?? null, now);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-medium text-foreground" aria-live="polite">{words}…</p>
        {started && <p className="text-[12px] text-muted-foreground">{queued ? 'Requested' : 'Started'} {started}</p>}
      </div>
      <ol className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Scan progress">
        {STAGES.map((stage, i) => {
          const done = current > i;
          const active = current === i || (!queued && current < 0 && i === 0);
          return (
            <li key={stage.label} className="min-w-0">
              <span
                className={cn(
                  'block h-1.5 rounded-full',
                  done ? 'bg-lime-500 dark:bg-lime-400' : active ? 'bg-lime-400/70 motion-safe:animate-pulse' : 'bg-zinc-300/80 dark:bg-white/10',
                )}
              />
              <span className={cn('mt-1.5 hidden md:block truncate text-[11px]', done || active ? 'text-foreground' : 'text-muted-foreground')}>
                {stage.label}
              </span>
              <span className="sr-only">{done ? 'done' : active ? 'in progress' : 'not started'}</span>
            </li>
          );
        })}
      </ol>
      {status.canonicalAssetCount > 0 && (
        <p className="mt-3 text-[12px] text-muted-foreground">
          Your {plural(status.canonicalAssetCount, 'organised asset')} stay available while this runs.
        </p>
      )}
    </div>
  );
}

function RunStats({ status, run }: { status: AgentStatus; run: AgentRun }) {
  const stats = [
    { label: 'Assets organised', value: status.canonicalAssetCount },
    { label: 'New this scan', value: run.recordsCreated },
    { label: 'Updated', value: run.recordsUpdated },
    { label: 'Duplicates merged', value: run.recordsDeduplicated },
  ];
  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="rounded-2xl bg-white/60 dark:bg-white/5 border border-white/70 dark:border-white/5 px-4 py-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</dt>
          <dd className="mt-1 text-2xl font-normal tracking-tight text-foreground tabular-nums">{s.value.toLocaleString('en-IN')}</dd>
        </div>
      ))}
    </dl>
  );
}

function PartialNotice({ run }: { run: AgentRun }) {
  const failed = failedSourcesInWords(run);
  const lines: string[] = [];
  if (failed) lines.push(`We couldn't refresh your ${failed} this time, so ${failed.includes(' and ') ? 'those were' : 'that was'} left as before. Everything else was organised.`);
  if (!run.aiUsed) lines.push('AI insights were unavailable, but your assets were still organised.');
  if (lines.length === 0) lines.push('A few steps didn’t finish, but your assets were still organised.');
  return (
    <div className="mb-4">
      <Notice tone="warning" icon={TriangleAlert} title="Some of this scan didn't complete">
        {lines.map(l => <span key={l} className="block">{l}</span>)}
        <span className="block mt-0.5">We'll try again on the next scan.</span>
      </Notice>
    </div>
  );
}

function FailedNotice({ status, now }: { status: AgentStatus; now: number }) {
  const last = relativeTime(status.lastSuccessfulAt, now);
  return (
    <Notice tone="danger" icon={AlertOctagon} title="We couldn't finish organising your assets">
      {last
        ? `Nothing was lost — your ${plural(status.canonicalAssetCount, 'asset')} from the scan ${last} are still here. Please try again in a moment.`
        : 'Nothing was lost and none of your data was changed. Please try again in a moment.'}
    </Notice>
  );
}

function Notice({ tone, icon: Icon, title, children }: {
  tone: 'warning' | 'danger' | 'info'; icon: typeof Info; title: string; children: React.ReactNode;
}) {
  return (
    <div
      role={tone === 'info' ? 'status' : 'alert'}
      className="flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4"
      style={{ background: `var(--tone-${tone}-bg)`, borderColor: `var(--tone-${tone}-border)` }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: `var(--tone-${tone}-fg)` }}>
        <Icon className="size-4.5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: `var(--tone-${tone}-fg)` }}>{title}</p>
        <div className="mt-0.5 text-[13px] leading-relaxed text-foreground/80">{children}</div>
      </div>
    </div>
  );
}

function Anomalies({ count, open, onToggle, onResolved, now }: {
  count: number; open: boolean; onToggle: () => void; onResolved: () => void; now: number;
}) {
  const [items, setItems] = useState<AgentAnomaly[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoadingList(true);
    try {
      const list = await getAgentAnomalies(signal);
      if (signal?.aborted) return;
      setItems(list);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err);
    } finally {
      if (!signal?.aborted) setLoadingList(false);
    }
  }, []);

  // Load when opened, and again when the open count changes (a new scan found something)
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [open, count, load]);

  const resolve = async (item: AgentAnomaly) => {
    setResolving(item.id);
    try {
      await resolveAgentAnomaly(item.id);
      setItems(prev => prev?.filter(i => i.id !== item.id) ?? prev);
      onResolved();
      toast.success('Marked as reviewed', { description: ANOMALY_WORDS[item.type] ?? 'Item reviewed' });
    } catch (err) {
      toast.error("Couldn't update that item", { description: userFacingMessage(err) });
    } finally {
      setResolving(null);
    }
  };

  return (
    <div id={ANOMALIES_ANCHOR} className="mt-4 scroll-mt-24">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${ANOMALIES_ANCHOR}-list`}
        className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:opacity-90"
        style={{ background: 'var(--tone-warning-bg)', borderColor: 'var(--tone-warning-border)' }}
      >
        <AlertTriangle className="size-4.5 shrink-0" style={{ color: 'var(--tone-warning-fg)' }} strokeWidth={2} />
        <span className="flex-1 min-w-0 text-sm font-semibold" style={{ color: 'var(--tone-warning-fg)' }}>
          {count === 1 ? '1 thing needs a look' : `${count.toLocaleString('en-IN')} things need a look`}
        </span>
        <span className="text-[12px] font-medium text-foreground/70 hidden sm:inline">{open ? 'Hide' : 'Review'}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-foreground/70 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div id={`${ANOMALIES_ANCHOR}-list`} className="mt-2">
          {error && !items ? (
            <ErrorNotice error={error} title="We couldn't load these items" onRetry={() => { void load(); }} isRetrying={loadingList} />
          ) : !items ? (
            <div className="space-y-2 animate-pulse" aria-busy="true">
              {[0, 1].map(i => <div key={i} className="h-16 rounded-2xl bg-white/50 dark:bg-white/5" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="flex items-center gap-2 rounded-2xl bg-white/60 dark:bg-white/5 px-4 py-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Nothing needs your attention right now.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[26rem] overflow-y-auto pr-0.5">
              {items.map(item => {
                const sev = SEVERITY[item.severity] ?? SEVERITY.info;
                const meta = [
                  item.institution,
                  assetClassInWords(item.assetClass),
                  item.occurrences > 1 ? `seen ${item.occurrences} times` : null,
                  relativeTime(item.lastSeenAt, now),
                ].filter(Boolean).join(' · ');
                return (
                  <li key={item.id} className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/70 dark:border-white/5 p-3.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className={cn('size-8 shrink-0 rounded-xl grid place-items-center', sev.tone)}>
                        <sev.icon className="size-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{ANOMALY_WORDS[item.type] ?? 'Something unusual'}</p>
                        {item.description && <p className="mt-0.5 text-[13px] text-foreground/80 break-words">{item.description}</p>}
                        {item.aiExplanation && (
                          <p className="mt-1 flex items-start gap-1.5 text-[12px] text-muted-foreground break-words">
                            <Sparkles className="size-3.5 mt-0.5 shrink-0" strokeWidth={1.75} />
                            <span>{item.aiExplanation}</span>
                          </p>
                        )}
                        {meta && <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { void resolve(item); }}
                      disabled={resolving === item.id}
                      className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 h-8 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-60 ml-11 sm:ml-0"
                    >
                      <CheckCheck className="size-3.5" />
                      {resolving === item.id ? 'Saving…' : 'Mark as reviewed'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
