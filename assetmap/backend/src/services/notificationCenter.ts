import crypto from 'crypto'
import net from 'net'
import { Pool } from 'pg'
import { logger } from '../utils/logger'
import { AUDIT_ACTIONS } from '../utils/constants'
import { familyVault } from '../family/familyVault'
import { CATEGORY_BY_ID } from '../classifier/categoryConfig'

// ═══════════════════════════════════════════════════════════════
// Notification Center
// One in-app feed built from every place that has something to tell
// the user: stored alerts, live "needs action" conditions, and recent
// security/account activity. Not plan-gated — in-app notifications are
// part of every plan (email/SMS/push delivery is what plans gate).
//
// Every source is isolated: a missing table, a slow query or a thrown
// error in one source never breaks the feed. Failed sources are reported
// in `degraded` so the UI can say the list may be incomplete.
// ═══════════════════════════════════════════════════════════════

export type NotificationKind = 'alert' | 'action' | 'activity'
export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success'

export interface NotificationItem {
  id:          string
  kind:        NotificationKind
  severity:    NotificationSeverity
  title:       string
  body:        string
  createdAt:   string
  read:        boolean
  actionLabel: string | null
  actionUrl:   string | null
  source:      string
  dismissible: boolean
  count?:      number
  /** A standing condition with no event date (e.g. no will yet): createdAt is when it was last checked. */
  ongoing?:    boolean
}

export interface NotificationFeed {
  items:       NotificationItem[]
  unreadCount: number
  counts:      { all: number; action: number; alert: number; activity: number }
  degraded:    string[]
  generatedAt: string
}

/** What a source returns before read/dismiss state is applied. */
export interface RawNotification {
  id:          string
  kind:        NotificationKind
  severity:    NotificationSeverity
  title:       string
  body:        string
  createdAt:   Date
  actionLabel?: string | null
  actionUrl?:   string | null
  source:      string
  /** Read flag owned by the source row itself (user_alerts.is_read, spend_insights.is_read). */
  ownRead?:    boolean
  /** Read state to assume when the user has never touched the item. */
  defaultRead?: boolean
  /** A stored alert type this live item replaces (the live item is the up-to-date version). */
  supersedesAlertType?: string
  /** Stored alerts of a "condition" type: only the newest one per type is kept. */
  alertType?:  string
  /** Activity entries with the same key close together collapse into one. */
  collapseKey?: string
  /** Standing condition without a real event time; createdAt is the evaluation time. */
  ongoing?:    boolean
}

export interface SourceContext {
  pool:   Pool
  userId: string
  now:    Date
}

export interface NotificationSource {
  name: string
  load: (ctx: SourceContext) => Promise<RawNotification[]>
}

