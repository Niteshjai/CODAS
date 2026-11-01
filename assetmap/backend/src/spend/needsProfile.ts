import { Pool } from 'pg'
import { CATEGORIES, CATEGORY_BY_ID } from '../classifier/categoryConfig'
import { encryptPII, decryptPII } from '../utils/encryption'
import { SpendError } from './spendError'

// ═══════════════════════════════════════════════════════════════
// Needs profile + needs-based breakdown
// Users say what matters to them (household, city tier, optional income band, priorities)
// and how their categories map into Needs / Wants / Savings & investments / Debt.
// The breakdown compares actual spend per bucket with a target split (default 50/30/20,
// where minimum debt payments count toward Needs, as in the usual 50/30/20 rule).
// ═══════════════════════════════════════════════════════════════

export type Bucket = 'needs' | 'wants' | 'savings' | 'debt'
export const BUCKETS: Bucket[] = ['needs', 'wants', 'savings', 'debt']
export const BUCKET_LABELS: Record<Bucket, string> = {
  needs: 'Needs', wants: 'Wants', savings: 'Savings & investments', debt: 'Debt repayments',
}

/** Default mapping. "CATEGORY:Subcategory" keys refine a category (groceries are a need, delivery a want). */
export const DEFAULT_BUCKETS: Record<string, Bucket> = {
  RENT: 'needs', BILLS: 'needs', RECHARGE: 'needs', INSURANCE: 'needs', HEALTH: 'needs',
  EDUCATION: 'needs', BANK_CHARGES: 'needs', ATM: 'needs',
  FOOD: 'wants', 'FOOD:Groceries': 'needs',
  TRAVEL: 'wants', 'TRAVEL:Fuel': 'needs', 'TRAVEL:Metro': 'needs',
  SUBSCRIPTIONS: 'wants', SHOPPING: 'wants', PARTY: 'wants', CHARITY: 'wants', OTHER_EXPENSE: 'wants',
  INVESTMENTS: 'savings',
  EMI: 'debt',
}

export const PRIORITIES = [
  { id: 'reduce_food_delivery', label: 'Spend less on food delivery', categories: ['FOOD'] },
  { id: 'cut_subscriptions',    label: 'Cut unused subscriptions',   categories: ['SUBSCRIPTIONS'] },
  { id: 'reduce_shopping',      label: 'Shop less impulsively',      categories: ['SHOPPING'] },
  { id: 'pay_off_debt',         label: 'Pay off loans faster',       categories: ['EMI'] },
  { id: 'build_emergency_fund', label: 'Build an emergency fund',    categories: [] },
  { id: 'save_for_home',        label: 'Save for a home',            categories: [] },
  { id: 'save_for_education',   label: "Save for education",         categories: ['EDUCATION'] },
  { id: 'save_for_retirement',  label: 'Save for retirement',        categories: ['INVESTMENTS'] },
  { id: 'travel_goal',          label: 'Save for a trip',            categories: ['TRAVEL'] },
] as const
export type PriorityId = typeof PRIORITIES[number]['id']
export const PRIORITY_IDS = PRIORITIES.map((p) => p.id) as string[]
export const SAVINGS_PRIORITIES = new Set(['build_emergency_fund', 'save_for_home', 'save_for_education', 'save_for_retirement', 'travel_goal'])

export const CITY_TIERS = [
  { id: 'metro', label: 'Metro' }, { id: 'tier1', label: 'Tier 1 city' },
  { id: 'tier2', label: 'Tier 2 city' }, { id: 'tier3', label: 'Tier 3 city / town' },
] as const
export const INCOME_BANDS = [
  { id: 'lt_25k', label: 'Under ₹25,000 / month' }, { id: '25k_50k', label: '₹25,000 – ₹50,000 / month' },
  { id: '50k_1l', label: '₹50,000 – ₹1 lakh / month' }, { id: '1l_2l', label: '₹1 – 2 lakh / month' },
  { id: '2l_5l', label: '₹2 – 5 lakh / month' }, { id: 'gt_5l', label: 'Over ₹5 lakh / month' },
] as const

