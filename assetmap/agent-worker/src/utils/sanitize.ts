// ─────────────────────────────────────────────
// Input sanitisers for data coming from external
// APIs and from the LLM. A single NaN, over-long
// string or unparseable date aborts the whole
// injection transaction, so everything bound for
// Postgres goes through these.
// ─────────────────────────────────────────────

/** Coerce a number or numeric string ("1,234.50") to a finite number, else undefined. */
export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,₹\s]/g, '')
    if (cleaned === '') return undefined
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

/** Rupees (number or numeric string) → integer paise. Missing/invalid → 0. */
export function toPaise(rupees: unknown): number {
  const n = toNumber(rupees)
  return n === undefined ? 0 : Math.round(n * 100)
}

/** Integer suitable for a BIGINT/INTEGER column; invalid → fallback. */
export function toInt(value: unknown, fallback = 0): number {
  const n = toNumber(value)
  return n === undefined ? fallback : Math.round(n)
}

/** Clamp to [min, max]; returns undefined for non-numeric input. */
export function clamp(value: unknown, min: number, max: number): number | undefined {
  const n = toNumber(value)
  if (n === undefined) return undefined
  return Math.min(max, Math.max(min, n))
}

/** Truncate a string to fit a VARCHAR(n) column. Non-strings are stringified. */
export function truncate(value: unknown, max: number): string | undefined {
  if (value === null || value === undefined) return undefined
  const s = String(value)
  if (s === '') return undefined
  return s.length > max ? s.slice(0, max) : s
}

/**
 * Normalise a date to YYYY-MM-DD for a DATE column.
 * Accepts ISO strings, Date objects, and the Indian DD-MM-YYYY /
 * DD/MM/YYYY formats (which Postgres would otherwise misread as
 * MM-DD or reject). Returns undefined for anything unparseable.
 */
export function toIsoDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10)
  }

  const s = String(value).trim()

  const dmy = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s)
  if (dmy) {
    const [, d, m, y] = dmy
    return buildDate(Number(y), Number(m), Number(d))
  }

  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (ymd) {
    const [, y, m, d] = ymd
    return buildDate(Number(y), Number(m), Number(d))
  }

  const parsed = new Date(s)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10)
}

function buildDate(y: number, m: number, d: number): string | undefined {
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCMonth() !== m - 1) return undefined // e.g. 31-02-2020
  return date.toISOString().slice(0, 10)
}

/** Whole months between a date and now, or null if the date is unusable. */
export function monthsSince(value: unknown): number | null {
  const iso = toIsoDate(value)
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30))
}
