// Clean raw bank narrations into readable merchant names.
// Indian bank narrations are notoriously messy:
//   "UPI/DR/412345678901/SWIGGY/YESB/swiggy@ybl/Order"     → "Swiggy"
//   "NACH/ACH DR/BAJAJ FINANCE LTD/EMI/0001234"            → "Bajaj Finance"
//   "POS 412345XXXXXX1234 AMAZON.IN 23456 DT 011224"       → "Amazon"
//   "NEFT-HDFCN52022110512345-ACME TECHNOLOGIES PVT LTD-SALARY NOV" → "Acme Technologies"
// The result is used as the merchant-memory key (stored upper-cased), so it must be stable
// for the same counterparty across transactions.

// Rails, directions and filler words that never name a counterparty
const NOISE_TOKENS = new Set([
  'UPI', 'UPIOUT', 'UPIIN', 'UPI DR', 'UPI CR', 'NEFT', 'IMPS', 'RTGS', 'NACH', 'ACH', 'ACH DR', 'ACH CR',
  'ECS', 'POS', 'INB', 'BIL', 'BBPS', 'MMT', 'CLG', 'DR', 'CR', 'P2A', 'P2M', 'P2P', 'TO', 'BY', 'FROM',
  'TRF', 'TRANSFER', 'FUND TRANSFER', 'PAYMENT', 'PAY', 'PAID', 'DEBIT', 'CREDIT', 'SENT', 'RECEIVED',
  'ONLINE', 'MOB', 'MOBILE', 'NET BANKING', 'NETBANKING', 'IB', 'MB', 'REF', 'REFNO', 'TXN', 'NA',
  'OK', 'COLLECT', 'REQUEST', 'INTENT', 'DT', 'SI', 'MANDATE', 'BRN', 'IN', 'INR',
  'ECOM', 'PUR', 'ECOM PUR', 'ONL', 'BPAY', 'INB', 'NWD', 'ATW', 'WDL', 'POS PUR', 'VPS', 'IPS',
  'TP', 'ACH D', 'TP ACH', // 'TP' marks a third-party mandate in ACH narrations ("ACH D- TP ACH ICICIPRULIFE-…")
])

// Short bank codes that appear as routing segments in UPI/IMPS narrations
const BANK_CODES = new Set([
  'HDFC', 'HDFC BANK', 'HDFCBANK', 'ICIC', 'ICICI', 'ICICI BANK', 'SBIN', 'SBI', 'UTIB', 'AXIS', 'AXIS BANK',
  'KKBK', 'KOTAK', 'YESB', 'YES BANK', 'PUNB', 'PNB', 'BARB', 'BOB', 'CNRB', 'CANARA', 'UBIN', 'IDIB',
  'IDFB', 'IDFC', 'INDB', 'FDRL', 'FEDERAL', 'PYTM', 'PAYTM', 'AIRP', 'JIOP', 'IPOS', 'CITI', 'SCBL', 'HSBC',
  'AUBL', 'RATN', 'DBSS', 'BKID', 'MAHB', 'IOBA', 'UCBA', 'CBIN', 'PSIB', 'KARB', 'KVBL', 'SIBL', 'TMBL',
])

// Brand fragments that should collapse to one canonical merchant wherever they appear
const KNOWN_EXPANSIONS: Record<string, string> = {
  'SWIGGY': 'Swiggy', 'SWIGGYINSTAMART': 'Swiggy', 'INSTAMART': 'Swiggy',
  'ZOMATO': 'Zomato', 'AMZN': 'Amazon', 'AMAZON': 'Amazon', 'FLIPKART': 'Flipkart',
  'BBDL': 'BigBasket', 'BIGBASKET': 'BigBasket', 'BLINKIT': 'Blinkit', 'ZEPTO': 'Zepto',
  'IRCTC': 'IRCTC', 'NETFLIX': 'Netflix', 'NFLX': 'Netflix', 'SPOTIFY': 'Spotify', 'SPOTIF': 'Spotify',
  'HOTSTAR': 'Hotstar', 'UBER': 'Uber', 'OLA': 'Ola', 'OLACABS': 'Ola', 'RAPIDO': 'Rapido', 'ZERODHA': 'Zerodha', 'GROWW': 'Groww',
  'KUVERA': 'Kuvera', 'MYNTRA': 'Myntra', 'NYKAA': 'Nykaa', 'BOOKMYSHOW': 'BookMyShow',
  'PHARMEASY': 'PharmEasy', 'MAKEMYTRIP': 'MakeMyTrip',
  'ICICIPRULIFE': 'ICICI Prudential Life', 'ICICIPRU': 'ICICI Prudential Life', 'IPRU': 'ICICI Prudential Life',
  'HDFCLIFE': 'HDFC Life', 'SBILIFE': 'SBI Life', 'MAXLIFE': 'Max Life',
}
const BRAND_PHRASES: Array<[RegExp, string]> = [
  [/\bAMAZON\s*PRIME\b/, 'Amazon Prime'],
  [/\bGOOGLE\s*ONE\b/, 'Google One'],
  [/\bYOUTUBE\s*PREMIUM\b/, 'YouTube Premium'],
  [/\bTATA\s*PLAY\b/, 'Tata Play'],
]

