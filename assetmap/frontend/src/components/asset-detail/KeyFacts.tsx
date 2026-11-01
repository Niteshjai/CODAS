import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { SECTION, inr, labelOf, parseNarration, type AssetDetailData, type DetailValue } from './format';
import { isFixedDeposit } from './HealthCard';

export interface Fact {
  label: string;
  value: string;
  sub?: string;
  signed?: 'up' | 'down';
}

const numOf = (v: DetailValue) => (typeof v === 'number' ? v : null);

/**
 * Facts nothing else on the page shows. Dates live in the term meter or Details, counts in the ledger /
 * holdings header, activity in the status card, so none of those are repeated here.
 * Real fields only: a missing field is skipped, never dashed.
 */
export function keyFacts(d: AssetDetailData, heroIsSumAssured = false): Fact[] {
  const x = d.details;
  const t = d.asset.fiType;
  const facts: Fact[] = [];

  if (isFixedDeposit(d)) {
    const principal = numOf(x.principal), rate = numOf(x.interestRate), maturity = numOf(x.maturityAmount);
    if (principal !== null) facts.push({ label: 'Principal', value: inr(principal, 0) });
    if (rate !== null) facts.push({ label: 'Interest rate', value: `${rate.toFixed(2)}% p.a.` });
    if (maturity !== null) facts.push({ label: 'Maturity value', value: inr(maturity, 0) });
    return facts;
  }

  if (t === 'DEPOSIT') {
    const interest = d.transactions.filter(tx => tx.type === 'CREDIT' && parseNarration(tx.narration, tx.mode).mode === 'INTEREST');
    const sum = interest.reduce((s, tx) => s + tx.amount, 0);
    if (sum > 0) facts.push({ label: 'Interest credited', value: inr(sum, 0), sub: `${interest.length} credit${interest.length === 1 ? '' : 's'}` });
    return facts;
  }

  if (t === 'MUTUAL_FUND' || t === 'EQUITY' || t === 'NPS') {
    const invested = numOf(x.investedValue), gain = numOf(x.gainLoss), pct = numOf(x.gainLossPct);
    if (invested !== null) facts.push({ label: 'Invested', value: inr(invested, 0) });
    if (invested !== null && gain !== null) {
      facts.push({
        label: 'Returns',
        value: `${gain >= 0 ? '+' : '−'}${inr(Math.abs(gain), 0)}`,
        sub: pct !== null ? `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}% all-time` : undefined,
        signed: gain >= 0 ? 'up' : 'down',
      });
    }
    return facts;
  }

  if (t === 'INSURANCE_POLICIES') {
    const premium = numOf(x.premium), sa = numOf(x.sumAssured);
    if (premium !== null) facts.push({ label: 'Premium', value: inr(premium, 0), sub: labelOf(x.premiumFrequency) ?? undefined });
    if (heroIsSumAssured) {
      if (d.asset.balance > 0) facts.push({ label: 'Policy value', value: inr(d.asset.balance, 0) });
    } else if (sa !== null && sa > 0) {
      facts.push({ label: 'Sum assured', value: inr(sa, 0) });
    }
    return facts;
  }

  return facts;
}

const SM_COLS: Record<number, string> = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };

/** Facts as a strip of tiles, with the term meter (FD / policy) as the card's footer. */
export function KeyFacts({ facts, term, label = 'Key facts' }: { facts: Fact[]; term?: ReactNode; label?: string }) {
  if (!facts.length && !term) return null;
  const n = facts.length;
  return (
    <section aria-label={label} className={`${SECTION} overflow-hidden p-0`}>
      {n > 0 && (
        <dl className={`grid ${n === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${SM_COLS[n] ?? 'sm:grid-cols-3'} gap-px bg-border`}>
          {facts.map((f, i) => (
            <div key={f.label} className={`bg-card p-4 sm:p-5 min-w-0 ${n % 2 === 1 && n > 1 && i === n - 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <dt className="text-xs font-medium text-muted-foreground truncate">{f.label}</dt>
              <dd className="mt-1 flex items-center gap-1 min-w-0">
                {f.signed && (f.signed === 'up'
                  ? <ArrowUpRight className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
                  : <ArrowDownRight className="size-4 shrink-0 text-rose-700 dark:text-rose-400" aria-hidden />)}
                <span className="text-[1.125rem] font-semibold text-foreground leading-tight tabular-nums truncate">{f.value}</span>
              </dd>
              {f.sub && <dd className="mt-0.5 text-xs text-muted-foreground truncate">{f.sub}</dd>}
            </div>
          ))}
        </dl>
      )}
      {term && <div className={`p-4 sm:p-5 ${n ? 'border-t border-border' : ''}`}>{term}</div>}
    </section>
  );
}