export interface TargetSplit { needs: number; wants: number; savings: number }
export const DEFAULT_SPLIT: TargetSplit = { needs: 50, wants: 30, savings: 20 }

export interface NeedsProfile {
  exists:          boolean
  householdSize:   number | null
  cityTier:        string | null
  incomeBand:      string | null
  priorities:      string[]
  goalsNote:       string | null
  targetSplit:     TargetSplit
  bucketOverrides: Record<string, Bucket>
  updatedAt:       string | null
}

export const DEFAULT_PROFILE: NeedsProfile = {
  exists: false, householdSize: null, cityTier: null, incomeBand: null, priorities: [],
  goalsNote: null, targetSplit: { ...DEFAULT_SPLIT }, bucketOverrides: {}, updatedAt: null,
}

export function bucketFor(
  category: string, subcategory: string | null | undefined, overrides: Record<string, Bucket>,
): { bucket: Bucket; source: 'default' | 'custom' } {
  const subKey = subcategory ? `${category}:${subcategory}` : null
  if (subKey && overrides[subKey]) return { bucket: overrides[subKey], source: 'custom' }
  if (overrides[category]) return { bucket: overrides[category], source: 'custom' }
  if (subKey && DEFAULT_BUCKETS[subKey]) return { bucket: DEFAULT_BUCKETS[subKey], source: 'default' }
  return { bucket: DEFAULT_BUCKETS[category] ?? 'wants', source: 'default' }
}

/** Valid override keys: expense categories, optionally ":Subcategory" from that category's list. */
export function isValidBucketKey(key: string): boolean {
  const [catId, sub, ...rest] = key.split(':')
  if (rest.length) return false
  const cat = CATEGORY_BY_ID.get(catId)
  if (!cat || cat.group !== 'expense') return false
  return sub === undefined || cat.subcategories.includes(sub)
}

function rowToProfile(r: any): NeedsProfile {
  let goalsNote: string | null = null
  if (r.goals_note_encrypted) {
    try { goalsNote = decryptPII(r.goals_note_encrypted) } catch { goalsNote = null }
  }
  return {
    exists: true,
    householdSize: r.household_size,
    cityTier: r.city_tier,
    incomeBand: r.income_band,
    priorities: r.priorities ?? [],
    goalsNote,
    targetSplit: { needs: r.target_needs_pct, wants: r.target_wants_pct, savings: r.target_savings_pct },
    bucketOverrides: r.bucket_overrides ?? {},
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
  }
}

export async function getNeedsProfile(pool: Pool, userId: string): Promise<NeedsProfile> {
  const res = await pool.query('SELECT * FROM spend_needs_profiles WHERE user_id = $1', [userId])
  return res.rows[0] ? rowToProfile(res.rows[0]) : { ...DEFAULT_PROFILE, targetSplit: { ...DEFAULT_SPLIT }, bucketOverrides: {} }
}

export interface ProfilePatch {
  householdSize?:   number | null
  cityTier?:        string | null
  incomeBand?:      string | null
  priorities?:      string[]
  goalsNote?:       string | null
  targetSplit?:     TargetSplit
  bucketOverrides?: Record<string, Bucket>
}