const CORPORATE_SUFFIX = /\b(PVT|PRIVATE|LTD|LIMITED|LLP|INDIA|IND|CO|INC|CORP|CORPORATION|TECHNOLOGIES PVT)\b\.?/g

function isNoiseSegment(seg: string): boolean {
  if (!seg) return true
  if (NOISE_TOKENS.has(seg) || BANK_CODES.has(seg)) return true
  if (seg.includes('@')) return true                                   // VPA / email
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(seg)) return true                  // IFSC
  if (/^[A-Z]{4}[A-Z0-9]?\d{8,}$/.test(seg)) return true               // NEFT UTR like HDFCN52022110512345
  const digits = (seg.match(/\d/g) ?? []).length
  if (digits >= 4 && digits >= seg.replace(/\s/g, '').length / 2) return true  // refs, card masks, dates
  if (/^X+\d+$/.test(seg)) return true
  if (seg.replace(/[^A-Z]/g, '').length < 3) return true
  return false
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
}

export function normaliseMerchant(narration: string): string {
  const upper = (narration ?? '').toUpperCase()

  for (const [re, name] of BRAND_PHRASES) if (re.test(upper)) return name
  if (/\b(ATM|ATW|NWD|CASH WDL|CASH WITHDRAWAL)\b/.test(upper)) return 'ATM Cash'

  // Segment on the separators banks use, then on runs of whitespace around numbers
  const segments = upper
    .replace(/\.(COM|IN|CO\.IN|NET|ORG)\b/g, ' ')
    .split(/[\/|*:\\]+|\s-\s|-(?=[A-Z0-9])|(?<=[A-Z0-9])-/)
    .map((s) => s.replace(/[^A-Z0-9@&.\s]/g, ' ').replace(/\s+/g, ' ').trim())

  // Brand fragments win wherever they appear (except inside a VPA, which can be anyone's handle)
  for (const seg of segments) {
    if (seg.includes('@')) continue
    for (const word of seg.split(/[\s.]+/)) {
      if (KNOWN_EXPANSIONS[word]) return KNOWN_EXPANSIONS[word]
    }
  }

  for (const seg of segments) {
    if (isNoiseSegment(seg)) continue
    // Inside the segment, drop noise words, numbers and card masks (POS narrations are one long segment)
    const words = seg.split(' ').filter((w) =>
      w.length > 0 && !NOISE_TOKENS.has(w) && !BANK_CODES.has(w) && !/\d{3,}/.test(w) && !/^X{2,}/.test(w) && !w.includes('@'),
    )
    let name = words.join(' ').replace(CORPORATE_SUFFIX, ' ').replace(/\s+/g, ' ').trim()
    if (name.replace(/[^A-Z]/g, '').length < 3) continue
    name = name.split(' ').slice(0, 4).join(' ')
    return titleCase(name)
  }

  return 'Unknown'
}

/** Payment rail inferred from the narration, used when the AA feed has no explicit mode. */
export function inferMode(narration: string): string | null {
  const u = (narration ?? '').toUpperCase()
  if (/\b(ATM|ATW|NWD|CASH WDL)\b/.test(u)) return 'ATM'
  if (/\b(NACH|ACH|ECS)\b/.test(u)) return 'NACH'
  if (/\bUPI/.test(u)) return 'UPI'
  if (/\bIMPS\b/.test(u)) return 'IMPS'
  if (/\bNEFT\b/.test(u)) return 'NEFT'
  if (/\bRTGS\b/.test(u)) return 'RTGS'
  if (/\bPOS\b|\bECOM\b/.test(u)) return 'POS'
  if (/\bBBPS\b|\bBIL\b/.test(u)) return 'BBPS'
  if (/\bCHQ\b|\bCLG\b|CHEQUE/.test(u)) return 'CHEQUE'
  return null
}
