import { FastifyPluginAsync } from 'fastify';
import { createConsentRequest, handleConsentCallback, revokeConsent, verifySetuWebhookSignature, fetchSetuConsentStatus } from '../services/accountAggregator';
import { ConsentCreateSchema, ConsentCallbackSchema } from '../utils/validators';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants';
import { ConsentModel } from '../models/consent';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../middleware/auth';

const consentRoutes: FastifyPluginAsync = async (fastify, opts) => {

  // Keep the raw JSON body (scoped to this plugin) so the webhook HMAC covers the exact bytes sent
  const defaultJsonParser = fastify.getDefaultJsonParser('error', 'ignore');
  fastify.removeContentTypeParser('application/json');
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    (req as any).rawBody = body;
    defaultJsonParser(req, body as string, done);
  });

  // ─────────────────────────────────────────────
  // POST /api/consent/create
  // ─────────────────────────────────────────────
  fastify.post('/create', {
    schema: { body: ConsentCreateSchema },
    preHandler: [verifyAccessToken]
  }, async (request, reply) => {
    try {
      // dateRangeEnd from the client is ignored: the server sets the data window's end to the
      // consent's expiry so periodic refreshes can keep fetching new transactions.
      const { fiTypes, purpose, dateRangeStart } = request.body as Record<string, any>;
      const userId = request.user!.id;
      const ipAddress = request.ip || '';
      const userAgent = request.headers['user-agent'] || '';

      const result = await createConsentRequest(
        userId,
        fiTypes,
        purpose,
        dateRangeStart,
        ipAddress,
        userAgent
      );

      return reply.send(successResponse(result));
    } catch (error) {
      logger.error('Consent creation failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, (error as Error).message));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/consent/status/:consentId
  // ─────────────────────────────────────────────
  fastify.get('/status/:consentId', {
    preHandler: [verifyAccessToken]
  }, async (request, reply) => {
    try {
      const { consentId } = request.params as Record<string, any>;
      const consent = await ConsentModel.findByConsentId(consentId);

      if (!consent) {
        return reply.status(404).send(errorResponse(ERROR_CODES.CONSENT_NOT_FOUND, 'Consent not found'));
      }

      if (consent.userId !== request.user!.id) {
        return reply.status(403).send(errorResponse(ERROR_CODES.UNAUTHORIZED, 'Access denied'));
      }

      return reply.send(successResponse(consent));
    } catch (error) {
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch consent status'));
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/consent/callback — Setu Webhook
  // ─────────────────────────────────────────────
  fastify.post('/callback', {
    schema: { body: ConsentCallbackSchema }
  }, async (request, reply) => {
    try {
      const body = request.body as Record<string, any>;
      const consentId = body.consentId;
      const webhookSignature = request.headers['x-setu-signature'] as string | undefined;

      // Setu sends 'consentStatus', but accept 'status' too for compatibility.
      // No default: a callback without a status must not activate a consent.
      let status = body.consentStatus || body.status;

      const signed = verifySetuWebhookSignature((request as any).rawBody, webhookSignature);
      // Unsigned body is only trusted for the local mock flow (dev, no secret configured).
      // Otherwise never trust the body: confirm the status with Setu directly.
      const trustUnsignedBody = process.env.NODE_ENV !== 'production' && !process.env.SETU_WEBHOOK_SECRET;
      if (!signed && !trustUnsignedBody) {
        const confirmed = consentId ? await fetchSetuConsentStatus(consentId) : null;
        if (!confirmed) {
          logger.warn('Consent callback rejected: unverified and not confirmed by Setu', { consentId });
          return reply.status(401).send(errorResponse(ERROR_CODES.UNAUTHORIZED, 'Unverified callback'));
        }
        status = confirmed;
      }
      if (!status) {
        return reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Missing consent status'));
      }

      logger.info('Consent callback received', { consentId, status, type: body.type });

      await handleConsentCallback(consentId, status);

      return reply.send(successResponse({ message: 'Callback processed' }));
    } catch (error) {
      logger.error('Consent callback failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Callback processing failed'));
    }
  });

  // ─────────────────────────────────────────────
  // DELETE /api/consent/:consentId — Revoke
  // ─────────────────────────────────────────────
  fastify.delete('/:consentId', {
    preHandler: [verifyAccessToken]
  }, async (request, reply) => {
    try {
      const { consentId } = request.params as Record<string, any>;
      const consent = await ConsentModel.findByConsentId(consentId);

      if (!consent) {
        return reply.status(404).send(errorResponse(ERROR_CODES.CONSENT_NOT_FOUND, 'Consent not found'));
      }

      if (consent.userId !== request.user!.id) {
        return reply.status(403).send(errorResponse(ERROR_CODES.UNAUTHORIZED, 'Access denied'));
      }

      if (consent.status === 'REVOKED') {
        return reply.status(400).send(errorResponse(ERROR_CODES.CONSENT_ALREADY_REVOKED, 'Consent is already revoked'));
      }

      await revokeConsent(
        consentId,
        request.user!.id,
        request.ip || '',
        request.headers['user-agent'] || ''
      );

      return reply.send(successResponse({ message: 'Consent revoked successfully' }));
    } catch (error) {
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to revoke consent'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/consent — List user's consents
  // ─────────────────────────────────────────────
  fastify.get('/', {
    preHandler: [verifyAccessToken]
  }, async (request, reply) => {
    try {
      const consents = await ConsentModel.findByUserId(request.user!.id);
      return reply.send(successResponse(consents));
    } catch (error) {
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch consents'));
    }
  });

};

export default consentRoutes;