export class NotificationError extends Error {
  constructor(message: string, public statusCode: 400 | 404 | 503 = 400, public code = 'NOTIFICATION_ERROR') {
    super(message)
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000
const SOURCE_TIMEOUT_MS = 4000
const MAX_ITEMS = 60
const MAX_NON_ACTIVITY = 45
const COLLAPSE_WINDOW_MS = 60 * 60 * 1000
const SAME_EVENT_MS = 5000
const MAX_COLLAPSE_SPAN_MS = 6 * 60 * 60 * 1000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const NOTIFICATION_ID_RE = /^(alert|insight|recovery|action|activity):[A-Za-z0-9:_.-]{1,180}$/

/** Short, stable fingerprint of a live condition; changes when the condition changes. */
export function fingerprint(parts: Array<string | number | null | undefined>): string {
  return crypto.createHash('sha1').update(parts.map(p => String(p ?? '')).join('|')).digest('hex').slice(0, 12)
}

/** Only in-app paths are ever sent to the client as action targets. */
export function safeInAppPath(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const u = url.trim()
  if (!u.startsWith('/') || u.startsWith('//') || u.includes('\\') || u.length > 200) return null
  if (/[\s<>"']/.test(u) || /^\/[a-z]+:/i.test(u)) return null
  return u
}

/** Expands an IPv6 address (including `::` and a dotted IPv4 tail) to its 8 hextets. */
function expandIPv6(v: string): string[] | null {
  if (!net.isIPv6(v)) return null
  let s = v.toLowerCase()
  const v4Tail = s.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4Tail) {
    const [a, b, c, d] = v4Tail.slice(1).map(Number)
    s = `${s.slice(0, v4Tail.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = s.split('::')
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length > 1 && halves[1] ? halves[1].split(':') : []
  const groups = halves.length > 1
    ? [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail]
    : head
  return groups.length === 8 ? groups.map(g => (parseInt(g, 16) || 0).toString(16)) : null
}

/** IPv4 → a.b.c.x (/24); IPv6 → first three groups (/48). Never the full address. */
export function maskIp(ip: unknown): string | null {
  if (typeof ip !== 'string' || !ip.trim()) return null
  let v = ip.trim().replace(/\/\d+$/, '').replace(/%.*$/, '')
  if (/^::ffff:\d{1,3}(\.\d{1,3}){3}$/i.test(v)) v = v.slice(7)
  const v4 = v.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/)
  if (v4) return `${v4[1]}.${v4[2]}.${v4[3]}.x`
  const groups = expandIPv6(v)
  return groups ? `${groups.slice(0, 3).join(':')}::/48` : null
}

export function describeDevice(ua: unknown): string | null {
  if (typeof ua !== 'string' || !ua) return null
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : null
  const os = /Windows/.test(ua) ? 'Windows'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : null
  if (browser && os) return `${browser} on ${os}`
  return browser ?? os
}

function formatINR(paise: number | string | null | undefined): string {
  const rupees = Math.round(Number(paise ?? 0) / 100)
  return `₹${rupees.toLocaleString('en-IN')}`
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

function listNames(names: string[], max = 2): string {
  const unique = [...new Set(names.filter(Boolean))]
  if (unique.length <= max) return unique.join(' and ')
  return `${unique.slice(0, max).join(', ')} and ${unique.length - max} more`
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

/** A whole table is absent (feature migration not applied) — the source has nothing to say. */
function isMissingRelation(err: unknown): boolean {
  return (err as { code?: string })?.code === '42P01' // undefined_table
}

/** A column is absent — schema drift; the source is broken, not empty, so it is reported as degraded. */
function isMissingColumn(err: unknown): boolean {
  return (err as { code?: string })?.code === '42703' // undefined_column
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout
  return Promise.race([
    p,
    new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms) }),
  ]).finally(() => clearTimeout(timer))
}

const SEVERITY_RANK: Record<NotificationSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 }

const FI_LABELS: Record<string, string> = {
  DEPOSIT: 'bank accounts', EQUITY: 'stocks', MUTUAL_FUND: 'mutual funds',
  INSURANCE_POLICIES: 'insurance', NPS: 'NPS', GSTN: 'GST records', LAND_RECORDS: 'land records',
}

// ─────────────────────────────────────────────
// Stored alerts (user_alerts)
// ─────────────────────────────────────────────

const ALERT_ACTIONS: Record<string, { label: string; url: string }> = {
  balance_drop:          { label: 'View balances',     url: '/dashboard?tab=overview' },
  balance_rise:          { label: 'View balances',     url: '/dashboard?tab=overview' },
  new_account_linked:    { label: 'Review accounts',   url: '/dashboard?tab=discovery' },
  account_unlinked:      { label: 'Review accounts',   url: '/dashboard?tab=discovery' },
  land_ownership_change: { label: 'View property',     url: '/dashboard?tab=land' },
  dormant_account_found: { label: 'View account',      url: '/dashboard?tab=overview' },
  nominee_missing:       { label: 'Add nominees',      url: '/nominee' },
  large_transaction:     { label: 'View spending',     url: '/dashboard?tab=analytics' },
  aadhaar_new_link:      { label: 'Review accounts',   url: '/dashboard?tab=discovery' },
  consent_expiring:      { label: 'Review consent',    url: '/settings#privacy' },
}

/** Alert types that describe a standing condition; older copies are noise. */
const CONDITION_ALERT_TYPES = new Set(['nominee_missing', 'consent_expiring', 'dormant_account_found'])

const alertsSource: NotificationSource = {
  name: 'alerts',
  async load({ pool, userId }) {
    const r = await pool.query(`
      SELECT id, alert_type, severity, title, body, metadata, is_read, created_at
        FROM user_alerts
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '90 days'
       ORDER BY created_at DESC
       LIMIT 50
    `, [userId])
    return r.rows.map((row): RawNotification => {
      const action = ALERT_ACTIONS[row.alert_type]
      const metaUrl = safeInAppPath(row.metadata?.actionUrl)
      const severity: NotificationSeverity = ['critical', 'warning', 'info'].includes(row.severity) ? row.severity : 'info'
      return {
        id: `alert:${row.id}`,
        kind: 'alert',
        severity,
        title: row.title,
        body: row.body,
        createdAt: new Date(row.created_at),
        actionLabel: action?.label ?? (metaUrl ? 'Open' : null),
        actionUrl: metaUrl ?? action?.url ?? null,
        source: 'alerts',
        ownRead: !!row.is_read,
        alertType: row.alert_type,
      }
    })
  },
}

// ─────────────────────────────────────────────
// Live "needs action" items
// ─────────────────────────────────────────────

/** Setu consents are requested for 12 months (consentDuration in accountAggregator.ts). */
const CONSENT_MONTHS = 12
const CONSENT_WARN_DAYS = 14

function fiSummary(fiTypes: unknown): string {
  const list = Array.isArray(fiTypes) ? fiTypes
    : typeof fiTypes === 'string' ? fiTypes.replace(/[{}]/g, '').split(',').filter(Boolean) : []
  const labels = list.map(t => FI_LABELS[String(t)] ?? null).filter(Boolean) as string[]
  return labels.length ? listNames(labels, 3) : 'your accounts'
}

const consentSource: NotificationSource = {
  name: 'consents',
  async load({ pool, userId, now }) {
    const r = await pool.query(`
      SELECT id, status::text AS status, fi_types, created_at, revoked_at,
             created_at + make_interval(months => $2::int) AS expires_at
        FROM consents
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 25
    `, [userId, CONSENT_MONTHS])
    const items: RawNotification[] = []
    const nowMs = now.getTime()
    const live = r.rows.filter(c => c.status === 'ACTIVE' && new Date(c.expires_at).getTime() > nowMs)

    for (const c of live) {
      const expires = new Date(c.expires_at)
      const daysLeft = Math.ceil((expires.getTime() - nowMs) / DAY_MS)
      if (daysLeft > CONSENT_WARN_DAYS) continue
      items.push({
        id: `action:consent-expiring:${fingerprint([c.id, expires.toISOString()])}`,
        kind: 'action',
        severity: daysLeft <= 3 ? 'critical' : 'warning',
        title: daysLeft <= 1 ? 'Account linking expires today' : `Account linking expires in ${daysLeft} days`,
        body: `Your consent to share ${fiSummary(c.fi_types)} ends on ${formatDate(expires)}. Renew it to keep balances and new accounts updating.`,
        createdAt: new Date(Math.min(nowMs, expires.getTime() - CONSENT_WARN_DAYS * DAY_MS)),
        actionLabel: 'Renew consent',
        actionUrl: '/consent',
        source: 'consents',
        supersedesAlertType: 'consent_expiring',
      })
    }

    if (live.length === 0) {
      const last = r.rows.find(c => c.status !== 'PENDING')
      if (last) {
        const lapsed = last.status === 'ACTIVE' || last.status === 'EXPIRED'
        const endedAt = last.status === 'REVOKED'
          ? new Date(last.revoked_at ?? last.created_at)
          : new Date(Math.min(nowMs, new Date(last.expires_at).getTime()))
        items.push({
          id: `action:consent-off:${fingerprint([last.id, lapsed ? 'EXPIRED' : last.status])}`,
          kind: 'action',
          severity: lapsed ? 'warning' : 'info',
          title: 'Account linking is off',
          body: lapsed
            ? `Your Account Aggregator consent expired on ${formatDate(endedAt)}, so balances and new accounts aren't updating.`
            : `You revoked your Account Aggregator consent on ${formatDate(endedAt)}, so balances and new accounts aren't updating.`,
          createdAt: endedAt,
          actionLabel: 'Link accounts',
          actionUrl: '/consent',
          source: 'consents',
          supersedesAlertType: 'consent_expiring',
        })
      }
    }

    // A consent request the user started but never approved (and nothing newer is active)
    const newestActive = live[0] ? new Date(live[0].created_at).getTime() : 0
    const pending = r.rows.find(c => c.status === 'PENDING'
      && new Date(c.created_at).getTime() > newestActive
      && nowMs - new Date(c.created_at).getTime() > 10 * 60 * 1000
      && nowMs - new Date(c.created_at).getTime() < 7 * DAY_MS)
    if (pending) {
      items.push({
        id: `action:consent-pending:${fingerprint([pending.id])}`,
        kind: 'action',
        severity: 'info',
        title: 'Finish linking your accounts',
        body: `Your request to share ${fiSummary(pending.fi_types)} is waiting for approval in your Account Aggregator app.`,
        createdAt: new Date(pending.created_at),
        actionLabel: 'Continue',
        actionUrl: '/consent',
        source: 'consents',
      })
    }
    return items
  },
}

const NOMINEE_CLASSES = ['BANK_ACCOUNT', 'FIXED_DEPOSIT', 'MUTUAL_FUND', 'EQUITY', 'NPS', 'INSURANCE_LIFE', 'INSURANCE_HEALTH', 'EPF', 'PPF']
/** nominee_update_tasks still moving — those accounts are being fixed, so don't nag about them. */
const TASK_IN_PROGRESS = ['pending', 'auto_submitted', 'session_opened', 'user_completed', 'form_sent']

