import { Pool }    from 'pg'
import { memberName, FamilyError } from './familyVault'

// Asset class → share column mapping. Covers every class in canonical_assets' CHECK list
// (migration 032); a class missing here is never shown to the family.
//  - share_land ("Property"): registry land, agent property records, legacy REAL_ESTATE and
//    land the user confirmed from ancestral search.
//  - share_gold ("Gold & other", off by default): gold, bonds, vehicles, money found in
//    unclaimed-asset registries and anything unclassified. Bonds sit here rather than with
//    fixed deposits, whose toggle promises "FD and RD values".
const SHARE_COLUMNS: Record<string, string> = {
  BANK_ACCOUNT:    'share_bank_accounts',
  FIXED_DEPOSIT:   'share_fixed_deposits',
  MUTUAL_FUND:     'share_mutual_funds',
  EQUITY:          'share_equity',
  NPS:             'share_nps',
  EPF:             'share_epf',
  PPF:             'share_epf',
  INSURANCE_LIFE:  'share_insurance',
  INSURANCE_HEALTH:'share_insurance',
  INSURANCE_OTHER: 'share_insurance',
  LAND:                     'share_land',
  PROPERTY:                 'share_land',
  REAL_ESTATE:              'share_land',
  AGRICULTURAL_LAND_MANUAL: 'share_land',
  GOLD:            'share_gold',
  BOND:            'share_gold',
  VEHICLE:         'share_gold',
  UNCLAIMED:       'share_gold',
  OTHER:           'share_gold',   // "Gold & other assets"
}

