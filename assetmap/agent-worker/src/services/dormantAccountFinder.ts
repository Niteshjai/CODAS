// ─────────────────────────────────────────────
// Dormant Account Finder Service
// Identifies accounts with no activity for 12+ months.
// Critical for unclaimed asset recovery.
// ─────────────────────────────────────────────

import { alertService } from './alertService'

interface DormantAccount {
  assetClass:       string
  institutionName:  string
  assetName:        string
  lastTransactionDate: string | null
  dormantMonths:    number
  currentValuePaise:number
}

interface DormantCheckResult {
  totalChecked:     number
  dormantCount:     number
  totalDormantValue:number
  dormantAccounts:  DormantAccount[]
  alertsTriggered:  number
}

class DormantAccountFinder {
  private readonly DORMANCY_THRESHOLD_MONTHS = 12

  /**
   * Scan all assets for dormancy (no transactions for 12+ months).
   * Triggers individual alerts for each dormant account found.
   */
  async scan(
    userId: string,
    assets: Array<{
      assetClass:           string
      institutionName?:     string
      assetName?:           string
      lastTransactionDate?: string | null
      currentValuePaise:    number
      isActive:             boolean
      isDormant:            boolean
    }>
  ): Promise<DormantCheckResult> {
    const activeAssets = assets.filter(a => a.isActive)
    const now = Date.now()

    const dormantAccounts: DormantAccount[] = []

    for (const asset of activeAssets) {
      if (asset.isDormant) {
        dormantAccounts.push({
          assetClass:          asset.assetClass,
          institutionName:     asset.institutionName ?? 'Unknown',
          assetName:           asset.assetName ?? 'Unnamed',
          lastTransactionDate: asset.lastTransactionDate ?? null,
          dormantMonths:       this.DORMANCY_THRESHOLD_MONTHS,
          currentValuePaise:   asset.currentValuePaise,
        })
        continue
      }

      if (!asset.lastTransactionDate) continue

      const lastTxDate = new Date(asset.lastTransactionDate)
      const dormantMs  = now - lastTxDate.getTime()
      const dormantMonths = Math.floor(dormantMs / (1000 * 60 * 60 * 24 * 30))

      if (dormantMonths >= this.DORMANCY_THRESHOLD_MONTHS) {
        dormantAccounts.push({
          assetClass:          asset.assetClass,
          institutionName:     asset.institutionName ?? 'Unknown',
          assetName:           asset.assetName ?? 'Unnamed',
          lastTransactionDate: asset.lastTransactionDate,
          dormantMonths,
          currentValuePaise:   asset.currentValuePaise,
        })
      }
    }

    // Send alerts for newly discovered dormant accounts
    let alertsTriggered = 0
    for (const da of dormantAccounts) {
      await alertService.sendDormantAlert(
        userId,
        `${da.assetName} at ${da.institutionName}`,
        da.dormantMonths
      )
      alertsTriggered++
    }

    const totalDormantValue = dormantAccounts.reduce(
      (sum, a) => sum + a.currentValuePaise, 0
    )

    console.log(`[DormantFinder] ${userId}:`, {
      checked:      activeAssets.length,
      dormant:      dormantAccounts.length,
      dormantValue: `₹${(totalDormantValue / 100).toLocaleString('en-IN')}`,
    })

    return {
      totalChecked:      activeAssets.length,
      dormantCount:      dormantAccounts.length,
      totalDormantValue,
      dormantAccounts,
      alertsTriggered,
    }
  }
}

export const dormantAccountFinder = new DormantAccountFinder()
