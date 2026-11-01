import { Pool } from 'pg'
import crypto from 'crypto'
import { kvStore } from '../db/connection'
import { decryptPII, encryptPII, hashEmail } from '../utils/encryption'
import { planEnforcer } from '../plans/planEnforcer'
import { alertService } from './alertService'
import { logger } from '../utils/logger'

// ─────────────────────────────────────────────────────
// Account Settings — the data behind /settings.
// Every preference here is read by something real:
//   sms / push / email          → assetChangeWorker channels (push also gates all FCM sends)
//   balanceDrop/newAccount/land → which alerts assetChangeWorker raises
//   marketing                   → recorded opt-in consent (off by default)
// ─────────────────────────────────────────────────────

export class SettingsError extends Error {
  constructor(message: string, public statusCode: 400 | 402 | 404 | 409 | 429 = 400, public code = 'SETTINGS_ERROR') {
    super(message)
  }
}

/** API field → alert_preferences column. Only these can ever reach SQL. */
const NOTIFICATION_COLUMNS = {
  email:       'email_enabled',
  sms:         'sms_enabled',
  push:        'push_enabled',
  marketing:   'marketing_opt_in',
  balanceDrop: 'alert_balance_drop',
  newAccount:  'alert_new_account',
  landChange:  'alert_land_change',
} as const
export type NotificationKey = keyof typeof NOTIFICATION_COLUMNS
export type NotificationPrefs = Record<NotificationKey, boolean>

const PLAN_NAMES: Record<string, string> = { free: 'Free', plus: 'Plus', pro: 'Pro', b2b: 'Business' }

const EMAIL_OTP_TTL_S   = 10 * 60
const EMAIL_OTP_MAX_TRY = 5
const emailOtpKey = (userId: string) => `settings:email-otp:${userId}`
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function safeDecrypt(v: string | null | undefined): string | null {
  if (!v) return null
  try { return decryptPII(v) } catch { return null }
}

export function maskMobile(mobile: string | null): string | null {
  if (!mobile) return null
  const digits = mobile.replace(/[^0-9]/g, '')
  if (digits.length < 4) return null
  const cc = mobile.startsWith('+') && digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : ''
  return `${cc}••••••${digits.slice(-4)}`
}