const nomineeSource: NotificationSource = {
  name: 'nominees',
  async load({ pool, userId }) {
    const items: RawNotification[] = []

    // canonical_assets is the central asset table; older accounts only exist in nominee_status
    let missing: Array<{ id: string; institution_name: string; checked_at: Date }> = []
    let inProgress = 0
    let canonicalCount = 0
    try {
      const c = await pool.query(`SELECT COUNT(*)::int AS n FROM canonical_assets WHERE user_id = $1 AND is_active = true`, [userId])
      canonicalCount = c.rows[0].n
    } catch (err) {
      if (!isMissingRelation(err)) throw err
    }

    const taskJoin = `
      EXISTS (SELECT 1 FROM nominee_update_tasks t
               WHERE t.user_id = $1 AND t.canonical_asset_id = a.id AND t.status = ANY($2))`

    if (canonicalCount > 0) {
      const r = await pool.query(`
        SELECT a.id, a.institution_name, a.last_synced_at AS checked_at, ${taskJoin} AS in_progress
          FROM canonical_assets a
         WHERE a.user_id = $1 AND a.is_active = true
           AND (a.has_nominee = false OR a.has_nominee IS NULL)
           AND a.asset_class = ANY($3)
      `, [userId, TASK_IN_PROGRESS, NOMINEE_CLASSES])
      missing = r.rows.filter(x => !x.in_progress)
      inProgress = r.rows.length - missing.length
    } else {
      const r = await pool.query(`
        SELECT a.id, a.institution_name, a.last_checked_at AS checked_at, ${taskJoin} AS in_progress
          FROM nominee_status a
         WHERE a.user_id = $1 AND (a.has_nominee = false OR a.has_nominee IS NULL)
      `, [userId, TASK_IN_PROGRESS])
      missing = r.rows.filter(x => !x.in_progress)
      inProgress = r.rows.length - missing.length
    }

    if (missing.length > 0) {
      const ids = missing.map(m => m.id).sort()
      const latest = missing.reduce((t, m) => Math.max(t, new Date(m.checked_at).getTime()), 0)
      const n = missing.length
      items.push({
        id: `action:nominee:${fingerprint(ids)}`,
        kind: 'action',
        severity: 'warning',
        title: `${plural(n, 'account')} ${n === 1 ? 'has' : 'have'} no nominee`,
        body: `${listNames(missing.map(m => m.institution_name))}. Without a nominee, your family faces a longer claim process.`
          + (inProgress > 0 ? ` ${plural(inProgress, 'other update')} already in progress.` : ''),
        createdAt: new Date(latest || Date.now()),
        actionLabel: 'Add nominees',
        actionUrl: '/nominee',
        source: 'nominees',
        supersedesAlertType: 'nominee_missing',
      })
    }

    // Updates that are waiting on the user (an OTP step, a signed form or a branch visit)
    const t = await pool.query(`
      SELECT id, institution_name, update_method, status, updated_at
        FROM nominee_update_tasks
       WHERE user_id = $1
         AND ((update_method = 'guided_otp'    AND status IN ('pending','session_opened'))
           OR (update_method = 'form_email'    AND status = 'form_sent')
           OR (update_method = 'manual_branch' AND status = 'pending'))
    `, [userId])
    if (t.rows.length > 0) {
      const latest = t.rows.reduce((m, x) => Math.max(m, new Date(x.updated_at).getTime()), 0)
      items.push({
        id: `action:nominee-input:${fingerprint(t.rows.map(x => `${x.id}:${x.status}`).sort())}`,
        kind: 'action',
        severity: 'info',
        title: `${plural(t.rows.length, 'nominee update')} need${t.rows.length === 1 ? 's' : ''} a step from you`,
        body: `${listNames(t.rows.map(x => x.institution_name))} — complete the OTP, signed form or branch visit to finish.`,
        createdAt: new Date(latest),
        actionLabel: 'Continue',
        actionUrl: '/nominee',
        source: 'nominees',
      })
    }
    return items
  },
}

const dormantSource: NotificationSource = {
  name: 'dormant',
  async load({ pool, userId }) {
    const r = await pool.query(`
      SELECT id, institution_name, months_inactive, iepf_risk, updated_at
        FROM dormant_accounts
       WHERE user_id = $1 AND (is_acknowledged = false OR is_acknowledged IS NULL)
    `, [userId])
    if (!r.rows.length) return []
    const n = r.rows.length
    const atRisk = r.rows.some(x => x.iepf_risk)
    const maxMonths = Math.max(...r.rows.map(x => Number(x.months_inactive) || 0))
    return [{
      id: `action:dormant:${fingerprint(r.rows.map(x => x.id).sort())}`,
      kind: 'action',
      severity: atRisk ? 'critical' : 'warning',
      title: `${plural(n, 'dormant account')} found`,
      body: `${listNames(r.rows.map(x => x.institution_name))}`
        + (maxMonths > 0 ? ` — no activity for up to ${maxMonths} months.` : '.')
        + ' Reactivate before unclaimed balances move to the RBI DEA Fund.',
      createdAt: new Date(r.rows.reduce((m, x) => Math.max(m, new Date(x.updated_at).getTime()), 0)),
      actionLabel: 'Review',
      actionUrl: '/dashboard?tab=overview',
      source: 'dormant',
      supersedesAlertType: 'dormant_account_found',
    }]
  },
}

const willSource: NotificationSource = {
  name: 'will',
  async load({ pool, userId, now }) {
    const r = await pool.query(`SELECT status, updated_at FROM wills WHERE user_id = $1 ORDER BY updated_at DESC`, [userId])
    if (r.rows.some(w => w.status === 'completed' || w.status === 'signed')) return []
    const draft = r.rows.find(w => w.status === 'draft')
    if (draft) {
      return [{
        id: 'action:will:draft',
        kind: 'action',
        severity: 'info',
        title: 'Finish your will',
        body: `Your draft was last edited on ${formatDate(draft.updated_at)}. Complete it so your family knows exactly who receives what.`,
        createdAt: new Date(draft.updated_at),
        actionLabel: 'Continue will',
        actionUrl: '/dashboard?tab=will',
        source: 'will',
      }]
    }
    return [{
      id: 'action:will:none',
      kind: 'action',
      severity: 'info',
      title: "You don't have a will yet",
      body: 'Without a will, your assets are divided under succession law, which can take your family longer to claim.',
      createdAt: now,
      ongoing: true,
      actionLabel: 'Start a will',
      actionUrl: '/dashboard?tab=will',
      source: 'will',
    }]
  },
}

const familyInviteSource: NotificationSource = {
  name: 'family',
  async load({ pool, userId }) {
    const invites = await familyVault.listMyInvitations(pool, userId)
    return invites.map((inv: any): RawNotification => ({
      id: `action:family-invite:${fingerprint([inv.inviteId])}`,
      kind: 'action',
      severity: 'info',
      title: `${inv.inviterName} invited you to ${inv.vaultName}`,
      body: `Join their family vault${inv.relationship ? ` as their ${String(inv.relationship).replace(/_/g, ' ')}` : ''}. The invitation expires on ${formatDate(inv.expiresAt)}.`,
      createdAt: new Date(inv.invitedAt),
      actionLabel: 'View invitation',
      actionUrl: '/dashboard?tab=family',
      source: 'family',
    }))
  },
}

