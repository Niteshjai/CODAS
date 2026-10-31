import { Pool } from 'pg'
import { FamilyError, familyVault, memberName } from './familyVault'

export const GOAL_TYPES = [
  'education', 'home_purchase', 'emergency_fund', 'wedding', 'vacation',
  'retirement', 'vehicle', 'medical', 'other',
] as const

const MAX_PAISE = 1_000_000_000_00 * 100 // ₹1,000 crore — sanity cap
const formatINR = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`

async function activeMemberUserIds(pool: Pool, vaultId: string): Promise<string[]> {
  const r = await pool.query(
    `SELECT user_id FROM family_vault_members WHERE vault_id = $1 AND status = 'active' AND user_id IS NOT NULL`,
    [vaultId]
  )
  return r.rows.map((x: any) => x.user_id)
}

export const familyGoals = {

  async createGoal(
    pool:   Pool,
    vaultId:string,
    userId: string,
    data: {
      name:                 string
      description?:         string
      goalType:             string
      emoji?:               string
      targetAmountPaise:    number
      targetDate?:          string | null
      contributingMembers?: string[]
    }
  ): Promise<string> {
    const name = (data.name ?? '').trim().replace(/\s+/g, ' ')
    if (name.length < 2 || name.length > 100) throw new FamilyError('Give the goal a name (2–100 characters)')
    if (!(GOAL_TYPES as readonly string[]).includes(data.goalType)) throw new FamilyError('Choose a goal type')
    if (!Number.isInteger(data.targetAmountPaise) || data.targetAmountPaise < 100_00 || data.targetAmountPaise > MAX_PAISE) {
      throw new FamilyError('Target amount must be at least ₹100')
    }
    let targetDate: string | null = null
    if (data.targetDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.targetDate) || isNaN(Date.parse(data.targetDate))) {
        throw new FamilyError('Enter a valid target date')
      }
      if (data.targetDate < new Date().toISOString().slice(0, 10)) throw new FamilyError('Target date must be in the future')
      targetDate = data.targetDate
    }

    // Contributors default to everyone; any listed must be active members of this vault
    const members = await activeMemberUserIds(pool, vaultId)
    const contributors = data.contributingMembers?.length ? [...new Set(data.contributingMembers)] : members
    if (contributors.some(id => !members.includes(id))) throw new FamilyError('Contributors must be members of this vault')

    const result = await pool.query(`
      INSERT INTO family_goals (
        vault_id, created_by_user_id, name, description, goal_type, emoji,
        target_amount_paise, target_date, contributing_members
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
    `, [
      vaultId, userId, name, data.description?.trim().slice(0, 500) || null,
      data.goalType, (data.emoji ?? '').slice(0, 8) || '🎯',
      data.targetAmountPaise, targetDate, contributors,
    ])

    await familyVault.logActivity(pool, vaultId, userId, {
      type: 'goal_created',
      title: `New family goal: ${name}`,
      body: `Target ${formatINR(data.targetAmountPaise)}`,
      meta: { goalId: result.rows[0].id },
    })
    return result.rows[0].id
  },

  async addContribution(
    pool:       Pool,
    vaultId:    string,
    goalId:     string,
    userId:     string,
    amountPaise:number,
    note?:      string
  ): Promise<{ completed: boolean }> {
    if (!Number.isInteger(amountPaise) || amountPaise < 1_00 || amountPaise > MAX_PAISE) {
      throw new FamilyError('Enter an amount of at least ₹1')
    }

    const client = await pool.connect()
    let goal: any
    let completed = false
    try {
      await client.query('BEGIN')
      // Lock the goal so concurrent contributions can't race the running total
      const g = await client.query(
        'SELECT id, name, status, current_amount_paise, target_amount_paise FROM family_goals WHERE id = $1 AND vault_id = $2 FOR UPDATE',
        [goalId, vaultId]
      )
      goal = g.rows[0]
      if (!goal) throw new FamilyError('Goal not found', 404, 'NOT_FOUND')
      if (goal.status !== 'active') throw new FamilyError(`This goal is already ${goal.status}`, 409, 'GOAL_CLOSED')

      await client.query(`
        INSERT INTO family_goal_contributions (goal_id, user_id, amount_paise, note)
        VALUES ($1,$2,$3,$4)
      `, [goalId, userId, amountPaise, note?.trim().slice(0, 200) || null])

      const newTotal = Number(goal.current_amount_paise) + amountPaise
      completed = newTotal >= Number(goal.target_amount_paise)
      await client.query(`
        UPDATE family_goals
           SET current_amount_paise = $2, status = $3, updated_at = NOW()
         WHERE id = $1
      `, [goalId, newTotal, completed ? 'completed' : 'active'])
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    const who = await pool.query('SELECT name_encrypted AS user_name_enc FROM users WHERE id = $1', [userId])
    const name = memberName(who.rows[0] ?? {})
    await familyVault.logActivity(pool, vaultId, userId, {
      type: 'goal_contribution',
      title: `${name} added ${formatINR(amountPaise)} to ${goal.name}`,
      body: note?.trim().slice(0, 200) || null,
      meta: { goalId },
    })
    if (completed) {
      await familyVault.logActivity(pool, vaultId, userId, {
        type: 'goal_completed', title: `🎉 Goal reached: ${goal.name}`, body: null, meta: { goalId },
      })
    }
    return { completed }
  },

  /** Creator or vault owner can cancel a goal. */
  async cancelGoal(pool: Pool, vaultId: string, goalId: string, userId: string): Promise<void> {
    const r = await pool.query(`
      SELECT g.id, g.name, g.status, g.created_by_user_id, fv.primary_user_id
        FROM family_goals g JOIN family_vaults fv ON fv.id = g.vault_id
       WHERE g.id = $1 AND g.vault_id = $2
    `, [goalId, vaultId])
    const g = r.rows[0]
    if (!g || g.status === 'cancelled') throw new FamilyError('Goal not found', 404, 'NOT_FOUND')
    if (g.created_by_user_id !== userId && g.primary_user_id !== userId) {
      throw new FamilyError('Only the person who created this goal or the vault owner can remove it', 403, 'FORBIDDEN')
    }
    await pool.query(`UPDATE family_goals SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [goalId])
    await familyVault.logActivity(pool, vaultId, userId, {
      type: 'goal_cancelled', title: `Goal removed: ${g.name}`, body: null, meta: { goalId },
    })
  },

  async getGoals(pool: Pool, vaultId: string, viewerId: string): Promise<any[]> {
    const result = await pool.query(`
      SELECT
        g.id, g.name, g.description, g.goal_type, g.emoji, g.status,
        g.target_amount_paise, g.current_amount_paise, g.target_date,
        g.created_by_user_id, g.created_at, fv.primary_user_id,
        COALESCE(json_agg(
          json_build_object(
            'amountPaise', gc.amount_paise,
            'note',        gc.note,
            'userId',      gc.user_id,
            'at',          gc.contributed_at
          )
          ORDER BY gc.contributed_at DESC
        ) FILTER (WHERE gc.id IS NOT NULL), '[]') AS contributions
      FROM family_goals g
      JOIN family_vaults fv ON fv.id = g.vault_id
      LEFT JOIN family_goal_contributions gc ON gc.goal_id = g.id
      WHERE g.vault_id = $1 AND g.status IN ('active','completed')
      GROUP BY g.id, fv.primary_user_id
      ORDER BY (g.status = 'active') DESC, g.created_at DESC
    `, [vaultId])

    // Resolve contributor names once (only people who are or were in this vault)
    const names = await pool.query(`
      SELECT fvm.user_id, fvm.display_name, fvm.invited_name, u.name_encrypted AS user_name_enc
        FROM family_vault_members fvm
        LEFT JOIN users u ON u.id = fvm.user_id
       WHERE fvm.vault_id = $1 AND fvm.user_id IS NOT NULL
    `, [vaultId])
    const nameOf = new Map(names.rows.map((r: any) => [r.user_id, memberName(r)]))

    return result.rows.map((g: any) => {
      const target  = Number(g.target_amount_paise) || 0
      const current = Number(g.current_amount_paise) || 0
      return {
        id:                 g.id,
        name:               g.name,
        description:        g.description,
        goalType:           g.goal_type,
        emoji:              g.emoji,
        status:             g.status,
        targetAmountPaise:  target,
        currentAmountPaise: current,
        remainingPaise:     Math.max(0, target - current),
        progressPct:        target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0,
        targetDate:         g.target_date,
        createdAt:          g.created_at,
        canCancel:          g.created_by_user_id === viewerId || g.primary_user_id === viewerId,
        createdBy:          nameOf.get(g.created_by_user_id) ?? 'Former member',
        contributions:      (g.contributions as any[]).slice(0, 20).map(c => ({
          amountPaise: Number(c.amountPaise) || 0,
          note:        c.note,
          at:          c.at,
          by:          nameOf.get(c.userId) ?? 'Former member',
          isYou:       c.userId === viewerId,
        })),
        contributionCount:  (g.contributions as any[]).length,
      }
    })
  },
}
