import { Pool } from 'pg'
import { classifyTransactions, PipelineResult, claudeBatchClassifier } from './classificationPipeline'
import { inferMode } from './merchantNormaliser'
import { rememberUserCorrection } from './merchantLearning'
import { CATEGORY_BY_ID } from './categoryConfig'
import {
  classifyPendingTransactions, rebuildMonthlySummary, runSpendAnalysis,
} from '../spend/spendOrchestrator'

// Back-compatible facade over the layered pipeline (classifier/classificationPipeline.ts) and
// the spend orchestrator (spend/spendOrchestrator.ts). New code should use those directly.

export interface Transaction {
  id?:             string
  narration:       string
  amount:          number       // paise
  type:            'debit'|'credit'
  date:            Date
  mode?:           string
  referenceNumber?:string
}

export interface ClassificationResult {
  category:        string
  subcategory:     string
  categoryGroup:   'expense'|'revenue'|'transfer'|'ignore'
  confidence:      number
  merchantName:    string
  classifiedBy:    'rule_engine'|'claude_ai'|'user'|'inherited'
  reason:          string
  isRecurring:     boolean
  isEmi:           boolean
  needsReview?:    boolean
}

function toLegacy(r: PipelineResult): ClassificationResult {
  return {
    category: r.category, subcategory: r.subcategory, categoryGroup: r.categoryGroup, confidence: r.confidence,
    merchantName: r.merchantName, classifiedBy: r.classifiedBy, reason: r.reason,
    isRecurring: r.isRecurring, isEmi: r.isEmi, needsReview: r.needsReview,
  }
}

export const transactionClassifier = {
  async classify(pool: Pool, userId: string, tx: Transaction): Promise<ClassificationResult> {
    const key = tx.id ?? 'single'
    const run = await classifyTransactions(pool, userId, [{
      key, narration: tx.narration, amountPaise: tx.amount, type: tx.type, date: tx.date,
      mode: tx.mode ?? inferMode(tx.narration),
    }], { ai: claudeBatchClassifier })
    return toLegacy(run.results.get(key)!)
  },

  /** Keyed by narration, as before. */
  async classifyBatch(pool: Pool, userId: string, txs: Transaction[]): Promise<Map<string, ClassificationResult>> {
    const run = await classifyTransactions(pool, userId, txs.map((tx, i) => ({
      key: String(i), narration: tx.narration, amountPaise: tx.amount, type: tx.type, date: tx.date,
      mode: tx.mode ?? inferMode(tx.narration),
    })), { ai: claudeBatchClassifier })
    const out = new Map<string, ClassificationResult>()
    txs.forEach((tx, i) => { const r = run.results.get(String(i)); if (r) out.set(tx.narration, toLegacy(r)) })
    return out
  },

  /** A user-confirmed merchant → category (confidence 100). */
  async learnMerchant(pool: Pool, userId: string, merchant: string, result: Partial<ClassificationResult>): Promise<void> {
    if (!merchant || merchant.length < 3 || !result.category) return
    const cat = CATEGORY_BY_ID.get(result.category)
    if (!cat) return
    await rememberUserCorrection(pool, userId, merchant, cat.id, result.subcategory ?? cat.subcategories[0] ?? '', cat.group)
  },

  async processUserTransactions(pool: Pool, userId: string): Promise<{ processed: number; failed: number }> {
    const s = await classifyPendingTransactions(pool, userId)
    await rebuildMonthlySummary(pool, userId)
    return { processed: s.classified, failed: 0 }
  },

  rebuildMonthlySummary,

  async generateInsights(pool: Pool, userId: string): Promise<void> {
    await runSpendAnalysis(pool, userId)
  },
}
