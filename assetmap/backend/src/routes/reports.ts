import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { verifyAccessToken } from '../middleware/auth';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants';
import { auditLogger } from '../services/auditLogger';
import { pool } from '../db/connection';
import { logger } from '../utils/logger';
import { planEnforcer } from '../plans/planEnforcer';
import { buildReportData, renderReportPdf, reportFileName } from '../services/assetReport';

const reportsRoutes: FastifyPluginAsync = async (fastify, opts) => {

  const sendPdf = (reply: any, pdf: Buffer, generatedAt: Date) => {
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${reportFileName(generatedAt)}"`);
    reply.header('Cache-Control', 'no-store');   // financial document: never cache in shared proxies
    reply.header('Access-Control-Expose-Headers', 'Content-Disposition');
    return reply.send(pdf);
  };

  // ─────────────────────────────────────────────
  // GET /api/reports/generate
  // Builds the consolidated asset report from live data and streams the PDF.
  // Same behaviour in every environment (previously production returned JSON
  // pointing at an S3 object that was never uploaded, so the download was a
  // corrupt file).
  // ─────────────────────────────────────────────
  fastify.get('/generate', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('pdf_report', pool)],
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;

      const limitCheck = await planEnforcer.checkLimit(pool, userId, 'pdf_report', 'limit_pdf_reports_pm');
      if (!limitCheck.allowed) {
        if (limitCheck.limitReached) {
          const resets = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            .toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
          return reply.status(429).send(errorResponse('REPORT_LIMIT_REACHED',
            `You've used all ${limitCheck.limit} PDF reports for this month. Your limit resets on ${resets}.`));
        }
        return reply.status(402).send(errorResponse('UPGRADE_REQUIRED', 'PDF reports are available on a paid plan.'));
      }

      const data = await buildReportData(pool, userId);
      const pdf = await renderReportPdf(data);

      // The PDF is regenerated from live data on download, so nothing is stored —
      // the row only records that a report was produced (history + plan usage).
      const reportId = randomUUID();
      await pool.query(
        'INSERT INTO reports (id, user_id, s3_key) VALUES ($1, $2, $3)',
        [reportId, userId, `generated-on-demand/${reportId}`]
      );
      await auditLogger.log(userId, 'REPORT_GENERATED', 'reports', reportId, request.ip, request.headers['user-agent']);
      await planEnforcer.incrementUsage(pool, userId, 'pdf_report');

      reply.header('X-Report-Id', reportId);
      return sendPdf(reply, pdf, data.generatedAt);
    } catch (error) {
      logger.error('Report generation failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to generate report'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/reports/:reportId/download
  // Re-downloads a previously generated report, rebuilt from the user's current
  // data (reports are not stored). Does not count against the monthly limit.
  // ─────────────────────────────────────────────
  fastify.get('/:reportId/download', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('pdf_report', pool)],
    schema: { params: { type: 'object', required: ['reportId'], properties: { reportId: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const { reportId } = request.params as { reportId: string };

      const result = await pool.query(
        'SELECT id FROM reports WHERE id = $1 AND user_id = $2',
        [reportId, userId]
      );
      if (result.rows.length === 0) {
        return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Report not found'));
      }

      await auditLogger.log(userId, 'REPORT_DOWNLOADED', 'reports', reportId, request.ip, request.headers['user-agent']);
      const data = await buildReportData(pool, userId);
      return sendPdf(reply, await renderReportPdf(data), data.generatedAt);
    } catch (error) {
      logger.error('Report download failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to download report'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/reports — List user's reports
  // ─────────────────────────────────────────────
  fastify.get('/', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('pdf_report', pool)]
  }, async (request, reply) => {
    try {
      const result = await pool.query(
        'SELECT id, report_type, generated_at FROM reports WHERE user_id = $1 ORDER BY generated_at DESC',
        [request.user!.id]
      );
      return reply.send(successResponse({ reports: result.rows }));
    } catch (error) {
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch reports'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/reports/audit-log — User's own audit trail
  // ─────────────────────────────────────────────
  fastify.get('/audit-log', {
    preHandler: [verifyAccessToken]
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const query = request.query as Record<string, any>;
      const page = parseInt(query.page) || 1;
      const limit = Math.min(parseInt(query.limit) || 20, 100);

      const trail = await auditLogger.getUserAuditTrail(userId, page, limit);

      await auditLogger.log(userId, 'AUDIT_LOG_VIEWED', 'audit_logs', undefined, request.ip, request.headers['user-agent']);

      return reply.send(successResponse(trail));
    } catch (error) {
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch audit trail'));
    }
  });
};

export default reportsRoutes;
