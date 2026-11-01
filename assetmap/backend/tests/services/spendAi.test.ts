import { describe, it, expect, beforeAll, afterAll } from '../testFramework'
import { pool } from '../../src/db/connection'
import { encryptPII } from '../../src/utils/encryption'
import crypto from 'crypto'
import { maskForPrompt, maskMerchant } from '../../src/classifier/piiMasker'
import {
  classifyTransactions, buildClassificationPrompt, getFewShotExamples, AiItem, FewShot, AiBatchClassifier, PipelineTx,
} from '../../src/classifier/classificationPipeline'
import { applyCorrection, recordVoteAndMaybePromote, PROMOTION_THRESHOLD } from '../../src/classifier/merchantLearning'
import { normaliseMerchant } from '../../src/classifier/merchantNormaliser'
import { ClaudeUnavailableError } from '../../src/ai/claudeClient'
import { computeBreakdown, DEFAULT_PROFILE, updateNeedsProfile, getNeedsProfile } from '../../src/spend/needsProfile'
import { detectRecurring, detectAnomalies, budgetBurn, computeMonthTotals, analyseMonth, AnalysisTx } from '../../src/spend/spendAnalysis'
import {
  buildFacts, validateNarratedInsight, narrateInsights, extractNumbers, buildNarrationPrompt, Fact, NarrationFn, NarratedInsight,
} from '../../src/spend/spendInsights'
import { runSpendAnalysis, listInsights } from '../../src/spend/spendOrchestrator'
import { askAboutSpending, buildAskContext, allowedAnswerNumbers, answerNumbersValid } from '../../src/spend/spendAsk'
import { SpendError } from '../../src/spend/spendError'
import { SPEND_NARRATIONS } from '../fixtures/spendNarrations'

// Spend Analyser AI orchestration. Nothing here calls Claude: every AI dependency is injected
// (recording fakes, or fakes that throw ClaudeUnavailableError like the real client does).

async function makeUser(label: string): Promise<string> {
  const res = await pool.query(
    `INSERT INTO users (aadhaar_hash, name_encrypted, mobile_encrypted) VALUES ($1, $2, $3) RETURNING id`,
    [crypto.randomBytes(16).toString('hex'), encryptPII(label), encryptPII('+919876543210')],
  )
  return res.rows[0].id
}

async function dropUser(userId: string) {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]) // cascades classified rows, memory, votes, profile, insights
}

const unavailable: AiBatchClassifier = async () => { throw new ClaudeUnavailableError('ANTHROPIC_API_KEY is not configured') }
const narratorDown: NarrationFn = async () => { throw new ClaudeUnavailableError('Claude declined the request') }

function tx(id: string, date: string, amountRupees: number, category: string, merchant: string, extra: Partial<AnalysisTx> = {}): AnalysisTx {
  const group = ['SALARY', 'OTHER_INCOME', 'INVESTMENT_RETURN', 'REFUNDS', 'BUSINESS_INCOME'].includes(category) ? 'revenue'
    : category === 'TRANSFERS' ? 'transfer' : 'expense'
  return {
    id, date, amountPaise: Math.round(amountRupees * 100), type: group === 'revenue' ? 'credit' : 'debit',
    category, subcategory: null, group, merchant, needsReview: false, ...extra,
  }
}

async function insertClassified(userId: string, row: {
  narration: string; amountPaise: number; type: 'debit' | 'credit'; date: string; category: string; group: string;
  merchant: string; needsReview?: boolean; subcategory?: string
}): Promise<string> {
  const res = await pool.query(`
    INSERT INTO classified_transactions (
      user_id, transaction_date, narration, amount_paise, transaction_type, merchant_name, category, subcategory,
      category_group, confidence, classified_by, needs_review, dedup_hash
    ) VALUES ($1,$2::date,$3,$4,$5,$6,$7,$8,$9,$10,'rule_engine',$11,$12) RETURNING id
  `, [userId, row.date, row.narration, row.amountPaise, row.type, row.merchant, row.category, row.subcategory ?? null,
      row.group, row.needsReview ? 40 : 80, row.needsReview ?? false, crypto.randomBytes(16).toString('hex')])
  return res.rows[0].id
}

