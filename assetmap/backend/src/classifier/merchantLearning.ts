import { Pool, PoolClient } from 'pg'
import { CATEGORY_BY_ID } from './categoryConfig'
import { isDirectionCompatible, looksLikePersonName } from './ruleEngine'
import { SpendError } from '../spend/spendError'

// ═══════════════════════════════════════════════════════════════
// Learning loop
//  * A correction becomes user merchant memory at confidence 100 (used first by the pipeline,
//    and as few-shot examples in this user's future AI prompts).
//  * "Apply to all from this merchant" re-labels the user's other auto-classified rows.
//  * A merchant → category is promoted to the global map only when ≥ PROMOTION_THRESHOLD
//    distinct users independently agree. The global row stores counts only — never user ids —
//    and individuals' names / transfers are never promoted.
// ═══════════════════════════════════════════════════════════════

export const PROMOTION_THRESHOLD = 3
const NEVER_PROMOTE = new Set(['TRANSFERS', 'OTHER_EXPENSE', 'OTHER_INCOME', 'RENT'])

export interface CorrectionInput {
  category: string
  subcategory?: string | null
  notes?: string | null
  applyToMerchant?: boolean
}

export interface CorrectionResult {
  transaction: {
    id: string
    category: string
    subcategory: string
    categoryGroup: string
    merchantName: string | null
  }
  merchantName: string | null
  rememberedForMerchant: boolean
  updatedOtherTransactions: number
  promotedGlobally: boolean
  agreementCount: number | null
}

export function validateCategoryFor(category: string, subcategory: string | null | undefined, txType: 'debit' | 'credit') {
  const cat = CATEGORY_BY_ID.get(category)
  if (!cat) throw new SpendError(400, `Unknown category "${category}"`)
  if (!isDirectionCompatible(cat.group, txType)) {
    throw new SpendError(400, txType === 'debit'
      ? `${cat.label} is for money coming in, but this transaction is money going out`
      : `${cat.label} is for money going out, but this transaction is money coming in`)
  }
  const sub = subcategory && subcategory.trim() ? subcategory.trim().slice(0, 100) : (cat.subcategories[0] ?? '')
  return { cat, subcategory: sub }
}

/** A pool or a checked-out client (so a correction can run in one transaction). */
type Db = Pick<PoolClient, 'query'>

export async function rememberUserCorrection(
  db: Db, userId: string, merchant: string, category: string, subcategory: string, group: string,
): Promise<void> {
  await db.query(`
    INSERT INTO merchant_category_map
      (user_id, merchant_name, category, subcategory, category_group, confidence, times_seen, user_confirmed, source)
    VALUES ($1, $2, $3, $4, $5, 100, 1, true, 'user')
    ON CONFLICT (user_id, merchant_name) DO UPDATE SET
      category = EXCLUDED.category, subcategory = EXCLUDED.subcategory, category_group = EXCLUDED.category_group,
      confidence = 100, user_confirmed = true, source = 'user',
      times_seen = merchant_category_map.times_seen + 1, last_seen_at = NOW()
  `, [userId, merchant.toUpperCase(), category, subcategory, group])
}

/**
 * Current crowd consensus for a merchant (≥ PROMOTION_THRESHOLD distinct users, no tie). When there
 * is none any more — votes withdrawn or changed — a crowd-promoted global row is demoted (deleted);
 * curated seed rows are never touched.
 */
async function syncCrowdConsensus(db: Db, key: string): Promise<{ category: string; voters: number } | null> {
  const tally = await db.query(`
    SELECT category, COUNT(DISTINCT user_id)::int AS voters
      FROM merchant_category_votes WHERE merchant_name = $1
     GROUP BY category ORDER BY voters DESC
  `, [key])
  const top = tally.rows[0]
  const runnerUp = tally.rows[1]
  const consensus = top && top.voters >= PROMOTION_THRESHOLD && !(runnerUp && runnerUp.voters === top.voters)
    ? { category: top.category as string, voters: top.voters as number }
    : null
  if (!consensus) {
    await db.query(`DELETE FROM merchant_category_map WHERE user_id IS NULL AND merchant_name = $1 AND source = 'crowd'`, [key])
  } else {
    // Keep the agreement count of an existing crowd row honest (a different category is demoted)
    await db.query(`
      DELETE FROM merchant_category_map
       WHERE user_id IS NULL AND merchant_name = $1 AND source = 'crowd' AND category <> $2
    `, [key, consensus.category])
    await db.query(`
      UPDATE merchant_category_map SET agreement_count = $3, times_seen = $3
       WHERE user_id IS NULL AND merchant_name = $1 AND source = 'crowd' AND category = $2
    `, [key, consensus.category, consensus.voters])
  }
  return consensus
}

