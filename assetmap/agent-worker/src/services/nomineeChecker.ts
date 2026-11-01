// ─────────────────────────────────────────────
// Nominee Checker Service
// Scans canonical assets for missing nominees
// and triggers alerts. Critical for estate planning.
// ─────────────────────────────────────────────

import { alertService } from './alertService'

interface NomineeCheckResult {
  totalAssets:         number
  assetsWithNominee:   number
  assetsWithoutNominee:number
  alertTriggered:      boolean
  missingNomineeAssets:Array<{
    assetClass:       string
    institutionName:  string
    assetName:        string
  }>
}

class NomineeChecker {
  /**
   * Check all canonical assets for nominee coverage.
   * Triggers an alert if any asset is missing a nominee.
   */
  async check(
    userId: string,
    assets: Array<{
      assetClass:      string
      institutionName?: string
      assetName?:       string
      hasNominee?:      boolean
      isActive:         boolean
    }>
  ): Promise<NomineeCheckResult> {
    const activeAssets = assets.filter(a => a.isActive)

    // Asset classes where nominees are critical
    const nomineeRequiredClasses = new Set([
      'BANK_ACCOUNT', 'FIXED_DEPOSIT', 'MUTUAL_FUND',
      'EQUITY', 'NPS', 'INSURANCE_LIFE', 'INSURANCE_HEALTH',
      'INSURANCE_OTHER', 'EPF', 'PPF'
    ])

    const relevantAssets = activeAssets.filter(
      a => nomineeRequiredClasses.has(a.assetClass)
    )

    const withNominee    = relevantAssets.filter(a => a.hasNominee === true)
    const withoutNominee = relevantAssets.filter(a => a.hasNominee === false)

    const result: NomineeCheckResult = {
      totalAssets:          relevantAssets.length,
      assetsWithNominee:    withNominee.length,
      assetsWithoutNominee: withoutNominee.length,
      alertTriggered:       false,
      missingNomineeAssets: withoutNominee.map(a => ({
        assetClass:      a.assetClass,
        institutionName: a.institutionName ?? 'Unknown',
        assetName:       a.assetName ?? 'Unnamed',
      })),
    }

    if (withoutNominee.length > 0) {
      await alertService.sendNomineeAlert(userId, withoutNominee.length)
      result.alertTriggered = true
    }

    console.log(`[NomineeCheck] ${userId}:`, {
      total:   relevantAssets.length,
      covered: withNominee.length,
      missing: withoutNominee.length,
    })

    return result
  }
}

export const nomineeChecker = new NomineeChecker()
