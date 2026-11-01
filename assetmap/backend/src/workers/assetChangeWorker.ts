import cron from 'node-cron'
import { Pool } from 'pg'
import { alertService } from '../services/alertService'
import { decryptPII as decrypt } from '../utils/encryption'
import { logger } from '../utils/logger'

export function startAssetChangeWorker(pool: Pool) {

  // Runs every day at 8AM IST, after the 6AM net worth snapshot it compares against
  cron.schedule('0 8 * * *', async () => {
    logger.info('[AssetChange] Starting daily asset comparison job')

    let users
    try {
      users = await pool.query(`
      SELECT DISTINCT u.id, u.mobile_encrypted, u.email_encrypted,
             ap.email_enabled,
             ap.balance_drop_pct,
             ap.balance_drop_min_paise,
             ap.sms_enabled,
             ap.push_enabled,
             ap.alert_balance_drop,
             ap.alert_new_account,
             ap.alert_land_change
      FROM users u
      JOIN asset_snapshots s ON s.user_id = u.id
      LEFT JOIN alert_preferences ap ON ap.user_id = u.id
      WHERE s.snapshot_date = CURRENT_DATE - 1
    `)
    } catch (err) {
      logger.error('[AssetChange] Job failed', { error: (err as Error).message })
      return
    }

    for (const user of users.rows) {
      try {
        await compareAndAlert(pool, user)
        await new Promise(r => setTimeout(r, 200))
      } catch (err) {
        logger.error('[AssetChange] Comparison failed', { userId: user.id, error: (err as Error).message })
      }
    }
    logger.info('[AssetChange] Done', { users: users.rows.length })
  }, { timezone: 'Asia/Kolkata' })

  logger.info('[AssetChange] Worker registered — runs daily at 8AM IST')
}

