import cron from 'node-cron';
import { pool } from '../db/connection';
import { logger } from '../utils/logger';

export function startStatusSweeper() {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[Cron Sweeper] Running sweep for stale PENDING_RTA nomination requests');

    try {
      // Find requests stuck in PENDING_RTA for more than 24 hours
      const res = await pool.query(`
        SELECT id, platform, tracking_id 
        FROM nomination_requests 
        WHERE status = 'PENDING_RTA' 
        AND updated_at < NOW() - INTERVAL '24 hours'
      `);

      // There is no real RTA status API wired up yet. Simulated outcomes are a dev aid only:
      // in production they would tell users their nominee was updated when nothing happened.
      if (process.env.NODE_ENV === 'production') {
        if (res.rows.length) {
          logger.warn('[Cron Sweeper] Stale PENDING_RTA requests need manual follow-up', { count: res.rows.length });
        }
        return;
      }

      for (const row of res.rows) {
        logger.info(`[Cron Sweeper] Re-polling status for request ${row.id} (${row.platform} tracking: ${row.tracking_id})`);
        
        try {
          // Mock RTA poll
          // const rtaStatus = await axios.get(`https://mock-${row.platform.toLowerCase()}.api/status/${row.tracking_id}`);
          const simulatedStatus = Math.random() > 0.2 ? 'SUCCESS' : 'FAILED';
          
          await pool.query(
            'UPDATE nomination_requests SET status = $1, updated_at = NOW() WHERE id = $2',
            [simulatedStatus, row.id]
          );

          logger.info(`[Cron Sweeper] Updated request ${row.id} to ${simulatedStatus}`);
        } catch (pollErr) {
          logger.error(`[Cron Sweeper] Failed to poll status for request ${row.id}`, { error: (pollErr as Error).message });
        }
      }
    } catch (error) {
      logger.error('[Cron Sweeper] Failed to run sweeper query', { error: (error as Error).message });
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info('[Cron Sweeper] Registered sweeper for stale PENDING_RTA requests');
}
