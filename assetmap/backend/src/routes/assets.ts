import { FastifyPluginAsync } from 'fastify';
import { verifyAccessToken, requireRole } from '../middleware/auth';
import { AssetSnapshotModel } from '../models/assetSnapshot';
import { FinancialAccountModel } from '../models/financialAccount';
import { TransactionModel } from '../models/transaction';
import { InvestmentHoldingModel } from '../models/investmentHolding';
import { InsurancePolicyModel } from '../models/insurancePolicy';
import { UserModel } from '../models/user';
import { getLandRecordsByUser } from '../db/queries/landRecords';
import { pool } from '../db/connection';
import { ConsentModel } from '../models/consent';
import { fetchFinancialData } from '../services/accountAggregator';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants';
import { auditLogger } from '../services/auditLogger';
import { logger } from '../utils/logger';
import { planEnforcer } from '../plans/planEnforcer';
import { manualAssetService } from '../manual/manualAssetService';
import { getAssetDetail } from '../services/assetDetail';

const MAX_PAGE_SIZE = 100;

// Account-scoped routes take accountId from the URL, so ownership must be checked explicitly
async function ownsAccount(accountId: string, userId: string): Promise<boolean> {
  if (process.env.MOCK_MODE === 'true') return true;
  const res = await pool.query(
    'SELECT 1 FROM financial_accounts WHERE id = $1 AND user_id = $2',
    [accountId, userId]
  );
  return (res.rowCount ?? 0) > 0;
}