const supportSource: NotificationSource = {
  name: 'support',
  async load({ pool, userId }) {
    // A ticket needs the user when support's reply is the latest human message on it
    const r = await pool.query(`
      SELECT t.id, t.reference, t.subject, t.status, m.id AS message_id, m.body, m.created_at
        FROM support_tickets t
        JOIN LATERAL (
          SELECT id, sender, body, created_at FROM support_messages
           WHERE ticket_id = t.id AND sender IN ('user','agent')
           ORDER BY created_at DESC LIMIT 1
        ) m ON true
       WHERE t.user_id = $1 AND t.status <> 'closed'
         AND (m.sender = 'agent' OR t.status = 'awaiting_user')
       ORDER BY m.created_at DESC
       LIMIT 10
    `, [userId])
    return r.rows.map((row): RawNotification => {
      const snippet = String(row.body ?? '').replace(/\s+/g, ' ').trim()
      return {
        id: `action:support-reply:${fingerprint([row.message_id])}`,
        kind: 'action',
        severity: 'info',
        title: `Support replied on ${row.reference}`,
        body: `${row.subject}: “${snippet.length > 110 ? `${snippet.slice(0, 107)}…` : snippet}”`,
        createdAt: new Date(row.created_at),
        actionLabel: 'Open ticket',
        actionUrl: '/help#tickets-heading',
        source: 'support',
      }
    })
  },
}

const budgetSource: NotificationSource = {
  name: 'budgets',
  async load({ pool, userId, now }) {
    const r = await pool.query(`
      SELECT cb.category, cb.budget_paise, COALESCE(ms.total_paise, 0) AS spent_paise,
             DATE_TRUNC('month', CURRENT_DATE)::DATE AS month, ms.updated_at
        FROM category_budgets cb
        LEFT JOIN monthly_spend_summary ms
          ON ms.user_id = cb.user_id AND ms.category = cb.category
         AND ms.month = DATE_TRUNC('month', CURRENT_DATE)::DATE
       WHERE cb.user_id = $1 AND cb.is_active = true AND cb.budget_paise > 0
    `, [userId])
    const items: RawNotification[] = []
    for (const row of r.rows) {
      const spent = Number(row.spent_paise)
      const budget = Number(row.budget_paise)
      // Band from the raw amounts, so ₹995 of ₹1,000 is never called "over budget"
      const band = spent >= budget ? 100 : spent >= 0.8 * budget ? 80 : 0
      if (!band) continue
      const pct = Math.floor((spent / budget) * 100)
      const label = CATEGORY_BY_ID.get(row.category)?.label ?? String(row.category).replace(/_/g, ' ').toLowerCase()
      const month = new Date(row.month).toISOString().slice(0, 7)
      items.push({
        id: `action:budget:${fingerprint([row.category, month, band])}`,
        kind: 'action',
        severity: band === 100 ? 'warning' : 'info',
        title: band === 100 ? `Over budget on ${label}` : `${label} budget ${pct}% used`,
        body: `${formatINR(row.spent_paise)} spent of your ${formatINR(row.budget_paise)} ${label} budget this month (${pct}%).`,
        createdAt: row.updated_at ? new Date(row.updated_at) : now,
        actionLabel: 'View spending',
        actionUrl: '/dashboard?tab=analytics',
        source: 'budgets',
      })
    }
    return items
  },
}

// savings_opportunity is only emitted when a target is missed, so it is never a "success"
const INSIGHT_SEVERITY: Record<string, NotificationSeverity> = {
  overspend: 'warning', income_dip: 'warning', unusual_pattern: 'warning',
  large_expense: 'info', new_subscription: 'info', recurring_detected: 'info', savings_opportunity: 'info',
}

/**
 * The Spend Analyser does not read view/category query params yet, so an insight's specific
 * deep link (e.g. "See transaction") would promise a view the page can't show. Every insight
 * links to the analyser itself until it honours those params.
 */
const SPEND_ANALYSER = { label: 'Open Spend Analyser', url: '/dashboard?tab=analytics' }

const insightSource: NotificationSource = {
  name: 'insights',
  async load({ pool, userId }) {
    // Read insights stay listed (as read) like stored alerts; dismissed ones never show.
    const query = (dismissFilter: string) => pool.query(`
      SELECT id, insight_type, title, body, is_read, created_at
        FROM spend_insights
       WHERE user_id = $1 ${dismissFilter}
         AND month >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months'
       ORDER BY created_at DESC
       LIMIT 10
    `, [userId])
    let r
    try {
      r = await query('AND dismissed_at IS NULL')
    } catch (err) {
      if (!isMissingColumn(err)) throw err
      r = await query('') // 031_spend_ai.sql not applied: no dismissed_at column yet
    }
    return r.rows.map((row): RawNotification => ({
      id: `insight:${row.id}`,
      kind: 'alert',
      severity: INSIGHT_SEVERITY[row.insight_type] ?? 'info',
      title: row.title,
      body: row.body,
      createdAt: new Date(row.created_at),
      actionLabel: SPEND_ANALYSER.label,
      actionUrl: SPEND_ANALYSER.url,
      source: 'insights',
      ownRead: !!row.is_read,
    }))
  },
}

const twoFactorSource: NotificationSource = {
  name: 'two_factor',
  async load({ pool, userId, now }) {
    const r = await pool.query(`SELECT is_enabled, disabled_at FROM user_two_factor WHERE user_id = $1`, [userId])
    const row = r.rows[0]
    if (row?.is_enabled) return []
    const since = row?.disabled_at ? new Date(row.disabled_at) : null
    return [{
      id: `action:2fa-off:${since ? since.getTime() : 'never'}`,
      kind: 'action',
      severity: since ? 'warning' : 'info',
      title: since ? 'Two-factor authentication is off' : 'Turn on two-factor authentication',
      body: 'Add an authenticator app or email code at sign-in, so a stolen mobile OTP alone can’t open your account.',
      createdAt: since ?? now,
      ...(since ? {} : { ongoing: true }),
      actionLabel: 'Set up 2FA',
      actionUrl: '/settings/2fa',
      source: 'two_factor',
    }]
  },
}

const landSource: NotificationSource = {
  name: 'land',
  async load({ pool, userId, now }) {
    const r = await pool.query(`
      SELECT id, district, state, is_stale, next_sync_at, last_synced_at, title_status, mutation_status
        FROM land_records
       WHERE user_id = $1 AND is_active = true
    `, [userId])
    const items: RawNotification[] = []
    const stale = r.rows.filter(x => x.is_stale || (x.next_sync_at && new Date(x.next_sync_at) < now))
    if (stale.length > 0) {
      const oldest = stale.reduce((m, x) => Math.min(m, new Date(x.last_synced_at).getTime()), Infinity)
      const due = stale.reduce((m, x) => Math.max(m, x.next_sync_at ? new Date(x.next_sync_at).getTime() : 0), 0)
      items.push({
        id: `action:land-stale:${fingerprint([...stale.map(x => x.id).sort(), oldest])}`,
        kind: 'action',
        severity: 'info',
        title: `${plural(stale.length, 'property record')} may be out of date`,
        body: `Last checked with the land registry on ${formatDate(new Date(oldest))}. Refresh to see current ownership and mutation status.`,
        createdAt: new Date(Math.min(now.getTime(), due || now.getTime())),
        actionLabel: 'View property',
        actionUrl: '/dashboard?tab=land',
        source: 'land',
      })
    }
    const flagged = r.rows.filter(x => ['dispute', 'encumbered', 'mutation_pending'].includes(x.title_status) || x.mutation_status === 'pending')
    if (flagged.length > 0) {
      const disputes = flagged.filter(x => x.title_status === 'dispute').length
      const encumbered = flagged.filter(x => x.title_status === 'encumbered').length
      const mutation = flagged.filter(x => x.title_status === 'mutation_pending' || x.mutation_status === 'pending').length
      const parts = [
        disputes ? `${disputes} under dispute` : null,
        encumbered ? `${encumbered} encumbered` : null,
        mutation ? `${mutation} with mutation pending` : null,
      ].filter(Boolean)
      items.push({
        id: `action:land-title:${fingerprint(flagged.map(x => `${x.id}:${x.title_status}:${x.mutation_status}`).sort())}`,
        kind: 'action',
        severity: disputes ? 'warning' : 'info',
        title: `${plural(flagged.length, 'property', 'properties')} need${flagged.length === 1 ? 's' : ''} attention`,
        body: `Registry records show ${parts.join(', ')}.`,
        createdAt: new Date(flagged.reduce((m, x) => Math.max(m, new Date(x.last_synced_at).getTime()), 0)),
        actionLabel: 'View property',
        actionUrl: '/dashboard?tab=land',
        source: 'land',
      })
    }
    return items
  },
}

