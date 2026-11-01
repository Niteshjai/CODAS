import { FastifyPluginAsync } from 'fastify'
import { verifyAccessToken } from '../middleware/auth'
import { userRateLimit } from '../middleware/userRateLimit'
import { planEnforcer } from '../plans/planEnforcer'
import { pool } from '../db/connection'
import { auditLogger } from '../services/auditLogger'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants'
import { logger } from '../utils/logger'
import { enqueueAgentRun, getAgentStatus, listOpenAnomalies, resolveAnomaly, AgentStatus } from '../agent/agentRuns'

// ═══════════════════════════════════════════════════════════════
// /api/agent — status and control of the asset-orchestration agent
// The agent itself runs in assetmap/agent-worker; these routes only read its tables and queue runs.
// ═══════════════════════════════════════════════════════════════

const EMPTY_STATUS: AgentStatus = {
  latestRun: null,
  inFlight: false,
  canonicalAssetCount: 0,
  openAnomalies: 0,
  lastSuccessfulAt: null,
}

const anomalyParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
}

const resolveBodySchema = {
  type: 'object',
  required: ['resolved'],
  properties: { resolved: { type: 'boolean', const: true } },
  additionalProperties: false,
}

const isMock = () => process.env.MOCK_MODE === 'true'

export const agentRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /api/agent/status — latest run, whether one is queued/running, and result counts
  fastify.get('/status', { preHandler: [verifyAccessToken] }, async (request, reply) => {
    if (isMock()) return reply.send(successResponse(EMPTY_STATUS))
    try {
      return reply.send(successResponse(await getAgentStatus(request.user!.id)))
    } catch (err) {
      logger.error('[Agent] Status failed', { error: (err as Error).message })
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to load asset scan status'))
    }
  })

  // POST /api/agent/runs — user-requested rescan. Collapses into an already-queued run.
  fastify.post('/runs', {
    preHandler: [
      verifyAccessToken,
      userRateLimit('agent_rescan', 3, 3600),
      planEnforcer.requireFeature('asset_dashboard', pool),
    ],
  }, async (request, reply) => {
    if (isMock()) return reply.status(202).send(successResponse({ runId: '00000000-0000-4000-a000-0000000000a1', deduped: false }))
    const userId = request.user!.id
    const result = await enqueueAgentRun(userId, 'user_refresh', { reason: 'user_rescan' })
    if (!result) {
      return reply.status(503).send(errorResponse(ERROR_CODES.SERVICE_UNAVAILABLE, 'Could not start an asset scan right now. Please try again shortly.'))
    }
    await auditLogger.log(
      userId,
      'AGENT_RUN_REQUESTED',
      'agent_runs',
      result.runId,
      request.ip,
      request.headers['user-agent'],
      { deduped: result.deduped }
    )
    return reply.status(202).send(successResponse(result))
  })

  // GET /api/agent/anomalies — open anomalies, newest first
  fastify.get('/anomalies', { preHandler: [verifyAccessToken] }, async (request, reply) => {
    if (isMock()) return reply.send(successResponse({ items: [] }))
    try {
      return reply.send(successResponse({ items: await listOpenAnomalies(request.user!.id) }))
    } catch (err) {
      logger.error('[Agent] Anomaly list failed', { error: (err as Error).message })
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to load anomalies'))
    }
  })

  // PATCH /api/agent/anomalies/:id — mark one of the user's anomalies resolved
  fastify.patch('/anomalies/:id', {
    preHandler: [verifyAccessToken],
    schema: { params: anomalyParamsSchema, body: resolveBodySchema },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (isMock()) return reply.send(successResponse({ id, resolved: true }))
    try {
      const ok = await resolveAnomaly(request.user!.id, id)
      // Someone else's anomaly reads as missing, so ids can't be probed
      if (!ok) return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Anomaly not found'))
      return reply.send(successResponse({ id, resolved: true }))
    } catch (err) {
      logger.error('[Agent] Anomaly resolve failed', { error: (err as Error).message })
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to update anomaly'))
    }
  })
}

export default agentRoutes
