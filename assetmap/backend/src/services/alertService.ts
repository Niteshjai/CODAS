import axios from 'axios'
import { Pool } from 'pg'
import { redis } from '../db/connection'
import { logger } from '../utils/logger'

import twilio from 'twilio'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

const PREFERENCE_COLUMNS = new Set([
  'sms_enabled', 'push_enabled', 'email_enabled', 'marketing_opt_in',
  'alert_balance_drop', 'alert_new_account', 'alert_land_change',
  'alert_dormant', 'alert_nominee', 'alert_large_txn',
])
export interface AlertPayload {
  userId:    string
  type:      string
  severity:  'info' | 'warning' | 'critical'
  title:     string
  body:      string
  metadata?: object
}

function formatINR(paise: number): string {
  const amount = paise / 100
  if (amount >= 10000000) return `₹${(amount/10000000).toFixed(2)}Cr`
  if (amount >= 100000)   return `₹${(amount/100000).toFixed(1)}L`
  if (amount >= 1000)     return `₹${(amount/1000).toFixed(0)}K`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export const alertService = {

  async createAlert(pool: Pool, payload: AlertPayload): Promise<string> {
    const result = await pool.query(`
      INSERT INTO user_alerts (
        user_id, alert_type, severity, title, body, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id
    `, [
      payload.userId, payload.type, payload.severity,
      payload.title, payload.body,
      JSON.stringify(payload.metadata ?? {})
    ])
    return result.rows[0].id
  },

  async sendSMS(userId: string, mobile: string, message: string): Promise<boolean> {
    try {
      const date = new Date().toISOString().split('T')[0]
      const redisKey = `sms:count:${userId}:${date}`
      
      const countStr = await redis.get(redisKey)
      const count = countStr ? parseInt(countStr) : 0
      
      if (count >= 3) {
        logger.warn(`[AlertService] SMS limit reached for user ${userId} today`)
        return false
      }

      if (!twilioClient) {
        // SMS bodies can carry family-invite join tokens and balances — never log them
        logger.warn(`[AlertService] Twilio not configured; SMS for user ${userId} not sent`)
        return false
      }

      await twilioClient.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: mobile.startsWith('+') ? mobile : `+91${mobile}`
      })
      
      await redis.incr(redisKey)
      if (count === 0) {
        await redis.expire(redisKey, 24 * 60 * 60)
      }
      
      return true
    } catch (err) {
      logger.error('[AlertService] SMS failed', { error: (err as Error).message })
      return false
    }
  },

  async sendEmail(options: { to: string; subject: string; html: string }): Promise<boolean> {
    try {
      // 1. If Resend API key is available
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
        const result = await resend.emails.send({
          from: fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        if (result.error) {
          logger.error('[AlertService] Resend API error', { error: result.error.message });
          return false;
        }
        logger.info(`[AlertService] Email sent via Resend. ID: ${result.data?.id}`);
        return true;
      }

      // 2. If SMTP / Nodemailer is configured
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: process.env.SMTP_SECURE !== 'false',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Codas" <${process.env.SMTP_USER}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        logger.info('[AlertService] Email sent via SMTP');
        return true;
      }

      // 3. Fallback for development/testing when no email provider keys are set in .env
      // In production, report failure instead of pretending an email (e.g. a 2FA OTP) went out
      if (process.env.NODE_ENV === 'production') {
        logger.error('[AlertService] No email provider configured; email not sent');
        return false;
      }
      logger.warn(`[AlertService] No email provider configured; skipped "${options.subject}". Set RESEND_API_KEY or SMTP_USER/SMTP_PASS.`);
      return true;
    } catch (err) {
      logger.error('[AlertService] Email delivery failed', { error: (err as Error).message });
      return false;
    }
  },

  async sendPushNotification(
    pool: Pool,
    userId: string,
    title: string,
    body: string
  ): Promise<boolean> {
    // FCM implementation — use firebase-admin
    try {
      const admin = require('firebase-admin')
      if (!admin.apps.length) {
        if (!process.env.FIREBASE_PROJECT_ID) return false;
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }

      // Respect the user's "Push notifications" setting for every push we send
      const tokenResult = await pool.query(`
        SELECT u.fcm_token, ap.push_enabled
          FROM users u LEFT JOIN alert_preferences ap ON ap.user_id = u.id
         WHERE u.id = $1
      `, [userId])
      const token = tokenResult.rows[0]?.fcm_token
      if (!token || tokenResult.rows[0]?.push_enabled === false) return false

      await admin.messaging().send({
        token,
        notification: { title, body },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } }
      })
      return true
    } catch (err) {
      logger.error('[AlertService] Push failed', { error: (err as Error).message })
      return false 
    }
  },

  async getUnreadCount(pool: Pool, userId: string): Promise<number> {
    const r = await pool.query(
      'SELECT COUNT(*) FROM user_alerts WHERE user_id=$1 AND is_read=false',
      [userId]
    )
    return parseInt(r.rows[0].count)
  },

  async getUserAlerts(
    pool: Pool,
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<any[]> {
    const r = await pool.query(`
      SELECT * FROM user_alerts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset])
    return r.rows
  },

  async markAllRead(pool: Pool, userId: string): Promise<void> {
    await pool.query(`
      UPDATE user_alerts
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
    `, [userId])
  },

  async getPreferences(pool: Pool, userId: string): Promise<any> {
    const r = await pool.query(
      'SELECT * FROM alert_preferences WHERE user_id = $1',
      [userId]
    )
    if (r.rows[0]) return r.rows[0]

    // Insert defaults
    await pool.query(
      'INSERT INTO alert_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [userId]
    )
    return (await pool.query(
      'SELECT * FROM alert_preferences WHERE user_id = $1', [userId]
    )).rows[0]
  },

  async updatePreferences(
    pool: Pool, userId: string, prefs: Record<string, unknown>
  ): Promise<void> {
    // Column names are interpolated into SQL, so only known boolean columns may pass
    const entries = Object.entries(prefs)
      .filter(([k, v]) => PREFERENCE_COLUMNS.has(k) && typeof v === 'boolean')
    if (!entries.length) return

    const cols = entries.map(([k]) => k)
    await pool.query(`
      INSERT INTO alert_preferences (user_id, ${cols.join(', ')})
      VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')})
      ON CONFLICT (user_id) DO UPDATE SET
        ${cols.map(c => `${c} = EXCLUDED.${c}`).join(', ')}, updated_at = NOW()
    `, [userId, ...entries.map(([, v]) => v)])
  }
}