/** Record this user's vote and promote to the global map once enough users agree. */
export async function recordVoteAndMaybePromote(
  db: Db, userId: string, merchant: string, category: string, subcategory: string, group: string,
): Promise<{ promoted: boolean; agreement: number | null }> {
  const key = merchant.toUpperCase()
  if (!key || key === 'UNKNOWN' || key === 'ATM CASH' || key.length < 3) return { promoted: false, agreement: null }
  if (looksLikePersonName(key) || NEVER_PROMOTE.has(category)) {
    // The user no longer stands behind an earlier promotable choice for this merchant: withdraw
    // that vote so it can't keep counting toward a global category they moved away from.
    const withdrawn = await db.query(
      'DELETE FROM merchant_category_votes WHERE user_id = $1 AND merchant_name = $2', [userId, key])
    if ((withdrawn.rowCount ?? 0) > 0) await syncCrowdConsensus(db, key)
    return { promoted: false, agreement: null }
  }

  await db.query(`
    INSERT INTO merchant_category_votes (user_id, merchant_name, category)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, merchant_name) DO UPDATE SET category = EXCLUDED.category, created_at = NOW()
  `, [userId, key, category])

  const consensus = await syncCrowdConsensus(db, key)
  if (!consensus || consensus.category !== category) {
    const mine = await db.query(
      'SELECT COUNT(DISTINCT user_id)::int AS n FROM merchant_category_votes WHERE merchant_name = $1 AND category = $2',
      [key, category])
    return { promoted: false, agreement: mine.rows[0]?.n ?? 1 }
  }
  const top = consensus

  // Curated seeds are never overwritten by the crowd; crowd rows track the current consensus
  const res = await db.query(`
    INSERT INTO merchant_category_map
      (user_id, merchant_name, category, subcategory, category_group, confidence, times_seen, user_confirmed, source, agreement_count)
    VALUES (NULL, $1, $2, $3, $4, 90, $5, false, 'crowd', $5)
    ON CONFLICT (user_id, merchant_name) DO UPDATE SET
      category = EXCLUDED.category, subcategory = EXCLUDED.subcategory, category_group = EXCLUDED.category_group,
      agreement_count = EXCLUDED.agreement_count, times_seen = EXCLUDED.times_seen, last_seen_at = NOW()
    WHERE merchant_category_map.source = 'crowd'
    RETURNING id
  `, [key, category, subcategory, group, top.voters])
  return { promoted: (res.rowCount ?? 0) > 0, agreement: top.voters }
}

/**
 * The user corrects one transaction's category (from the review queue or the transaction list).
 */
export async function applyCorrection(
  pool: Pool, userId: string, txId: string, input: CorrectionInput,
): Promise<CorrectionResult> {
  // One transaction: the row, merchant memory, "apply to all" and the crowd vote land together
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await applyCorrectionIn(client, userId, txId, input)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function applyCorrectionIn(
  db: Db, userId: string, txId: string, input: CorrectionInput,
): Promise<CorrectionResult> {
  const txRes = await db.query(
    `SELECT id, merchant_name, transaction_type FROM classified_transactions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
    [txId, userId],
  )
  const tx = txRes.rows[0]
  if (!tx) throw new SpendError(404, 'Transaction not found')

  const { cat, subcategory } = validateCategoryFor(input.category, input.subcategory, tx.transaction_type)

  // notes: undefined = leave as is; null or blank = remove the note; text = replace it
  const notesProvided = input.notes !== undefined
  const notes = typeof input.notes === 'string' && input.notes.trim() ? input.notes.trim().slice(0, 500) : null
  await db.query(`
    UPDATE classified_transactions
       SET category = $3, subcategory = $4, category_group = $5,
           user_category = $3, user_corrected_at = NOW(),
           user_notes = CASE WHEN $9::boolean THEN $6 ELSE user_notes END,
           classified_by = 'user', confidence = 100,
           classification_reason = 'Set by you',
           is_emi = $8, is_recurring = $7,
           needs_review = false, review_reason = NULL, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
  `, [txId, userId, cat.id, subcategory, cat.group, notes, cat.isRecurring, cat.id === 'EMI', notesProvided])

  const merchant: string | null = tx.merchant_name && tx.merchant_name !== 'Unknown' ? tx.merchant_name : null
  let updatedOther = 0
  let promoted = { promoted: false, agreement: null as number | null }

  if (merchant) {
    await rememberUserCorrection(db, userId, merchant, cat.id, subcategory, cat.group)

    if (input.applyToMerchant) {
      // Other rows from the same merchant in the same direction; earlier explicit corrections stay
      const upd = await db.query(`
        UPDATE classified_transactions
           SET category = $4, subcategory = $5, category_group = $6,
               classified_by = 'inherited', confidence = 100,
               classification_reason = 'Applied from your correction for this merchant',
               is_emi = $9, is_recurring = $7,
               needs_review = false, review_reason = NULL, updated_at = NOW()
         WHERE user_id = $1 AND merchant_name = $2 AND id <> $3
           AND transaction_type = $8 AND user_corrected_at IS NULL
      `, [userId, merchant, txId, cat.id, subcategory, cat.group, cat.isRecurring, tx.transaction_type, cat.id === 'EMI'])
      updatedOther = upd.rowCount ?? 0
    }

    promoted = await recordVoteAndMaybePromote(db, userId, merchant, cat.id, subcategory, cat.group)
  }

  return {
    transaction: { id: txId, category: cat.id, subcategory, categoryGroup: cat.group, merchantName: merchant },
    merchantName: merchant,
    rememberedForMerchant: Boolean(merchant),
    updatedOtherTransactions: updatedOther,
    promotedGlobally: promoted.promoted,
    agreementCount: promoted.agreement,
  }
}