const recoverySource: NotificationSource = {
  name: 'recovery',
  async load({ pool, userId }) {
    // The same update goes out on several channels; show it once
    const r = await pool.query(`
      SELECT * FROM (
        SELECT DISTINCT ON (case_id, title) id, case_id, title, body, sent_at
          FROM recovery_notifications
         WHERE user_id = $1 AND sent_at > NOW() - INTERVAL '30 days' AND title IS NOT NULL
         ORDER BY case_id, title, sent_at DESC
      ) x ORDER BY sent_at DESC LIMIT 10
    `, [userId])
    return r.rows.map((row): RawNotification => ({
      id: `recovery:${row.id}`,
      kind: 'alert',
      severity: 'info',
      title: row.title,
      body: row.body ?? '',
      createdAt: new Date(row.sent_at),
      actionLabel: 'View recovery',
      actionUrl: '/unclaimed',
      source: 'recovery',
      defaultRead: false,
    }))
  },
}

// ─────────────────────────────────────────────
// Activity (audit_logs + two_factor_audit_log)
// ─────────────────────────────────────────────

interface ActivityCopy {
  title:     string
  body:      string
  severity?: NotificationSeverity
  /** Security-relevant: unread by default and shows device + masked IP. */
  security?: boolean
  label?:    string
  url?:      string
  /** Entries sharing a key close together collapse into one (defaults to the title). */
  collapseKey?: string
}

type CopyFn = (meta: Record<string, any>, entityType: string | null) => ActivityCopy | null

const SECURITY_URL = '/settings#security'

/**
 * Copy for every audit action. `null` = not shown in the feed (internal or too noisy).
 * Kept exhaustive over AUDIT_ACTIONS (a test enforces it) so new actions get a decision.
 */
export const ACTIVITY_COPY: Record<(typeof AUDIT_ACTIONS)[number], ActivityCopy | CopyFn | null> = {
  AADHAAR_INITIATED: null,
  AADHAAR_VERIFIED: { title: 'Signed in with Aadhaar', body: 'Your identity was verified with an Aadhaar OTP.', label: 'Review security', url: SECURITY_URL },
  PHONE_OTP_INITIATED: null,
  PHONE_VERIFIED: { title: 'Signed in with mobile OTP', body: 'Your mobile number was verified with a one-time code.', label: 'Review security', url: SECURITY_URL },
  LOGIN: { title: 'Signed in', body: 'A new session was started on your account.', label: 'Review security', url: SECURITY_URL },
  LOGOUT: (meta) => meta?.scope === 'all_devices'
    ? { title: 'Signed out of all devices', body: 'Every session on your account was ended.', severity: 'warning', security: true, label: 'Review security', url: SECURITY_URL }
    : { title: 'Signed out', body: 'A session on your account was ended.' },
  TOKEN_REFRESHED: null,
  CONSENT_CREATED: { title: 'Account linking requested', body: 'You started a new Account Aggregator consent request.', label: 'View consents', url: '/settings#privacy' },
  CONSENT_APPROVED: { title: 'Account linking approved', body: 'Your Account Aggregator consent is active, so we can fetch your balances securely.', severity: 'success', label: 'View consents', url: '/settings#privacy' },
  CONSENT_REVOKED: { title: 'Account linking revoked', body: 'An Account Aggregator consent was revoked. We no longer fetch data under it.', severity: 'warning', security: true, label: 'View consents', url: '/settings#privacy' },
  CONSENT_EXPIRED: { title: 'Account linking expired', body: 'An Account Aggregator consent reached its end date.', severity: 'warning', label: 'Renew consent', url: '/consent' },
  DATA_FETCHED: { title: 'Accounts synced', body: 'Balances and accounts were fetched through your Account Aggregator.', severity: 'success', collapseKey: 'data-sync' },
  DATA_REFRESHED: { title: 'Balances refreshed', body: 'Your balances were refreshed with the latest data from your banks.', severity: 'success', collapseKey: 'data-sync' },
  LAND_SEARCH: { title: 'Property records searched', body: 'Land registries were searched for records in your name.', label: 'View property', url: '/dashboard?tab=land' },
  REPORT_GENERATED: { title: 'Asset report generated', body: 'A report of your assets was created.' },
  REPORT_DOWNLOADED: (meta) => meta?.type === 'personal_data_export'
    ? { title: 'Your personal data was exported', body: 'A copy of your profile, consents, assets and activity was downloaded.', severity: 'warning', security: true, label: 'Review security', url: SECURITY_URL }
    : { title: 'Asset report downloaded', body: 'A PDF report of your assets was downloaded.' },
  ESTATE_FILED: { title: 'Estate claim filed', body: 'An estate discovery case was filed.', label: 'View case', url: '/estate' },
  ESTATE_VERIFIED: { title: 'Estate case verified', body: 'An estate discovery case was verified.', severity: 'success', label: 'View case', url: '/estate' },
  ESTATE_ASSETS_VIEWED: { title: 'Estate assets viewed', body: 'Assets in an estate case were viewed.', label: 'View case', url: '/estate' },
  AUDIT_LOG_VIEWED: null,
  USER_DATA_DELETED: { title: 'Personal data deleted', body: 'A request to erase your personal data was processed.', severity: 'warning', security: true },
  INSURANCE_GAP_ANALYSED: { title: 'Insurance gap check run', body: 'Your insurance cover was compared against your needs.', label: 'View results', url: '/dashboard?tab=insurance' },
  AFFILIATE_CLICK: null,
  LAND_DATA_FETCHED: { title: 'Property records fetched', body: 'Land records were fetched from the state registry.', severity: 'success', label: 'View property', url: '/dashboard?tab=land' },
  LAND_RECORD_VIEWED: null,
  LOAN_ELIGIBILITY_ASSESSED: { title: 'Loan eligibility checked', body: 'Your loan eligibility was assessed from your linked assets.', label: 'View results', url: '/dashboard?tab=loan' },
  UNCLAIMED_SEARCH_COMPLETED: { title: 'Unclaimed assets search finished', body: 'Public unclaimed-asset registries were searched for you.', label: 'View results', url: '/dashboard?tab=unclaimed' },
  WILL_CREATED: { title: 'Will draft saved', body: 'Your will was saved.', label: 'Open will', url: '/dashboard?tab=will' },
  WILL_PDF_GENERATED: { title: 'Will PDF created', body: 'A PDF of your will was generated.', severity: 'success', label: 'Open will', url: '/dashboard?tab=will' },
  CREATE_RECORD: (_meta, entity) => entity === 'recovery_case'
    ? { title: 'Recovery case opened', body: 'A case to recover an unclaimed asset was opened.', label: 'View recovery', url: '/unclaimed' }
    : null,
  UPDATE_RECORD: (meta, entity) => {
    if (entity === 'alert_preferences') return { title: 'Notification settings changed', body: 'Your alert preferences were updated.', label: 'Open settings', url: '/settings#notifications' }
    if (entity === 'users' && meta?.field === 'email') return { title: 'Email address changed', body: 'The email address on your account was changed.', severity: 'warning', security: true, label: 'Review security', url: SECURITY_URL }
    if (entity === 'recovery_case') return { title: 'Recovery case updated', body: 'A recovery case moved to a new stage.', label: 'View recovery', url: '/unclaimed' }
    return null
  },
  UPLOAD_DOCUMENT: (_meta, entity) => entity === 'recovery_document'
    ? { title: 'Recovery document uploaded', body: 'A document was added to a recovery case.', label: 'View recovery', url: '/unclaimed' }
    : { title: 'Document uploaded', body: 'A document was uploaded to your account.' },
  FAMILY_VAULT_CREATED: { title: 'Family vault created', body: 'You created a family vault.', severity: 'success', label: 'Open vault', url: '/dashboard?tab=family' },
  FAMILY_VAULT_CLOSED: { title: 'Family vault closed', body: 'Your family vault was closed and sharing stopped.', severity: 'warning', security: true, label: 'Open vault', url: '/dashboard?tab=family' },
  FAMILY_MEMBER_INVITED: { title: 'Family member invited', body: 'You invited someone to your family vault.', label: 'Open vault', url: '/dashboard?tab=family' },
  FAMILY_MEMBER_JOINED: { title: 'Joined a family vault', body: 'You joined a family vault.', severity: 'success', label: 'Open vault', url: '/dashboard?tab=family' },
  FAMILY_MEMBER_REMOVED: { title: 'Family member removed', body: 'A member was removed from the family vault.', label: 'Open vault', url: '/dashboard?tab=family' },
  FAMILY_MEMBER_LEFT: { title: 'Left a family vault', body: 'You left a family vault. They can no longer see what you shared.', label: 'Open vault', url: '/dashboard?tab=family' },
  FAMILY_SHARING_UPDATED: { title: 'Family sharing changed', body: 'What you share with your family vault was updated.', security: true, label: 'Open vault', url: '/dashboard?tab=family' },
  SPEND_ANALYSIS_RUN: { title: 'Spending analysis run', body: 'Your transactions were analysed for spending insights.', label: 'View spending', url: '/dashboard?tab=analytics' },
  SPEND_CATEGORY_CORRECTED: null, // the user's own edit, one per transaction — too noisy for the feed
  SPEND_PROFILE_UPDATED: { title: 'Spending profile updated', body: 'Your household spending needs were updated.', label: 'View spending', url: '/dashboard?tab=analytics' },
}