async function compareAndAlert(pool: Pool, user: any) {

  const snaps = await pool.query(`
    SELECT * FROM asset_snapshots
    WHERE user_id = $1
    AND snapshot_date >= CURRENT_DATE - 1
    ORDER BY snapshot_date DESC
    LIMIT 2
  `, [user.id])

  if (snaps.rows.length < 2) return

  const today     = snaps.rows[0]
  const yesterday = snaps.rows[1]
  
  const todayBal = parseInt(today.total_balance_paise) || 0
  const yesterdayBal = parseInt(yesterday.total_balance_paise) || 0

  // Alert 1: Significant balance drop
  if (user.alert_balance_drop !== false) {
    const drop = yesterdayBal - todayBal
    const dropPct = drop / (yesterdayBal || 1) * 100

    if (
      drop > (user.balance_drop_min_paise ?? 500000) &&
      dropPct > (user.balance_drop_pct ?? 20)
    ) {
      
      const existing = await pool.query(`
        SELECT id FROM user_alerts
        WHERE user_id = $1 AND alert_type = 'balance_drop'
        AND created_at > NOW() - INTERVAL '30 days'
        LIMIT 1
      `, [user.id])
      
      if (!existing.rows.length) {
        const alertId = await alertService.createAlert(pool, {
          userId:   user.id,
          type:     'balance_drop',
          severity: dropPct > 50 ? 'critical' : 'warning',
          title:    'Significant balance drop detected',
          body:     `Your total balance dropped by ${Math.round(dropPct)}% ` +
                    `(${formatINR(drop)}) since yesterday. ` +
                    `If you did not initiate this, check your accounts immediately.`,
          metadata: { drop, dropPct: Math.round(dropPct), yesterday: yesterdayBal, today: todayBal }
        })

        await emailAlert(pool, user, alertId, 'Significant balance drop detected',
          `Your total balance dropped by ${Math.round(dropPct)}% (${formatINR(drop)}) since yesterday. ` +
          'If you did not initiate this, check your accounts immediately.')

        if (user.sms_enabled !== false) {
          const mobile = decrypt(user.mobile_encrypted)
          if (mobile) {
            await alertService.sendSMS(
              user.id,
              mobile,
              `AssetMap Alert: Your balance dropped ${Math.round(dropPct)}% ` +
              `(${formatINR(drop)}). Login to check. Reply STOP to opt out.`
            )
            await pool.query(
              'UPDATE user_alerts SET sms_sent=true, sms_sent_at=NOW() WHERE id=$1',
              [alertId]
            )
          }
        }

        if (user.push_enabled !== false) {
          await alertService.sendPushNotification(
            pool,
            user.id,
            'Balance drop detected',
            `Your total balance dropped ${Math.round(dropPct)}% since yesterday`
          )
          await pool.query(
            'UPDATE user_alerts SET push_sent=true, push_sent_at=NOW() WHERE id=$1',
            [alertId]
          )
        }
      }
    }
  }

  // Alert 2: New account appeared
  if (
    user.alert_new_account !== false &&
    today.total_accounts > yesterday.total_accounts
  ) {
    const newCount = today.total_accounts - yesterday.total_accounts
    
    const existing = await pool.query(`
        SELECT id FROM user_alerts
        WHERE user_id = $1 AND alert_type = 'new_account_linked'
        AND created_at > NOW() - INTERVAL '30 days'
        LIMIT 1
    `, [user.id])
    
    if (!existing.rows.length) {
      const alertId = await alertService.createAlert(pool, {
        userId:   user.id,
        type:     'new_account_linked',
        severity: 'warning',
        title:    `${newCount} new account${newCount > 1 ? 's' : ''} linked to your Aadhaar`,
        body:     `We detected ${newCount} new financial account(s) linked to your Aadhaar ` +
                  `today. If you did not open these, report to your bank immediately.`,
        metadata: { newCount, previousTotal: yesterday.total_accounts, currentTotal: today.total_accounts }
      })

      await emailAlert(pool, user, alertId, `${newCount} new account${newCount > 1 ? 's' : ''} linked to your Aadhaar`,
        `We detected ${newCount} new financial account(s) linked to your Aadhaar today. ` +
        'If you did not open these, report to your bank immediately.')

      if (user.sms_enabled !== false) {
        const mobile = decrypt(user.mobile_encrypted)
        if (mobile) {
          await alertService.sendSMS(
            user.id,
            mobile,
            `AssetMap Alert: ${newCount} new account(s) linked to your Aadhaar detected. ` +
            `If not you, call your bank immediately. Login to AssetMap to review. Reply STOP to opt out.`
          )
        }
      }
    }
  }

  // Alert 3: Land ownership change
  if (user.alert_land_change !== false) {
    const landChanges = await pool.query(`
      SELECT COUNT(*) FROM land_records
      WHERE user_id = $1
      AND updated_at >= NOW() - INTERVAL '24 hours'
      -- registry sync sets both in one statement (same NOW()); manual edits only touch updated_at
      AND updated_at = last_synced_at
      AND source != 'manual'
    `, [user.id])

    if (parseInt(landChanges.rows[0].count) > 0) {
      const existing = await pool.query(`
          SELECT id FROM user_alerts
          WHERE user_id = $1 AND alert_type = 'land_ownership_change'
          AND created_at > NOW() - INTERVAL '30 days'
          LIMIT 1
      `, [user.id])
      
      if (!existing.rows.length) {
        const alertId = await alertService.createAlert(pool, {
          userId:   user.id,
          type:     'land_ownership_change',
          severity: 'critical',
          title:    'Land record update detected',
          body:     'One or more of your land records were updated in the registry. ' +
                    'Login to review the changes immediately.',
          metadata: { changedCount: parseInt(landChanges.rows[0].count) }
        })

        await emailAlert(pool, user, alertId, 'Land record update detected',
          'One or more of your land records were updated in the registry. Sign in to review the changes.')

        if (user.sms_enabled !== false) {
          const mobile = decrypt(user.mobile_encrypted)
          if (mobile) {
            await alertService.sendSMS(
              user.id,
              mobile,
              `AssetMap Alert: A land record linked to your name was updated in ` +
              `the registry. Login immediately to review. Reply STOP to opt out.`
            )
          }
        }
      }
    }
  }
}

// Email channel: only when the user turned "Email alerts" on in Settings and has a verified email
async function emailAlert(pool: Pool, user: any, alertId: string, subject: string, text: string) {
  if (user.email_enabled !== true || !user.email_encrypted) return
  let to: string
  try { to = decrypt(user.email_encrypted) } catch { return }
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const sent = await alertService.sendEmail({
    to,
    subject: `AssetMap alert: ${subject}`,
    html:    `<p>${escaped}</p><p>Sign in to AssetMap to review. You can turn off email alerts in Account Settings.</p>`,
  }).catch(() => false)
  if (sent) {
    await pool.query('UPDATE user_alerts SET email_sent = true, email_sent_at = NOW() WHERE id = $1', [alertId])
  }
}

function formatINR(paise: number): string {
  const amount = paise / 100
  if (amount >= 10000000) return `₹${(amount/10000000).toFixed(1)}Cr`
  if (amount >= 100000)   return `₹${(amount/100000).toFixed(1)}L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}