export function maskEmail(email: string | null): string | null {
  if (!email) return null
  const [user, domain] = email.split('@')
  if (!user || !domain) return null
  const visible = user.length <= 2 ? user[0] : user.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(2, Math.min(6, user.length - visible.length)))}@${domain}`
}

const hashOtp = (otp: string) => crypto.createHash('sha256').update(`settings-email:${otp}`).digest('hex')

export const accountSettings = {

  async getPreferences(pool: Pool, userId: string): Promise<NotificationPrefs> {
    await pool.query('INSERT INTO alert_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId])
    const r = await pool.query(
      `SELECT ${Object.values(NOTIFICATION_COLUMNS).join(', ')} FROM alert_preferences WHERE user_id = $1`, [userId]
    )
    const row = r.rows[0] ?? {}
    return Object.fromEntries(
      Object.entries(NOTIFICATION_COLUMNS).map(([key, col]) => [key, row[col] === true])
    ) as NotificationPrefs
  },

  async getSettings(pool: Pool, userId: string) {
    const u = await pool.query(`
      SELECT name_encrypted, mobile_encrypted, email_encrypted, fcm_token,
             COALESCE(registered_at, created_at) AS member_since
        FROM users WHERE id = $1
    `, [userId])
    if (!u.rows[0]) throw new SettingsError('Account not found', 404, 'NOT_FOUND')
    const row = u.rows[0]

    const [planId, smsCheck, pushCheck, notifications] = await Promise.all([
      planEnforcer.getCurrentPlanId(pool, userId),
      planEnforcer.canAccess(pool, userId, 'sms_alerts'),
      planEnforcer.canAccess(pool, userId, 'push_alerts'),
      this.getPreferences(pool, userId),
    ])
    const email = safeDecrypt(row.email_encrypted)

    return {
      account: {
        name:        safeDecrypt(row.name_encrypted) || 'AssetMap user',
        mobile:      maskMobile(safeDecrypt(row.mobile_encrypted)),
        email:       maskEmail(email),
        memberSince: row.member_since,
        plan:        { id: planId, name: PLAN_NAMES[planId] ?? planId },
      },
      notifications,
      channels: {
        emailOnFile:     !!email,
        smsAllowed:      smsCheck.allowed,
        pushAllowed:     pushCheck.allowed,
        requiredPlan:    smsCheck.allowed ? null : (smsCheck.requiredPlan ?? 'plus'),
        pushRegistered:  !!row.fcm_token,
      },
    }
  },

  async updateNotifications(pool: Pool, userId: string, changes: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const entries = (Object.keys(NOTIFICATION_COLUMNS) as NotificationKey[])
      .filter(k => typeof changes[k] === 'boolean')
      .map(k => [k, changes[k] as boolean] as const)
    if (!entries.length) return this.getPreferences(pool, userId)

    // Turning a channel ON has prerequisites; turning anything OFF is always allowed
    const turningOn = new Set(entries.filter(([, v]) => v).map(([k]) => k))
    if (turningOn.has('email')) {
      const r = await pool.query('SELECT email_encrypted FROM users WHERE id = $1', [userId])
      if (!r.rows[0]?.email_encrypted) {
        throw new SettingsError('Add and verify an email address first to get email alerts.', 400, 'EMAIL_REQUIRED')
      }
    }
    for (const [key, feature] of [['sms', 'sms_alerts'], ['push', 'push_alerts']] as const) {
      if (turningOn.has(key)) {
        const check = await planEnforcer.canAccess(pool, userId, feature)
        if (!check.allowed) {
          throw new SettingsError(`${key === 'sms' ? 'SMS' : 'Push'} alerts are available on the Plus plan and above.`, 402, 'UPGRADE_REQUIRED')
        }
      }
    }

    const cols = entries.map(([k]) => NOTIFICATION_COLUMNS[k])
    const vals = entries.map(([, v]) => v)
    const marketingChanged = entries.some(([k]) => k === 'marketing')
    // Column names come only from the NOTIFICATION_COLUMNS whitelist above
    await pool.query(`
      INSERT INTO alert_preferences (user_id, ${cols.join(', ')}${marketingChanged ? ', marketing_updated_at' : ''})
      VALUES ($1, ${vals.map((_, i) => `$${i + 2}`).join(', ')}${marketingChanged ? ', NOW()' : ''})
      ON CONFLICT (user_id) DO UPDATE SET
        ${cols.map(c => `${c} = EXCLUDED.${c}`).join(', ')},
        ${marketingChanged ? 'marketing_updated_at = NOW(),' : ''}
        updated_at = NOW()
    `, [userId, ...vals])

    return this.getPreferences(pool, userId)
  },

  /** Step 1 of adding/changing the account email: send a 6-digit code to the new address. */
  async startEmailChange(pool: Pool, userId: string, rawEmail: string): Promise<{ maskedEmail: string; expiresInSeconds: number }> {
    const email = rawEmail.trim().toLowerCase()
    if (email.length > 254 || !EMAIL_RE.test(email)) throw new SettingsError('Enter a valid email address')

    const current = await pool.query('SELECT email_encrypted FROM users WHERE id = $1', [userId])
    if (safeDecrypt(current.rows[0]?.email_encrypted)?.toLowerCase() === email) {
      throw new SettingsError('This is already your account email')
    }

    const otp = String(crypto.randomInt(100000, 1000000))
    await kvStore.setex(emailOtpKey(userId), EMAIL_OTP_TTL_S, JSON.stringify({
      emailEnc: encryptPII(email), otpHash: hashOtp(otp), attempts: 0,
    }))

    // Never print codes outside local mock runs — logs are shipped and retained
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_MODE === 'true') {
      console.log(`[Settings] Email verification code: ${otp}`)
    }
    const sent = await alertService.sendEmail({
      to:      email,
      subject: 'Verify your email for AssetMap',
      html:    `<p>Your AssetMap verification code is <strong style="font-size:20px;letter-spacing:2px">${otp}</strong>.</p>` +
               `<p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    }).catch((err: Error) => { logger.warn('[Settings] Verification email failed', { error: err.message }); return false })

    if (!sent && process.env.NODE_ENV === 'production') {
      await kvStore.del(emailOtpKey(userId))
      throw new SettingsError("We couldn't send the verification email. Check the address and try again.", 400, 'EMAIL_SEND_FAILED')
    }
    return { maskedEmail: maskEmail(email)!, expiresInSeconds: EMAIL_OTP_TTL_S }
  },

  /** Step 2: confirm the code and save the email (encrypted + salted hash only). */
  async confirmEmailChange(pool: Pool, userId: string, otp: string): Promise<{ email: string }> {
    const raw = await kvStore.get(emailOtpKey(userId))
    if (!raw) throw new SettingsError('This code has expired. Request a new one.', 400, 'OTP_EXPIRED')
    const pending = JSON.parse(raw) as { emailEnc: string; otpHash: string; attempts: number }

    if (pending.attempts >= EMAIL_OTP_MAX_TRY) {
      await kvStore.del(emailOtpKey(userId))
      throw new SettingsError('Too many incorrect attempts. Request a new code.', 429, 'OTP_LOCKED')
    }

    const given = Buffer.from(hashOtp(String(otp).trim()), 'hex')
    const expected = Buffer.from(pending.otpHash, 'hex')
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      pending.attempts += 1
      await kvStore.setex(emailOtpKey(userId), EMAIL_OTP_TTL_S, JSON.stringify(pending))
      const left = EMAIL_OTP_MAX_TRY - pending.attempts
      throw new SettingsError(left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many incorrect attempts. Request a new code.', 400, 'OTP_INVALID')
    }

    await kvStore.del(emailOtpKey(userId))
    const email = decryptPII(pending.emailEnc)
    try {
      await pool.query(
        'UPDATE users SET email_encrypted = $2, email_hash = $3 WHERE id = $1',
        [userId, encryptPII(email), hashEmail(email)]
      )
    } catch (err: any) {
      // Unique email_hash: don't reveal whether another account owns the address
      if (err?.code === '23505') throw new SettingsError("This email can't be used. Try a different address.", 409, 'EMAIL_UNAVAILABLE')
      throw err
    }
    return { email: maskEmail(email)! }
  },

  /** Everything we hold about the user, for the DPDP right of access ("Download my data"). */
  async exportData(pool: Pool, userId: string) {
    // Fail the whole export rather than silently hand back a partial copy
    const q = async (sql: string) => (await pool.query(sql, [userId])).rows

    const [user] = await q(`
      SELECT name_encrypted, mobile_encrypted, email_encrypted, dob_encrypted, nationality,
             country_code, created_at, registered_at, last_login_at
        FROM users WHERE id = $1`)
    const decrypted = user ? {
      name:         safeDecrypt(user.name_encrypted),
      mobile:       safeDecrypt(user.mobile_encrypted),
      email:        safeDecrypt(user.email_encrypted),
      dateOfBirth:  safeDecrypt(user.dob_encrypted),
      nationality:  user.nationality,
      countryCode:  user.country_code,
      accountCreatedAt: user.created_at,
      registeredAt: user.registered_at,
      lastLoginAt:  user.last_login_at,
      aadhaar:      'Not stored — only a one-way salted hash is kept for identity matching',
    } : null

    return {
      exportedAt: new Date().toISOString(),
      notice:     'This file contains your personal and financial data. Store it securely.',
      profile:    decrypted,
      plan:       await planEnforcer.getCurrentPlanId(pool, userId),
      notificationPreferences: await this.getPreferences(pool, userId),
      consents: await q(`
        SELECT consent_id, status, fi_types, purpose, date_range_start, date_range_end, created_at, revoked_at
          FROM consents WHERE user_id = $1 ORDER BY created_at DESC`),
      assets: (await q(`
        SELECT asset_class, asset_name, institution_name, account_ref_enc, folio_number_enc, policy_number_enc,
               current_value_paise, has_nominee, nominee_name_enc,
               COALESCE(primary_source, source) AS source, is_active, last_synced_at
          FROM canonical_assets WHERE user_id = $1 ORDER BY asset_class, institution_name`))
        .map((a: any) => ({
          assetClass: a.asset_class, assetName: a.asset_name ?? null, institution: a.institution_name,
          accountReference: safeDecrypt(a.account_ref_enc),
          folioNumber: safeDecrypt(a.folio_number_enc),
          policyNumber: safeDecrypt(a.policy_number_enc),
          currentValueRupees: a.current_value_paise == null ? null : Number(a.current_value_paise) / 100,
          // null = the source didn't say whether a nominee is registered
          hasNominee: a.has_nominee, nomineeName: safeDecrypt(a.nominee_name_enc),
          source: a.source, active: a.is_active, lastSyncedAt: a.last_synced_at,
        })),
      landRecords: (await q(`
        SELECT state, district, taluka, village, survey_number_enc, khasra_number_enc, area_value, area_unit,
               land_type, ownership_type, estimated_value_paise, source, created_at
          FROM land_records WHERE user_id = $1 ORDER BY created_at DESC`))
        .map((l: any) => ({
          state: l.state, district: l.district, taluka: l.taluka, village: l.village,
          surveyNumber: safeDecrypt(l.survey_number_enc), khasraNumber: safeDecrypt(l.khasra_number_enc),
          area: l.area_value == null ? null : `${l.area_value} ${l.area_unit ?? ''}`.trim(),
          landType: l.land_type, ownershipType: l.ownership_type,
          estimatedValueRupees: l.estimated_value_paise == null ? null : Number(l.estimated_value_paise) / 100,
          source: l.source, addedAt: l.created_at,
        })),
      alerts: await q(`
        SELECT alert_type, severity, title, body, is_read, created_at
          FROM user_alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500`),
      auditTrail: await q(`
        SELECT action, entity_type, "timestamp" AS at
          FROM audit_logs WHERE user_id = $1 ORDER BY "timestamp" DESC LIMIT 1000`),
    }
  },
}

/** Test hooks — lets tests plant a known code without exposing it through the API */
export const __testing = { hashOtp, emailOtpKey }
