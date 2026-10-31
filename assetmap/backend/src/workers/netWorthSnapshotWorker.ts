import cron from 'node-cron'
import { Pool } from 'pg'
import { netWorthTracker } from '../services/netWorthTracker'
import { decryptPII as decrypt } from '../utils/encryption'
import { logger } from '../utils/logger'

export function startNetWorthSnapshotWorker(pool: Pool) {
  const runJob = async () => {
    logger.info('[NetWorthSnapshot] Starting daily snapshot job')

    const users = await pool.query(`
      SELECT DISTINCT user_id
      FROM consents
      WHERE status = 'ACTIVE'
    `)

    for (const user of users.rows) {
      try {
        const rows = await pool.query(`
          SELECT fi_type, balance_encrypted
          FROM asset_snapshots_aa
          WHERE user_id = $1
        `, [user.user_id])

        let bankBalancePaise = 0;
        let mfValuePaise = 0;
        let equityValuePaise = 0;
        let npsValuePaise = 0;
        let insuranceValuePaise = 0;
        let bankAccounts = 0;
        let investmentAccounts = 0;

        for (const row of rows.rows) {
          const balanceDecrypted = decrypt(row.balance_encrypted);
          // balance_encrypted holds rupees (e.g. "450000.50"); snapshots are stored in paise
          const balance = Math.round(parseFloat(balanceDecrypted || '0') * 100) || 0;
          
          if (row.fi_type === 'DEPOSIT') {
            bankBalancePaise += balance;
            bankAccounts += 1;
          } else {
            investmentAccounts += 1;
            if (row.fi_type === 'MUTUAL_FUND') mfValuePaise += balance;
            else if (row.fi_type === 'EQUITY') equityValuePaise += balance;
            else if (row.fi_type === 'NPS') npsValuePaise += balance;
            else if (row.fi_type === 'INSURANCE_POLICIES') insuranceValuePaise += balance;
          }
        }

        const landTotal = await pool.query(`
          SELECT COALESCE(SUM(estimated_value_paise), 0) AS land_value_paise
          FROM land_records
          WHERE user_id = $1 AND is_active = true
        `, [user.user_id])

        await netWorthTracker.saveSnapshot(pool, user.user_id, {
          bankBalancePaise,
          mfValuePaise,
          equityValuePaise,
          npsValuePaise,
          insuranceValuePaise,
          landValuePaise:      parseInt(landTotal.rows[0].land_value_paise) || 0,
          bankAccounts,
          investmentAccounts,
        })

        await new Promise(r => setTimeout(r, 100))
      } catch (err) {
        logger.error('[NetWorthSnapshot] Snapshot failed', { userId: user.user_id, error: (err as Error).message })
      }
    }

    logger.info('[NetWorthSnapshot] Done', { users: users.rows.length })
  };

  // A DB blip must not become an unhandled rejection that kills the API process
  const safeRun = () => runJob().catch(err =>
    logger.error('[NetWorthSnapshot] Job failed', { error: (err as Error).message }))

  // Startup run catches up after downtime; snapshots upsert per (user, date) so reruns are safe
  safeRun();
  cron.schedule('0 6 * * *', safeRun, { timezone: 'Asia/Kolkata' });

  logger.info('[NetWorthSnapshot] Worker registered — runs daily at 6AM IST and on startup')
}