/** Audit actions present in the DB enum but not in AUDIT_ACTIONS. */
const EXTRA_ACTIVITY_COPY: Record<string, ActivityCopy | null> = {
  PHONE_OTP_VERIFIED: { title: 'Signed in with mobile OTP', body: 'Your mobile number was verified with a one-time code.', label: 'Review security', url: SECURITY_URL },
  NOMINEE_BATCH_CREATED: { title: 'Nominee update started', body: 'You started updating nominees on your accounts.', label: 'Track progress', url: '/nominee' },
}

const HIDDEN_ACTIONS = [
  ...Object.entries(ACTIVITY_COPY).filter(([, v]) => v === null).map(([k]) => k),
  ...Object.entries(EXTRA_ACTIVITY_COPY).filter(([, v]) => v === null).map(([k]) => k),
]

const TWO_FACTOR_COPY: Record<string, ActivityCopy> = {
  '2fa_enabled':        { title: 'Two-factor authentication turned on', body: 'Sign-ins now need a second code.', severity: 'success', security: true, label: 'Manage 2FA', url: '/settings/2fa' },
  '2fa_disabled':       { title: 'Two-factor authentication turned off', body: 'Sign-ins no longer need a second code.', severity: 'warning', security: true, label: 'Turn back on', url: '/settings/2fa' },
  '2fa_backup_used':    { title: 'Backup code used to sign in', body: 'One of your backup codes was used. It can’t be used again.', severity: 'warning', security: true, label: 'Manage 2FA', url: '/settings/2fa' },
  '2fa_challenge_failed': { title: 'Failed two-factor attempt', body: 'A wrong two-factor code was entered for your account.', severity: 'warning', security: true, label: 'Review security', url: SECURITY_URL },
  '2fa_locked_out':     { title: 'Two-factor locked after failed attempts', body: 'Too many wrong codes were entered, so sign-in was paused.', severity: 'critical', security: true, label: 'Review security', url: SECURITY_URL },
  '2fa_device_trusted': { title: 'Device remembered for sign-in', body: 'This device will skip two-factor for a while.', security: true, label: 'Manage 2FA', url: '/settings/2fa' },
}

const METHOD_LABEL: Record<string, string> = { totp: 'authenticator app', email: 'email code', backup: 'backup code' }

function securityContext(ua: unknown, ip: unknown): string {
  const parts = [describeDevice(ua), maskIp(ip) ? `IP ${maskIp(ip)}` : null].filter(Boolean)
  return parts.length ? ` ${parts.join(' · ')}.` : ''
}

/** Security entries stay unread for a week; routine activity is informational (read by default). */
const SECURITY_UNREAD_DAYS = 7

const activitySource: NotificationSource = {
  name: 'activity',
  async load({ pool, userId, now }) {
    const r = await pool.query(`
      SELECT id, action::text AS action, entity_type, metadata, host(ip_address) AS ip, user_agent, timestamp
        FROM audit_logs
       WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
         AND NOT (action::text = ANY($2))
       ORDER BY timestamp DESC
       LIMIT 80
    `, [userId, HIDDEN_ACTIONS])
    const items: RawNotification[] = []
    for (const row of r.rows) {
      const entry = (ACTIVITY_COPY as Record<string, ActivityCopy | CopyFn | null>)[row.action] ?? EXTRA_ACTIVITY_COPY[row.action] ?? null
      const copy = typeof entry === 'function' ? entry(row.metadata ?? {}, row.entity_type) : entry
      if (!copy) continue
      const at = new Date(row.timestamp)
      items.push({
        id: `activity:${row.id}`,
        kind: 'activity',
        severity: copy.severity ?? 'info',
        title: copy.title,
        body: copy.security ? `${copy.body}${securityContext(row.user_agent, row.ip)}` : copy.body,
        createdAt: at,
        actionLabel: copy.url ? (copy.label ?? 'Open') : null,
        actionUrl: copy.url ?? null,
        source: 'activity',
        defaultRead: !(copy.security && now.getTime() - at.getTime() < SECURITY_UNREAD_DAYS * DAY_MS),
        collapseKey: copy.collapseKey ?? copy.title,
      })
    }
    return items
  },
}

