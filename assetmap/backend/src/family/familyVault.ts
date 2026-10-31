import { Pool, PoolClient } from 'pg'
import { randomBytes } from 'crypto'
import { auditLogger } from '../services/auditLogger'
import { alertService } from '../services/alertService'
import { decryptPII, encryptPII, hashMobile } from '../utils/encryption'
import { logger } from '../utils/logger'

// ─────────────────────────────────────────────────────
// Family Vault — one owner (Pro) plus invited family members.
// Members never need their own Pro plan; the owner's plan covers the vault.
// A user is an active member of at most one vault (enforced by a unique index).
// ─────────────────────────────────────────────────────

export class FamilyError extends Error {
  constructor(message: string, public statusCode: 400 | 403 | 404 | 409 = 400, public code = 'FAMILY_ERROR') {
    super(message)
  }
}

export const RELATIONSHIPS = ['spouse', 'parent', 'child', 'sibling', 'grandparent', 'grandchild', 'other'] as const
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const AVATAR_COLOURS = ['#185FA5', '#1D9E75', '#534AB7', '#E24B4A', '#C27803', '#D85A30', '#0E7490']

const SHARE_KEYS = {
  shareBankAccounts:  'share_bank_accounts',
  shareFixedDeposits: 'share_fixed_deposits',
  shareMutualFunds:   'share_mutual_funds',
  shareEquity:        'share_equity',
  shareNps:           'share_nps',
  shareEpf:           'share_epf',
  shareInsurance:     'share_insurance',
  shareLand:          'share_land',
  shareGold:          'share_gold',
  shareTotalNetworth: 'share_total_networth',
} as const
export type SharingPrefs = { [K in keyof typeof SHARE_KEYS]?: boolean } & { displayName?: string }

export function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null
  try { return decryptPII(value) } catch { return null }
}

const last10 = (mobile: string) => mobile.replace(/[^0-9]/g, '').slice(-10)

// Invites are matched to the invitee's account by a salted hash of the 10-digit number
export const inviteMobileHash = (mobile: string) => hashMobile(`invite:${last10(mobile)}`)

/** Name shown to the family: the member's chosen name, else their account name, else the name the owner typed. */
export function memberName(row: { display_name?: string | null; user_name_enc?: string | null; invited_name?: string | null }): string {
  return row.display_name?.trim() || safeDecrypt(row.user_name_enc) || row.invited_name?.trim() || 'Family member'
}

async function userMobile10(db: Pool | PoolClient, userId: string): Promise<string | null> {
  const r = await db.query('SELECT mobile_encrypted FROM users WHERE id = $1', [userId])
  const mobile = safeDecrypt(r.rows[0]?.mobile_encrypted)
  const digits = mobile ? last10(mobile) : ''
  return digits.length === 10 ? digits : null
}

async function userName(db: Pool | PoolClient, userId: string): Promise<string> {
  const r = await db.query('SELECT name_encrypted FROM users WHERE id = $1', [userId])
  return safeDecrypt(r.rows[0]?.name_encrypted) || 'A family member'
}

// Does this pending invite belong to the user? Legacy rows (before hashing) kept the plaintext number.
function inviteIsForMobile(invite: any, mobile10: string | null): boolean {
  if (!mobile10) return false
  if (invite.invited_mobile_hash) return invite.invited_mobile_hash === inviteMobileHash(mobile10)
  return !!invite.invited_mobile && last10(invite.invited_mobile) === mobile10
}
// MOCK_MODE runs every request as one fixed user, so the binding can't be checked there
const inviteMatchesMobile = (invite: any, mobile10: string | null) =>
  process.env.MOCK_MODE === 'true' || inviteIsForMobile(invite, mobile10)

async function notify(fn: () => Promise<unknown>, what: string) {
  try { await fn() } catch (err) {
    logger.warn(`[FamilyVault] ${what} failed`, { error: (err as Error).message })
  }
}

export interface Membership { vaultId: string; memberId: string; isOwner: boolean }