export function registerSpendAiTests() {
  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — PII masking (nothing identifying leaves in a prompt)', () => {
    let userId: string
    beforeAll(async () => { userId = await makeUser('Meera Iyer') })
    afterAll(async () => { await dropUser(userId) })

    it('masks VPAs, emails, phones, account/card/ref numbers, IFSC and individuals', () => {
      const raw = 'UPI/DR/412345678901/RAMESH KUMAR/SBIN/ramesh.k@oksbi/rent 9876543210 a/c 50100123456789 card 4160 21XX XXXX 4321 SBIN0001234 meera.iyer@gmail.com MR SURESH NAIDU'
      const m = maskForPrompt(raw)
      for (const secret of ['412345678901', 'RAMESH', 'KUMAR', 'ramesh.k@oksbi', '9876543210', '50100123456789', '4321', 'SBIN0001234', 'meera.iyer', 'gmail', 'SURESH', 'NAIDU']) {
        expect(m.includes(secret)).toBe(false)
      }
      expect(m).toContain('[PERSON]')
      expect(m).toContain('[VPA]')
      expect(m).toContain('rent')
    })

    it('keeps business names (the classification signal) but masks people as merchants', () => {
      expect(maskMerchant('Swiggy')).toBe('Swiggy')
      expect(maskMerchant('Sri Venkateshwara Enterprises')).toBe('Sri Venkateshwara Enterprises')
      expect(maskMerchant('Ramesh Kumar')).toBe('[PERSON]')
      expect(maskForPrompt('UPI/DR/412300001234/Zepto Marketplace/YESB/zeptonow@ybl/Payment')).toContain('Zepto Marketplace')
    })

    it('the classification prompt contains no user identity or raw PII', async () => {
      const txs: PipelineTx[] = [
        { key: 'a', narration: 'UPI/DR/412398761234/ANJALI DESAI/HDFC/anjali.d@okhdfcbank/9812345678', amountPaise: 1_234_500, type: 'debit', date: new Date('2026-10-02'), mode: 'UPI' },
        { key: 'b', narration: 'IMPS/P2A/412312341234/MEERA IYER/ICIC/50100987654321/meera.iyer@gmail.com', amountPaise: 99_900, type: 'debit', date: new Date('2026-10-03'), mode: 'IMPS' },
        { key: 'c', narration: 'POS 416021XXXXXX4321 KRISHNA SWEETS AND SNACKS', amountPaise: 45_000, type: 'debit', date: new Date('2026-10-04'), mode: 'POS' },
      ]
      let captured: { items: AiItem[]; shots: FewShot[] } | null = null
      const recorder: AiBatchClassifier = async (items, shots) => { captured = { items, shots }; return [] }
      await classifyTransactions(pool, userId, txs, { ai: recorder, learn: false })
      expect(captured !== null).toBe(true)
      const prompt = buildClassificationPrompt(captured!.items, captured!.shots)
      for (const secret of [userId, 'Meera', 'MEERA', 'IYER', 'ANJALI', 'DESAI', 'anjali.d', '9812345678', '50100987654321',
        'gmail', '412398761234', '4321', '12345', '+919876543210']) {
        expect(prompt.includes(secret)).toBe(false)
      }
      // Exact amounts never leave — only a band
      expect(prompt.includes('12345')).toBe(false)
      expect(prompt).toContain('₹10k–50k')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — learning from corrections', () => {
    let userId: string
    const others: string[] = []
    const crowdMerchant = `TESTCROWD ${crypto.randomBytes(3).toString('hex').toUpperCase()} STORES`
    beforeAll(async () => { userId = await makeUser('Learning Tester') })
    afterAll(async () => {
      await pool.query('DELETE FROM merchant_category_map WHERE user_id IS NULL AND merchant_name = $1', [crowdMerchant])
      for (const id of others) await dropUser(id)
      await dropUser(userId)
    })

    it('a correction updates memory, applies to the merchant, and the next classification uses it', async () => {
      const narr = 'UPI/DR/412398761234/RAMESH KUMAR/SBIN/ramesh.k@oksbi/Payment'
      const merchant = normaliseMerchant(narr)
      expect(merchant).toBe('Ramesh Kumar')
      const first = await insertClassified(userId, { narration: narr, amountPaise: 2_500_000, type: 'debit', date: '2026-09-02', category: 'TRANSFERS', group: 'transfer', merchant, needsReview: true })
      const second = await insertClassified(userId, { narration: narr, amountPaise: 2_500_000, type: 'debit', date: '2026-10-02', category: 'TRANSFERS', group: 'transfer', merchant, needsReview: true })

      const result = await applyCorrection(pool, userId, first, { category: 'RENT', applyToMerchant: true })
      expect(result.transaction.categoryGroup).toBe('expense')
      expect(result.updatedOtherTransactions).toBe(1)
      expect(result.promotedGlobally).toBe(false) // individuals are never promoted
      const row2 = await pool.query('SELECT category, category_group, needs_review FROM classified_transactions WHERE id = $1', [second])
      expect(row2.rows[0].category).toBe('RENT')
      expect(row2.rows[0].needs_review).toBe(false)

      let aiCalled = false
      const run = await classifyTransactions(pool, userId, [
        { key: 'n', narration: 'UPI/DR/412300000001/RAMESH KUMAR/SBIN/ramesh.k@oksbi/Payment', amountPaise: 2_500_000, type: 'debit', date: new Date('2026-11-02') },
      ], { ai: async () => { aiCalled = true; return [] } })
      const r = run.results.get('n')!
      expect(r.category).toBe('RENT')
      expect(r.layer).toBe('user_memory')
      expect(r.needsReview).toBe(false)
      expect(aiCalled).toBe(false)
    })

    it('corrections become few-shot examples (businesses only, most recent first)', async () => {
      const merchant = 'Sri Venkateshwara Enterprises'
      const id = await insertClassified(userId, { narration: 'UPI/DR/412300001212/SRI VENKATESHWARA ENTERPRISES/SBIN/q123456789@ybl/Payment', amountPaise: 34_000, type: 'debit', date: '2026-10-30', category: 'TRANSFERS', group: 'transfer', merchant, needsReview: true })
      await applyCorrection(pool, userId, id, { category: 'FOOD', subcategory: 'Groceries' })
      const shots = await getFewShotExamples(pool, userId)
      expect(shots[0].merchant).toBe('SRI VENKATESHWARA ENTERPRISES')
      expect(shots[0].category).toBe('FOOD')
      expect(shots.some((s) => s.merchant.includes('RAMESH'))).toBe(false)
    })

    it('validates the category, its direction, and sets the right category_group', async () => {
      const credit = await insertClassified(userId, { narration: 'NEFT CR-ACME LTD-SAL', amountPaise: 5_000_000, type: 'credit', date: '2026-10-01', category: 'OTHER_INCOME', group: 'revenue', merchant: 'Acme' })
      let caught: unknown
      try { await applyCorrection(pool, userId, credit, { category: 'NOT_A_CATEGORY' }) } catch (e) { caught = e }
      expect(caught instanceof SpendError && (caught as SpendError).statusCode === 400).toBe(true)
      caught = undefined
      try { await applyCorrection(pool, userId, credit, { category: 'FOOD' }) } catch (e) { caught = e }
      expect(caught instanceof SpendError && (caught as SpendError).message.includes('money coming in')).toBe(true)
      const ok = await applyCorrection(pool, userId, credit, { category: 'SALARY' })
      expect(ok.transaction.categoryGroup).toBe('revenue')
      caught = undefined
      try { await applyCorrection(pool, userId, crypto.randomUUID(), { category: 'FOOD' }) } catch (e) { caught = e }
      expect((caught as SpendError).statusCode).toBe(404)
    })

    it(`promotes a merchant globally only when ${PROMOTION_THRESHOLD} users agree, storing counts not user ids`, async () => {
      for (let i = 0; i < PROMOTION_THRESHOLD; i++) others.push(await makeUser(`Crowd ${i}`))
      const r1 = await recordVoteAndMaybePromote(pool, others[0], crowdMerchant, 'HEALTH', 'Pharmacy', 'expense')
      const r2 = await recordVoteAndMaybePromote(pool, others[1], crowdMerchant, 'HEALTH', 'Pharmacy', 'expense')
      expect(r1.promoted || r2.promoted).toBe(false)
      const r3 = await recordVoteAndMaybePromote(pool, others[2], crowdMerchant, 'HEALTH', 'Pharmacy', 'expense')
      expect(r3.promoted).toBe(true)
      const g = await pool.query('SELECT user_id, category, agreement_count, source FROM merchant_category_map WHERE user_id IS NULL AND merchant_name = $1', [crowdMerchant])
      expect(g.rows.length).toBe(1)
      expect(g.rows[0].user_id).toBeNull()
      expect(g.rows[0].agreement_count).toBe(3)
      expect(g.rows[0].source).toBe('crowd')
      const person = await recordVoteAndMaybePromote(pool, others[0], 'Ramesh Kumar', 'RENT', 'Rent', 'expense')
      expect(person.promoted).toBe(false)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — needs-based breakdown math', () => {
    it('maps categories (and subcategories) into buckets and compares with 50/30/20 of income', () => {
      const b = computeBreakdown([
        { category: 'RENT', subcategory: 'Rent', amountPaise: 2_500_000, count: 1 },
        { category: 'FOOD', subcategory: 'Groceries', amountPaise: 800_000, count: 6 },
        { category: 'FOOD', subcategory: 'Delivery', amountPaise: 600_000, count: 12 },
        { category: 'SHOPPING', subcategory: 'Online', amountPaise: 900_000, count: 3 },
        { category: 'INVESTMENTS', subcategory: 'Mutual funds', amountPaise: 1_000_000, count: 1 },
        { category: 'EMI', subcategory: 'Loan EMI', amountPaise: 1_200_000, count: 1 },
      ], 10_000_000, DEFAULT_PROFILE, new Map([['FOOD', 1_000_000]]))
      const amt = (k: string) => b.buckets.find((x) => x.bucket === k)!.amountPaise
      expect(b.basis).toBe('income')
      expect(amt('needs')).toBe(3_300_000)
      expect(amt('wants')).toBe(1_500_000)
      expect(amt('savings')).toBe(1_000_000)
      expect(amt('debt')).toBe(1_200_000)
      expect(b.totalOutflowPaise).toBe(7_000_000)
      expect(b.unspentPaise).toBe(3_000_000)
      const needs = b.comparison.find((c) => c.group === 'needs')!
      expect(needs.actualPaise).toBe(4_500_000)    // needs + debt
      expect(needs.actualPct).toBe(45)
      expect(needs.status).toBe('on_target')
      const savings = b.comparison.find((c) => c.group === 'savings')!
      expect(savings.actualPaise).toBe(4_000_000)  // invested + unspent
      expect(savings.actualPct).toBe(40)
      const wants = b.comparison.find((c) => c.group === 'wants')!
      expect(wants.actualPct).toBe(15)
      expect(wants.targetPaise).toBe(3_000_000)
      // FOOD is split across buckets; budget usage counts the whole category
      const foodNeeds = b.buckets.find((x) => x.bucket === 'needs')!.categories.find((c) => c.category === 'FOOD')!
      expect(foodNeeds.amountPaise).toBe(800_000)
      expect(foodNeeds.budgetUsedPct).toBe(140)
    })

    it('honours user bucket overrides and custom targets, and falls back to spending as the base', () => {
      const b = computeBreakdown([
        { category: 'FOOD', subcategory: 'Groceries', amountPaise: 400_000, count: 2 },
        { category: 'FOOD', subcategory: 'Delivery', amountPaise: 600_000, count: 5 },
        { category: 'TRAVEL', subcategory: 'Cab', amountPaise: 1_000_000, count: 4 },
      ], 0, { targetSplit: { needs: 60, wants: 20, savings: 20 }, bucketOverrides: { FOOD: 'wants', TRAVEL: 'needs' } })
      expect(b.basis).toBe('spending')
      expect(b.buckets.find((x) => x.bucket === 'wants')!.amountPaise).toBe(1_000_000)
      expect(b.buckets.find((x) => x.bucket === 'needs')!.amountPaise).toBe(1_000_000)
      const wants = b.comparison.find((c) => c.group === 'wants')!
      expect(wants.actualPct).toBe(50)
      expect(wants.targetPct).toBe(20)
      expect(wants.status).toBe('over')
      expect(b.buckets.find((x) => x.bucket === 'needs')!.categories[0].bucketSource).toBe('custom')
    })

    it('rejects target splits that do not add up to 100 and unknown categories', async () => {
      const userId = await makeUser('Profile Tester')
      try {
        let caught: unknown
        try { await updateNeedsProfile(pool, userId, { targetSplit: { needs: 50, wants: 30, savings: 30 } }) } catch (e) { caught = e }
        expect((caught as SpendError).statusCode).toBe(400)
        caught = undefined
        try { await updateNeedsProfile(pool, userId, { bucketOverrides: { SALARY: 'needs' } as any }) } catch (e) { caught = e }
        expect((caught as SpendError).statusCode).toBe(400)
        const p = await updateNeedsProfile(pool, userId, {
          householdSize: 4, cityTier: 'metro', priorities: ['reduce_food_delivery'], goalsNote: 'Saving for a flat in Pune',
          bucketOverrides: { 'FOOD:Delivery': 'wants', TRAVEL: 'needs' },
        })
        expect(p.exists).toBe(true)
        const raw = await pool.query('SELECT goals_note_encrypted FROM spend_needs_profiles WHERE user_id = $1', [userId])
        expect(raw.rows[0].goals_note_encrypted.includes('Pune')).toBe(false) // encrypted at rest
        expect((await getNeedsProfile(pool, userId)).goalsNote).toBe('Saving for a flat in Pune')
      } finally { await dropUser(userId) }
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — recurring, anomaly and burn-rate detection', () => {
    it('detects a monthly subscription (±10%, 25–35 days, ≥ 2) and ignores frequent merchants', () => {
      const txs = [
        tx('n1', '2026-07-05', 649, 'SUBSCRIPTIONS', 'Netflix'),
        tx('n2', '2026-08-05', 649, 'SUBSCRIPTIONS', 'Netflix'),
        tx('n3', '2026-09-04', 649, 'SUBSCRIPTIONS', 'Netflix'),
        tx('g1', '2026-08-10', 1200, 'SHOPPING', 'Gadget Shop'),
        tx('g2', '2026-09-09', 2900, 'SHOPPING', 'Gadget Shop'),       // amount differs > 10%
        tx('y1', '2026-06-01', 199, 'SUBSCRIPTIONS', 'YouTube Premium'),
        tx('y2', '2026-09-01', 199, 'SUBSCRIPTIONS', 'YouTube Premium'), // 92-day gap
        ...Array.from({ length: 12 }, (_, i) => tx(`s${i}`, `2026-09-${String(1 + i * 2).padStart(2, '0')}`, 400, 'FOOD', 'Swiggy')),
        tx('s-x', '2026-08-03', 400, 'FOOD', 'Swiggy'),
      ]
      const rec = detectRecurring(txs, '2026-09-20')
      expect(rec.map((r) => r.merchant)).toEqual(['Netflix'])
      expect(rec[0].occurrences).toBe(3)
      expect(rec[0].avgIntervalDays).toBe(31)
      expect(rec[0].nextExpectedDate).toBe('2026-10-05')
      expect(rec[0].active).toBe(true)
    })

    it('flags amounts above mean + 3σ or 3× median of that category, not normal ones', () => {
      const hist = [1500, 1800, 1650, 1700, 1550, 1600].map((a, i) => tx(`h${i}`, `2026-0${4 + Math.floor(i / 2)}-1${i}`, a, 'SHOPPING', 'Store'))
      const txs = [...hist, tx('big', '2026-10-12', 24_999, 'SHOPPING', 'Croma'), tx('normal', '2026-10-13', 1750, 'SHOPPING', 'Store')]
      const an = detectAnomalies(txs, '2026-10')
      expect(an.length).toBe(1)
      expect(an[0].txId).toBe('big')
      expect(an[0].rule).toBe('sigma')
      expect(an[0].medianPaise).toBe(162_500)
      expect(an[0].multipleOfMedian).toBe(15.4)
    })

    it('projects budget burn to month end', () => {
      const txs = [tx('f1', '2026-11-05', 3000, 'FOOD', 'Swiggy'), tx('f2', '2026-11-10', 3000, 'FOOD', 'Zomato')]
      const totals = computeMonthTotals(txs, '2026-11')
      const [b] = budgetBurn(new Map([['FOOD', 800_000]]), totals, '2026-11', '2026-11-10')
      expect(b.spentPaise).toBe(600_000)
      expect(b.projectedPaise).toBe(1_800_000)          // 6000 / 10 days × 30
      expect(b.projectedOverPaise).toBe(1_000_000)
      expect(b.status).toBe('at_risk')
      expect(b.daysLeft).toBe(20)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — insight number validation', () => {
    const month = '2026-10'
    const monthTxs: AnalysisTx[] = [
        tx('s9', '2026-09-01', 80_000, 'SALARY', 'Acme'),
        tx('s10', '2026-10-01', 80_000, 'SALARY', 'Acme'),
        tx('f9', '2026-09-10', 6_000, 'FOOD', 'Swiggy', { subcategory: 'Delivery' }),
        tx('f10', '2026-10-10', 9_000, 'FOOD', 'Swiggy', { subcategory: 'Delivery' }),
        tx('sh', '2026-10-12', 40_000, 'SHOPPING', 'Croma'),
        tx('r10', '2026-10-02', 25_000, 'RENT', 'Landlord Ltd'),
    ]
    const analysis = analyseMonth({
      month, asOf: '2026-10-31', budgets: new Map(), profile: { ...DEFAULT_PROFILE, priorities: ['reduce_food_delivery'] },
      txs: monthTxs,
    })
    const facts = buildFacts(analysis, { ...DEFAULT_PROFILE, priorities: ['reduce_food_delivery'] })
    const mom = facts.find((f) => f.key === 'mom:FOOD') as Fact
    const ctx = [2026, 50, 30, 20]
    const good = (): NarratedInsight => ({
      fact_id: 'mom:FOOD', insight_type: 'overspend', title: 'Food delivery is up 50% this month',
      body: 'You spent ₹9,000 on Food & Dining in October, ₹3,000 more than in September.',
      amount_paise: mom.amountPaise!, category: 'FOOD', action_label: 'See food spending',
      action_url: '/dashboard?tab=analytics&view=transactions&category=FOOD',
    })

    it('builds deterministic facts with the computed numbers', () => {
      expect(mom.amountPaise).toBe(300_000)
      expect(mom.numbers).toEqual([9000, 6000, 3000, 50])
      expect(facts.some((f) => f.key === 'savings_rate')).toBe(true) // spent 74,000 of 80,000 → 8% < 20%
      expect(facts.some((f) => f.key === 'priority:food_delivery')).toBe(true)
      expect(extractNumbers('₹1.2L and 3k, 40% of ₹12,340')).toEqual([120000, 3000, 40, 12340])
    })

    it('accepts AI text whose numbers all come from the fact', () => {
      expect(validateNarratedInsight(good(), mom, ctx)).toEqual([])
    })

    it('rejects invented numbers, changed amounts/categories and non-app links', () => {
      expect(validateNarratedInsight({ ...good(), body: 'You spent ₹9,500 on food.' }, mom, ctx).length).toBeGreaterThan(0)
      expect(validateNarratedInsight({ ...good(), title: 'Food is up 40%' }, mom, ctx).length).toBeGreaterThan(0)
      expect(validateNarratedInsight({ ...good(), amount_paise: 1 }, mom, ctx).length).toBeGreaterThan(0)
      expect(validateNarratedInsight({ ...good(), category: 'SHOPPING' }, mom, ctx).length).toBeGreaterThan(0)
      expect(validateNarratedInsight({ ...good(), action_url: 'https://evil.example/phish' }, mom, ctx).length).toBeGreaterThan(0)
      expect(validateNarratedInsight({ ...good(), fact_id: 'made-up' }, undefined, ctx).length).toBeGreaterThan(0)
    })

    it('keeps valid AI insights, retries once, then falls back to the template per insight', async () => {
      let calls = 0
      const narrator: NarrationFn = async () => {
        calls++
        return { insights: [good(), { ...good(), fact_id: 'savings_rate', insight_type: 'savings_opportunity', category: '', amount_paise: facts.find((f) => f.key === 'savings_rate')!.amountPaise!, title: 'You saved 12% this month', body: 'Try harder.', action_url: '/dashboard?tab=analytics&view=breakdown' }] }
      }
      const run = await narrateInsights(facts, DEFAULT_PROFILE, month, narrator)
      expect(calls).toBe(2)
      expect(run.generatedBy).toBe('mixed')
      const byKey = new Map(run.insights.map((i) => [i.factKey, i]))
      expect(byKey.get('mom:FOOD')!.generatedBy).toBe('ai')
      const sav = byKey.get('savings_rate')!
      expect(sav.generatedBy).toBe('template')
      expect(sav.title).toBe(facts.find((f) => f.key === 'savings_rate')!.template.title)
    })

    it('uses deterministic templates when Claude is unavailable or disabled', async () => {
      const down = await narrateInsights(facts, DEFAULT_PROFILE, month, narratorDown)
      expect(down.generatedBy).toBe('template')
      expect(down.insights.length).toBe(Math.min(6, facts.length))
      expect(down.insights.every((i) => i.generatedBy === 'template')).toBe(true)
      const off = await narrateInsights(facts, DEFAULT_PROFILE, month, null)
      expect(off.insights[0].title).toBe(facts[0].template.title)
    })

    it('Q&A answers are checked against the aggregate', () => {
      const ctxData = buildAskContext(analysis, monthTxs, [])
      const allowed = allowedAnswerNumbers(ctxData)
      expect(answerNumbersValid('You spent ₹9,000 on food.', allowed)).toBe(true)
      expect(answerNumbersValid('You spent ₹9,999 on food.', allowed)).toBe(false)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — graceful no-AI orchestration', () => {
    let userId: string
    beforeAll(async () => {
      userId = await makeUser('No AI Tester')
      const acct = crypto.randomUUID()
      const rows: Array<[string, string, string, number]> = [
        ['2026-09-01', 'NEFT-HDFCN52026090112345-ACME TECHNOLOGIES PVT LTD-SALARY SEP', 'CREDIT', 80000],
        ['2026-10-01', 'NEFT-HDFCN52026100112345-ACME TECHNOLOGIES PVT LTD-SALARY OCT', 'CREDIT', 80000],
        ['2026-09-05', 'POS 416021XXXXXX4321 NETFLIX.COM', 'DEBIT', 649],
        ['2026-10-05', 'POS 416021XXXXXX4321 NETFLIX.COM', 'DEBIT', 649],
        ['2026-09-12', 'UPI/DR/412345678901/SWIGGY/YESB/swiggy.stores@ybl/Order', 'DEBIT', 4000],
        ['2026-10-12', 'UPI/DR/412345678902/SWIGGY/YESB/swiggy.stores@ybl/Order', 'DEBIT', 9000],
        ['2026-10-20', 'UPI/DR/412300001212/SRI VENKATESHWARA ENTERPRISES/SBIN/q123456789@ybl/Payment', 'DEBIT', 340],
        ['2026-10-21', 'Incremental Sync Debit', 'DEBIT', 1200],
      ]
      for (const [d, n, t, a] of rows) {
        await pool.query('INSERT INTO transactions (account_id, user_id, date, narration, type, amount) VALUES ($1,$2,$3,$4,$5,$6)', [acct, userId, d, n, t, a])
      }
    })
    afterAll(async () => {
      await pool.query('DELETE FROM transactions WHERE user_id = $1', [userId])
      await dropUser(userId)
    })

    it('classifies, reviews the unknown, and stores template insights when Claude is down', async () => {
      const out = await runSpendAnalysis(pool, userId, { month: '2026-10', ai: { classifier: unavailable, narrator: narratorDown } })
      expect(out.hasData).toBe(true)
      expect(out.classification.classified).toBe(7) // simulated sync rows are never classified
      expect(out.classification.aiStatus).toBe('unavailable')
      expect(out.classification.needsReview).toBe(1)
      const review = await pool.query(`SELECT merchant_name FROM classified_transactions WHERE user_id = $1 AND needs_review`, [userId])
      expect(review.rows[0].merchant_name).toBe('Sri Venkateshwara Enterprises')
      expect(out.generatedBy).toBe('template')
      expect(out.insights.length).toBeGreaterThan(0)
      expect(out.insights.every((i) => i.generatedBy === 'template')).toBe(true)
      const food = out.insights.find((i) => i.category === 'FOOD' && i.insightType === 'overspend')!
      expect(food.amountPaise).toBe(500_000)
      expect(food.evidence !== null).toBe(true)

      // Idempotent: a second run classifies nothing new and keeps one row per fact
      const again = await runSpendAnalysis(pool, userId, { month: '2026-10', ai: { classifier: unavailable, narrator: null } })
      expect(again.classification.classified).toBe(0)
      expect((await listInsights(pool, userId, '2026-10')).length).toBe(out.insights.length)
    })

    it('dismissed insights stay dismissed across re-analysis', async () => {
      const [first] = await listInsights(pool, userId, '2026-10')
      await pool.query('UPDATE spend_insights SET dismissed_at = NOW() WHERE id = $1', [first.id])
      await runSpendAnalysis(pool, userId, { month: '2026-10', ai: { classifier: null, narrator: null } })
      const visible = await listInsights(pool, userId, '2026-10')
      expect(visible.some((i) => i.id === first.id)).toBe(false)
    })

    it('answers questions deterministically without AI, and says when it has no data', async () => {
      const ans = await askAboutSpending(pool, userId, 'How much did I spend on food?', async () => { throw new ClaudeUnavailableError('x') }, '2026-10-31')
      expect(ans.source).toBe('fallback')
      expect(ans.answer).toContain('₹9,000')
      expect(ans.answer).toContain('₹4,000')
      const lie = await askAboutSpending(pool, userId, 'How much did I spend on food?', async () => ({ answerable: true, answer: 'You spent ₹1,23,456 on food.' }), '2026-10-31')
      expect(lie.source).toBe('fallback')
      const empty = await makeUser('Empty Tester')
      try {
        const none = await askAboutSpending(pool, empty, 'What did I spend?', null)
        expect(none.answerable).toBe(false)
        expect(none.answer).toContain("don't have any spending data")
      } finally { await dropUser(empty) }
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — classifier evaluation harness (deterministic layers)', () => {
    let userId: string
    beforeAll(async () => { userId = await makeUser('Eval Tester') })
    afterAll(async () => { await dropUser(userId) })

    it(`classifies the ${SPEND_NARRATIONS.length}-narration labelled set accurately and abstains on the ambiguous ones`, async () => {
      expect(SPEND_NARRATIONS.length).toBeGreaterThanOrEqual(60)
      const txs: PipelineTx[] = SPEND_NARRATIONS.map((f, i) => ({
        key: String(i), narration: f.narration, amountPaise: f.amountPaise, type: f.type, date: new Date(`${f.date}T00:00:00Z`),
      }))
      const run = await classifyTransactions(pool, userId, txs, { ai: null, learn: false })
      let decided = 0, correct = 0, abstainedCorrectly = 0
      const misses: string[] = []
      SPEND_NARRATIONS.forEach((f, i) => {
        const r = run.results.get(String(i))!
        if (r.needsReview) {
          if (f.deterministicCanKnow === false) abstainedCorrectly++
          else misses.push(`ABSTAIN  ${f.expected} (guess ${r.category}) ← ${f.narration}`)
          return
        }
        decided++
        if (r.category === f.expected) correct++
        else misses.push(`WRONG    ${f.expected} got ${r.category} ← ${f.narration}`)
      })
      const precision = correct / decided
      const coverage = decided / SPEND_NARRATIONS.length
      console.log(`      [eval] n=${SPEND_NARRATIONS.length} decided=${decided} correct=${correct} precision=${(precision * 100).toFixed(1)}% coverage=${(coverage * 100).toFixed(1)}% overall=${((correct / SPEND_NARRATIONS.length) * 100).toFixed(1)}% layers=${JSON.stringify(run.byLayer)}`)
      for (const m of misses) console.log(`      [eval] ${m}`)
      expect(precision).toBeGreaterThanOrEqual(0.95)
      expect(coverage).toBeGreaterThanOrEqual(0.9)
      expect(abstainedCorrectly).toBe(SPEND_NARRATIONS.filter((f) => f.deterministicCanKnow === false).length)
    })

    it('"training": after the user labels the review queue, the same merchants are classified from memory', async () => {
      const ambiguous = SPEND_NARRATIONS.filter((f) => f.deterministicCanKnow === false)
      for (const f of ambiguous) {
        const id = await insertClassified(userId, {
          narration: f.narration, amountPaise: f.amountPaise, type: f.type, date: f.date, category: 'OTHER_EXPENSE',
          group: 'expense', merchant: normaliseMerchant(f.narration), needsReview: true,
        })
        await applyCorrection(pool, userId, id, { category: f.expected })
      }
      const run = await classifyTransactions(pool, userId, ambiguous.map((f, i) => ({
        key: String(i), narration: f.narration.replace(/\d{9,}/g, '499999999999'), amountPaise: f.amountPaise, type: f.type, date: new Date('2026-11-15'),
      })), { ai: null, learn: false })
      ambiguous.forEach((f, i) => {
        const r = run.results.get(String(i))!
        expect(r.category).toBe(f.expected)
        expect(r.layer).toBe('user_memory')
      })
      console.log(`      [eval] after corrections: ${ambiguous.length}/${ambiguous.length} previously-ambiguous merchants now classified from user memory`)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — hyphenated narrations and insight prompts never leak personal names', () => {
    let userId: string
    beforeAll(async () => { userId = await makeUser('Hyphen Tester') })
    afterAll(async () => { await dropUser(userId) })

    it('masks names in NEFT-/UPI-/IMPS- narrations (HDFC style) before the classification prompt', async () => {
      const txs: PipelineTx[] = [
        { key: 'neft', narration: 'NEFT-N123456789012-ANITA DESAI-advance', amountPaise: 1_500_000, type: 'debit', date: new Date('2026-10-05'), mode: 'NEFT' },
        { key: 'upi', narration: 'UPI-PRIYA SHARMA-9876543210@ybl-HDFC0001234-412345678901-UPI', amountPaise: 1_500_000, type: 'debit', date: new Date('2026-10-05'), mode: 'UPI' },
        { key: 'imps', narration: 'IMPS-412345678901-VIKRAM SINGH RATHORE-ICIC0001234-XXXXXXXX4321', amountPaise: 1_500_000, type: 'debit', date: new Date('2026-10-05'), mode: 'IMPS' },
        { key: 'vpa', narration: 'UPI-MOHAN LAL GUPTA-mohan.gupta@okaxis-SBIN0001234-412345678901-Payment', amountPaise: 1_500_000, type: 'debit', date: new Date('2026-10-05'), mode: 'UPI' },
      ]
      let captured: { items: AiItem[]; shots: FewShot[] } | null = null
      await classifyTransactions(pool, userId, txs, { ai: async (items, shots) => { captured = { items, shots }; return [] }, learn: false })
      expect(captured !== null).toBe(true)
      expect(captured!.items.length).toBe(4) // large P2P debits are unsure → they do reach the AI batch
      const prompt = buildClassificationPrompt(captured!.items, captured!.shots).toUpperCase()
      for (const name of ['ANITA', 'DESAI', 'PRIYA', 'SHARMA', 'VIKRAM', 'SINGH', 'RATHORE', 'MOHAN', 'GUPTA', ' LAL']) {
        expect(prompt.includes(name)).toBe(false)
      }
      expect(prompt).toContain('ADVANCE') // the note (the useful signal) survives
    })

    it('keeps business names in hyphenated mandate narrations', () => {
      expect(maskForPrompt('ACH D- TP ACH ICICIPRULIFE-123456781')).toContain('ICICIPRULIFE')
      expect(maskForPrompt('UPI-ZOMATO LTD-zomato-order@paytm-412345678901-UPI')).toContain('ZOMATO LTD')
    })

    it('the insight narration prompt never contains a payee who is a person; AI text gets the name back locally', async () => {
      const txs: AnalysisTx[] = [
        tx('s', '2026-09-05', 500, 'FOOD', 'Swiggy', { subcategory: 'Delivery' }),
        tx('r', '2026-10-03', 25_000, 'RENT', 'Ramesh Kumar', { subcategory: 'Rent' }),
        tx('h', '2026-10-10', 3_000, 'HEALTH', 'Anita Desai', { subcategory: 'Doctor' }),
      ]
      const a = analyseMonth({ month: '2026-10', asOf: '2026-10-31', txs, budgets: new Map(), profile: DEFAULT_PROFILE })
      const facts = buildFacts(a, DEFAULT_PROFILE)
      const fact = facts.find((f) => f.key === 'new_merchants')!
      expect(fact.template.body).toContain('Ramesh Kumar') // the stored, user-facing template keeps the name
      const prompt = buildNarrationPrompt(facts, DEFAULT_PROFILE, '2026-10')
      for (const name of ['Ramesh', 'RAMESH', 'Kumar', 'Anita', 'Desai']) expect(prompt.includes(name)).toBe(false)
      expect(prompt).toContain('[PERSON A]')

      let seen = ''
      const narrator: NarrationFn = async (_system, p) => {
        seen = p
        return { insights: [{
          fact_id: 'new_merchants', insight_type: 'unusual_pattern', title: '2 new payees in October',
          body: 'Your biggest new payment was ₹25,000 to [PERSON A].', amount_paise: fact.amountPaise!, category: '',
          action_label: 'See transactions', action_url: '/dashboard?tab=analytics&view=transactions',
        }] }
      }
      const run = await narrateInsights(facts, DEFAULT_PROFILE, '2026-10', narrator)
      expect(seen.includes('Ramesh')).toBe(false)
      const ins = run.insights.find((i) => i.factKey === 'new_merchants')!
      expect(ins.generatedBy).toBe('ai')
      expect(ins.body).toBe('Your biggest new payment was ₹25,000 to Ramesh Kumar.')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  describe('Spend AI — review fixes (concurrency, votes, notes, sources, transfers, Ask month)', () => {
    let userId: string
    const others: string[] = []
    const merchant = `TESTVOTE ${crypto.randomBytes(3).toString('hex').toUpperCase()} MART`
    beforeAll(async () => { userId = await makeUser('Review Fix Tester') })
    afterAll(async () => {
      await pool.query('DELETE FROM merchant_category_map WHERE user_id IS NULL AND merchant_name = $1', [merchant])
      for (const id of others) await dropUser(id)
      await dropUser(userId)
    })

    it('concurrent summary rebuilds for one user all succeed', async () => {
      const { rebuildMonthlySummary } = await import('../../src/spend/spendOrchestrator')
      for (const [i, c] of ['FOOD', 'SHOPPING', 'TRAVEL', 'BILLS'].entries()) {
        await insertClassified(userId, { narration: `TEST ${c}`, amountPaise: 10_000 * (i + 1), type: 'debit', date: `2026-0${i + 6}-05`, category: c, group: 'expense', merchant: c })
      }
      const results = await Promise.allSettled(Array.from({ length: 8 }, () => rebuildMonthlySummary(pool, userId)))
      expect(results.filter((r) => r.status === 'rejected').length).toBe(0)
      const rows = await pool.query('SELECT COUNT(*)::int AS n FROM monthly_spend_summary WHERE user_id = $1', [userId])
      expect(rows.rows[0].n).toBe(4)
    })

    it('re-correcting to a non-promotable category withdraws the vote and demotes the crowd row', async () => {
      for (let i = 0; i < PROMOTION_THRESHOLD; i++) others.push(await makeUser(`Voter ${i}`))
      for (const id of others) await recordVoteAndMaybePromote(pool, id, merchant, 'SHOPPING', 'Online', 'expense')
      const promoted = await pool.query(`SELECT category, agreement_count FROM merchant_category_map WHERE user_id IS NULL AND merchant_name = $1`, [merchant])
      expect(promoted.rows[0].category).toBe('SHOPPING')
      // One of them changes their mind to a never-promoted category
      await recordVoteAndMaybePromote(pool, others[0], merchant, 'OTHER_EXPENSE', 'Other', 'expense')
      const votes = await pool.query('SELECT COUNT(*)::int AS n FROM merchant_category_votes WHERE merchant_name = $1', [merchant])
      expect(votes.rows[0].n).toBe(PROMOTION_THRESHOLD - 1)
      const after = await pool.query(`SELECT 1 FROM merchant_category_map WHERE user_id IS NULL AND merchant_name = $1`, [merchant])
      expect(after.rows.length).toBe(0) // consensus fell below the threshold → crowd row removed
    })

    it('a correction can remove a saved note (null), and leaves it alone when notes are omitted', async () => {
      const id = await insertClassified(userId, { narration: 'UPI/DR/412300000077/SOME SHOP/YESB/x@ybl', amountPaise: 50_000, type: 'debit', date: '2026-10-07', category: 'OTHER_EXPENSE', group: 'expense', merchant: 'Some Shop' })
      await applyCorrection(pool, userId, id, { category: 'SHOPPING', notes: 'gift for mum' })
      await applyCorrection(pool, userId, id, { category: 'SHOPPING' })
      expect((await pool.query('SELECT user_notes FROM classified_transactions WHERE id = $1', [id])).rows[0].user_notes).toBe('gift for mum')
      await applyCorrection(pool, userId, id, { category: 'SHOPPING', notes: null })
      expect((await pool.query('SELECT user_notes FROM classified_transactions WHERE id = $1', [id])).rows[0].user_notes).toBeNull()
    })

    it('shared merchant-list matches are rules (not "learned from you") with a capped confidence', async () => {
      const run = await classifyTransactions(pool, userId, [
        { key: 'u', narration: 'UPI/DR/412300000099/UBER/YESB/uber@ybl/Ride', amountPaise: 32_000, type: 'debit', date: new Date('2026-10-16') },
      ], { ai: null, learn: false })
      const r = run.results.get('u')!
      expect(r.layer).toBe('global_map')
      expect(r.classifiedBy).toBe('rule_engine')
      expect(r.confidence).toBeLessThan(100)
    })

    it('IMPS transfers get an IMPS subcategory and a plain-language review reason; ICICI Pru mandates are insurance', async () => {
      const run = await classifyTransactions(pool, userId, [
        { key: 'i', narration: 'IMPS/P2A/412312341234/PRIYA/ICIC/50100987654321', amountPaise: 2_500_000, type: 'debit', date: new Date('2026-10-02') },
        { key: 'p', narration: 'ACH D- TP ACH ICICIPRULIFE-123456781', amountPaise: 425_000, type: 'debit', date: new Date('2026-10-02') },
      ], { ai: null, learn: false })
      const i = run.results.get('i')!
      expect(i.category).toBe('TRANSFERS')
      expect(i.subcategory).toBe('IMPS')
      expect((i.reviewReason ?? '').includes('mentions')).toBe(false)
      const p = run.results.get('p')!
      expect(p.category).toBe('INSURANCE')
      expect(p.merchantName).toBe('ICICI Prudential Life')
    })

    it('transfers to people are money out: not unspent income and not savings', () => {
      const txs: AnalysisTx[] = [
        tx('sal', '2026-10-01', 100_000, 'SALARY', 'Acme'),
        tx('food', '2026-10-05', 30_000, 'FOOD', 'Swiggy'),
        tx('p2p', '2026-10-06', 50_000, 'TRANSFERS', 'Priya Sharma', { subcategory: 'IMPS' }),
        tx('self', '2026-10-07', 10_000, 'TRANSFERS', 'Own account', { subcategory: 'Self' }),
      ]
      const a = analyseMonth({ month: '2026-10', asOf: '2026-10-31', txs, budgets: new Map(), profile: DEFAULT_PROFILE })
      expect(a.totals.transfersOutPaise).toBe(5_000_000) // self-transfers stay the user's money
      expect(a.savings.savingsRatePct).toBe(20)          // (1,00,000 − 30,000 − 50,000) / 1,00,000
      expect(a.breakdown.unspentPaise).toBe(2_000_000)
      expect(a.breakdown.transfersOutPaise).toBe(5_000_000)
    })

    it('Ask answers the month the question names (or the viewed month), never another month', async () => {
      const { mentionedMonth } = await import('../../src/spend/spendAsk')
      expect(mentionedMonth('How much did I spend in September?', '2026-10')).toBe('2026-09')
      expect(mentionedMonth('food last month', '2026-10')).toBe('2026-09')
      expect(mentionedMonth('May I see my food spend?', '2026-10')).toBeNull()
      expect(mentionedMonth('travel in Dec', '2026-10')).toBe('2025-12')
      const down = async () => { throw new ClaudeUnavailableError('x') }
      // This user has data for June–October 2026; May has none
      const may = await askAboutSpending(pool, userId, 'How much did I spend in May 2026?', down, '2026-10-31')
      expect(may.answerable).toBe(false)
      expect(may.month).toBe('2026-05')
      const viewed = await askAboutSpending(pool, userId, 'What did I spend the most on?', down, '2026-10-31', '2026-07')
      expect(viewed.month).toBe('2026-07')
      expect(viewed.answer).toContain('July 2026')
    })
  })
}
