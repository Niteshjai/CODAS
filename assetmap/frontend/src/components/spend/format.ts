import type { Bucket, ClassifiedBy } from './types'

/** ₹ amount from integer paise, whole rupees (Indian grouping). */
export function rupees(paise: number | null | undefined, opts: { signed?: boolean } = {}): string {
  if (paise == null || !Number.isFinite(paise)) return '—'
  const r = Math.round(Math.abs(paise) / 100)
  const s = `₹${r.toLocaleString('en-IN')}`
  if (opts.signed) return paise < 0 ? `−${s}` : paise > 0 ? `+${s}` : s
  return paise < 0 ? `−${s}` : s
}

/** Short form for tight spaces: ₹4.2K, ₹1.25L, ₹2.1Cr. */
export function rupeesCompact(paise: number): string {
  const r = Math.abs(paise) / 100
  const sign = paise < 0 ? '−' : ''
  if (r >= 1e7) return `${sign}₹${(r / 1e7).toFixed(2).replace(/\.?0+$/, '')}Cr`
  if (r >= 1e5) return `${sign}₹${(r / 1e5).toFixed(2).replace(/\.?0+$/, '')}L`
  if (r >= 1e3) return `${sign}₹${(r / 1e3).toFixed(1).replace(/\.0$/, '')}K`
  return `${sign}₹${Math.round(r)}`
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** '2026-10' → 'October 2026' (or 'Oct 2026' when short). */
export function monthLabel(month: string | null | undefined, short = false): string {
  if (!month) return ''
  const [y, m] = month.split('-').map(Number)
  const name = MONTHS[(m || 1) - 1] ?? ''
  return `${short ? name.slice(0, 3) : name} ${y}`
}

/** '2026-10-16' → '16 Oct' (adds the year when it differs from the reference year). */
export function shortDate(iso: string | null | undefined, refYear?: number): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const base = `${d} ${MONTHS[m - 1]?.slice(0, 3) ?? ''}`
  return refYear && y !== refYear ? `${base} ${y}` : base
}

export function pct(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${n.toFixed(digits)}%`
}

export const BUCKET_LABEL: Record<Bucket, string> = {
  needs: 'Needs', wants: 'Wants', savings: 'Savings & investments', debt: 'Debt repayments',
}

export const BUCKET_HINT: Record<Bucket, string> = {
  needs: 'Rent, bills, groceries, health — things you have to pay',
  wants: 'Eating out, shopping, entertainment — things you choose',
  savings: 'SIPs, investments and income left unspent',
  debt: 'EMIs and loan repayments',
}

/** Fixed categorical order (validated palette slots 1–4); CSS vars live in spend.css. */
export const BUCKET_ORDER: Bucket[] = ['needs', 'wants', 'savings', 'debt']
export const bucketVar = (b: Bucket) => `var(--spend-${b})`

export const SOURCE_BADGE: Record<ClassifiedBy, { label: string; title: string }> = {
  user: { label: 'You', title: 'You set this category' },
  claude_ai: { label: 'AI', title: 'Categorised by AI from the masked transaction description' },
  rule_engine: { label: 'Rule', title: 'Matched a known merchant or payment pattern' },
  // Only set from the user's own corrections (directly or via 'apply to all from this merchant')
  inherited: { label: 'Learned', title: 'Applied from how you categorised this merchant before' },
}

/** Insight action URLs are always in-app (/dashboard?tab=analytics…). Reject anything else. */
export function safeInAppUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return null
  return url
}

export function prevMonthKey(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
