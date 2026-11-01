import { looksLikePersonName } from './ruleEngine'

// ═══════════════════════════════════════════════════════════════
// PII masking for anything that leaves our systems in an AI prompt (DPDP data minimisation).
// Removes VPAs, emails, phone numbers, account / card / reference numbers, IFSC codes and,
// where detectable, individuals' names. Business names are kept: they are the main
// classification signal. User identity (name, mobile, email, ids) is never put in a prompt.
// ═══════════════════════════════════════════════════════════════

// Local parts exclude '-': most Indian bank narrations use bare hyphens as separators
// ("UPI-PRIYA SHARMA-9876543210@ybl-…"), so a '-' in the local part would swallow the
// neighbouring name segment and leave half of the name behind.
const EMAIL_RE   = /[A-Z0-9._%+]+@[A-Z0-9\-]+(\.[A-Z0-9\-]+)+/gi
const VPA_RE     = /[A-Z0-9._]{2,}@[A-Z][A-Z0-9]{1,}/gi
const PHONE_RE   = /(\+?91[\s\-]?)?\b[6-9]\d{4}[\s\-]?\d{5}\b/g
const IFSC_RE    = /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi
const CARD_RE    = /\b[0-9X*]{4,}[\s\-]?[0-9X*]{2,}[\s\-]?[0-9X*]{2,}[\s\-]?\d{2,4}\b/gi
const MASKED_ACC = /\b(X{2,}|\*{2,})\d{2,6}\b/gi
const LONG_NUM   = /\d{5,}/g
const HONORIFIC  = /\b(MR|MRS|MS|MISS|SHRI|SMT|KUMARI)\.?\s+[A-Z]+(\s+[A-Z]+){0,2}/gi
// Segment separators used by banks: '/', '|', and hyphens — spaced (" - ") or bare ("NEFT-…-NAME-note")
const SEGMENT_SPLIT = /(\s*[\/|]\s*|\s*-\s*)/

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Replace every word of the given personal names (case-insensitive, word-bounded) with [PERSON].
 * Used with the merchant the normaliser extracted, so a detected individual can never survive
 * in the narration however the bank formatted it.
 */
export function maskPersonNames(text: string, names: Array<string | null | undefined>): string {
  const tokens = new Set<string>()
  for (const n of names) {
    if (!n || !looksLikePersonName(n)) continue
    for (const w of n.toUpperCase().split(/\s+/)) if (/^[A-Z]{2,}$/.test(w)) tokens.add(w)
  }
  if (tokens.size === 0) return text
  // Longest first so "RAMESHWAR" is not split by "RAMESH"
  const alt = Array.from(tokens).sort((a, b) => b.length - a.length).map(escapeRe).join('|')
  const re = new RegExp(`(^|[^A-Za-z0-9])(?:${alt})(?=[^A-Za-z0-9]|$)`, 'gi')
  return text
    .replace(re, (_m, pre) => `${pre}[PERSON]`)
    .replace(/\[PERSON\](\s+\[PERSON\])+/g, '[PERSON]')
}

/**
 * Mask one free-text field (narration, merchant, note) for an AI prompt.
 * `personNames` are names already detected for this row (e.g. the cleaned merchant); every
 * word of them is masked wherever it appears.
 */
export function maskForPrompt(text: string | null | undefined, personNames: Array<string | null | undefined> = []): string {
  if (!text) return ''
  let s = String(text)
    .replace(EMAIL_RE, '[EMAIL]')
    .replace(VPA_RE, '[VPA]')
    .replace(PHONE_RE, '[PHONE]')
    .replace(IFSC_RE, '[IFSC]')
    .replace(MASKED_ACC, '[ACCT]')
    .replace(CARD_RE, (m) => (/\d/.test(m) ? '[NUM]' : m))
    .replace(LONG_NUM, '[NUM]')
    .replace(HONORIFIC, '[PERSON]')

  // Slash / pipe / hyphen separated narrations: mask segments that look like an individual's name
  s = s
    .split(SEGMENT_SPLIT)
    .map((seg) => (looksLikePersonName(seg.trim()) ? seg.replace(seg.trim(), '[PERSON]') : seg))
    .join('')
  s = maskPersonNames(s, personNames)
  return s.slice(0, 240)
}

/** Mask a cleaned merchant name: individuals become [PERSON], businesses are kept. */
export function maskMerchant(merchant: string | null | undefined): string {
  if (!merchant) return ''
  if (looksLikePersonName(merchant)) return '[PERSON]'
  return maskForPrompt(merchant)
}

/** Coarse amount band — the exact amount is not needed to classify. */
export function amountBand(amountPaise: number): string {
  const r = Math.abs(amountPaise) / 100
  if (r < 500) return 'under ₹500'
  if (r < 2000) return '₹500–2k'
  if (r < 10000) return '₹2k–10k'
  if (r < 50000) return '₹10k–50k'
  if (r < 200000) return '₹50k–2L'
  return 'over ₹2L'
}
