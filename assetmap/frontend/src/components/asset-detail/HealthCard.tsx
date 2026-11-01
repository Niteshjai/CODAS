import type { ReactNode } from 'react';
import { Check as CheckIcon, AlertTriangle, X, Minus, Clock, ShieldAlert, ShieldQuestion, ArrowRight } from 'lucide-react';
import { FOCUS, SECTION, accountNoun, daysBetween, daysUntil, fmtDate, inrAuto, isCustomerInitiated, last4, relativeTime, type AssetDetailData } from './format';

export type Tone = 'ok' | 'warn' | 'bad' | 'neutral' | 'progress';
export interface Check { key: string; tone: Tone; title: string; body: string; action?: { label: string; onClick: () => void; disabled?: boolean } }

export const softCta =
  'inline-flex items-center gap-1.5 rounded-full border border-lime-500/40 bg-lime-300/25 px-3 py-1 text-xs font-semibold text-lime-900 hover:bg-lime-300/45 dark:bg-lime-400/10 dark:text-lime-300 dark:hover:bg-lime-400/20 disabled:opacity-60 transition-colors';

export const isFixedDeposit = (d: AssetDetailData) =>
  d.asset.fiType === 'DEPOSIT' &&
  (/TERM|FIXED|RECURRING|\bFD\b|\bRD\b/i.test(String(d.details.accountType ?? '')) || d.details.maturityDate != null || d.details.principal != null);

export function healthChecks(d: AssetDetailData, actions: { nominee: () => void; refresh: () => void; refreshing: boolean }): Check[] {
  const checks: Check[] = [];
  const t = d.asset.fiType;
  const noun = accountNoun(t);

  // Nominee
  const n = d.nominee.status;
  checks.push({
    key: 'nominee',
    tone: n === 'registered' ? 'ok' : n === 'in_progress' ? 'progress' : n === 'missing' ? 'bad' : 'neutral',
    title: n === 'registered' ? 'Nominee on record' : n === 'in_progress' ? 'Nominee update in progress' : n === 'missing' ? 'No nominee' : 'Nominee not confirmed',
    body: n === 'registered' ? 'Your family can claim this without a succession certificate.'
      : n === 'in_progress' ? "We're tracking the update with the institution."
      : n === 'missing' ? `Without one, your family may need court papers to claim this ${noun === 'account' ? 'money' : noun}.`
      : "The institution didn't share nominee details.",
    action: n === 'registered' ? undefined : { label: n === 'in_progress' ? 'Track' : n === 'missing' ? 'Add nominee' : 'Check', onClick: actions.nominee },
  });

  // Activity / dormancy — savings & current accounts only (RBI: inoperative after 2 years without customer-induced transactions)
  if (t === 'DEPOSIT' && !isFixedDeposit(d)) {
    const own = d.transactions.filter(isCustomerInitiated);
    if (!d.transactions.length) {
      checks.push({ key: 'activity', tone: 'neutral', title: 'Activity unknown', body: "Without shared transactions we can't check it for dormancy." });
    } else if (!own.length) {
      checks.push({ key: 'activity', tone: 'warn', title: 'Only bank entries', body: 'Only interest or charges were shared — no transactions made by you.' });
    } else {
      const last = own.reduce((a, b) => (a.date > b.date ? a : b)).date;
      const idleDays = daysBetween(new Date(last).getTime(), Date.now());
      checks.push(
        idleDays >= 730 ? { key: 'activity', tone: 'bad', title: 'Likely inoperative', body: `No transaction by you since ${fmtDate(last)}. RBI treats accounts idle for 2 years as inoperative — re-activate with KYC at the branch.` }
        : idleDays >= 365 ? { key: 'activity', tone: 'warn', title: 'Idle for over a year', body: `Last used ${fmtDate(last)}. Make a small transaction to keep it active — it becomes inoperative after 2 years.` }
        : { key: 'activity', tone: 'ok', title: 'Account active', body: `Last transaction ${relativeTime(last)} (${fmtDate(last)}).` },
      );
    }
  }

  // Fixed deposit maturity: only when it needs a decision. A running term is shown by the term meter.
  if (isFixedDeposit(d) && d.details.maturityDate) {
    const left = daysUntil(d.details.maturityDate);
    if (left !== null && left <= 30) checks.push(
      left < 0 ? { key: 'maturity', tone: 'warn', title: 'Deposit has matured', body: `Matured on ${fmtDate(String(d.details.maturityDate))}. Renew it or move the money so it keeps earning.` }
      : { key: 'maturity', tone: 'warn', title: left === 0 ? 'Matures today' : `Matures in ${left} day${left === 1 ? '' : 's'}`, body: `On ${fmtDate(String(d.details.maturityDate))}. Decide whether to renew or withdraw before then.` },
    );
  }

  // Insurance policy status & premium
  if (t === 'INSURANCE_POLICIES') {
    const status = String(d.details.status ?? '').toUpperCase();
    if (status) checks.push(/ACTIVE|IN\s*FORCE/.test(status)
      ? { key: 'policy', tone: 'ok', title: 'Policy in force', body: 'The institution reports this policy as active.' }
      : { key: 'policy', tone: 'bad', title: `Policy ${status.toLowerCase()}`, body: 'Contact your insurer to revive it before the cover is lost.' });
    const due = daysUntil(d.details.nextPremiumDue);
    if (due !== null) checks.push(due < 0
      ? { key: 'premium', tone: 'bad', title: 'Premium overdue', body: `Was due ${fmtDate(String(d.details.nextPremiumDue))}. Pay within the grace period to keep cover.` }
      : { key: 'premium', tone: due <= 15 ? 'warn' : 'ok', title: due <= 15 ? `Premium due in ${due} days` : 'Premium up to date', body: `Next premium due ${fmtDate(String(d.details.nextPremiumDue))}.` });
  }

  // Data freshness
  const age = daysBetween(new Date(d.asset.fetchedAt).getTime(), Date.now());
  checks.push({
    key: 'fresh',
    tone: age <= 7 ? 'ok' : age <= 30 ? 'warn' : 'bad',
    title: age <= 7 ? 'Data is fresh' : 'Data may be outdated',
    body: `Synced ${relativeTime(d.asset.fetchedAt)} from ${d.asset.institutionName || 'your institution'} via Account Aggregator.`,
    action: age > 7 ? { label: actions.refreshing ? 'Refreshing…' : 'Refresh', onClick: actions.refresh, disabled: actions.refreshing } : undefined,
  });

  return checks;
}

