// Shapes returned by /api/spend (see backend/src/routes/spend.ts). Amounts are integer paise.

export type Bucket = 'needs' | 'wants' | 'savings' | 'debt'
export type CategoryGroup = 'expense' | 'revenue' | 'transfer'
export type AiAvailability = 'configured' | 'available' | 'degraded' | 'not_configured'
export type ClassifiedBy = 'rule_engine' | 'claude_ai' | 'user' | 'inherited'

export interface SpendStatus {
  hasData: boolean
  classifiedCount: number
  needsReviewCount: number
  pendingCount: number
  hasLinkedBankAccount: boolean
  latestMonth: string | null
  months: Array<{ month: string; txCount: number }>
  lastAnalyzedAt: string | null
  ai: { availability: AiAvailability }
  emptyState: null | { title: string; body: string; actionLabel: string; actionUrl: string | null }
}

export interface SpendCategory {
  id: string
  label: string
  group: CategoryGroup
  emoji: string
  color: string
  subcategories: string[]
  defaultBucket: Bucket | null
}

export interface SpendTx {
  id: string
  date: string
  merchantName: string | null
  narration: string
  amountPaise: number
  type: 'debit' | 'credit'
  category: string
  categoryLabel: string
  subcategory: string | null
  categoryGroup: string
  confidence: number | null
  classifiedBy: ClassifiedBy | null
  reason: string | null
  needsReview: boolean
  reviewReason: string | null
  isRecurring: boolean
  isEmi: boolean
  userCorrected: boolean
  notes: string | null
  bankName: string | null
  mode: string | null
}

export interface ReviewItem extends SpendTx {
  suggestedCategory: string
  suggestedSubcategory: string | null
  sameMerchantCount: number
}

export interface CorrectionResult {
  transaction: SpendTx
  merchantName: string | null
  rememberedForMerchant: boolean
  updatedOtherTransactions: number
  promotedGlobally: boolean
  agreementCount: number | null
}

export interface TargetSplit { needs: number; wants: number; savings: number }

export interface NeedsProfile {
  exists: boolean
  householdSize: number | null
  cityTier: string | null
  incomeBand: string | null
  priorities: string[]
  goalsNote: string | null
  targetSplit: TargetSplit
  bucketOverrides: Record<string, Bucket>
  updatedAt: string | null
}

export interface ProfileOptions {
  priorities: Array<{ id: string; label: string }>
  cityTiers: Array<{ id: string; label: string }>
  incomeBands: Array<{ id: string; label: string }>
  buckets: Array<{ id: Bucket; label: string }>
  categories: Array<{
    id: string
    label: string
    defaultBucket: Bucket
    bucket: Bucket
    subcategories: Array<{ name: string; key: string; defaultBucket: Bucket; bucket: Bucket }>
  }>
}

export interface ProfileResponse { profile: NeedsProfile; options: ProfileOptions }

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
  month: string
  hasData: boolean
  needsReviewCount: number
  profileConfigured: boolean
  basis: 'income' | 'spending'
  incomePaise: number
  totalOutflowPaise: number
  /** Sent to people / card bills: not a spending bucket and not counted as unspent income */
  transfersOutPaise: number
  unspentPaise: number
  targetSplit: TargetSplit
  buckets: Array<{ bucket: Bucket; label: string; amountPaise: number; pctOfBase: number; categories: BreakdownCategory[] }>
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

export interface RecurringSeries {
  merchant: string
  category: string
  label: string
  occurrences: number
  avgAmountPaise: number
  avgIntervalDays: number
  firstDate: string
  lastDate: string
  nextExpectedDate: string
  active: boolean
  isNew: boolean
  monthlyEquivalentPaise: number
}

export interface BudgetBurn {
  category: string
  label: string
  budgetPaise: number
  spentPaise: number
  usedPct: number
  daysElapsed: number
  daysInMonth: number
  daysLeft: number
  projectedPaise: number
  projectedOverPaise: number
  status: 'on_track' | 'at_risk' | 'over'
}

export interface Analysis {
  month: string
  asOf: string
  isCurrentMonth: boolean
  hasData: boolean
  totals: {
    incomePaise: number
    refundsPaise: number
    outflowPaise: number
    spendingPaise: number
    investedPaise: number
    transfersOutPaise: number
    byCategory: Array<{ category: string; label: string; paise: number; count: number }>
  }
  previousMonth: string
  monthOverMonth: Array<{ category: string; label: string; currentPaise: number; previousPaise: number; deltaPaise: number; deltaPct: number | null }>
  recurring: RecurringSeries[]
  newMerchants: Array<{ merchant: string; category: string; totalPaise: number; count: number; firstDate: string }>
  anomalies: Array<{
    txId: string; date: string; merchant: string; category: string; label: string; amountPaise: number
    meanPaise: number; medianPaise: number; stdDevPaise: number; historyCount: number
    rule: 'sigma' | 'median'; multipleOfMedian: number
  }>
  budgets: BudgetBurn[]
  savings: { incomePaise: number; spendingPaise: number; investedPaise: number; transfersOutPaise: number; savingsRatePct: number | null; targetPct: number }
  incomeDip: null | { incomePaise: number; avgPreviousPaise: number; dropPct: number; monthsCompared: number }
  needsReviewCount: number
  coverage: { firstDate: string | null; lastDate: string | null; monthsWithData: number }
}

export type InsightType =
  | 'overspend' | 'new_subscription' | 'large_expense' | 'recurring_detected'
  | 'savings_opportunity' | 'income_dip' | 'unusual_pattern'

export interface Insight {
  id: string
  month: string
  insightType: InsightType
  title: string
  body: string
  amountPaise: number | null
  category: string | null
  actionLabel: string | null
  actionUrl: string | null
  priority: number
  generatedBy: 'ai' | 'template'
  evidence: (Record<string, unknown> & { kind?: string }) | null
  isRead: boolean
  dismissedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface AnalyzeResult {
  queued: boolean
  message?: string
  pendingCount?: number
  month?: string | null
  hasData?: boolean
  classification?: {
    classified: number
    reclassified: number
    needsReview: number
    aiStatus: 'not_needed' | 'used' | 'unavailable' | 'disabled'
    byLayer: Record<string, number>
  }
  generatedBy?: 'ai' | 'template' | 'mixed' | 'none'
  aiAvailability?: AiAvailability
  insights?: Insight[]
  /** Insights for the month the user dismissed earlier (they still hold, but stay hidden) */
  dismissedCount?: number
}

export interface AskResult {
  answer: string
  answerable: boolean
  source: 'ai' | 'fallback'
  month: string | null
  aiAvailability: AiAvailability
}

export interface SummaryRow {
  category: string
  label: string
  category_group: string
  total_paise: number
  transaction_count: number
  largest_tx_paise: number
}

export interface SpendSummary {
  period: { months: number; endMonth: string }
  expenses: SummaryRow[]
  revenue: SummaryRow[]
  totalExpensePaise: number
  totalRevenuePaise: number
  netPaise: number
  transfersOutPaise: number
  savingsRatePct: number | null
}

export interface SubscriptionRow {
  merchant_name: string
  occurrences: number
  avg_amount: number
  last_charged: string
  first_charged: string
  total_spent_ever: number
}

export type SpendView = 'overview' | 'transactions' | 'review' | 'budgets' | 'subscriptions'