export async function updateNeedsProfile(pool: Pool, userId: string, patch: ProfilePatch): Promise<NeedsProfile> {
  const current = await getNeedsProfile(pool, userId)
  const next: NeedsProfile = { ...current }

  if (patch.householdSize !== undefined) next.householdSize = patch.householdSize
  if (patch.cityTier !== undefined) next.cityTier = patch.cityTier
  if (patch.incomeBand !== undefined) next.incomeBand = patch.incomeBand
  if (patch.priorities !== undefined) {
    const bad = patch.priorities.filter((p) => !PRIORITY_IDS.includes(p))
    if (bad.length) throw new SpendError(400, `Unknown priority: ${bad.join(', ')}`)
    next.priorities = Array.from(new Set(patch.priorities))
  }
  if (patch.goalsNote !== undefined) {
    const note = patch.goalsNote?.trim() ?? ''
    next.goalsNote = note ? note.slice(0, 300) : null
  }
  if (patch.targetSplit !== undefined) {
    const { needs, wants, savings } = patch.targetSplit
    if (needs + wants + savings !== 100) throw new SpendError(400, 'Needs, wants and savings targets must add up to 100%')
    next.targetSplit = { needs, wants, savings }
  }
  if (patch.bucketOverrides !== undefined) {
    const cleaned: Record<string, Bucket> = {}
    for (const [key, bucket] of Object.entries(patch.bucketOverrides)) {
      if (!isValidBucketKey(key)) throw new SpendError(400, `"${key}" is not a spending category`)
      if (!BUCKETS.includes(bucket)) throw new SpendError(400, `"${bucket}" is not a bucket`)
      cleaned[key] = bucket
    }
    next.bucketOverrides = cleaned
  }

  const res = await pool.query(`
    INSERT INTO spend_needs_profiles (
      user_id, household_size, city_tier, income_band, priorities, goals_note_encrypted,
      target_needs_pct, target_wants_pct, target_savings_pct, bucket_overrides, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      household_size = EXCLUDED.household_size, city_tier = EXCLUDED.city_tier,
      income_band = EXCLUDED.income_band, priorities = EXCLUDED.priorities,
      goals_note_encrypted = EXCLUDED.goals_note_encrypted,
      target_needs_pct = EXCLUDED.target_needs_pct, target_wants_pct = EXCLUDED.target_wants_pct,
      target_savings_pct = EXCLUDED.target_savings_pct, bucket_overrides = EXCLUDED.bucket_overrides,
      updated_at = NOW()
    RETURNING *
  `, [
    userId, next.householdSize, next.cityTier, next.incomeBand, next.priorities,
    next.goalsNote ? encryptPII(next.goalsNote) : null,
    next.targetSplit.needs, next.targetSplit.wants, next.targetSplit.savings,
    JSON.stringify(next.bucketOverrides),
  ])
  return rowToProfile(res.rows[0])
}

/** Static options the profile form needs (category list with default + effective buckets). */
export function profileOptions(overrides: Record<string, Bucket>) {
  return {
    priorities: PRIORITIES.map((p) => ({ id: p.id, label: p.label })),
    cityTiers: CITY_TIERS,
    incomeBands: INCOME_BANDS,
    buckets: BUCKETS.map((b) => ({ id: b, label: BUCKET_LABELS[b] })),
    categories: CATEGORIES.filter((c) => c.group === 'expense').map((c) => ({
      id: c.id,
      label: c.label,
      defaultBucket: DEFAULT_BUCKETS[c.id] ?? 'wants',
      bucket: bucketFor(c.id, null, overrides).bucket,
      subcategories: c.subcategories.map((s) => ({
        name: s,
        key: `${c.id}:${s}`,
        defaultBucket: bucketFor(c.id, s, {}).bucket,
        bucket: bucketFor(c.id, s, overrides).bucket,
      })),
    })),
  }
}

// ─── Breakdown (pure) ──────────────────────────────────────────────────────────

export interface SpendRow { category: string; subcategory: string | null; amountPaise: number; count: number }

export interface BreakdownCategory {
  category: string
  label: string
  amountPaise: number
  txCount: number
  pctOfBucket: number
  bucketSource: 'default' | 'custom'
  subcategories: Array<{ name: string; amountPaise: number; txCount: number }>
  budgetPaise: number | null
  budgetUsedPct: number | null
}

export interface Breakdown {
  basis: 'income' | 'spending'
  incomePaise: number
  totalOutflowPaise: number
  /** Sent to people / card bills: not a spending bucket, but not unspent income either */
  transfersOutPaise: number
  unspentPaise: number
  targetSplit: TargetSplit
  buckets: Array<{
    bucket: Bucket
    label: string
    amountPaise: number
    pctOfBase: number
    categories: BreakdownCategory[]
  }>
  comparison: Array<{
    group: 'needs' | 'wants' | 'savings'
    label: string
    actualPaise: number
    actualPct: number
    targetPct: number
    targetPaise: number
    differencePaise: number
    status: 'on_target' | 'over' | 'under'
  }>
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)