export const familyVault = {

  /** The vault the user currently belongs to (as owner or member), if any. */
  async getMembership(db: Pool | PoolClient, userId: string): Promise<Membership | null> {
    const r = await db.query(`
      SELECT fvm.id AS member_id, fv.id AS vault_id, fv.primary_user_id
        FROM family_vault_members fvm
        JOIN family_vaults fv ON fv.id = fvm.vault_id AND fv.is_active = true
       WHERE fvm.user_id = $1 AND fvm.status = 'active'
       ORDER BY (fv.primary_user_id = $1) DESC
       LIMIT 1
    `, [userId])
    const row = r.rows[0]
    return row ? { vaultId: row.vault_id, memberId: row.member_id, isOwner: row.primary_user_id === userId } : null
  },

  async createVault(pool: Pool, userId: string, vaultName = 'My Family'): Promise<string> {
    const name = vaultName.trim().replace(/\s+/g, ' ').slice(0, 100) || 'My Family'
    const membership = await this.getMembership(pool, userId)
    if (membership?.isOwner) return membership.vaultId
    if (membership) {
      throw new FamilyError("You're already part of a family vault. Leave it before creating your own.", 409, 'ALREADY_IN_VAULT')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(`
        INSERT INTO family_vaults (primary_user_id, vault_name)
        VALUES ($1, $2)
        ON CONFLICT (primary_user_id)
        DO UPDATE SET vault_name = EXCLUDED.vault_name, is_active = true, updated_at = NOW()
        RETURNING id
      `, [userId, name])
      const vaultId = result.rows[0].id

      // Owner is always the first active member. display_name stays NULL so the
      // family sees the owner's real name (not "Me").
      await client.query(`
        INSERT INTO family_vault_members (
          vault_id, user_id, primary_user_id, status, relationship, avatar_color,
          share_gold, accepted_at
        )
        SELECT $1, $2, $2, 'active', 'other', $3, false, NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM family_vault_members WHERE vault_id = $1 AND user_id = $2 AND status = 'active'
        )
      `, [vaultId, userId, AVATAR_COLOURS[0]])
      await client.query('COMMIT')

      await auditLogger.log(userId, 'FAMILY_VAULT_CREATED', 'family_vault', vaultId)
      return vaultId
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  /** Owner closes the vault: every member loses access and shared goals/history are deleted. */
  async closeVault(pool: Pool, ownerId: string): Promise<void> {
    const vault = await pool.query(
      'SELECT id FROM family_vaults WHERE primary_user_id = $1 AND is_active = true', [ownerId]
    )
    if (!vault.rows[0]) throw new FamilyError('You do not manage a family vault', 404, 'NO_VAULT')
    const vaultId = vault.rows[0].id

    const members = await pool.query(`
      SELECT user_id FROM family_vault_members
       WHERE vault_id = $1 AND status = 'active' AND user_id IS NOT NULL AND user_id <> $2
    `, [vaultId, ownerId])

    await pool.query('DELETE FROM family_vaults WHERE id = $1', [vaultId])
    await auditLogger.log(ownerId, 'FAMILY_VAULT_CLOSED', 'family_vault', vaultId, undefined, undefined,
      { membersRemoved: members.rows.length })

    for (const m of members.rows) {
      await notify(() => alertService.sendPushNotification(pool, m.user_id,
        'Family vault closed', 'The family vault you were part of has been closed by its owner'), 'push')
    }
  },

  async inviteMember(
    pool: Pool,
    ownerId: string,
    params: { mobile: string; name: string; relationship: string }
  ): Promise<{ memberId: string; smsSent: boolean; mobileHint: string }> {
    const mobile = last10(params.mobile)
    const name = params.name.trim().replace(/\s+/g, ' ')
    if (!/^[6-9][0-9]{9}$/.test(mobile)) throw new FamilyError('Enter a valid 10-digit Indian mobile number')
    if (name.length < 2 || !/^[\p{L} .'-]+$/u.test(name)) throw new FamilyError('Enter their name using letters only')
    if (!(RELATIONSHIPS as readonly string[]).includes(params.relationship)) throw new FamilyError('Choose a relationship')

    const vault = await pool.query(
      'SELECT id, max_members FROM family_vaults WHERE primary_user_id = $1 AND is_active = true', [ownerId]
    )
    if (!vault.rows[0]) {
      throw new FamilyError('Only the vault owner can invite members', 403, 'NOT_OWNER')
    }
    const { id: vaultId, max_members: maxMembers } = vault.rows[0]

    if (mobile === await userMobile10(pool, ownerId)) {
      throw new FamilyError("That's your own number. Enter your family member's mobile number.")
    }

    const mobileHash = inviteMobileHash(mobile)
    const rows = await pool.query(`
      SELECT fvm.id, fvm.status, fvm.invite_token_expires, fvm.invited_mobile_hash, fvm.invited_mobile,
             u.mobile_encrypted
        FROM family_vault_members fvm
        LEFT JOIN users u ON u.id = fvm.user_id
       WHERE fvm.vault_id = $1 AND fvm.status IN ('invited','active')
    `, [vaultId])

    let reuseId: string | null = null
    let occupied = 0
    for (const r of rows.rows) {
      const expired = r.status === 'invited' && new Date(r.invite_token_expires) <= new Date()
      const sameNumber = r.status === 'active'
        ? last10(safeDecrypt(r.mobile_encrypted) ?? '') === mobile
        : inviteIsForMobile(r, mobile)
      if (sameNumber && r.status === 'active') throw new FamilyError('This person is already a member of your family vault', 409, 'ALREADY_MEMBER')
      if (sameNumber && !expired) throw new FamilyError('An invitation to this number is already pending. You can resend it from their card.', 409, 'ALREADY_INVITED')
      if (sameNumber && expired) { reuseId = r.id; continue }
      if (!expired) occupied++
    }
    if (occupied >= maxMembers) {
      throw new FamilyError(`Your family vault is full (${maxMembers} members). Remove a member or cancel an invite first.`, 409, 'VAULT_FULL')
    }

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + INVITE_TTL_MS)
    let memberId: string

    if (reuseId) {
      await pool.query(`
        UPDATE family_vault_members
           SET invite_token = $2, invite_token_expires = $3, invited_name = $4, display_name = $4,
               relationship = $5, invited_at = NOW(), updated_at = NOW()
         WHERE id = $1
      `, [reuseId, token, expires, name, params.relationship])
      memberId = reuseId
    } else {
      const colours = await pool.query(
        `SELECT avatar_color FROM family_vault_members WHERE vault_id = $1 AND status IN ('invited','active')`, [vaultId]
      )
      const used = new Set(colours.rows.map((r: any) => r.avatar_color))
      const colour = AVATAR_COLOURS.slice(1).find(c => !used.has(c)) ?? AVATAR_COLOURS[1]

      const result = await pool.query(`
        INSERT INTO family_vault_members (
          vault_id, primary_user_id, invite_token, invite_token_expires,
          invited_mobile_hash, invited_mobile_encrypted, invited_name,
          relationship, status, display_name, avatar_color
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'invited',$7,$9)
        RETURNING id
      `, [vaultId, ownerId, token, expires, mobileHash, encryptPII(mobile), name, params.relationship, colour])
      memberId = result.rows[0].id
    }

    const smsSent = await this.sendInviteSms(pool, ownerId, mobile, token)

    await this.logActivity(pool, vaultId, ownerId, {
      type: 'member_invited',
      title: `${name} was invited to the family vault`,
      body: null,
      meta: { relationship: params.relationship },
    })
    await auditLogger.log(ownerId, 'FAMILY_MEMBER_INVITED', 'family_vault_member', memberId,
      undefined, undefined, { relationship: params.relationship, resent: !!reuseId })

    return { memberId, smsSent, mobileHint: `••••${mobile.slice(-4)}` }
  },

  /** Owner re-sends an invite: new link, fresh 7-day expiry. */
  async resendInvite(pool: Pool, ownerId: string, memberId: string): Promise<{ smsSent: boolean }> {
    const r = await pool.query(`
      SELECT fvm.id, fvm.invited_mobile_encrypted, fvm.invited_mobile
        FROM family_vault_members fvm
        JOIN family_vaults fv ON fv.id = fvm.vault_id AND fv.is_active = true
       WHERE fvm.id = $1 AND fv.primary_user_id = $2 AND fvm.status = 'invited'
    `, [memberId, ownerId])
    const row = r.rows[0]
    if (!row) throw new FamilyError('Invitation not found', 404, 'NOT_FOUND')

    const mobile = safeDecrypt(row.invited_mobile_encrypted) ?? row.invited_mobile
    const token = randomBytes(32).toString('hex')
    await pool.query(`
      UPDATE family_vault_members
         SET invite_token = $2, invite_token_expires = $3, invited_at = NOW(), updated_at = NOW()
       WHERE id = $1
    `, [memberId, token, new Date(Date.now() + INVITE_TTL_MS)])

    return { smsSent: mobile ? await this.sendInviteSms(pool, ownerId, mobile, token) : false }
  },

  async sendInviteSms(pool: Pool, ownerId: string, mobile: string, token: string): Promise<boolean> {
    const ownerName = await userName(pool, ownerId)
    const url = `${process.env.FRONTEND_URL}/family/join?token=${token}`
    try {
      return await alertService.sendSMS(ownerId, mobile,
        `${ownerName} has invited you to their AssetMap Family Vault. ` +
        `Sign in with this number to accept: ${url} (expires in 7 days)`)
    } catch (err) {
      logger.warn('[FamilyVault] Invite SMS failed', { error: (err as Error).message })
      return false
    }
  },

  /** Pending invitations addressed to the user's own mobile number. */
  async listMyInvitations(pool: Pool, userId: string): Promise<any[]> {
    const mobile10 = await userMobile10(pool, userId)
    if (!mobile10 && process.env.MOCK_MODE !== 'true') return []
    const r = await pool.query(`
      SELECT fvm.id, fvm.relationship, fvm.invited_at, fvm.invite_token_expires,
             fvm.invited_mobile_hash, fvm.invited_mobile,
             fv.vault_name, fv.primary_user_id, u.name_encrypted AS owner_name_enc
        FROM family_vault_members fvm
        JOIN family_vaults fv ON fv.id = fvm.vault_id AND fv.is_active = true
        JOIN users u ON u.id = fv.primary_user_id
       WHERE fvm.status = 'invited' AND fvm.invite_token_expires > NOW()
         AND fv.primary_user_id <> $1
         AND (fvm.invited_mobile_hash = $2
              OR (fvm.invited_mobile_hash IS NULL AND right(regexp_replace(fvm.invited_mobile, '[^0-9]', '', 'g'), 10) = $3))
       ORDER BY fvm.invited_at DESC
    `, [userId, mobile10 ? inviteMobileHash(mobile10) : null, mobile10])
    return r.rows.map(row => this.toInvitation(row))
  },

  toInvitation(row: any) {
    return {
      inviteId:     row.id,
      vaultName:    row.vault_name,
      inviterName:  safeDecrypt(row.owner_name_enc) || 'A family member',
      relationship: row.relationship,
      invitedAt:    row.invited_at,
      expiresAt:    row.invite_token_expires,
    }
  },

  async findInvite(db: Pool | PoolClient, userId: string, by: { token?: string; inviteId?: string }, lock = false) {
    const r = await db.query(`
      SELECT fvm.*, fv.vault_name, fv.max_members, fv.primary_user_id AS owner_id, u.name_encrypted AS owner_name_enc
        FROM family_vault_members fvm
        JOIN family_vaults fv ON fv.id = fvm.vault_id AND fv.is_active = true
        JOIN users u ON u.id = fv.primary_user_id
       WHERE ${by.token ? 'fvm.invite_token = $1' : 'fvm.id = $1'}
         AND fvm.status = 'invited' AND fvm.invite_token_expires > NOW()
       ${lock ? 'FOR UPDATE OF fvm' : ''}
    `, [by.token ?? by.inviteId])
    const invite = r.rows[0]
    if (!invite) throw new FamilyError('This invitation is invalid, was cancelled, or has expired. Ask the vault owner to resend it.', 404, 'INVITE_INVALID')
    if (invite.owner_id === userId) throw new FamilyError("This is an invitation from your own vault — it's for the family member you invited.", 400, 'OWN_INVITE')
    if (!inviteMatchesMobile(invite, await userMobile10(db, userId))) {
      throw new FamilyError('This invitation was sent to a different mobile number. Sign in with the number it was sent to.', 403, 'WRONG_MOBILE')
    }
    return invite
  },

  /** What the invitee sees before accepting (link flow). */
  async previewInvite(pool: Pool, userId: string, by: { token?: string; inviteId?: string }) {
    const invite = await this.findInvite(pool, userId, by)
    const membership = await this.getMembership(pool, userId)
    let blockedReason: string | null = null
    let replacesOwnVault = false
    if (membership && !membership.isOwner) {
      blockedReason = "You're already part of another family vault. Leave it before joining this one."
    } else if (membership?.isOwner) {
      const others = await pool.query(`
        SELECT 1 FROM family_vault_members WHERE vault_id = $1 AND status IN ('invited','active') AND id <> $2 LIMIT 1
      `, [membership.vaultId, membership.memberId])
      if (others.rows.length) blockedReason = 'You manage your own family vault with other members. Close it before joining another.'
      else replacesOwnVault = true
    }
    return { ...this.toInvitation(invite), blockedReason, replacesOwnVault }
  },

  async acceptInvite(
    pool: Pool,
    userId: string,
    by: { token?: string; inviteId?: string }
  ): Promise<{ vaultId: string; primaryUserName: string }> {
    const client = await pool.connect()
    let invite: any
    try {
      await client.query('BEGIN')
      invite = await this.findInvite(client, userId, by, true)

      const membership = await this.getMembership(client, userId)
      if (membership && !membership.isOwner) {
        throw new FamilyError("You're already part of another family vault. Leave it before joining this one.", 409, 'ALREADY_IN_VAULT')
      }
      if (membership?.isOwner) {
        const others = await client.query(`
          SELECT 1 FROM family_vault_members WHERE vault_id = $1 AND status IN ('invited','active') AND id <> $2 LIMIT 1
        `, [membership.vaultId, membership.memberId])
        if (others.rows.length) {
          throw new FamilyError('You manage your own family vault with other members. Close it before joining another.', 409, 'OWNS_VAULT')
        }
        // Their own vault has nobody else in it — replace it with the family they're joining
        await client.query('DELETE FROM family_vaults WHERE id = $1', [membership.vaultId])
      }

      const active = await client.query(
        `SELECT COUNT(*)::int AS n FROM family_vault_members WHERE vault_id = $1 AND status = 'active'`, [invite.vault_id]
      )
      if (active.rows[0].n >= invite.max_members) {
        throw new FamilyError('This family vault is already full. Ask the owner to make room.', 409, 'VAULT_FULL')
      }

      await client.query(`
        UPDATE family_vault_members
           SET user_id = $2, status = 'active', accepted_at = NOW(),
               invite_token = NULL, invite_token_expires = NULL,
               invited_mobile = NULL, invited_mobile_encrypted = NULL,
               display_name = NULL, updated_at = NOW()
         WHERE id = $1
      `, [invite.id, userId])
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    const joinerName = await userName(pool, userId)
    await this.logActivity(pool, invite.vault_id, userId, {
      type: 'member_joined',
      title: `${joinerName} joined the family vault`,
      body: null,
      meta: { relationship: invite.relationship },
    })
    await auditLogger.log(userId, 'FAMILY_MEMBER_JOINED', 'family_vault_member', invite.id)
    await notify(() => alertService.sendPushNotification(pool, invite.owner_id,
      'New family member', `${joinerName} accepted your family vault invitation`), 'push')

    return { vaultId: invite.vault_id, primaryUserName: safeDecrypt(invite.owner_name_enc) || 'your family' }
  },

  async declineInvite(pool: Pool, userId: string, inviteId: string): Promise<void> {
    const invite = await this.findInvite(pool, userId, { inviteId })
    await pool.query(`
      UPDATE family_vault_members
         SET status = 'removed', invite_token = NULL, invited_mobile = NULL,
             invited_mobile_encrypted = NULL, updated_at = NOW()
       WHERE id = $1
    `, [invite.id])
    await this.logActivity(pool, invite.vault_id, invite.owner_id, {
      type: 'member_left',
      title: `${invite.invited_name} declined the invitation`,
      body: null,
      meta: {},
    })
  },

  async updateVisibility(pool: Pool, userId: string, prefs: SharingPrefs): Promise<void> {
    const membership = await this.getMembership(pool, userId)
    if (!membership) throw new FamilyError("You're not part of a family vault", 404, 'NO_VAULT')

    const sets: string[] = []
    const values: unknown[] = [membership.memberId]
    for (const [key, col] of Object.entries(SHARE_KEYS)) {
      const v = prefs[key as keyof typeof SHARE_KEYS]
      if (typeof v === 'boolean') { values.push(v); sets.push(`${col} = $${values.length}`) }
    }
    if (prefs.displayName !== undefined) {
      const name = prefs.displayName.trim().replace(/\s+/g, ' ')
      if (name && !/^[\p{L} .'-]{2,50}$/u.test(name)) throw new FamilyError('Display name can only contain letters (2–50 characters)')
      values.push(name || null)            // empty → fall back to the account name
      sets.push(`display_name = $${values.length}`)
    }
    if (!sets.length) return

    await pool.query(
      `UPDATE family_vault_members SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1`, values
    )
    await auditLogger.log(userId, 'FAMILY_SHARING_UPDATED', 'family_vault_member', membership.memberId,
      undefined, undefined, { fields: Object.keys(prefs) })
  },

  /** Owner removes a member or cancels a pending invite. */
  async removeMember(pool: Pool, ownerId: string, memberId: string): Promise<void> {
    const r = await pool.query(`
      SELECT fvm.id, fvm.user_id, fvm.status, fvm.invited_name, fvm.display_name,
             fv.id AS vault_id, u.name_encrypted AS user_name_enc
        FROM family_vault_members fvm
        JOIN family_vaults fv ON fv.id = fvm.vault_id AND fv.is_active = true
        LEFT JOIN users u ON u.id = fvm.user_id
       WHERE fvm.id = $1 AND fv.primary_user_id = $2 AND fvm.status IN ('invited','active','paused')
    `, [memberId, ownerId])
    const m = r.rows[0]
    if (!m) throw new FamilyError('Member not found', 404, 'NOT_FOUND')
    if (m.user_id === ownerId) throw new FamilyError("You can't remove yourself. Close the vault instead.")

    await pool.query(`
      UPDATE family_vault_members
         SET status = 'removed', invite_token = NULL, invited_mobile = NULL,
             invited_mobile_encrypted = NULL, updated_at = NOW()
       WHERE id = $1
    `, [memberId])

    const name = memberName(m)
    await this.logActivity(pool, m.vault_id, ownerId, {
      type: 'member_left',
      title: m.status === 'invited' ? `Invitation to ${name} was cancelled` : `${name} was removed from the vault`,
      body: null,
      meta: {},
    })
    await auditLogger.log(ownerId, 'FAMILY_MEMBER_REMOVED', 'family_vault_member', memberId,
      undefined, undefined, { wasInvite: m.status === 'invited' })

    if (m.user_id) {
      await notify(() => alertService.sendPushNotification(pool, m.user_id,
        'Removed from family vault', 'You have been removed from the family vault'), 'push')
    }
  },

  /** A member (not the owner) leaves the vault they joined. */
  async leaveVault(pool: Pool, userId: string): Promise<void> {
    const membership = await this.getMembership(pool, userId)
    if (!membership) throw new FamilyError("You're not part of a family vault", 404, 'NO_VAULT')
    if (membership.isOwner) {
      throw new FamilyError('You own this vault. Close it instead — that removes everyone.', 400, 'OWNER_CANNOT_LEAVE')
    }

    await pool.query(
      `UPDATE family_vault_members SET status = 'removed', updated_at = NOW() WHERE id = $1`, [membership.memberId]
    )
    const name = await userName(pool, userId)
    await this.logActivity(pool, membership.vaultId, userId, {
      type: 'member_left', title: `${name} left the family vault`, body: null, meta: {},
    })
    await auditLogger.log(userId, 'FAMILY_MEMBER_LEFT', 'family_vault_member', membership.memberId)

    const owner = await pool.query('SELECT primary_user_id FROM family_vaults WHERE id = $1', [membership.vaultId])
    if (owner.rows[0]) {
      await notify(() => alertService.sendPushNotification(pool, owner.rows[0].primary_user_id,
        'Family member left', `${name} left your family vault`), 'push')
    }
  },

  async logActivity(
    pool: Pool,
    vaultId: string,
    userId: string,
    data: { type: string; title: string; body: string | null; meta: object }
  ): Promise<void> {
    // The feed is informational: never let it fail the action that triggered it
    await notify(() => pool.query(`
      INSERT INTO family_activity_feed (vault_id, user_id, activity_type, title, body, metadata)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [vaultId, userId, data.type, data.title, data.body, JSON.stringify(data.meta)]), 'activity log')
  },

  /** Vault + members as seen by the requesting user (owner or member). */
  async getVaultDetails(pool: Pool, userId: string): Promise<any> {
    const membership = await this.getMembership(pool, userId)
    if (!membership) return null

    const vault = await pool.query(
      'SELECT id, vault_name, max_members, primary_user_id, created_at FROM family_vaults WHERE id = $1',
      [membership.vaultId]
    )
    const v = vault.rows[0]

    const rows = await pool.query(`
      SELECT fvm.*, u.name_encrypted AS user_name_enc
        FROM family_vault_members fvm
        LEFT JOIN users u ON u.id = fvm.user_id
       WHERE fvm.vault_id = $1 AND fvm.status IN ('invited','active','paused')
       ORDER BY (fvm.user_id = $2) DESC NULLS LAST,
                (fvm.status = 'active') DESC,
                fvm.accepted_at ASC NULLS LAST, fvm.invited_at ASC
    `, [v.id, v.primary_user_id])

    const now = Date.now()
    const members = rows.rows.map((m: any) => {
      const isOwnerRow = m.user_id === v.primary_user_id
      const expired = m.status === 'invited' && new Date(m.invite_token_expires).getTime() <= now
      const sharing = Object.fromEntries(Object.entries(SHARE_KEYS).map(([k, col]) => [k, !!m[col]]))
      const invitedMobile = membership.isOwner && m.status === 'invited'
        ? (safeDecrypt(m.invited_mobile_encrypted) ?? m.invited_mobile) : null
      return {
        id:           m.id,
        userId:       m.status === 'active' ? m.user_id : null,
        displayName:  memberName(m),
        customName:   m.display_name ?? null,
        relationship: isOwnerRow ? 'owner' : m.relationship,
        role:         isOwnerRow ? 'owner' : 'member',
        status:       expired ? 'expired' : m.status,
        isYou:        m.user_id === userId,
        avatarColor:  m.avatar_color || AVATAR_COLOURS[1],
        ...sharing,
        // Only the owner sees who a pending invite went to, and only the last 4 digits
        mobileHint:   invitedMobile ? `••••${last10(invitedMobile).slice(-4)}` : null,
        acceptedAt:   m.accepted_at,
        invitedAt:    m.invited_at,
        expiresAt:    m.status === 'invited' ? m.invite_token_expires : null,
      }
    })

    const seats = members.filter((m: any) => m.status === 'active' || m.status === 'invited').length
    return {
      id:              v.id,
      vault_name:      v.vault_name,
      max_members:     v.max_members,
      primary_user_id: v.primary_user_id,
      created_at:      v.created_at,
      seatsUsed:       seats,
      viewer:          { userId, memberId: membership.memberId, isOwner: membership.isOwner },
      members,
    }
  },
}
