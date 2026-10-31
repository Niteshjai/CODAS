import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken }  from '../middleware/auth'
import { planEnforcer }       from '../plans/planEnforcer'
import { pool }               from '../db/connection'
import { familyVault, FamilyError, RELATIONSHIPS, safeDecrypt } from '../family/familyVault'
import { familyAggregator, verifyVaultAccess } from '../family/familyAggregator'
import { familyGoals, GOAL_TYPES } from '../family/familyGoals'

// Rejects with 403 unless the caller is the vault owner or an active member
async function requireVaultAccess(req: FastifyRequest, reply: FastifyReply) {
  const { vaultId } = req.params as { vaultId: string }
  try {
    await verifyVaultAccess(pool, vaultId, req.user!.id)
  } catch {
    return reply.status(403).send({
      success:false, error:{ code:'FORBIDDEN', message:'You do not have access to this family vault' }
    })
  }
}

// Expected business-rule failures carry a user-safe message; anything else is a real 500
function handleError(reply: FastifyReply, err: unknown) {
  if (err instanceof FamilyError) {
    return reply.status(err.statusCode).send({ success:false, error:{ code: err.code, message: err.message } })
  }
  throw err
}

const uuidParam = (...names: string[]) => ({
  type: 'object',
  required: names,
  properties: Object.fromEntries(names.map(n => [n, { type: 'string', format: 'uuid' }])),
})
const token64 = { type:'string', pattern:'^[0-9a-f]{64}$' }

