import { FastifyInstance, FastifyReply } from 'fastify';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants';
import { verifyAccessToken } from '../middleware/auth';
import { userRateLimit } from '../middleware/userRateLimit'
import { SUPPORT_CATEGORIES, SUPPORT_LIMITS, SupportError, supportService } from '../services/supportService';

const uuidParam = {
  type: 'object',
  required: ['ticketId'],
  properties: { ticketId: { type: 'string', format: 'uuid' } },
} as const;

const createBody = {
  type: 'object',
  required: ['category', 'subject', 'message'],
  additionalProperties: false,
  properties: {
    category: { type: 'string', enum: [...SUPPORT_CATEGORIES] },
    subject:  { type: 'string', minLength: SUPPORT_LIMITS.subjectMin, maxLength: SUPPORT_LIMITS.subjectMax },
    message:  { type: 'string', minLength: 2, maxLength: SUPPORT_LIMITS.messageMax },
    channel:  { type: 'string', enum: ['chat', 'email'] },
  },
} as const;

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof SupportError) {
    const code = err.statusCode === 404 ? ERROR_CODES.NOT_FOUND : err.statusCode === 400 ? ERROR_CODES.VALIDATION_ERROR : err.code;
    return reply.status(err.statusCode).send(errorResponse(code, err.message));
  }
  throw err; // global handler → generic 500 message
}

export async function supportRoutes(app: FastifyInstance) {
  const auth = { preHandler: [verifyAccessToken] };
  // Creating a ticket triggers an AI assistant first reply (a Claude call) plus an inbox email.
  // Both creating routes share one per-user bucket, so closing tickets to free the open-ticket
  // cap or rotating IPs (the IP limit below) can't buy unbounded Claude calls.
  const ticketCreateLimit = userRateLimit('support_ticket', 5, 60 * 60);

  // Open a ticket (chat or email form)
  app.post('/tickets', {
    preHandler: [verifyAccessToken, ticketCreateLimit],
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    schema: { body: createBody },
  }, async (req, reply) => {
    const body = req.body as { category: any; subject: string; message: string; channel?: 'chat' | 'email' };
    try {
      const ticket = await supportService.createTicket(req.user!.id, { ...body, channel: body.channel ?? 'chat' });
      return reply.status(201).send(successResponse(ticket));
    } catch (err) { return handleError(err, reply); }
  });

  app.get('/tickets', auth, async (req) => {
    return successResponse(await supportService.listTickets(req.user!.id));
  });

  app.get('/tickets/:ticketId', { ...auth, schema: { params: uuidParam } }, async (req, reply) => {
    const { ticketId } = req.params as { ticketId: string };
    try {
      return successResponse(await supportService.getTicket(req.user!.id, ticketId));
    } catch (err) { return handleError(err, reply); }
  });

  app.post('/tickets/:ticketId/messages', {
    // No AI here (messages only notify the support inbox); the per-user cap stops one account
    // spamming that inbox from many IPs
    preHandler: [verifyAccessToken, userRateLimit('support_message', 60, 60 * 60)],
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: {
      params: uuidParam,
      body: {
        type: 'object', required: ['body'], additionalProperties: false,
        properties: { body: { type: 'string', minLength: 1, maxLength: SUPPORT_LIMITS.messageMax } },
      },
    },
  }, async (req, reply) => {
    const { ticketId } = req.params as { ticketId: string };
    try {
      const ticket = await supportService.addMessage(req.user!.id, ticketId, (req.body as { body: string }).body);
      return reply.status(201).send(successResponse(ticket));
    } catch (err) { return handleError(err, reply); }
  });

  app.post('/tickets/:ticketId/:action', {
    ...auth,
    schema: {
      params: {
        type: 'object', required: ['ticketId', 'action'],
        properties: { ticketId: { type: 'string', format: 'uuid' }, action: { type: 'string', enum: ['close', 'reopen'] } },
      },
    },
  }, async (req, reply) => {
    const { ticketId, action } = req.params as { ticketId: string; action: 'close' | 'reopen' };
    try {
      return successResponse(await supportService.setStatus(req.user!.id, ticketId, action));
    } catch (err) { return handleError(err, reply); }
  });

  // Legacy endpoint (older clients): now creates an email ticket instead of sending raw HTML mail
  app.post('/contact', {
    preHandler: [verifyAccessToken, ticketCreateLimit],
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    schema: {
      body: {
        type: 'object', required: ['subject', 'message'], additionalProperties: false,
        properties: {
          subject: createBody.properties.subject,
          message: createBody.properties.message,
        },
      },
    },
  }, async (req, reply) => {
    const { subject, message } = req.body as { subject: string; message: string };
    try {
      const ticket = await supportService.createTicket(req.user!.id, { category: 'other', subject, message, channel: 'email' });
      return reply.status(201).send(successResponse({ reference: ticket.reference, id: ticket.id }));
    } catch (err) { return handleError(err, reply); }
  });
}
