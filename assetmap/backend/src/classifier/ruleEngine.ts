import { Pool }         from 'pg'
import { CATEGORIES, CATEGORY_BY_ID, CategoryGroup } from './categoryConfig'
import { normaliseMerchant, inferMode } from './merchantNormaliser'

export interface RuleResult {
  category:      string
  subcategory:   string
  categoryGroup: CategoryGroup
  confidence:    number
  method:        'merchant_map'|'keyword'|'narration_pattern'|'amount_pattern'
  reason:        string
}

/** A category can only describe money moving in its own direction (transfers go either way). */
export function isDirectionCompatible(group: string, txType: 'debit'|'credit'): boolean {
  if (group === 'transfer' || group === 'ignore') return true
  if (group === 'expense') return txType === 'debit'
  if (group === 'revenue') return txType === 'credit'
  return false
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Word-bounded so 'rd' doesn't fire on "ORDER", 'lic' on "PUBLIC" or 'emi' on "PREMIUM"
const keywordRegexCache = new Map<string, RegExp>()
function wordRe(keyword: string): RegExp {
  let re = keywordRegexCache.get(keyword)
  if (!re) {
    re = new RegExp(`(^|[^A-Z0-9])${escapeRe(keyword.toUpperCase())}([^A-Z0-9]|$)`)
    keywordRegexCache.set(keyword, re)
  }
  return re
}

function result(
  category: string, subcategory: string, confidence: number,
  method: RuleResult['method'], reason: string,
): RuleResult {
  const cat = CATEGORY_BY_ID.get(category)
  return {
    category, subcategory, confidence, method, reason,
    categoryGroup: (cat?.group ?? 'expense') as CategoryGroup,
  }
}

const PERSON_BUSINESS_TOKENS = /\b(PVT|LTD|LIMITED|PRIVATE|STORE|STORES|MART|ENTERPRISES?|TRADERS?|SERVICES?|RESTAURANT|CAFE|HOSPITAL|PHARMA|PHARMACY|MEDICALS?|BANK|FINANCE|FINSERV|TECHNOLOGIES|SOLUTIONS|AGENCY|AGENCIES|CORP|INC|LLP|INDUSTRIES|HOTEL|FOODS?|MOTORS|PETROLEUM|FUELS?|SUPERMARKET|CENTRE|CENTER|CLINIC|INSURANCE|SECURITIES|CAPITAL|VENTURES|SHOP|BAZAAR|EMPORIUM|COLLECTION|ELECTRICALS?|ELECTRONICS|TELECOM|TRAVELS?|TOURS)\b/

/**
 * Heuristic: does this cleaned merchant look like an individual's name (P2P counterparty)?
 * Used to keep personal names out of the global merchant map and to mask them in AI prompts.
 */
export function looksLikePersonName(merchant: string): boolean {
  const m = (merchant ?? '').toUpperCase().trim()
  if (!m || m === 'UNKNOWN' || m === 'ATM CASH') return false
  if (PERSON_BUSINESS_TOKENS.test(m)) return false
  const words = m.split(/\s+/)
  if (words.length < 2 || words.length > 4) return false
  if (words.some((w) => NON_NAME_WORDS.has(w) || BRAND_WORDS.has(w))) return false
  return words.every((w) => /^[A-Z]{2,}$/.test(w) || /^[A-Z]$/.test(w))
}

// Single-word brand keywords (≥ 5 letters) mark a business; a few keywords that are also
// common Indian given names / surnames are excluded so those people still count as people.
const NAME_LIKE_KEYWORDS = new Set([
  'ALLEN', 'AAKASH', 'VIJAYA', 'VIJAY', 'MAHINDRA', 'RELIANCE', 'TOAST', 'NATURALS', 'BRILLIANT', 'RESONANCE',
  'MUTHOOT', 'MANIPAL', 'KOTAK', 'BAJAJ', 'BIRLA', 'ADITYA', 'MOTILAL', 'OSWAL', 'SHARMA', 'GUPTA',
])
const BRAND_WORDS: Set<string> = (() => {
  const s = new Set<string>([
    'MARKETPLACE', 'PIZZA', 'CLUB', 'ASSN', 'ASSOCIATION', 'OWNERS', 'APARTMENT', 'APARTMENTS', 'FOUNDATION',
    'TRUST', 'SCHOOL', 'COLLEGE', 'ACADEMY', 'INTERNET', 'RETAIL', 'BROKING', 'DESIGNS', 'CINEMAS', 'PATHLABS',
    'LABS', 'FIBERNET', 'BROADBAND', 'ELECTRICITY', 'POWER', 'GAS', 'WATER', 'BOARD', 'MUNICIPAL', 'CORPORATION',
    'NIGAM', 'VIDYUT', 'TELECOM', 'NETWORKS', 'MOBILITY', 'LOGISTICS', 'COMMERCE', 'DIGITAL', 'ONLINE', 'GLOBAL',
    'INDIA', 'GROUP', 'HOLDINGS', 'KITCHEN', 'BAKERY', 'SWEETS', 'DHABA', 'BHAVAN', 'KIRANA', 'GENERAL',
    'PETROL', 'DIESEL', 'PUMP', 'STATION', 'AUTOMOBILES', 'GARAGE', 'SALON', 'SPA', 'GYM', 'FITNESS', 'OPTICALS',
    'JEWELLERS', 'JEWELLERY', 'TEXTILES', 'FASHION', 'FOOTWEAR', 'FURNITURE', 'HARDWARE', 'BOOKS', 'STATIONERY',
  ])
  for (const c of CATEGORIES) {
    for (const k of c.keywords) {
      for (const w of k.toUpperCase().split(/\s+/)) {
        if (w.length >= 5 && /^[A-Z]+$/.test(w) && !NAME_LIKE_KEYWORDS.has(w)) s.add(w)
      }
    }
  }
  return s
})()

// Words that appear in payment notes / merchant names but are never part of a person's name
const NON_NAME_WORDS: Set<string> = (() => {
  const s = new Set<string>([
    'JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','SEPT','OCT','NOV','DEC',
    'JANUARY','FEBRUARY','MARCH','APRIL','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
    'PAYMENT','PAY','BILL','BILLS','FEE','FEES','ORDER','TRANSFER','FUND','FUNDS','GIFT','ADVANCE','DEPOSIT',
    'MONTHLY','SHARE','SPLIT','DINNER','LUNCH','TRIP','MAID','COOK','DRIVER','TUITION','CHARGES','PURCHASE',
    'UPI','NEFT','IMPS','RTGS','NACH','POS','ATM','DR','CR','TO','FROM','BY','FOR','THE','AND','OF','NO',
    'REFUND','CASHBACK','INTEREST','SALARY','BONUS','ONLINE','RECHARGE','TOPUP','PREMIUM','POLICY',
    'ECOM','PUR','CONTRIBUTION','PRAN','MANDATE','AUTOPAY','EMI','QTR','ENDED','WDL',
    // Rail / routing words: hyphen-separated narrations ("ACH D- TP ACH …") put them in their own segment
    'ACH','ECS','TP','P2A','P2M','P2P','BIL','BBPS','MMT','INB','CMS','REF','TXN','INR','IFSC','ACCT','NUM','VPA',
  ])
  // Narration hints only: brand keywords include real surnames/first names (e.g. "Lal", "Allen")
  for (const c of CATEGORIES) {
    for (const k of c.narrationHints) {
      for (const w of k.toUpperCase().split(/\s+/)) if (w.length >= 3) s.add(w)
    }
  }
  return s
})()

/** Transfer subcategory from the payment rail the narration names (an IMPS payment is not 'UPI'). */
function transferSub(narration: string): string {
  const mode = inferMode(narration)
  if (mode === 'UPI' || mode === 'IMPS' || mode === 'NEFT' || mode === 'RTGS') return mode
  return /WALLET/i.test(narration) ? 'Wallet' : 'Other'
}

// Insurer names as they appear in mandate narrations, often run together (ICICIPRULIFE, SBILIFE, HDFCLIFE)
const INSURER_RE = /\b(LIC|INSURANCE|LIFE|HEALTH|PRU|IPRU|ICICIPRU|PRULIFE|ERGO|LOMBARD|BUPA|PREMIUM|ASSURANCE|ALLIANZ|AEGON|AVIVA|TATAAIA|NIVA|[A-Z]{2,}LIFE|[A-Z]{2,}HEALTH)\b/

function isUpiP2P(upper: string, merchant: string): boolean {
  return /\bUPI/.test(upper) && (/@/.test(upper) || /\bP2P\b|\bP2A\b/.test(upper)) && looksLikePersonName(merchant)
}

/**
 * Deterministic rule engine (no I/O). Hard, high-precision patterns first, then the
 * longest word-bounded keyword across all categories, then weak narration hints.
 * Returns null when nothing matches; confidences below 70 are treated as "unsure".
 */
export function classifyByRulesPure(
  narration: string,
  amount:    number,          // paise
  txType:    'debit'|'credit',
  transactionDate: Date,
  merchantIn?: string,
): RuleResult | null {
  const upper    = (narration ?? '').toUpperCase()
  const merchant = merchantIn ?? normaliseMerchant(narration)
  const has      = (re: RegExp) => re.test(upper)

  // ── Hard rules ──────────────────────────────────────────────
  if (has(/\b(SELF|OWN A\/?C|OWN ACCOUNT|SWEEP (IN|OUT)|TO SELF|SELF TRANSFER)\b/)) {
    return result('TRANSFERS', 'Self', 90, 'narration_pattern', 'Transfer between your own accounts')
  }

  if (txType === 'credit') {
    if (has(/\b(SALARY|SAL CR|SAL\/|SAL FOR|PAYROLL|WAGES|STIPEND)\b|\bSAL\b/)) {
      return result('SALARY', 'Primary', 95, 'narration_pattern', 'Salary credit')
    }
    if (has(/\b(REFUND|CASHBACK|REVERSAL|RVSL|REV)\b/)) {
      return result('REFUNDS', 'E-commerce', 90, 'narration_pattern', 'Refund or reversal credit')
    }
    if (has(/\b(DIVIDEND|DIV)\b/)) {
      return result('INVESTMENT_RETURN', 'Dividend', 90, 'narration_pattern', 'Dividend credit')
    }
    if (has(/\b(INT\.?\s?PD|INT\.?\s?CR|INTEREST|SB INT|INT\.COLL|FD MATURITY|RD MATURITY)\b/)) {
      return result('INVESTMENT_RETURN', 'Interest', 90, 'narration_pattern', 'Interest credit')
    }
  }

  if (txType === 'debit') {
    if (has(/\b(ATM|ATW|NWD|CASH WDL|CASH WITHDRAWAL)\b/)) {
      return result('ATM', 'ATM', 95, 'narration_pattern', 'ATM / cash withdrawal')
    }
    if (has(/\b(CREDIT CARD|CC PAYMENT|CC BILL|CCBILL|CARD BILL|CRED CLUB|CREDCLUB)\b/)) {
      return result('TRANSFERS', 'Credit card bill', 85, 'narration_pattern', 'Credit card bill payment (a transfer, not new spending)')
    }
    // Mandates: decide by counterparty
    if (has(/\b(NACH|ACH|ECS|SI DEBIT|STANDING INSTRUCTION|E-MANDATE|EMANDATE)\b/)) {
      if (has(/\b(SIP|MUTUAL|MF|BSE STAR|BSESTAR|CAMS|KFIN|KFINTECH|NIPPON|MIRAE|PPFAS|NPS)\b/)) {
        return result('INVESTMENTS', 'Mutual funds', 92, 'narration_pattern', 'Mandate to an investment platform (SIP)')
      }
      if (has(INSURER_RE)) {
        const sub = /LIFE|\bLIC\b|PRU/.test(upper) ? 'Life' : /HEALTH|BUPA|ERGO|NIVA/.test(upper) ? 'Health' : 'Premium'
        return result('INSURANCE', sub, 88, 'narration_pattern', 'Mandate to an insurer')
      }
      if (has(/\b(EMI|LOAN|LN|FINANCE|FINSERV|FINCORP|CAPITAL|HOUSING|HL|PL|CL|AUTO LOAN|VEHICLE)\b/)) {
        return result('EMI', 'Loan EMI', 90, 'narration_pattern', 'Mandate to a lender (EMI)')
      }
      if (amount >= 500000) {
        return result('EMI', 'Loan EMI', 60, 'narration_pattern', 'Large mandate debit — probably an EMI')
      }
      return result('SUBSCRIPTIONS', 'Software', 50, 'narration_pattern', 'Small mandate debit — possibly a subscription or premium')
    }
  }

  // ── Keywords: longest word-bounded match wins ───────────────
  let best: { cat: typeof CATEGORIES[number]; keyword: string } | null = null
  for (const cat of CATEGORIES) {
    if (!isDirectionCompatible(cat.group, txType)) continue
    for (const keyword of cat.keywords) {
      if (best && keyword.length <= best.keyword.length) continue
      if (wordRe(keyword).test(upper)) best = { cat, keyword }
    }
  }
  if (best) {
    const short = best.keyword.replace(/\s/g, '').length <= 3
    return result(
      best.cat.id, best.cat.subcategories[0] ?? '', short ? 72 : 80, 'keyword',
      `Keyword "${best.keyword}" in narration`,
    )
  }

  if (txType === 'debit' && has(/\b(CHRG|CHARGES|CHGS|GST ON|SMS ALERT|AMC|PENAL|MIN BAL)\b/)) {
    return result('BANK_CHARGES', 'Charges', 85, 'narration_pattern', 'Bank charge or fee')
  }

  // ── Person-to-person ────────────────────────────────────────
  if (/\b(UPI|IMPS|NEFT|RTGS)/.test(upper) && (isUpiP2P(upper, merchant) || looksLikePersonName(merchant))) {
    if (txType === 'debit' && amount >= 500000) {
      return result('TRANSFERS', transferSub(narration), 60, 'narration_pattern',
        'Large payment to an individual — could be rent, a loan repayment or a transfer')
    }
    return result('TRANSFERS', transferSub(narration), 70, 'narration_pattern',
      txType === 'debit' ? 'Payment to an individual' : 'Money received from an individual')
  }

  // ── Weak hints ──────────────────────────────────────────────
  for (const cat of CATEGORIES) {
    if (!isDirectionCompatible(cat.group, txType)) continue
    for (const hint of cat.narrationHints) {
      if (wordRe(hint).test(upper)) {
        // Plain-language reason: it is shown to the user in the review queue
        if (cat.id === 'TRANSFERS') {
          const sub = transferSub(narration)
          return result(cat.id, sub, 62, 'narration_pattern',
            `Bank transfer${sub === 'Other' ? '' : ` (${sub})`} — we couldn't tell who it was to or what it was for`)
        }
        return result(cat.id, cat.subcategories[0] ?? '', 62, 'narration_pattern', `Only a weak clue in the description ("${hint}")`)
      }
    }
  }

  // Large credit at month start/end → maybe salary (unsure)
  if (txType === 'credit' && amount >= 2000000) {
    const day = transactionDate.getDate()
    if (day <= 10 || day >= 25) {
      return result('SALARY', 'Primary', 55, 'amount_pattern',
        'Large credit near the start/end of the month — possibly salary')
    }
  }

  return null
}

/**
 * Back-compatible entry point: merchant map (user row first, then global) → pure rules.
 */
export async function classifyByRules(
  pool:             Pool,
  userId:           string,
  narration:        string,
  amount:           number,
  txType:           'debit'|'credit',
  transactionDate:  Date
): Promise<RuleResult | null> {
  const merchant = normaliseMerchant(narration)
  const merchantResult = await pool.query(`
    SELECT category, subcategory, category_group, confidence
    FROM merchant_category_map
    WHERE UPPER(merchant_name) = $1
    AND (user_id = $2 OR user_id IS NULL)
    ORDER BY CASE WHEN user_id = $2 THEN 1 ELSE 2 END, confidence DESC
    LIMIT 1
  `, [merchant.toUpperCase(), userId])

  const r = merchantResult.rows[0]
  if (r && isDirectionCompatible(r.category_group, txType)) {
    return {
      category: r.category, subcategory: r.subcategory ?? '', categoryGroup: r.category_group,
      confidence: r.confidence, method: 'merchant_map', reason: `Known merchant: ${merchant}`,
    }
  }
  return classifyByRulesPure(narration, amount, txType, transactionDate, merchant)
}