const twoFactorActivitySource: NotificationSource = {
  name: 'two_factor_activity',
  async load({ pool, userId, now }) {
    const r = await pool.query(`
      SELECT id, event, method, ip_address, user_agent, metadata, created_at
        FROM two_factor_audit_log
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days' AND event = ANY($2)
       ORDER BY created_at DESC
       LIMIT 30
    `, [userId, Object.keys(TWO_FACTOR_COPY)])
    return r.rows.map((row): RawNotification => {
      const copy = TWO_FACTOR_COPY[row.event]
      const at = new Date(row.created_at)
      const method = row.method && METHOD_LABEL[row.method] ? ` Method: ${METHOD_LABEL[row.method]}.` : ''
      return {
        id: `activity:2fa:${row.id}`,
        kind: 'activity',
        severity: copy.severity ?? 'info',
        title: copy.title,
        body: `${copy.body}${row.event === '2fa_enabled' ? method : ''}${securityContext(row.user_agent, row.ip_address ?? row.metadata?.ip)}`,
        createdAt: at,
        actionLabel: copy.label ?? null,
        actionUrl: copy.url ?? null,
        source: 'activity',
        defaultRead: now.getTime() - at.getTime() >= SECURITY_UNREAD_DAYS * DAY_MS,
        collapseKey: copy.title,
      }
    })
  },
}

export const NOTIFICATION_SOURCES: NotificationSource[] = [
  alertsSource, insightSource, recoverySource,
  consentSource, nomineeSource, dormantSource, willSource, familyInviteSource,
  supportSource, budgetSource, twoFactorSource, landSource,
  activitySource, twoFactorActivitySource,
]

// ─────────────────────────────────────────────
// Feed assembly
// ─────────────────────────────────────────────

interface StateRow { item_key: string; read_at: Date | null; dismissed_at: Date | null; snoozed_until: Date | null }

async function loadState(pool: Pool, userId: string, keys: string[]): Promise<Map<string, StateRow>> {
  if (!keys.length) return new Map()
  try {
    const r = await pool.query(
      `SELECT item_key, read_at, dismissed_at, snoozed_until FROM notification_state WHERE user_id = $1 AND item_key = ANY($2)`,
      [userId, keys]
    )
    return new Map(r.rows.map((row: StateRow) => [row.item_key, row]))
  } catch (err) {
    if (isMissingRelation(err)) return new Map()
    throw err
  }
}

async function runSources(ctx: SourceContext, sources: NotificationSource[]) {
  const degraded: string[] = []
  const results = await Promise.all(sources.map(async (s) => {
    try {
      return await withTimeout(s.load(ctx), SOURCE_TIMEOUT_MS, s.name)
    } catch (err) {
      if (isMissingRelation(err)) {
        logger.debug(`[Notifications] source ${s.name} skipped: table not available`)
        return []
      }
      degraded.push(s.name)
      logger.warn('[Notifications] source failed', { source: s.name, error: (err as Error).message })
      return []
    }
  }))
  return { raw: results.flat(), degraded }
}

/** Dedupe, supersede stale condition alerts, collapse repeated activity. Pure — exported for tests. */
export function mergeRaw(raw: RawNotification[]): RawNotification[] {
  const seen = new Set<string>()
  let items = raw.filter(i => {
    if (!i || !i.id || seen.has(i.id)) return false
    seen.add(i.id)
    return true
  })

  // A live item is the current truth; stored alerts about the same condition are dropped
  const superseded = new Set(items.map(i => i.supersedesAlertType).filter(Boolean) as string[])
  const newestCondition = new Map<string, number>()
  for (const i of items) {
    if (i.alertType && CONDITION_ALERT_TYPES.has(i.alertType)) {
      newestCondition.set(i.alertType, Math.max(newestCondition.get(i.alertType) ?? 0, i.createdAt.getTime()))
    }
  }
  items = items.filter(i => {
    if (!i.alertType) return true
    if (superseded.has(i.alertType)) return false
    if (CONDITION_ALERT_TYPES.has(i.alertType)) return newestCondition.get(i.alertType) === i.createdAt.getTime()
    return true
  })

  items.sort(compareRaw)

  // Collapse repeats of the same activity (e.g. several refreshes in an hour) into the newest entry.
  // Entries a few seconds apart are one event logged twice (a refresh writes FETCHED + REFRESHED).
  const out: Array<RawNotification & { count?: number }> = []
  const groups = new Map<string, { item: RawNotification & { count?: number }; newest: number; oldest: number }>()
  for (const i of items) {
    if (i.kind === 'activity' && i.collapseKey) {
      const t = i.createdAt.getTime()
      const g = groups.get(i.collapseKey)
      if (g && g.oldest - t <= COLLAPSE_WINDOW_MS && g.newest - t <= MAX_COLLAPSE_SPAN_MS) {
        if (g.oldest - t > SAME_EVENT_MS) g.item.count = (g.item.count ?? 1) + 1
        g.oldest = t
        continue
      }
      const copy = { ...i }
      out.push(copy)
      groups.set(i.collapseKey, { item: copy, newest: t, oldest: t })
      continue
    }
    out.push({ ...i })
  }
  return out
}

function compareRaw(a: RawNotification, b: RawNotification) {
  const t = b.createdAt.getTime() - a.createdAt.getTime()
  if (t !== 0) return t
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
}

export interface BuildOptions {
  sources?: NotificationSource[]
  now?:     Date
}

export async function buildFeed(pool: Pool, userId: string, opts: BuildOptions = {}): Promise<NotificationFeed> {
  const now = opts.now ?? new Date()
  const ctx: SourceContext = { pool, userId, now }
  const { raw, degraded } = await runSources(ctx, opts.sources ?? NOTIFICATION_SOURCES)
  const merged = mergeRaw(raw)

  let state = new Map<string, StateRow>()
  try {
    state = await loadState(pool, userId, merged.map(i => i.id))
  } catch (err) {
    degraded.push('state')
    logger.warn('[Notifications] state load failed', { error: (err as Error).message })
  }

  const visible: NotificationItem[] = []
  for (const i of merged as Array<RawNotification & { count?: number }>) {
    const s = state.get(i.id)
    if (s?.dismissed_at) continue
    if (s?.snoozed_until && new Date(s.snoozed_until) > now) continue
    const read = i.ownRead !== undefined ? (i.ownRead || !!s?.read_at) : (s?.read_at ? true : (i.defaultRead ?? false))
    const count = i.count && i.count > 1 ? i.count : undefined
    visible.push({
      id: i.id,
      kind: i.kind,
      severity: i.severity,
      title: i.title,
      body: i.body,
      createdAt: i.createdAt.toISOString(),
      read,
      actionLabel: safeInAppPath(i.actionUrl) ? (i.actionLabel ?? 'Open') : null,
      actionUrl: safeInAppPath(i.actionUrl),
      source: i.source,
      dismissible: i.kind !== 'activity',
      ...(count ? { count } : {}),
      ...(i.ongoing ? { ongoing: true } : {}),
    })
  }

  // Keep every live item; trim the oldest stored alerts and activity first
  const nonActivity = visible.filter(i => i.kind !== 'activity')
  const keepNon = new Set([
    ...nonActivity.filter(i => i.kind === 'action').map(i => i.id),
    ...nonActivity.filter(i => i.kind !== 'action').slice(0, Math.max(0, MAX_NON_ACTIVITY - nonActivity.filter(i => i.kind === 'action').length)).map(i => i.id),
  ])
  const activityRoom = Math.max(0, MAX_ITEMS - keepNon.size)
  const keepActivity = new Set(visible.filter(i => i.kind === 'activity').slice(0, activityRoom).map(i => i.id))
  const items = visible.filter(i => keepNon.has(i.id) || keepActivity.has(i.id))

  return {
    items,
    unreadCount: items.filter(i => !i.read).length,
    counts: {
      all: items.length,
      action: items.filter(i => i.kind === 'action').length,
      alert: items.filter(i => i.kind === 'alert').length,
      activity: items.filter(i => i.kind === 'activity').length,
    },
    degraded: [...new Set(degraded)],
    generatedAt: now.toISOString(),
  }
}

