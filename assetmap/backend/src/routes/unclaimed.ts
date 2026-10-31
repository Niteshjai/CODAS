import { FastifyPluginAsync } from 'fastify'
import { verifyAccessToken } from '../middleware/auth'
import { pool } from '../db/connection'
import { unclaimedAssets } from '../services/unclaimedAssets'
import { UnclaimedAssetModel } from '../models/unclaimedAsset'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants'
import { UnclaimedSearchSchema } from '../utils/validators'
import { planEnforcer } from '../plans/planEnforcer'
import { UserModel } from '../models/user'

export const unclaimedRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/assets', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('unclaimed_search', pool)]
  }, async (request, reply) => {
    try {
      const userId = request.user!.id
      const assets = await UnclaimedAssetModel.findByUserId(userId)
      return successResponse(assets)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to get unclaimed assets'))
    }
  })
  fastify.post('/search/initiate', {
    schema: { body: UnclaimedSearchSchema },
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('unclaimed_search', pool)]
  }, async (request, reply) => {
    try {
      const userId = request.user!.id
      const body = request.body as any

      const limitCheck = await planEnforcer.checkLimit(pool, userId, 'unclaimed_search', 'limit_unclaimed_searches_py');
      if (!limitCheck.allowed) {
        return reply.status(403).send(errorResponse(ERROR_CODES.UNAUTHORIZED, 'You have reached your unclaimed search limit. Please upgrade your plan.'));
      }

      // DPDP purpose limitation: only search the caller's own verified identity, never an
      // arbitrary third party's PAN/name supplied in the request.
      const user = await UserModel.findById(userId)
      if (!user?.pan) {
        return reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Verify your PAN before searching for unclaimed assets.'))
      }
      if (body.pan && String(body.pan).trim().toUpperCase() !== user.pan.trim().toUpperCase()) {
        return reply.status(403).send(errorResponse(ERROR_CODES.UNAUTHORIZED, 'You can only search using your own verified PAN.'))
      }

      const searchId = await unclaimedAssets.initiateSearch(pool, userId, {
        pan: user.pan,
        name: user.name || `${body.firstName} ${body.lastName}`,
        aadhaarHash: user.aadhaarHash,
      })

      await planEnforcer.incrementUsage(pool, userId, 'unclaimed_search', 'year');

      return successResponse({ searchId })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to initiate search'))
    }
  })

  fastify.get('/search/:id', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('unclaimed_search', pool)]
  }, async (request, reply) => {
    try {
      const userId = request.user!.id
      const params = request.params as any
      const searchId = params.id
      const result = await unclaimedAssets.getSearchResults(pool, userId, searchId)
      return successResponse(result)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to get search results'))
    }
  })
}
