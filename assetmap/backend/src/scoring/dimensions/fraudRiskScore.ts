import { Pool } from 'pg'
import { DimensionResult } from './assetStrengthScore'

export async function fraudRiskScore(
  pool: Pool,
  userId: string
): Promise<DimensionResult> {

  // Open agent anomalies, de-duplicated. Since 034 the agent upserts one row per fingerprint
  // (last_seen_at/occurrences grow on every run); rows written before that have no fingerprint
  // and repeat per run, so they collapse on (type, asset or description). Anomalies whose asset
  // has since been deactivated, or that the agent has not seen for 30 days, no longer count.
  const agentAnomalies = await pool.query(`
    SELECT COUNT(DISTINCT COALESCE(
             an.fingerprint,
             an.anomaly_type || ':' || COALESCE(an.canonical_id::text, an.description, '')
           )) AS unresolved,
           COALESCE(array_agg(DISTINCT an.anomaly_type), '{}') AS types
    FROM asset_anomalies an
    LEFT JOIN canonical_assets ca ON ca.id = an.canonical_id AND ca.user_id = an.user_id
    WHERE an.user_id = $1
    AND an.is_resolved = false
    AND an.last_seen_at > NOW() - INTERVAL '30 days'
    AND (an.canonical_id IS NULL OR ca.is_active IS NOT FALSE)
  `, [userId])

  // AI anomaly flags on assets that have no open anomaly row of their own — the agent records
  // each flag as an asset_anomalies row too, and the same problem must not be penalised twice.
  const anomalyResult = await pool.query(`
    SELECT COUNT(*) AS active_anomalies
    FROM canonical_assets ca
    WHERE ca.user_id = $1
    AND ca.ai_anomaly_flag = true
    AND ca.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM asset_anomalies an
       WHERE an.user_id = ca.user_id AND an.canonical_id = ca.id AND an.is_resolved = false
    )
  `, [userId])

  // Bank accounts that are genuinely new. The agent creates every row on its first run, so a
  // row's created_at only means "new account" once the user's canonical history is older than
  // the 30-day window (the account appeared in a later sync). A known opened_date overrides
  // that: an account opened in the last 30 days is new whenever it was first seen, and one
  // opened earlier never is.
  const newAccounts = await pool.query(`
    WITH first_seen AS (
      SELECT MIN(created_at) AS at FROM canonical_assets WHERE user_id = $1
    )
    SELECT COUNT(*) AS new_count
    FROM canonical_assets ca, first_seen fs
    WHERE ca.user_id = $1
    AND ca.asset_class = 'BANK_ACCOUNT'
    AND ca.is_active = true
    AND (
      (ca.opened_date IS NOT NULL AND ca.opened_date >= CURRENT_DATE - 30)
      OR (ca.opened_date IS NULL
          AND ca.created_at > NOW() - INTERVAL '30 days'
          AND ca.created_at > fs.at + INTERVAL '30 days')
    )
  `, [userId])

  // Check for alerts history
  const criticalAlerts = await pool.query(`
    SELECT COUNT(*) AS critical_count
    FROM user_alerts
    WHERE user_id = $1
    AND severity = 'critical'
    AND created_at > NOW() - INTERVAL '90 days'
  `, [userId])

  const activeAnomalies   = parseInt(anomalyResult.rows[0].active_anomalies)  || 0
  const unresolvedAgentAnomalies = parseInt(agentAnomalies.rows[0].unresolved) || 0
  const newAccountCount   = parseInt(newAccounts.rows[0].new_count)            || 0
  const criticalAlertCount= parseInt(criticalAlerts.rows[0].critical_count)    || 0

  let score   = 100  // Start clean, deduct for risks
  const reasons:  string[] = []
  const warnings: string[] = []

  if (activeAnomalies === 0 && unresolvedAgentAnomalies === 0)
    reasons.push('No active anomaly flags on any linked account')
  else if (activeAnomalies > 0) {
    score -= activeAnomalies * 20
    warnings.push(`${activeAnomalies} active anomaly flag(s) detected by AI`)
  }

  if (unresolvedAgentAnomalies > 0) {
    score -= unresolvedAgentAnomalies * 15
    warnings.push(`${unresolvedAgentAnomalies} unresolved financial anomaly alert(s)`)
  }

  if (newAccountCount >= 3) {
    score -= 15
    warnings.push(
      `${newAccountCount} new bank accounts linked in last 30 days — ` +
      `manual review recommended`
    )
  }

  if (criticalAlertCount > 0) {
    score -= criticalAlertCount * 10
    warnings.push(`${criticalAlertCount} critical security alert(s) in last 90 days`)
  }

  if (score === 100)
    reasons.push('Clean fraud risk profile — no suspicious activity detected')

  score = Math.max(0, score)

  return {
    score,
    reasons,
    warnings,
    data: {
      activeAnomalies,
      unresolvedAgentAnomalies,
      anomalyTypes:      agentAnomalies.rows[0].types ?? [],
      newAccountCount,
      criticalAlertCount
    }
  }
}