// ─────────────────────────────────────────────
// Read / dismiss / snooze
// ─────────────────────────────────────────────

function parseId(id: string): { prefix: string; rest: string } {
  if (typeof id !== 'string' || !NOTIFICATION_ID_RE.test(id)) {
    throw new NotificationError('That notification could not be found.', 404, 'NOTIFICATION_NOT_FOUND')
  }
  const idx = id.indexOf(':')
  return { prefix: id.slice(0, idx), rest: id.slice(idx + 1) }
}

async function upsertState(pool: Pool, userId: string, keys: string[], set: 'read' | 'dismiss' | 'snooze', snoozeHours = 0) {
  if (!keys.length) return
  const assignments = {
    read:    `read_at = COALESCE(notification_state.read_at, NOW())`,
    dismiss: `dismissed_at = NOW(), read_at = COALESCE(notification_state.read_at, NOW())`,
    snooze:  `snoozed_until = EXCLUDED.snoozed_until, read_at = COALESCE(notification_state.read_at, NOW())`,
  }[set]
  try {
    await pool.query(`
      INSERT INTO notification_state (user_id, item_key, read_at, dismissed_at, snoozed_until)
      SELECT $1, k, NOW(),
             CASE WHEN $3 = 'dismiss' THEN NOW() END,
             CASE WHEN $3 = 'snooze' THEN NOW() + make_interval(hours => $4::int) END
        FROM unnest($2::text[]) AS k
      ON CONFLICT (user_id, item_key) DO UPDATE SET ${assignments}, updated_at = NOW()
    `, [userId, keys, set, snoozeHours])
  } catch (err) {
    if (isMissingRelation(err)) {
      throw new NotificationError('Notification preferences are temporarily unavailable.', 503, 'NOTIFICATION_STATE_UNAVAILABLE')
    }
    throw err
  }
}

/** Marks the source row itself read when the item has one; returns true if it did. */
async function markOwnRead(pool: Pool, userId: string, prefix: string, rest: string): Promise<boolean> {
  if (prefix === 'alert') {
    if (!UUID_RE.test(rest)) throw new NotificationError('That notification could not be found.', 404, 'NOTIFICATION_NOT_FOUND')
    const r = await pool.query(
      `UPDATE user_alerts SET is_read = true, read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2 RETURNING id`,
      [rest, userId]
    )
    if (!r.rowCount) throw new NotificationError('That notification could not be found.', 404, 'NOTIFICATION_NOT_FOUND')
    return true
  }
  if (prefix === 'insight') {
    if (!UUID_RE.test(rest)) throw new NotificationError('That notification could not be found.', 404, 'NOTIFICATION_NOT_FOUND')
    const r = await pool.query(`UPDATE spend_insights SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id`, [rest, userId])
    if (!r.rowCount) throw new NotificationError('That notification could not be found.', 404, 'NOTIFICATION_NOT_FOUND')
    return true
  }
  return false
}

/**
 * State rows are only written for items the user's sources currently produce, so a client
 * can't fill notification_state with arbitrary well-formed ids.
 */
async function assertCurrentItem(pool: Pool, userId: string, id: string): Promise<void> {
  const { raw } = await runSources({ pool, userId, now: new Date() }, NOTIFICATION_SOURCES)
  if (!raw.some(i => i.id === id)) {
    throw new NotificationError('That notification could not be found.', 404, 'NOTIFICATION_NOT_FOUND')
  }
}

/**
 * Dismiss an insight on its own row, so the bell and the Spend Analyser share one dismissed
 * state (un-dismissing in the analyser brings it back here too). Returns false when the
 * column doesn't exist yet (031 not applied) and notification_state has to hold it instead.
 */
async function dismissInsightRow(pool: Pool, userId: string, insightId: string): Promise<boolean> {
  try {
    await pool.query(
      `UPDATE spend_insights SET dismissed_at = COALESCE(dismissed_at, NOW()) WHERE id = $1 AND user_id = $2`,
      [insightId, userId]
    )
    return true
  } catch (err) {
    if (isMissingColumn(err)) return false
    throw err
  }
}

export const notificationCenter = {
  buildFeed,

  async markRead(pool: Pool, userId: string, id: string): Promise<void> {
    const { prefix, rest } = parseId(id)
    if (await markOwnRead(pool, userId, prefix, rest)) return
    await assertCurrentItem(pool, userId, id)
    await upsertState(pool, userId, [id], 'read')
  },

  async markAllRead(pool: Pool, userId: string): Promise<NotificationFeed> {
    const feed = await buildFeed(pool, userId)
    await pool.query(`UPDATE user_alerts SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`, [userId])
    const insightIds = feed.items.filter(i => !i.read && i.id.startsWith('insight:')).map(i => i.id.slice('insight:'.length))
    if (insightIds.length) {
      await pool.query(`UPDATE spend_insights SET is_read = true WHERE user_id = $1 AND id = ANY($2::uuid[])`, [userId, insightIds])
    }
    const stateKeys = feed.items.filter(i => !i.read && !i.id.startsWith('alert:') && !i.id.startsWith('insight:')).map(i => i.id)
    await upsertState(pool, userId, stateKeys, 'read')
    const items = feed.items.map(i => ({ ...i, read: true }))
    return { ...feed, items, unreadCount: 0 }
  },

  async dismiss(pool: Pool, userId: string, id: string): Promise<void> {
    const { prefix, rest } = parseId(id)
    if (prefix === 'activity') {
      throw new NotificationError('Activity entries stay in your history and can’t be dismissed.', 400, 'NOTIFICATION_NOT_DISMISSIBLE')
    }
    if (!(await markOwnRead(pool, userId, prefix, rest))) await assertCurrentItem(pool, userId, id)
    if (prefix === 'insight' && await dismissInsightRow(pool, userId, rest)) return
    await upsertState(pool, userId, [id], 'dismiss')
  },

  async snooze(pool: Pool, userId: string, id: string, hours: number): Promise<void> {
    const { prefix, rest } = parseId(id)
    if (prefix === 'activity') {
      throw new NotificationError('Activity entries can’t be snoozed.', 400, 'NOTIFICATION_NOT_DISMISSIBLE')
    }
    if (!Number.isInteger(hours) || hours < 1 || hours > 24 * 30) {
      throw new NotificationError('Snooze for between 1 hour and 30 days.', 400, 'VALIDATION_ERROR')
    }
    if (!(await markOwnRead(pool, userId, prefix, rest))) await assertCurrentItem(pool, userId, id)
    await upsertState(pool, userId, [id], 'snooze', hours)
  },
}
