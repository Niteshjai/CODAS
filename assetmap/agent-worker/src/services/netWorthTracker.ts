// ─────────────────────────────────────────────
// Net Worth Tracker Service
// Takes a snapshot of total net worth after each
// agent run. Powers the net worth chart over time.
// ─────────────────────────────────────────────

import { Pool } from 'pg'

interface NetWorthSnapshot {
  userId:                string
  totalValuePaise:       number
  assetBreakdown:        Record<string, number>
  assetCount:            number
  snapshotDate:          string
}

class NetWorthTracker {
  /**
   * Calculate and store a net worth snapshot for the user.
   * Called after every successful agent run injection.
   */
  async takeSnapshot(
    pool: Pool,
    userId: string,
    assets: Array<{
      assetClass: string
      currentValuePaise: number
      isActive: boolean
    }>
  ): Promise<NetWorthSnapshot> {
    const activeAssets = assets.filter(a => a.isActive)

    const totalValuePaise = activeAssets.reduce(
      (sum, a) => sum + a.currentValuePaise, 0
    )

    const assetBreakdown: Record<string, number> = {}
    for (const asset of activeAssets) {
      assetBreakdown[asset.assetClass] =
        (assetBreakdown[asset.assetClass] ?? 0) + asset.currentValuePaise
    }

    const snapshot: NetWorthSnapshot = {
      userId,
      totalValuePaise,
      assetBreakdown,
      assetCount: activeAssets.length,
      snapshotDate: new Date().toISOString().split('T')[0],
    }

    console.log(`[NetWorth] Snapshot for ${userId}:`, {
      total: `₹${(totalValuePaise / 100).toLocaleString('en-IN')}`,
      assets: activeAssets.length,
      classes: Object.keys(assetBreakdown).length,
    })

    // TODO: Persist to net_worth_snapshots table
    // await pool.query(`
    //   INSERT INTO net_worth_snapshots
    //   (user_id, total_value_paise, asset_breakdown, asset_count, snapshot_date)
    //   VALUES ($1, $2, $3, $4, $5)
    //   ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
    //     total_value_paise = EXCLUDED.total_value_paise,
    //     asset_breakdown   = EXCLUDED.asset_breakdown,
    //     asset_count       = EXCLUDED.asset_count
    // `, [userId, totalValuePaise, assetBreakdown, activeAssets.length, snapshot.snapshotDate])

    return snapshot
  }
}

export const netWorthTracker = new NetWorthTracker()