// ─── Ranking: the first non-ok check is the one thing to act on ───

const TONE_RANK: Record<Tone, number> = { bad: 0, warn: 1, progress: 2, neutral: 3, ok: 4 };
const KEY_RANK: Record<string, number> = { policy: 0, premium: 1, nominee: 2, activity: 3, maturity: 4, fresh: 5 };

export function rankChecks(checks: Check[]): Check[] {
  return [...checks].sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone] || (KEY_RANK[a.key] ?? 9) - (KEY_RANK[b.key] ?? 9));
}

const TILE: Record<Exclude<Tone, 'ok'>, { cls: string; icon: ReactNode; eyebrow: string }> = {
  bad:      { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', icon: <ShieldAlert className="size-5" />, eyebrow: 'text-rose-700 dark:text-rose-300' },
  warn:     { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', icon: <AlertTriangle className="size-5" />, eyebrow: 'text-amber-700 dark:text-amber-300' },
  progress: { cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', icon: <Clock className="size-5" />, eyebrow: 'text-sky-700 dark:text-sky-300' },
  neutral:  { cls: 'bg-muted text-muted-foreground', icon: <ShieldQuestion className="size-5" />, eyebrow: 'text-muted-foreground' },
};

const DISC: Record<Tone, { cls: string; icon: ReactNode; word: string }> = {
  ok:       { cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', icon: <CheckIcon className="size-3.5" strokeWidth={3} />, word: 'OK' },
  bad:      { cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', icon: <X className="size-3.5" strokeWidth={3} />, word: 'Problem' },
  warn:     { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', icon: <AlertTriangle className="size-3.5" />, word: 'Warning' },
  progress: { cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', icon: <Clock className="size-3.5" />, word: 'In progress' },
  neutral:  { cls: 'bg-muted text-muted-foreground', icon: <Minus className="size-3.5" strokeWidth={3} />, word: 'Unknown' },
};

const primaryBtn = `inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-lime-300 hover:bg-lime-400 px-5 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-60 ${FOCUS}`;
const secondaryBtn = `inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60 ${FOCUS}`;

/** Copy for the featured item: written for the moment it is the one thing on screen to act on. */
function featuredCopy(c: Check, d: AssetDetailData): { title: string; body: string; cta?: string } {
  if (c.key === 'nominee') {
    if (c.tone === 'bad') {
      const l4 = last4(d.asset.accountRef);
      const noun = accountNoun(d.asset.fiType);
      const sa = typeof d.details.sumAssured === 'number' && d.details.sumAssured > 0 ? d.details.sumAssured : null;
      const what = d.asset.fiType === 'INSURANCE_POLICIES'
        ? (sa ? `the ${inrAuto(sa)} cover` : d.asset.balance > 0 ? inrAuto(d.asset.balance) : 'the policy payout')
        : d.asset.balance > 0 ? inrAuto(d.asset.balance) : 'it';
      return {
        title: `Add a nominee to this ${noun}`,
        body: `No nominee is registered on this ${noun}${l4 ? ` (••${l4})` : ''}. Without one, your family may need a succession certificate to claim ${what}.`,
        cta: 'Add nominee',
      };
    }
    if (c.tone === 'progress') return { title: 'Nominee update in progress', body: c.body, cta: 'Track update' };
    if (c.tone === 'neutral') return { title: c.title, body: c.body, cta: 'Check nominee' };
  }
  if (c.key === 'fresh' && c.tone !== 'ok') return { title: 'Data may be outdated', body: c.body, cta: c.action?.disabled ? 'Refreshing…' : 'Refresh now' };
  return { title: c.title, body: c.body, cta: c.action?.label };
}

function Featured({ check, data, issues }: { check: Check; data: AssetDetailData; issues: number }) {
  const t = TILE[check.tone as Exclude<Tone, 'ok'>];
  const copy = featuredCopy(check, data);
  const eyebrow = check.tone === 'bad' ? `Action needed · ${issues} thing${issues === 1 ? '' : 's'} to fix`
    : check.tone === 'warn' ? 'Worth a look' : check.tone === 'progress' ? 'In progress' : 'Worth checking';
  const primary = check.tone === 'bad' || check.tone === 'warn';
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4">
      <span className={`size-10 rounded-xl shrink-0 grid place-items-center ${t.cls}`} aria-hidden>{t.icon}</span>
      <div className="min-w-0 self-center">
        <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${t.eyebrow}`}>{eyebrow}</p>
        <p className="mt-1 text-[1.125rem] sm:text-[1.25rem] font-semibold text-foreground leading-snug">{copy.title}</p>
      </div>
      <div className="col-span-2 sm:col-span-1 sm:col-start-2 min-w-0">
        <p className="mt-2 sm:mt-1 text-sm leading-relaxed text-muted-foreground max-w-[34rem]">{copy.body}</p>
        {check.action && copy.cta && (
          <button type="button" onClick={check.action.onClick} disabled={check.action.disabled} className={`mt-4 ${primary ? primaryBtn : secondaryBtn}`}>
            {copy.cta}
            {primary && <ArrowRight className="size-4" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusPanel({ checks, data }: { checks: Check[]; data: AssetDetailData }) {
  const ranked = rankChecks(checks);
  const featured = ranked.find(c => c.tone !== 'ok');
  const rest = ranked.filter(c => c !== featured);
  const issues = checks.filter(c => c.tone === 'bad' || c.tone === 'warn').length;

  return (
    <section aria-labelledby="status-h" className={`${SECTION} p-5 sm:p-6`}>
      <h2 id="status-h" className="sr-only">Account status</h2>

      {featured ? (
        <Featured check={featured} data={data} issues={issues} />
      ) : (
        <div className="flex items-start gap-3">
          <span className="size-10 rounded-xl shrink-0 grid place-items-center bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" aria-hidden>
            <CheckIcon className="size-5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 self-center">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">All clear</p>
            <p className="mt-1 text-[1.125rem] sm:text-[1.25rem] font-semibold text-foreground leading-snug">Nothing needs your attention</p>
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <ul className="mt-5 pt-3 border-t border-border">
          {rest.map(c => (
            <li key={c.key} className="flex items-start gap-3 py-2.5">
              <span className={`mt-0.5 size-6 rounded-full shrink-0 grid place-items-center ${DISC[c.tone].cls}`}>
                {DISC[c.tone].icon}<span className="sr-only">{DISC[c.tone].word}: </span>
              </span>
              <div className="min-w-0 flex-1 sm:flex sm:items-start sm:gap-3">
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-medium text-foreground">{c.title}</span>
                  <span className="hidden sm:inline text-muted-foreground"> · </span>
                  <span className="block sm:inline text-[13px] text-muted-foreground">{c.body}</span>
                </p>
                {c.action && (
                  <button
                    type="button"
                    onClick={c.action.onClick}
                    disabled={c.action.disabled}
                    className={`mt-1 sm:mt-0 sm:ml-auto shrink-0 rounded text-[13px] font-semibold text-foreground underline underline-offset-4 decoration-border sm:no-underline hover:underline disabled:opacity-60 ${FOCUS}`}
                  >
                    {c.action.label}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