export async function familyRoutes(app: FastifyInstance) {
  // Members never need their own plan — only creating a vault and inviting are Pro features
  const authed      = [verifyAccessToken]
  const vaultMember = [verifyAccessToken, requireVaultAccess]
  const proOnly     = [verifyAccessToken, planEnforcer.requireFeature('family_vault', pool)]

  // ── Vault
  app.post('/vault', {
    preHandler: proOnly,
    schema: {
      body: {
        type: 'object',
        properties: { vaultName: { type:'string', maxLength:100 } },
        additionalProperties: false,
      }
    },
    handler: async (req, reply) => {
      try {
        const { vaultName } = (req.body ?? {}) as { vaultName?: string }
        const vaultId = await familyVault.createVault(pool, req.user!.id, vaultName)
        return reply.status(201).send({ success:true, data:{ vaultId } })
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.get('/vault', {
    preHandler: authed,
    handler: async (req, reply) => {
      const vault = await familyVault.getVaultDetails(pool, req.user!.id)
      if (!vault) return reply.status(404).send({
        success:false, error:{ code:'NO_VAULT', message:"You're not part of a family vault yet" }
      })
      return { success:true, data:vault }
    }
  })

  app.delete('/vault', {
    preHandler: authed,
    handler: async (req, reply) => {
      try {
        await familyVault.closeVault(pool, req.user!.id)
        return { success:true }
      } catch (err) { return handleError(reply, err) }
    }
  })

  // ── Invites (owner)
  app.post('/invite', {
    preHandler: proOnly,
    schema: {
      body: {
        type:'object',
        required:['mobile','name','relationship'],
        properties: {
          mobile:       { type:'string', pattern:'^[6-9][0-9]{9}$' },
          name:         { type:'string', minLength:2, maxLength:100 },
          relationship: { type:'string', enum:[...RELATIONSHIPS] }
        },
        additionalProperties:false
      }
    },
    handler: async (req, reply) => {
      try {
        const result = await familyVault.inviteMember(pool, req.user!.id, req.body as any)
        return reply.status(201).send({ success:true, data:result })
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.post('/members/:memberId/resend', {
    preHandler: proOnly,
    schema: { params: uuidParam('memberId') },
    handler: async (req, reply) => {
      try {
        const { memberId } = req.params as { memberId: string }
        const data = await familyVault.resendInvite(pool, req.user!.id, memberId)
        return { success:true, data }
      } catch (err) { return handleError(reply, err) }
    }
  })

  // Remove a member or cancel a pending invite (owner)
  app.delete('/members/:memberId', {
    preHandler: authed,
    schema: { params: uuidParam('memberId') },
    handler: async (req, reply) => {
      try {
        const { memberId } = req.params as { memberId: string }
        await familyVault.removeMember(pool, req.user!.id, memberId)
        return { success:true }
      } catch (err) { return handleError(reply, err) }
    }
  })

  // ── Invitations (invitee) — matched to the signed-in user's own mobile number
  app.get('/invitations', {
    preHandler: authed,
    handler: async (req) => {
      const data = await familyVault.listMyInvitations(pool, req.user!.id)
      return { success:true, data }
    }
  })

  app.post('/invitations/:inviteId/preview', {
    preHandler: authed,
    schema: { params: uuidParam('inviteId') },
    handler: async (req, reply) => {
      try {
        const { inviteId } = req.params as { inviteId: string }
        return { success:true, data: await familyVault.previewInvite(pool, req.user!.id, { inviteId }) }
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.post('/invitations/:inviteId/accept', {
    preHandler: authed,
    schema: { params: uuidParam('inviteId') },
    handler: async (req, reply) => {
      try {
        const { inviteId } = req.params as { inviteId: string }
        return { success:true, data: await familyVault.acceptInvite(pool, req.user!.id, { inviteId }) }
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.post('/invitations/:inviteId/decline', {
    preHandler: authed,
    schema: { params: uuidParam('inviteId') },
    handler: async (req, reply) => {
      try {
        const { inviteId } = req.params as { inviteId: string }
        await familyVault.declineInvite(pool, req.user!.id, inviteId)
        return { success:true }
      } catch (err) { return handleError(reply, err) }
    }
  })

  // SMS-link flow: the token travels in the body, never in a URL we log
  app.post('/join/preview', {
    preHandler: authed,
    schema: { body: { type:'object', required:['token'], properties:{ token: token64 }, additionalProperties:false } },
    handler: async (req, reply) => {
      try {
        const { token } = req.body as { token: string }
        return { success:true, data: await familyVault.previewInvite(pool, req.user!.id, { token }) }
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.post('/join', {
    preHandler: authed,
    schema: { body: { type:'object', required:['token'], properties:{ token: token64 }, additionalProperties:false } },
    handler: async (req, reply) => {
      try {
        const { token } = req.body as { token: string }
        return { success:true, data: await familyVault.acceptInvite(pool, req.user!.id, { token }) }
      } catch (err) { return handleError(reply, err) }
    }
  })

  // ── Membership (member)
  app.post('/leave', {
    preHandler: authed,
    handler: async (req, reply) => {
      try {
        await familyVault.leaveVault(pool, req.user!.id)
        return { success:true }
      } catch (err) { return handleError(reply, err) }
    }
  })

  // What *I* share with the family — only the member themself controls this
  app.patch('/visibility', {
    preHandler: authed,
    schema: {
      body: {
        type:'object',
        properties: {
          shareBankAccounts:  { type:'boolean' },
          shareFixedDeposits: { type:'boolean' },
          shareMutualFunds:   { type:'boolean' },
          shareEquity:        { type:'boolean' },
          shareNps:           { type:'boolean' },
          shareEpf:           { type:'boolean' },
          shareInsurance:     { type:'boolean' },
          shareLand:          { type:'boolean' },
          shareGold:          { type:'boolean' },
          shareTotalNetworth: { type:'boolean' },
          displayName:        { type:'string', maxLength:50 }
        },
        additionalProperties:false
      }
    },
    handler: async (req, reply) => {
      try {
        await familyVault.updateVisibility(pool, req.user!.id, req.body as any)
        return { success:true }
      } catch (err) { return handleError(reply, err) }
    }
  })

  // ── Shared views
  app.get('/vault/:vaultId/networth', {
    preHandler: vaultMember,
    schema: { params: uuidParam('vaultId') },
    handler: async (req) => {
      const { vaultId } = req.params as { vaultId:string }
      const data = await familyAggregator.getCombinedNetWorth(pool, vaultId, req.user!.id)
      return { success:true, data }
    }
  })

  app.get('/vault/:vaultId/history', {
    preHandler: vaultMember,
    schema: {
      params: uuidParam('vaultId'),
      querystring: {
        type:'object',
        properties:{ months:{ type:'integer', minimum:1, maximum:36 } }
      }
    },
    handler: async (req) => {
      const { vaultId } = req.params as { vaultId:string }
      const { months = 12 } = req.query as { months?: number }
      const history = await familyAggregator.getCombinedHistory(pool, vaultId, req.user!.id, months)
      return { success:true, data:history }
    }
  })

  app.get('/vault/:vaultId/members/:memberId/assets', {
    preHandler: vaultMember,
    schema: { params: uuidParam('vaultId', 'memberId') },
    handler: async (req, reply) => {
      try {
        const { vaultId, memberId } = req.params as { vaultId: string; memberId: string }
        const data = await familyAggregator.getMemberAssets(pool, vaultId, req.user!.id, memberId)
        return { success:true, data }
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.get('/vault/:vaultId/estate', {
    preHandler: vaultMember,
    schema: { params: uuidParam('vaultId') },
    handler: async (req) => {
      const { vaultId } = req.params as { vaultId:string }
      const data = await familyAggregator.getEstateReadiness(pool, vaultId, req.user!.id)
      return { success:true, data }
    }
  })

  app.get('/vault/:vaultId/activity', {
    preHandler: vaultMember,
    schema: { params: uuidParam('vaultId') },
    handler: async (req) => {
      const { vaultId } = req.params as { vaultId:string }
      const result = await pool.query(`
        SELECT fa.id, fa.activity_type, fa.title, fa.body, fa.created_at, fa.user_id,
               u.name_encrypted
          FROM family_activity_feed fa
          LEFT JOIN users u ON u.id = fa.user_id
         WHERE fa.vault_id = $1 AND fa.is_visible_to_all = true
         ORDER BY fa.created_at DESC
         LIMIT 30
      `, [vaultId])

      const activities = result.rows.map((r: any) => ({
        id:           r.id,
        activityType: r.activity_type,
        title:        r.title,
        body:         r.body,
        createdAt:    r.created_at,
        isYou:        r.user_id === req.user!.id,
        userName:     safeDecrypt(r.name_encrypted),
      }))
      return { success:true, data:activities }
    }
  })

  // ── Goals
  app.get('/vault/:vaultId/goals', {
    preHandler: vaultMember,
    schema: { params: uuidParam('vaultId') },
    handler: async (req) => {
      const { vaultId } = req.params as { vaultId:string }
      return { success:true, data: await familyGoals.getGoals(pool, vaultId, req.user!.id) }
    }
  })

  app.post('/vault/:vaultId/goals', {
    preHandler: vaultMember,
    schema: {
      params: uuidParam('vaultId'),
      body: {
        type: 'object',
        required: ['name', 'goalType', 'targetAmountPaise'],
        properties: {
          name:                { type: 'string', minLength: 2, maxLength: 100 },
          description:         { type: 'string', maxLength: 500 },
          goalType:            { type: 'string', enum: [...GOAL_TYPES] },
          emoji:               { type: 'string', maxLength: 8 },
          targetAmountPaise:   { type: 'integer', minimum: 10000 },
          targetDate:          { type: ['string', 'null'], maxLength: 10 },
          contributingMembers: { type: 'array', maxItems: 20, items: { type: 'string', format: 'uuid' } }
        },
        additionalProperties: false
      }
    },
    handler: async (req, reply) => {
      try {
        const { vaultId } = req.params as { vaultId: string }
        const id = await familyGoals.createGoal(pool, vaultId, req.user!.id, req.body as any)
        return reply.status(201).send({ success: true, data: { id } })
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.post('/vault/:vaultId/goals/:goalId/contributions', {
    preHandler: vaultMember,
    schema: {
      params: uuidParam('vaultId', 'goalId'),
      body: {
        type: 'object',
        required: ['amountPaise'],
        properties: {
          amountPaise: { type: 'integer', minimum: 100 },
          note:        { type: 'string', maxLength: 200 }
        },
        additionalProperties: false
      }
    },
    handler: async (req, reply) => {
      try {
        const { vaultId, goalId } = req.params as { vaultId: string; goalId: string }
        const body = req.body as { amountPaise: number; note?: string }
        const data = await familyGoals.addContribution(pool, vaultId, goalId, req.user!.id, body.amountPaise, body.note)
        return reply.status(201).send({ success: true, data })
      } catch (err) { return handleError(reply, err) }
    }
  })

  app.delete('/vault/:vaultId/goals/:goalId', {
    preHandler: vaultMember,
    schema: { params: uuidParam('vaultId', 'goalId') },
    handler: async (req, reply) => {
      try {
        const { vaultId, goalId } = req.params as { vaultId: string; goalId: string }
        await familyGoals.cancelGoal(pool, vaultId, goalId, req.user!.id)
        return { success: true }
      } catch (err) { return handleError(reply, err) }
    }
  })
}