const assetRoutes: FastifyPluginAsync = async (fastify, opts) => {

  // ─────────────────────────────────────────────
  // GET /api/assets/summary
  // Aggregated net worth + category breakdown
  // ─────────────────────────────────────────────
  fastify.get('/summary', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)]
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const summary = await AssetSnapshotModel.getSummary(userId);
      const consents = await ConsentModel.getActiveConsents(userId);
      const activeConsent = consents[0];
      const hasLandConsent = activeConsent?.fiTypes?.includes('LAND_RECORDS') ?? false;
      const landRecords = hasLandConsent ? await getLandRecordsByUser(pool, userId) : [];

      // Add land value to summary if available
      const landValue = landRecords.reduce((sum, r) => {
        return sum + (r.estimated_value_paise ? r.estimated_value_paise / 100 : 0);
      }, 0);

      // Add manual asset value to summary
      const manualSummary = await manualAssetService.getSummary(userId);
      const manualValue = manualSummary.totalPaise;

      const totalWithLand = summary.totalNetWorth + landValue + manualValue;

      // Handle Net Worth History — respect plan limit for months
      const nwLimitCheck = await planEnforcer.checkLimit(pool, userId, 'networth_tracker', 'limit_networth_months');
      const monthsLimit = nwLimitCheck.limit; // null = unlimited

      let historyQuery = 'SELECT net_worth, recorded_at FROM net_worth_history WHERE user_id = $1';
      const historyParams: any[] = [userId];
      if (monthsLimit !== null && monthsLimit !== undefined) {
        historyQuery += ` AND recorded_at >= NOW() - INTERVAL '${Math.floor(monthsLimit)} months'`;
      }
      historyQuery += ' ORDER BY recorded_at ASC';

      const historyRes = await pool.query(historyQuery, historyParams);

      let incrementPercentage = 0;

      if (historyRes.rows.length > 0) {
        // Compare with the oldest record for demo (or typically last month's record)
        const oldestNetWorth = parseFloat(historyRes.rows[0].net_worth);
        if (oldestNetWorth > 0) {
          incrementPercentage = ((totalWithLand - oldestNetWorth) / oldestNetWorth) * 100;
        }

        // Insert a new snapshot if the latest is more than 24 hours old
        const latestRecord = historyRes.rows[historyRes.rows.length - 1];
        const hoursSinceLastRecord = (Date.now() - new Date(latestRecord.recorded_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRecord > 24) {
          await pool.query(
            'INSERT INTO net_worth_history (user_id, net_worth) VALUES ($1, $2)',
            [userId, totalWithLand]
          );
        }
      } else {
        // First time seeing this user: no history yet.
        // Insert current snapshot only. Growth will correctly read as 0%.
        await pool.query(
          'INSERT INTO net_worth_history (user_id, net_worth) VALUES ($1, $2)',
          [userId, totalWithLand]
        );
        incrementPercentage = 0;
      }

      return reply.send(successResponse({
        ...summary,
        landRecordCount: landRecords.length,
        estimatedLandValue: landValue,
        totalWithLand,
        incrementPercentage: parseFloat(incrementPercentage.toFixed(1))
      }));
    } catch (error) {
      logger.error('Asset summary failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch asset summary'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/assets/financial
  // All AA-fetched financial data
  // ─────────────────────────────────────────────
  fastify.get('/financial', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)]
  }, async (request, reply) => {
    try {
      const assets = await AssetSnapshotModel.findByUserId(request.user!.id);
      return reply.send(successResponse({ assets }));
    } catch (error) {
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch financial data'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/assets/financial/:id/detail
  // One linked account: details, nominee status, value history, transactions
  // ─────────────────────────────────────────────
  fastify.get('/financial/:id/detail', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Account not found'));
    }
    try {
      const detail = await getAssetDetail(request.user!.id, id);
      if (!detail) return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Account not found'));
      return reply.send(successResponse(detail));
    } catch (error) {
      logger.error('Asset detail fetch failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to load account details'));
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/assets/refresh
  // Re-trigger AA data session
  // ─────────────────────────────────────────────
  fastify.post('/refresh', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)],
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } }
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const user = await UserModel.findById(userId);



      // Find the most recent active consent
      const consents = await ConsentModel.getActiveConsents(userId);
      if (consents.length === 0) {
        return reply.status(403).send(errorResponse(ERROR_CODES.NO_ACTIVE_CONSENT, 'No active consent. Please grant consent first.'));
      }

      const activeConsent = consents[0];
      const ipAddress = request.ip || '';
      const userAgent = request.headers['user-agent'] || '';

      const freshData = await fetchFinancialData(activeConsent.consentId, userId, ipAddress, userAgent);

      await auditLogger.log(userId, 'DATA_REFRESHED', 'asset_snapshots', activeConsent.consentId, ipAddress, userAgent);

      // Return fresh summary
      const summary = await AssetSnapshotModel.getSummary(userId);

      return reply.send(successResponse({
        message: `Refreshed ${freshData.length} asset records`,
        summary,
      }));
    } catch (error) {
      logger.error('Asset refresh failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.DATA_FETCH_FAILED, 'Failed to refresh financial data'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/assets/accounts
  // All financial accounts (detailed view)
  // ─────────────────────────────────────────────
  fastify.get('/accounts', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)]
  }, async (request, reply) => {
    try {
      const accounts = await FinancialAccountModel.findByUserId(request.user!.id);
      return reply.send(successResponse({ accounts }));
    } catch (error) {
      logger.error('Financial accounts fetch failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch financial accounts'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/assets/:accountId/transactions
  // Paginated transaction history for an account
  // ─────────────────────────────────────────────
  fastify.get('/:accountId/transactions', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)]
  }, async (request, reply) => {
    try {
      const { accountId } = request.params as { accountId: string };
      const { limit, offset, startDate, endDate } = request.query as {
        limit?: string; offset?: string; startDate?: string; endDate?: string;
      };

      if (!(await ownsAccount(accountId, request.user!.id))) {
        return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Account not found'));
      }

      const pageSize = Math.min(Math.max(parseInt(limit || '50', 10) || 50, 1), MAX_PAGE_SIZE);
      const pageOffset = Math.max(parseInt(offset || '0', 10) || 0, 0);

      const transactions = await TransactionModel.findByAccountId(accountId, {
        limit: pageSize,
        offset: pageOffset,
        startDate,
        endDate,
      });

      const total = await TransactionModel.countByAccountId(accountId);

      return reply.send(successResponse({
        transactions,
        total,
        limit: pageSize,
        offset: pageOffset,
      }));
    } catch (error) {
      logger.error('Transaction fetch failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch transactions'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/assets/:accountId/holdings
  // Investment holdings (stocks & mutual funds)
  // ─────────────────────────────────────────────
  fastify.get('/:accountId/holdings', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)]
  }, async (request, reply) => {
    try {
      const { accountId } = request.params as { accountId: string };
      if (!(await ownsAccount(accountId, request.user!.id))) {
        return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Account not found'));
      }
      const holdings = await InvestmentHoldingModel.findByAccountId(accountId);
      return reply.send(successResponse({ holdings }));
    } catch (error) {
      logger.error('Holdings fetch failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch investment holdings'));
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/assets/:accountId/policy
  // Insurance policy details
  // ─────────────────────────────────────────────
  fastify.get('/:accountId/policy', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('asset_dashboard', pool)]
  }, async (request, reply) => {
    try {
      const { accountId } = request.params as { accountId: string };
      if (!(await ownsAccount(accountId, request.user!.id))) {
        return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Account not found'));
      }
      const policies = await InsurancePolicyModel.findByAccountId(accountId);
      return reply.send(successResponse({ policies }));
    } catch (error) {
      logger.error('Policy fetch failed', { error: (error as Error).message });
      return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch insurance policies'));
    }
  });

};

export default assetRoutes;