export const familyAggregator = {

  // Get combined net worth for the vault
  // CRITICAL: only includes asset classes each member has chosen to share
  async getCombinedNetWorth(
    pool:    Pool,
    vaultId: string,
    userId:  string  // must be primary user or active member
  ): Promise<{
    totalPaise:      number
    members:         MemberSummary[]
    byAssetClass:    Record<string, number>
    memberCount:     number
  }> {
    // Verify access
    await verifyVaultAccess(pool, vaultId, userId)

    // Get all active members with their sharing preferences
    const members = await pool.query(`
      SELECT
        fvm.id AS member_id, fvm.user_id,
        fvm.display_name, fvm.invited_name, u.name_encrypted AS user_name_enc,
        fvm.avatar_color, fvm.relationship,
        fvm.share_bank_accounts, fvm.share_fixed_deposits,
        fvm.share_mutual_funds, fvm.share_equity,
        fvm.share_nps, fvm.share_epf, fvm.share_insurance,
        fvm.share_land, fvm.share_gold, fvm.share_total_networth
      FROM family_vault_members fvm
      LEFT JOIN users u ON u.id = fvm.user_id
      WHERE fvm.vault_id = $1 AND fvm.status = 'active'
      AND fvm.user_id IS NOT NULL
    `, [vaultId])

    const memberSummaries: MemberSummary[] = []
    const byAssetClass: Record<string, number> = {}
    let totalPaise = 0

    for (const member of members.rows) {
      if (!member.user_id) continue

      // Fetch only the asset classes this member shares
      // Build WHERE clause dynamically based on their preferences
      // share_total_networth is the member's master switch: off → nothing of theirs is counted
      const sharedClasses = member.share_total_networth === false ? [] : Object.entries(SHARE_COLUMNS)
        .filter(([_, col]) => member[col] === true)
        .map(([cls]) => cls)

      if (sharedClasses.length === 0) {
        memberSummaries.push({
          memberId:      member.member_id,
          userId:        member.user_id,
          name:          memberName(member),
          avatarColor:   member.avatar_color,
          relationship:  member.relationship,
          totalPaise:    0,
          byAssetClass:  {},
          sharesNothing: true,
        })
        continue
      }

      const placeholders = sharedClasses
        .map((_, i) => `$${i + 2}`)
        .join(',')

      const assets = await pool.query(`
        SELECT
          asset_class,
          SUM(current_value_paise) AS total_value
        FROM canonical_assets
        WHERE user_id = $1
        AND is_active = true
        AND asset_class IN (${placeholders})

        GROUP BY asset_class
      `, [member.user_id, ...sharedClasses])

      const memberAssets: Record<string, number> = {}
      let memberTotal = 0

      for (const row of assets.rows) {
        const value = Number(row.total_value) || 0
        memberAssets[row.asset_class] = value
        memberTotal += value
        byAssetClass[row.asset_class] =
          (byAssetClass[row.asset_class] ?? 0) + value
      }

      totalPaise += memberTotal

      memberSummaries.push({
        memberId:     member.member_id,
        userId:       member.user_id,
        name:         memberName(member),
        avatarColor:  member.avatar_color,
        relationship: member.relationship,
        totalPaise:   memberTotal,
        byAssetClass: memberAssets,
        sharesNothing:false,
      })
    }

    return {
      totalPaise,
      members:      memberSummaries,
      byAssetClass,
      memberCount:  members.rows.length
    }
  },

  // One member's shared assets (drill-down). memberId is the family_vault_members row id.
  async getMemberAssets(
    pool:             Pool,
    vaultId:          string,
    requestingUserId: string,
    memberId:         string
  ): Promise<{
    member:   any
    assets:   any[]
    summary:  Record<string, number>
    sharesNothing: boolean
  }> {
    await verifyVaultAccess(pool, vaultId, requestingUserId)

    const member = await pool.query(`
      SELECT fvm.*, u.name_encrypted AS user_name_enc
        FROM family_vault_members fvm
        LEFT JOIN users u ON u.id = fvm.user_id
       WHERE fvm.vault_id = $1 AND fvm.id = $2 AND fvm.status = 'active' AND fvm.user_id IS NOT NULL
    `, [vaultId, memberId])
    const m = member.rows[0]
    if (!m) throw new FamilyError('Member not found', 404, 'NOT_FOUND')

    const sharedClasses = m.share_total_networth === false ? [] : Object.entries(SHARE_COLUMNS)
      .filter(([_, col]) => m[col] === true)
      .map(([cls]) => cls)

    // Never return invite_token / invited_mobile or the member's raw sharing row
    const safeMember = {
      id:           m.id,
      name:         memberName(m),
      avatarColor:  m.avatar_color,
      relationship: m.relationship,
      sharedClasses,
    }
    if (sharedClasses.length === 0) {
      return { member: safeMember, assets: [], summary: {}, sharesNothing: true }
    }

    const placeholders = sharedClasses.map((_, i) => `$${i + 2}`).join(',')
    // Family sees institution, type and value — never account/folio numbers or nominee names
    const assets = await pool.query(`
      SELECT id, asset_class, institution_name, COALESCE(primary_source, source) AS source,
             current_value_paise, has_nominee, last_synced_at
        FROM canonical_assets
       WHERE user_id = $1 AND is_active = true AND asset_class IN (${placeholders})
       ORDER BY current_value_paise DESC NULLS LAST
    `, [m.user_id, ...sharedClasses])

    const summary: Record<string, number> = {}
    const rows = assets.rows.map((a: any) => {
      const value = Number(a.current_value_paise) || 0
      summary[a.asset_class] = (summary[a.asset_class] ?? 0) + value
      return { ...a, current_value_paise: value }
    })

    return { member: safeMember, assets: rows, summary, sharesNothing: false }
  },
  // Get combined net worth history for chart
  async getCombinedHistory(
    pool:    Pool,
    vaultId: string,
    userId:  string,
    months:  number = 12
  ): Promise<{
    month:      string
    totalPaise: number
    members:    Record<string, number>
  }[]> {
    await verifyVaultAccess(pool, vaultId, userId)

    const result = await pool.query(`
      SELECT
        snapshot_month,
        total_paise,
        member_breakdown
      FROM family_networth_snapshots
      WHERE vault_id = $1
      ORDER BY snapshot_month DESC
      LIMIT $2
    `, [vaultId, months])

    return result.rows.map(r => ({
      month:      r.snapshot_month,
      totalPaise: parseInt(r.total_paise),
      members:    r.member_breakdown ?? {}
    })).reverse()
  },

  // Family estate readiness
  async getEstateReadiness(
    pool:    Pool,
    vaultId: string,
    userId:  string
  ): Promise<{
    overallScore: number
    members:      EstateReadinessPerMember[]
  }> {
    await verifyVaultAccess(pool, vaultId, userId)

    const members = await pool.query(`
      SELECT fvm.id AS member_id, fvm.user_id, fvm.display_name, fvm.invited_name, fvm.avatar_color,
             u.name_encrypted AS user_name_enc
        FROM family_vault_members fvm
        LEFT JOIN users u ON u.id = fvm.user_id
       WHERE fvm.vault_id = $1 AND fvm.status = 'active' AND fvm.user_id IS NOT NULL
       ORDER BY fvm.accepted_at ASC NULLS LAST
    `, [vaultId])

    const results: EstateReadinessPerMember[] = []

    for (const m of members.rows) {
      const nomineeResult = await pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE has_nominee = true)::int AS with_nominee
        FROM canonical_assets
        WHERE user_id = $1
        AND asset_class IN (
          'BANK_ACCOUNT','FIXED_DEPOSIT','MUTUAL_FUND',
          'EQUITY','NPS','INSURANCE_LIFE','EPF'
        )
        AND is_active = true
      `, [m.user_id])

      const total       = nomineeResult.rows[0].total
      const withNominee = nomineeResult.rows[0].with_nominee
      const nomineePct  = total > 0 ? Math.round(withNominee / total * 100) : 0

      const willResult = await pool.query(`
        SELECT status FROM wills
         WHERE user_id = $1
         ORDER BY CASE WHEN status IN ('completed','signed') THEN 0 ELSE 1 END, updated_at DESC NULLS LAST
         LIMIT 1
      `, [m.user_id])
      const willStatus = willResult.rows[0]?.status ?? null
      const hasWill = willStatus === 'completed' || willStatus === 'signed'

      // 70% nominee coverage + 30% will. With no linked accounts the nominee part can't be
      // assessed, so it doesn't drag the score to zero — the UI says "no accounts linked".
      const estateScore = total > 0
        ? Math.round(nomineePct * 0.7 + (hasWill ? 30 : 0))
        : (hasWill ? 30 : 0)

      results.push({
        memberId:    m.member_id,
        userId:      m.user_id,
        name:        memberName(m),
        avatarColor: m.avatar_color,
        nomineePct,
        hasWill,
        willStatus,
        estateScore,
        totalAccounts:       total,
        accountsWithNominee: withNominee,
      })
    }

    const overallScore = results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.estateScore, 0) / results.length)
      : 0

    return { overallScore, members: results }
  }
}

interface MemberSummary {
  memberId:     string
  userId:       string
  name:         string
  avatarColor:  string
  relationship: string
  totalPaise:   number
  byAssetClass: Record<string, number>
  sharesNothing:boolean
}

interface EstateReadinessPerMember {
  memberId:            string
  userId:              string
  name:                string
  avatarColor:         string
  nomineePct:          number
  hasWill:             boolean
  willStatus:          string | null
  estateScore:         number
  totalAccounts:       number
  accountsWithNominee: number
}

export async function verifyVaultAccess(
  pool:    Pool,
  vaultId: string,
  userId:  string
): Promise<void> {
  const result = await pool.query(`
    SELECT 1 FROM family_vaults WHERE id = $1 AND primary_user_id = $2
    UNION
    SELECT 1 FROM family_vault_members
    WHERE vault_id = $1 AND user_id = $2 AND status = 'active'
  `, [vaultId, userId])

  if (!result.rows.length) {
    throw new Error('You do not have access to this family vault')
  }
}
