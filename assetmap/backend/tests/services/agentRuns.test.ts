import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import Fastify from 'fastify';
import crypto from 'crypto';
import { Queue } from 'bullmq';
import { pool } from '../../src/db/connection';
import { getRedisConnection } from '../../src/workers/redisConnection';
import {
  AGENT_JOB_NAME, AgentQueueLike, enqueueAgentRun, getAgentStatus, listOpenAnomalies, resolveAnomaly, setAgentQueueForTests,
} from '../../src/agent/agentRuns';
import { agentRoutes } from '../../src/routes/agent';
import { verifyAccessToken } from '../../src/middleware/auth';

// Enqueues go to a throwaway queue (never 'asset-orchestration'), so the real agent worker can't
// pick up a test job. The queue is obliterated afterwards.
export function registerAgentRunsTests() {
  describe('agentRuns (asset-orchestration producer + /api/agent)', () => {
    let userId: string;
    let otherUserId: string;
    let testQueue: Queue;
    let previousQueue: AgentQueueLike | null = null;

    const newUser = async () => (await pool.query(
      'INSERT INTO users (aadhaar_hash, name_encrypted) VALUES ($1, NULL) RETURNING id',
      [crypto.randomBytes(16).toString('hex')]
    )).rows[0].id as string;

    beforeAll(async () => {
      userId = await newUser();
      otherUserId = await newUser();
      testQueue = new Queue(`asset-orchestration-test-${crypto.randomBytes(4).toString('hex')}`, {
        connection: getRedisConnection(), skipVersionCheck: true,
      } as any);
      previousQueue = setAgentQueueForTests(testQueue as unknown as AgentQueueLike);
    });

    afterAll(async () => {
      setAgentQueueForTests(previousQueue);
      try {
        await testQueue.obliterate({ force: true });
      } catch {}
      await testQueue.close().catch(() => {});
      for (const id of [userId, otherUserId]) {
        if (!id) continue;
        await pool.query('DELETE FROM asset_anomalies WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM agent_runs WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
      }
    });

    it('creates one queued run and one job with jobId = runId and minimal data', async () => {
      const res = await enqueueAgentRun(userId, 'data_updated', { reason: 'aa_refresh' });
      expect(res).toBeTruthy();
      expect(res!.deduped).toBe(false);

      const rows = await pool.query('SELECT id, status, trigger_type, trigger_metadata FROM agent_runs WHERE user_id = $1', [userId]);
      expect(rows.rows.length).toBe(1);
      expect(rows.rows[0].id).toBe(res!.runId);
      expect(rows.rows[0].status).toBe('queued');
      expect(rows.rows[0].trigger_type).toBe('data_updated');
      expect(rows.rows[0].trigger_metadata).toEqual({ reason: 'aa_refresh' });

      const job = await testQueue.getJob(res!.runId);
      expect(job).toBeTruthy();
      expect(job!.id).toBe(res!.runId);
      expect(job!.name).toBe(AGENT_JOB_NAME);
      expect(job!.data).toEqual({ runId: res!.runId, userId, triggerType: 'data_updated' });
      expect(job!.opts.attempts).toBe(3);
      expect((job!.opts.backoff as any)?.type).toBe('exponential');
      expect((job!.opts.backoff as any)?.delay).toBe(5000);
      expect(job!.opts.removeOnComplete).toBe(true);
      expect(await testQueue.count()).toBe(1);
    });

    it('dedupes a second enqueue while a run is queued and adds no job', async () => {
      const first = await pool.query(`SELECT id FROM agent_runs WHERE user_id = $1 AND status = 'queued'`, [userId]);
      const res = await enqueueAgentRun(userId, 'user_refresh', { reason: 'user_rescan' });
      expect(res).toBeTruthy();
      expect(res!.deduped).toBe(true);
      expect(res!.runId).toBe(first.rows[0].id);

      const rows = await pool.query('SELECT id FROM agent_runs WHERE user_id = $1', [userId]);
      expect(rows.rows.length).toBe(1);
      expect(await testQueue.count()).toBe(1);
    });

    it('marks the run failed when the queue add throws', async () => {
      // Free the user's queued slot, as if the worker had picked the run up
      await pool.query(`UPDATE agent_runs SET status = 'running', started_at = NOW() WHERE user_id = $1 AND status = 'queued'`, [userId]);
      const failing: AgentQueueLike = { add: async () => { throw new Error('redis down'); } };
      setAgentQueueForTests(failing);
      let res;
      try {
        res = await enqueueAgentRun(userId, 'consent_granted', { reason: 'consent_callback' });
      } finally {
        setAgentQueueForTests(testQueue as unknown as AgentQueueLike);
      }
      expect(res).toBeNull();

      const failed = await pool.query(
        `SELECT status, error_message, completed_at FROM agent_runs WHERE user_id = $1 AND trigger_type = 'consent_granted'`,
        [userId]
      );
      expect(failed.rows.length).toBe(1);
      expect(failed.rows[0].status).toBe('failed');
      expect(failed.rows[0].error_message).toBe('Enqueue failed');
      expect(failed.rows[0].completed_at).toBeTruthy();
      // The failed row doesn't hold the queued slot: the next trigger gets a fresh run
      const next = await enqueueAgentRun(userId, 'data_updated', { reason: 'aa_refresh' });
      expect(next).toBeTruthy();
      expect(next!.deduped).toBe(false);
      expect(await testQueue.count()).toBe(2);
    });

    it('reports status with the contract shape', async () => {
      const status = await getAgentStatus(userId);
      expect(Object.keys(status).sort()).toEqual(['canonicalAssetCount', 'inFlight', 'lastSuccessfulAt', 'latestRun', 'openAnomalies']);
      expect(status.inFlight).toBe(true);
      expect(status.latestRun).toBeTruthy();
      expect(Object.keys(status.latestRun!).sort()).toEqual([
        'aiUsed', 'anomaliesDetected', 'completedAt', 'currentStep', 'durationMs', 'id', 'queuedAt',
        'recordsCreated', 'recordsDeduplicated', 'recordsUpdated', 'sourcesFetched', 'startedAt', 'status',
        'stepsFailed', 'triggerType',
      ]);
      expect(status.latestRun!.status).toBe('queued');
      expect(status.latestRun!.triggerType).toBe('data_updated');
      expect(Array.isArray(status.latestRun!.sourcesFetched)).toBe(true);
      expect(status.latestRun!.aiUsed).toBe(false);
      expect(typeof status.canonicalAssetCount).toBe('number');
      expect(status.lastSuccessfulAt).toBeNull();

      // A finished run shows as the last success; nothing in flight once every run is done
      await pool.query(
        `UPDATE agent_runs SET status = 'completed', completed_at = NOW(), ai_calls_made = 2 WHERE user_id = $1 AND status IN ('queued', 'running')`,
        [userId]
      );
      const after = await getAgentStatus(userId);
      expect(after.inFlight).toBe(false);
      expect(after.lastSuccessfulAt).toBeTruthy();
      expect(after.latestRun!.aiUsed).toBe(true);

      const empty = await getAgentStatus(otherUserId);
      expect(empty.latestRun).toBeNull();
      expect(empty.inFlight).toBe(false);
      expect(empty.openAnomalies).toBe(0);
    });

    it('lists only the owner\'s open anomalies and resolves them owner-checked', async () => {
      const mine = await pool.query(
        `INSERT INTO asset_anomalies (user_id, anomaly_type, severity, description, fingerprint, occurrences)
         VALUES ($1, 'value_spike', 'warning', 'Value jumped', $2, 3) RETURNING id`,
        [userId, crypto.randomBytes(16).toString('hex')]
      );
      await pool.query(
        `INSERT INTO asset_anomalies (user_id, anomaly_type, severity, description)
         VALUES ($1, 'large_transaction', 'info', 'Not yours')`,
        [otherUserId]
      );
      const anomalyId = mine.rows[0].id as string;

      const items = await listOpenAnomalies(userId);
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(anomalyId);
      expect(items[0].type).toBe('value_spike');
      expect(items[0].occurrences).toBe(3);
      expect(Object.keys(items[0]).sort()).toEqual([
        'aiExplanation', 'assetClass', 'description', 'firstSeenAt', 'id', 'institution', 'lastSeenAt', 'occurrences', 'severity', 'type',
      ]);
      expect((await getAgentStatus(userId)).openAnomalies).toBe(1);

      // Another user can't resolve it
      expect(await resolveAnomaly(otherUserId, anomalyId)).toBe(false);
      expect((await listOpenAnomalies(userId)).length).toBe(1);

      expect(await resolveAnomaly(userId, anomalyId)).toBe(true);
      expect((await listOpenAnomalies(userId)).length).toBe(0);
      expect((await listOpenAnomalies(otherUserId)).length).toBe(1);
    });

    it('wires the routes: auth on all, rate limit + plan gate on POST /runs, uuid-checked PATCH', async () => {
      const app = Fastify();
      const routes: Array<{ method: string; url: string; preHandler: unknown }> = [];
      app.addHook('onRoute', (r) => {
        if (r.method !== 'HEAD') routes.push({ method: String(r.method), url: r.url, preHandler: r.preHandler });
      });
      await app.register(agentRoutes, { prefix: '/api/agent' });
      await app.ready();
      expect(routes.length).toBe(4);
      for (const r of routes) {
        expect(Array.isArray(r.preHandler)).toBe(true);
        expect((r.preHandler as unknown[])[0] === verifyAccessToken).toBe(true);
      }
      const post = routes.find((r) => r.method === 'POST' && r.url === '/api/agent/runs');
      expect((post!.preHandler as unknown[]).length).toBe(3);

      const prevMock = process.env.MOCK_MODE;
      process.env.MOCK_MODE = 'true';
      try {
        const status = await app.inject({ method: 'GET', url: '/api/agent/status' });
        expect(status.statusCode).toBe(200);
        const body = status.json();
        expect(body.success).toBe(true);
        expect(body.data.inFlight).toBe(false);
        expect(body.data.latestRun).toBeNull();

        const bad = await app.inject({ method: 'PATCH', url: '/api/agent/anomalies/not-a-uuid', payload: { resolved: true } });
        expect(bad.statusCode).toBe(400);
        const badBody = await app.inject({ method: 'PATCH', url: `/api/agent/anomalies/${crypto.randomUUID()}`, payload: { resolved: false } });
        expect(badBody.statusCode).toBe(400);
      } finally {
        process.env.MOCK_MODE = prevMock;
        await app.close();
      }
    });
  });
}
