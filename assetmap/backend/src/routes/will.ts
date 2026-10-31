import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { verifyAccessToken } from '../middleware/auth'
import { pool } from '../db/connection'
import { willBuilder, WillError } from '../services/willBuilder'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants'
import { WillCreateSchema, WillUpdateSchema, WillBeneficiarySchema, WillAllocationSchema } from '../utils/validators'
import { planEnforcer } from '../plans/planEnforcer'

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
}

const childParams = (child: string) => ({
  type: 'object',
  required: ['id', child],
  properties: { id: { type: 'string', format: 'uuid' }, [child]: { type: 'string', format: 'uuid' } },
})

// WillError carries a user-facing message + 4xx status; anything else is a 500
function handleError(request: FastifyRequest, reply: FastifyReply, error: unknown, fallback: string) {
  if (error instanceof WillError) {
    const code = error.statusCode === 404 ? ERROR_CODES.NOT_FOUND : ERROR_CODES.VALIDATION_ERROR
    return reply.status(error.statusCode).send(errorResponse(code, error.message))
  }
  request.log.error(error)
  return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, fallback))
}

export const willRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = [verifyAccessToken, planEnforcer.requireFeature('will_builder', pool)]

  // Resume the user's active will (null when they haven't started one)
  fastify.get('/current', { preHandler: guard }, async (request, reply) => {
    try {
      return successResponse(await willBuilder.getCurrentWill(pool, request.user!.id))
    } catch (error) {
      return handleError(request, reply, error, 'Failed to load your will')
    }
  })

  fastify.post('/create', {
    schema: { body: WillCreateSchema },
    preHandler: guard
  }, async (request, reply) => {
    try {
      const willId = await willBuilder.createWill(pool, request.user!.id, request.body as any)
      return successResponse({ willId })
    } catch (error) {
      return handleError(request, reply, error, 'Failed to create will')
    }
  })

  fastify.put('/:id', {
    schema: { body: WillUpdateSchema, params: idParams },
    preHandler: guard
  }, async (request, reply) => {
    try {
      await willBuilder.updateWill(pool, request.user!.id, (request.params as any).id, request.body as any)
      return successResponse({ updated: true })
    } catch (error) {
      return handleError(request, reply, error, 'Failed to update will')
    }
  })

  fastify.post('/:id/beneficiary', {
    schema: { body: WillBeneficiarySchema, params: idParams },
    preHandler: guard
  }, async (request, reply) => {
    try {
      const beneficiaryId = await willBuilder.addBeneficiary(pool, request.user!.id, (request.params as any).id, request.body as any)
      return successResponse({ beneficiaryId })
    } catch (error) {
      return handleError(request, reply, error, 'Failed to add beneficiary')
    }
  })

  fastify.delete('/:id/beneficiary/:beneficiaryId', {
    schema: { params: childParams('beneficiaryId') },
    preHandler: guard
  }, async (request, reply) => {
    try {
      const { id, beneficiaryId } = request.params as any
      await willBuilder.removeBeneficiary(pool, request.user!.id, id, beneficiaryId)
      return successResponse({ removed: true })
    } catch (error) {
      return handleError(request, reply, error, 'Failed to remove beneficiary')
    }
  })

  fastify.post('/:id/allocation', {
    schema: { body: WillAllocationSchema, params: idParams },
    preHandler: guard
  }, async (request, reply) => {
    try {
      const userId = request.user!.id

      const limitCheck = await planEnforcer.checkLimit(pool, userId, 'will_builder', 'limit_will_allocations');
      if (!limitCheck.allowed) {
        return reply.status(403).send(errorResponse(ERROR_CODES.UNAUTHORIZED, 'You have reached your will allocation limit. Please upgrade your plan.'));
      }

      const allocationId = await willBuilder.addAllocation(pool, userId, (request.params as any).id, request.body as any)
      await planEnforcer.incrementUsage(pool, userId, 'will_builder');

      return successResponse({ allocationId })
    } catch (error) {
      return handleError(request, reply, error, 'Failed to add allocation')
    }
  })

  fastify.delete('/:id/allocation/:allocationId', {
    schema: { params: childParams('allocationId') },
    preHandler: guard
  }, async (request, reply) => {
    try {
      const { id, allocationId } = request.params as any
      await willBuilder.removeAllocation(pool, request.user!.id, id, allocationId)
      return successResponse({ removed: true })
    } catch (error) {
      return handleError(request, reply, error, 'Failed to remove allocation')
    }
  })

  // Returns the PDF itself so the user can download it immediately
  fastify.post('/:id/generate-pdf', {
    schema: { params: idParams },
    preHandler: guard
  }, async (request, reply) => {
    try {
      const pdf = await willBuilder.generatePDF(pool, request.user!.id, (request.params as any).id)
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', 'attachment; filename="My-Will.pdf"')
        .header('Cache-Control', 'no-store')
        .send(pdf)
    } catch (error) {
      return handleError(request, reply, error, 'Failed to generate PDF')
    }
  })

  fastify.post('/:id/esign', {
    schema: { params: idParams },
    preHandler: guard
  }, async (request, reply) => {
    try {
      const url = await willBuilder.initiateESign(pool, request.user!.id, (request.params as any).id)
      return successResponse({ url })
    } catch (error) {
      return handleError(request, reply, error, 'Failed to initiate e-sign')
    }
  })
}