export function computeBreakdown(
  rows: SpendRow[], incomePaise: number, profile: Pick<NeedsProfile, 'targetSplit' | 'bucketOverrides'>,
  budgets: Map<string, number> = new Map(),
  transfersOutPaise = 0,
): Breakdown {
  const perBucket = new Map<Bucket, Map<string, BreakdownCategory>>()
  for (const b of BUCKETS) perBucket.set(b, new Map())
  const categoryTotals = new Map<string, number>()

  for (const r of rows) {
    if (r.amountPaise <= 0) continue
    const { bucket, source } = bucketFor(r.category, r.subcategory, profile.bucketOverrides)
    const m = perBucket.get(bucket)!
    let entry = m.get(r.category)
    if (!entry) {
      entry = {
        category: r.category, label: CATEGORY_BY_ID.get(r.category)?.label ?? r.category,
        amountPaise: 0, txCount: 0, pctOfBucket: 0, bucketSource: source, subcategories: [],
        budgetPaise: budgets.get(r.category) ?? null, budgetUsedPct: null,
      }
      m.set(r.category, entry)
    }
    if (source === 'custom') entry.bucketSource = 'custom'
    entry.amountPaise += r.amountPaise
    entry.txCount += r.count
    entry.subcategories.push({ name: r.subcategory || 'Other', amountPaise: r.amountPaise, txCount: r.count })
    categoryTotals.set(r.category, (categoryTotals.get(r.category) ?? 0) + r.amountPaise)
  }

  const totalOutflow = Array.from(categoryTotals.values()).reduce((s, v) => s + v, 0)
  const basis: Breakdown['basis'] = incomePaise > 0 ? 'income' : 'spending'
  const base = basis === 'income' ? incomePaise : totalOutflow
  // Transfers out left the account too, so they can't be counted as unspent (saved) income
  const unspent = basis === 'income' ? Math.max(0, incomePaise - totalOutflow - transfersOutPaise) : 0

  const buckets = BUCKETS.map((b) => {
    const cats = Array.from(perBucket.get(b)!.values())
    const amount = cats.reduce((s, c) => s + c.amountPaise, 0)
    for (const c of cats) {
      c.pctOfBucket = pct(c.amountPaise, amount)
      c.subcategories.sort((x, y) => y.amountPaise - x.amountPaise)
      if (c.budgetPaise) c.budgetUsedPct = Math.round(((categoryTotals.get(c.category) ?? 0) / c.budgetPaise) * 100)
    }
    cats.sort((x, y) => y.amountPaise - x.amountPaise)
    return { bucket: b, label: BUCKET_LABELS[b], amountPaise: amount, pctOfBase: pct(amount, base), categories: cats }
  })

  const amt = (b: Bucket) => buckets.find((x) => x.bucket === b)!.amountPaise
  const split = profile.targetSplit
  const compare = (group: 'needs' | 'wants' | 'savings', label: string, actual: number, target: number) => {
    const actualPct = pct(actual, base)
    const targetPaise = Math.round((base * target) / 100)
    const status: 'on_target' | 'over' | 'under' =
      group === 'savings'
        ? (actualPct < target - 2 ? 'under' : 'on_target')
        : (actualPct > target + 2 ? 'over' : 'on_target')
    return { group, label, actualPaise: actual, actualPct, targetPct: target, targetPaise, differencePaise: actual - targetPaise, status }
  }

  return {
    basis, incomePaise, totalOutflowPaise: totalOutflow, transfersOutPaise, unspentPaise: unspent, targetSplit: split, buckets,
    comparison: [
      compare('needs', 'Needs (incl. debt repayments)', amt('needs') + amt('debt'), split.needs),
      compare('wants', 'Wants', amt('wants'), split.wants),
      compare('savings', basis === 'income' ? 'Savings & investments (incl. unspent income)' : 'Savings & investments',
        amt('savings') + unspent, split.savings),
    ],
  }
}
