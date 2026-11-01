import axios, { AxiosInstance } from 'axios';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { pool } from '../db/connection';
import { decryptPII, encryptPII } from '../utils/encryption';
import { nomineeChecker } from './nomineeChecker';
import { dormantAccountFinder } from './dormantAccountFinder';
import { FIType, FI_TYPE_LABELS } from '../utils/constants';
import { logger } from '../utils/logger';
import { auditLogger } from './auditLogger';
import { enqueueSpendAnalysis } from '../workers/classifierWorker';
import { accountKeyOf, accountObject, flattenFiResponse, nomineeFlagOf, parseTransactions, pendingAccountCount, relinkAccountTransactions, saveAccountTransactions, withoutTransactions } from './aaTransactions';
import { UserModel } from '../models/user';
import { CONSENT_DURATION_MONTHS } from '../models/consent';
import { enqueueAgentRun } from '../agent/agentRuns';

/** Why an AA fetch ran: decides the agent trigger after the data is stored. Not PII. */
export type AaFetchReason = 'consent_callback' | 'aa_refresh';

// ═══════════════════════════════════════════════════════════════
// Account Aggregator (Setu) Service
// Full Setu AA SDK integration for the India AA framework
// ═══════════════════════════════════════════════════════════════

interface ConsentArtefact {
  consentId: string;
  redirectUrl: string;
  status: string;
}

interface FinancialDataItem {
  fiType: FIType;
  institutionName: string;   // display only — never part of a stored key
  accountRef: string;
  balance: number;
  currency: string;
  rawJson: Record<string, any>;
  // Stable identifiers from the AA payload (absent for sandbox mock items)
  fipId?: string;
  rawType?: string;          // ReBIT account.type, normalised (e.g. deposit, term_deposit)
  linkRefNumber?: string;
}

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

// ReBIT account.type values (lower-cased) whose transactions are bank CREDIT/DEBIT movements.
// '' covers payloads that don't state a type.
const BANK_DEPOSIT_ACCOUNT_TYPES = new Set(['', 'deposit', 'savings', 'current']);

// Sandbox items carry a ReBIT-style nominee flag so the nominee check has something to read
const MOCK_NO_NOMINEE = { profile: { holders: { holder: [{ nominee: 'NOT-REGISTERED' }] } } };

/** Identity used to match a stored snapshot to a re-delivered account (snapshot columns only). */
const snapshotIdentity = (fiType: string, institution: string, accountRef: string): string =>
  `${fiType}|${String(institution ?? '').trim().toLowerCase()}|${String(accountRef ?? '').trim().toUpperCase()}`;

function safeDecrypt(value: string | null): string {
  if (!value) return '';
  try {
    return decryptPII(value);
  } catch {
    return '';
  }
}

/**
 * FI data window for a new consent: from the requested start (never after today) to the consent's
 * expiry, so PERIODIC fetches can keep bringing new transactions for the consent's whole life.
 * Dates are YYYY-MM-DD; Setu gets them as UTC midnight.
 */
export function consentDataRange(requestedStart: string, now: Date = new Date()): { start: string; end: string } {
  const today = isoDay(now);
  const end = new Date(now);
  end.setUTCMonth(end.getUTCMonth() + CONSENT_DURATION_MONTHS);
  const parsed = new Date(requestedStart);
  let start: string;
  if (Number.isNaN(parsed.getTime())) {
    const yearAgo = new Date(now);
    yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
    start = isoDay(yearAgo);
  } else {
    start = isoDay(parsed) > today ? today : isoDay(parsed);
  }
  return { start, end: isoDay(end) };
}

/** A data session's window: the consent's data range, but never asking for data beyond now. */
export function sessionDataRange(rangeStart: string, rangeEnd: string, now: number = Date.now()): { from: string; to: string } {
  return {
    from: new Date(rangeStart).toISOString(),
    to: new Date(Math.min(now, new Date(rangeEnd).getTime())).toISOString(),
  };
}

// ─────────────────────────────────────────────
// Setu API Client
// ─────────────────────────────────────────────

function createSetuClient(): AxiosInstance {
  return axios.create({
    baseURL: process.env.SETU_AA_BASE_URL || 'https://fiu-sandbox.setu.co',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.SETU_CLIENT_ID || '',
      'x-client-secret': process.env.SETU_CLIENT_SECRET || '',
      'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID || '',
    },
    timeout: 30000,
  });
}

// ─────────────────────────────────────────────
// Create AA Handle for User
// ─────────────────────────────────────────────

export async function createAAHandle(
  userId: string,
  mobile: string
): Promise<string> {
  const client = createSetuClient();

  try {
    if (process.env.NODE_ENV === 'production') {
      const response = await client.post('/v2/users', {
        mobile,
        redirectUrl: `${process.env.FRONTEND_URL}/consent/callback`,
      });
      return response.data.aaHandle;
    }

    // Sandbox: generate mock AA handle
    const aaHandle = `${mobile}@aa-sandbox`;
    // aaHandle embeds the user's mobile number — never log it
    logger.info('AA handle created (sandbox)', { userId });
    return aaHandle;
  } catch (error) {
    logger.error('Failed to create AA handle', { userId, error: (error as Error).message });
    throw new Error('Failed to register with Account Aggregator network');
  }
}

// ─────────────────────────────────────────────
// Create Consent Request
// ─────────────────────────────────────────────

export async function createConsentRequest(
  userId: string,
  fiTypes: FIType[],
  purpose: string,
  dateRangeStart: string,
  ipAddress: string,
  userAgent: string
): Promise<ConsentArtefact> {
  const client = createSetuClient();
  // The server, not the client, decides where the data window ends
  const dateRange = consentDataRange(dateRangeStart);

  try {
    if (process.env.MOCK_MODE === 'true') {
      const mockConsentId = randomUUID();
      logger.info('Consent request created (MOCK)', { userId, consentId: mockConsentId, fiTypes });
      return {
        consentId: mockConsentId,
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/consent/callback?id=${mockConsentId}`,
        status: 'PENDING',
      };
    }

    let consentId: string;
    let redirectUrl: string;

    // Look up user's mobile for VUA (Virtual User Address)
    const user = await UserModel.findById(userId);
    const mobile = user?.mobile || '9999999999'; // fallback for sandbox

    // Map our internal FI types to Setu's expected exact strings
    const fiTypeMap: Record<string, string> = {
      'DEPOSIT': 'DEPOSIT',
      'EQUITY': 'EQUITIES',
      'MUTUAL_FUND': 'MUTUAL_FUNDS',
      'INSURANCE_POLICIES': 'INSURANCE_POLICIES',
      'NPS': 'NPS',
      'GSTN': 'GSTR1_3B'
    };

    // Filter out non-AA types (like LAND_RECORDS) and map to Setu types
    const setuFiTypes = fiTypes
      .map(t => fiTypeMap[t as string])
      .filter(Boolean);

    if (setuFiTypes.length === 0) {
      throw new Error('No valid Account Aggregator FI types provided for consent');
    }

    // Build Setu v2 consent request body
    const setuConsentBody = {
      vua: `${mobile}@onemoney`,
      dataRange: {
        from: new Date(dateRange.start).toISOString(),
        to: new Date(dateRange.end).toISOString(),
      },
      consentDuration: {
        unit: 'MONTH',
        value: CONSENT_DURATION_MONTHS,
      },
      consentMode: 'STORE',
      fetchType: 'PERIODIC',
      consentTypes: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
      fiTypes: setuFiTypes,
      redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/consent/callback`,
      context: [],
    };

    // Call Setu API (works for both sandbox and production)
    const response = await client.post('/v2/consents', setuConsentBody);

    consentId = response.data.id;
    redirectUrl = response.data.url;

    logger.info('Setu consent created', { consentId, redirectUrl });

    // Store consent in database
    await pool.query(
      `INSERT INTO consents (user_id, consent_id, fi_types, purpose, date_range_start, date_range_end, status)
       VALUES ($1, $2, $3::fi_type[], $4, $5, $6, 'PENDING')`,
      [userId, consentId, fiTypes, purpose, dateRange.start, dateRange.end]
    );

    // Audit log
    await auditLogger.log(userId, 'CONSENT_CREATED', 'consents', consentId, ipAddress, userAgent);

    logger.info('Consent request created', { userId, consentId, fiTypes });

    return {
      consentId,
      redirectUrl,
      status: 'PENDING',
    };
  } catch (error: any) {
    const errMsg = error?.response?.data?.errorMsg || (error as Error).message;
    logger.error('Failed to create consent request with Setu', {
      userId,
      error: errMsg,
      // Raw Setu bodies can echo PII; log only the HTTP status
      setuStatus: error?.response?.status,
    });
    
    // Fallback to mock consent creation if Setu fails (e.g. invalid mock credentials in dev)
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Falling back to mock consent creation due to Setu API failure');
      const mockConsentId = randomUUID();
      
      await pool.query(
        `INSERT INTO consents (user_id, consent_id, fi_types, purpose, date_range_start, date_range_end, status)
         VALUES ($1, $2, $3::fi_type[], $4, $5, $6, 'PENDING')`,
        [userId, mockConsentId, fiTypes, purpose, dateRange.start, dateRange.end]
      );
      
      return {
        consentId: mockConsentId,
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/consent/callback?consentId=${mockConsentId}&status=SUCCESS`,
        status: 'PENDING',
      };
    }
    
    throw new Error(`Failed to create consent request: ${errMsg}`);
  }
}

// ─────────────────────────────────────────────
// Handle Consent Callback (Webhook)
// ─────────────────────────────────────────────

/**
 * Verifies the HMAC-SHA256 (hex) of the raw webhook body against SETU_WEBHOOK_SECRET.
 * Returns false when no secret is configured; the route then falls back to
 * fetchSetuConsentStatus rather than trusting the body.
 */
export function verifySetuWebhookSignature(rawBody: string | undefined, signature: string | undefined): boolean {
  const secret = process.env.SETU_WEBHOOK_SECRET;
  if (!secret || !rawBody || !signature) return false;

  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'), 'utf8');
  const received = Buffer.from(signature.replace(/^sha256=/, ''), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Authoritative consent status straight from Setu (server-to-server, with our credentials).
 * Used when a callback can't be signature-verified, so a forged callback can't change state
 * and real callbacks keep working whatever signing scheme Setu uses.
 */
export async function fetchSetuConsentStatus(consentId: string): Promise<string | null> {
  try {
    const response = await createSetuClient().get(`/v2/consents/${encodeURIComponent(consentId)}`);
    return typeof response.data?.status === 'string' ? response.data.status : null;
  } catch (error: any) {
    logger.warn('Setu consent status lookup failed', { consentId, httpStatus: error?.response?.status });
    return null;
  }
}

const CONSENT_AUDIT_ACTIONS: Record<string, 'CONSENT_APPROVED' | 'CONSENT_REVOKED' | 'CONSENT_EXPIRED'> = {
  ACTIVE: 'CONSENT_APPROVED',
  REVOKED: 'CONSENT_REVOKED',
  REJECTED: 'CONSENT_REVOKED',
  EXPIRED: 'CONSENT_EXPIRED',
};

export async function handleConsentCallback(
  consentId: string,
  status: string
): Promise<void> {
  const mappedStatus = status.toUpperCase() === 'APPROVED' ? 'ACTIVE' : status.toUpperCase();

  const result = await pool.query(
    `UPDATE consents SET status = $1::consent_status, revoked_at = CASE WHEN $1::consent_status = 'REVOKED'::consent_status THEN NOW() ELSE NULL END
     WHERE consent_id = $2
     RETURNING user_id`,
    [mappedStatus, consentId]
  );

  if (result.rows.length === 0) {
    logger.warn('Consent callback for unknown consent', { consentId, status });
    return;
  }

  const userId = result.rows[0].user_id;

  const auditAction = CONSENT_AUDIT_ACTIONS[mappedStatus];
  if (auditAction) {
    await auditLogger.log(userId, auditAction, 'consents', consentId, undefined, undefined, { status: mappedStatus });
  }

  logger.info('Consent status updated', { consentId, status: mappedStatus });

  // If consent was approved, fetch data in the background so the webhook acks quickly
  // (Setu retries slow callbacks, which would re-trigger the fetch)
  if (mappedStatus === 'ACTIVE') {
    fetchFinancialData(consentId, userId, undefined, undefined, 'consent_callback').catch((error) => {
      logger.error('Auto data fetch after consent approval failed', {
        consentId,
        error: (error as Error).message,
      });
    });
  }
}

// ─────────────────────────────────────────────
// Fetch Financial Data via Data Session
// ─────────────────────────────────────────────

export async function fetchFinancialData(
  consentId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  reason: AaFetchReason = 'aa_refresh'
): Promise<FinancialDataItem[]> {
  const client = createSetuClient();

  // Get consent details. Dates as text: pg turns a DATE into local midnight, which outside UTC
  // would fall before the consent's own UTC-midnight bounds and get the session rejected.
  const consentResult = await pool.query(
    `SELECT fi_types,
            to_char(date_range_start, 'YYYY-MM-DD') AS range_start,
            to_char(date_range_end, 'YYYY-MM-DD') AS range_end
       FROM consents WHERE consent_id = $1 AND status = $2`,
    [consentId, 'ACTIVE']
  );

  if (consentResult.rows.length === 0) {
    throw new Error('No active consent found');
  }

  const consent = consentResult.rows[0];

  try {
    let financialData: FinancialDataItem[];
    // A PARTIAL session delivers only some accounts; the others keep their previous snapshot
    let partial = false;

    if (process.env.NODE_ENV === 'production') {
      // Step 1: Create data session. Always request the full consented range, up to now:
      // duplicates are dropped on insert, and a "since the latest stored transaction" start would
      // never backfill an account linked later. Consents created before the server set the range
      // end (end = their creation day) can't be widened; they keep fetching up to that end.
      const sessionResponse = await client.post('/v2/sessions', {
        consentId,
        dataRange: sessionDataRange(consent.range_start, consent.range_end),
        format: 'json',
      });

      const sessionId = sessionResponse.data.id;

      // Step 2: Fetch data (with retry for async processing). PARTIAL means some FIPs failed or
      // denied — terminal once no account is still PENDING, and acceptable with whatever is READY
      // if accounts are still pending when we stop waiting.
      let dataResponse;
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (retries + 1)));
        dataResponse = await client.get(`/v2/sessions/${sessionId}`);
        const status = dataResponse.data.status;
        if (status === 'COMPLETED') break;
        if (status === 'FAILED' || status === 'EXPIRED') throw new Error(`Data session ${status}`);
        if (status === 'PARTIAL' && pendingAccountCount(dataResponse.data) === 0) break;
        retries++;
      }

      const finalStatus = dataResponse?.data.status;
      if (finalStatus !== 'COMPLETED' && finalStatus !== 'PARTIAL') {
        throw new Error('Data session timed out');
      }
      partial = finalStatus === 'PARTIAL';

      financialData = normalizeFinancialData(flattenFiResponse(dataResponse!.data));
    } else {
      // Sandbox: generate mock financial data
      financialData = [
        {
          fiType: 'DEPOSIT',
          institutionName: 'HDFC Bank',
          accountRef: 'XXXX1234',
          balance: 450000.50,
          currency: 'INR',
          rawJson: { type: 'SAVINGS', status: 'ACTIVE', ...MOCK_NO_NOMINEE },
        },
        {
          fiType: 'DEPOSIT',
          institutionName: 'State Bank of India',
          accountRef: 'XXXX8877',
          balance: 155000.00,
          currency: 'INR',
          rawJson: { type: 'SAVINGS', status: 'ACTIVE', ...MOCK_NO_NOMINEE },
        },
        {
          fiType: 'EQUITY',
          institutionName: 'Zerodha Broking',
          accountRef: 'DMAT-XXXX9999',
          balance: 1250000.00,
          currency: 'INR',
          rawJson: { type: 'DEMAT', holdings: 15, ...MOCK_NO_NOMINEE },
        },
        {
          fiType: 'MUTUAL_FUND',
          institutionName: 'Groww',
          accountRef: 'FOLIO-XXXX5555',
          balance: 850000.00,
          currency: 'INR',
          rawJson: { type: 'MUTUAL_FUND', folios: 2, ...MOCK_NO_NOMINEE },
        },
      ];

      // Filter based on user's granted consent types
      const allowedTypes = consent.fi_types || [];
      financialData = financialData.filter(item => allowedTypes.includes(item.fiType));

      // Add Insurance if requested
      if (allowedTypes.includes('INSURANCE_POLICIES')) {
        financialData.push({
          fiType: 'INSURANCE_POLICIES',
          institutionName: 'LIC of India',
          accountRef: 'POL-XXXX2222',
          balance: 500000.00,
          currency: 'INR',
          rawJson: { type: 'LIFE', status: 'ACTIVE', ...MOCK_NO_NOMINEE },
        });
      }

      // Add NPS if requested
      if (allowedTypes.includes('NPS')) {
        financialData.push({
          fiType: 'NPS',
          institutionName: 'NSDL CRA',
          accountRef: 'PRAN-XXXX4411',
          balance: 620000.00,
          currency: 'INR',
          rawJson: { type: 'TIER_1', status: 'ACTIVE', ...MOCK_NO_NOMINEE },
        });
      }
    }

    // Replace this consent's snapshots and store transactions atomically. The per-user advisory
    // lock serialises concurrent refreshes (two tabs, a retry) so accounts can't be duplicated,
    // and a failure part-way rolls back instead of leaving the user with half their accounts.
    let newTransactions = 0;
    // Bank deposit accounts whose history lives in the transactions table (for the dormancy check)
    const keyedDeposits: Array<{ item: FinancialDataItem; accountKey: string }> = [];
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`aa-refresh:${userId}`]);
      const consentDbId = (await db.query('SELECT id FROM consents WHERE consent_id = $1', [consentId])).rows[0]?.id;

      if (partial) {
        // Only replace the accounts that were re-delivered; accounts whose FIP failed this time
        // keep their previous snapshot (and their transaction history stays linked to it).
        const delivered = new Set(financialData.map((i) => snapshotIdentity(i.fiType, i.institutionName, i.accountRef)));
        const existing = await db.query(
          'SELECT id, fi_type, institution_name, account_ref_encrypted FROM asset_snapshots_aa WHERE consent_id = $1',
          [consentDbId]
        );
        const replaced = existing.rows
          .filter((r) => delivered.has(snapshotIdentity(r.fi_type, r.institution_name, safeDecrypt(r.account_ref_encrypted))))
          .map((r) => r.id);
        if (replaced.length) {
          await db.query('DELETE FROM asset_snapshots_aa WHERE id = ANY($1::uuid[])', [replaced]);
        }
      } else {
        await db.query('DELETE FROM asset_snapshots_aa WHERE consent_id = $1', [consentDbId]);
      }

      const usedKeys = new Set<string>();
      for (const item of financialData) {
        // Key from stable identifiers (raw ReBIT type, FIP id), not display or mapped fields.
        // Sandbox mock items have neither and fall back to fiType/institution as before.
        let accountKey: string | null = accountKeyOf(item.rawType || item.fiType, item.fipId || item.institutionName, item.accountRef);
        if (usedKeys.has(accountKey)) {
          // Two accounts at one FIP with the same masked number: disambiguate by link reference,
          // or store no transactions for this one rather than merge two histories.
          accountKey = item.linkRefNumber
            ? accountKeyOf(item.rawType || item.fiType, item.fipId || item.institutionName, `${item.accountRef}#${item.linkRefNumber}`)
            : null;
          if (accountKey && usedKeys.has(accountKey)) accountKey = null;
          logger.warn('AA accounts share a masked account number', { userId, fiType: item.fiType, disambiguated: !!accountKey });
        }
        if (accountKey) usedKeys.add(accountKey);

        // Only bank deposit (savings/current) entries are CREDIT/DEBIT cash movements. Term/recurring
        // deposits, insurance, MF etc. keep their transactions inside the encrypted payload, so they
        // never reach the Spend Analyser as income or spend.
        const isBankDeposit = item.fiType === 'DEPOSIT' &&
          BANK_DEPOSIT_ACCOUNT_TYPES.has(String(accountObject(item.rawJson).type ?? '').toLowerCase());
        const txns = accountKey && isBankDeposit ? parseTransactions(item.rawJson) : [];
        // Transactions are stored in their own table; don't duplicate them inside the encrypted
        // payload that every dashboard read loads.
        const storedRaw = txns.length ? withoutTransactions(item.rawJson) : item.rawJson;

        const insertRes = await db.query(
          `INSERT INTO asset_snapshots_aa (user_id, consent_id, fi_type, institution_name, account_ref_encrypted, balance_encrypted, raw_json_encrypted, currency)
           VALUES ($1, $2, $3::fi_type, $4, $5, $6, $7, $8) RETURNING id`,
          [
            userId,
            consentDbId,
            item.fiType,
            item.institutionName,
            encryptPII(item.accountRef),
            encryptPII(item.balance.toString()),
            encryptPII(JSON.stringify(storedRaw)),
            item.currency,
          ]
        );
        const accountId = insertRes.rows[0].id;
        if (!accountKey) continue;
        if (isBankDeposit) keyedDeposits.push({ item, accountKey });

        if (txns.length) {
          newTransactions += await saveAccountTransactions(db, userId, accountId, accountKey, txns, item.currency);
        } else if (isBankDeposit && process.env.NODE_ENV !== 'production') {
          // Sandbox only: two simulated entries per day so the UI has something to show. Never in
          // production — it would fabricate entries in real users' bank histories. Keyed by day,
          // so repeated refreshes don't pile up copies.
          const day = new Date().toISOString().slice(0, 10);
          newTransactions += await saveAccountTransactions(db, userId, accountId, accountKey, [
            { txnId: `SIM-${day}-C`, date: new Date().toISOString(), type: 'CREDIT', amount: 5000, balanceAfter: null, narration: 'Incremental Sync Credit', reference: null, mode: null, dedupeKey: `sim:${day}:c` },
            { txnId: `SIM-${day}-D`, date: new Date().toISOString(), type: 'DEBIT', amount: 1200, balanceAfter: null, narration: 'Incremental Sync Debit', reference: null, mode: null, dedupeKey: `sim:${day}:d` },
          ], item.currency);
        } else {
          await relinkAccountTransactions(db, userId, accountId, accountKey);
        }
      }
      await db.query('COMMIT');
    } catch (err) {
      await db.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      db.release();
    }
    logger.info('AA data stored', { userId, accounts: financialData.length, newTransactions });

    // Hand the stored data to the asset-orchestration agent. enqueueAgentRun never throws and a
    // burst of refreshes collapses into one queued run; not awaited so the caller isn't held up.
    void enqueueAgentRun(userId, reason === 'consent_callback' ? 'consent_granted' : 'data_updated', { reason });

    // New transactions feed the Spend Analyser: classify them in the background
    if (newTransactions > 0) {
      void enqueueSpendAnalysis(userId);
    }

    // Engagement Features: Nominee and Dormant Checks
    try {
      // The nominee flag is in the ReBIT profile (holders.holder[].nominee). Accounts whose payload
      // says nothing are skipped, so an unknown is never recorded (and alerted) as "no nominee".
      const nomineeInput = financialData.flatMap((item) => {
        const flag = nomineeFlagOf(item.rawJson);
        return flag ? [{ ...item, nomineeRegistered: flag === 'REGISTERED' }] : [];
      });
      await nomineeChecker.processAAData(pool, userId, nomineeInput);

      // Dormancy from the stored history (it spans earlier refreshes, not just this fetch's window)
      if (keyedDeposits.length) {
        const spans = await pool.query(
          `SELECT account_key, MIN(date) AS first_tx, MAX(date) AS last_tx
             FROM transactions
            WHERE user_id = $1 AND account_key = ANY($2::text[])
            GROUP BY account_key`,
          [userId, keyedDeposits.map((k) => k.accountKey)]
        );
        const byKey = new Map(spans.rows.map((r) => [r.account_key as string, r]));
        const dormantInput = keyedDeposits.flatMap(({ item, accountKey }) => {
          const span = byKey.get(accountKey);
          return span ? [{ ...item, transactions: [{ valueDate: span.first_tx }, { valueDate: span.last_tx }] }] : [];
        });
        await dormantAccountFinder.analyzeAccounts(pool, userId, dormantInput);
      }
    } catch (e) {
      logger.error('Failed to run engagement checks', { error: (e as Error).message });
    }

    // Audit log
    await auditLogger.log(
      userId,
      'DATA_FETCHED',
      'asset_snapshots',
      consentId,
      ipAddress,
      userAgent
    );

    logger.info('Financial data fetched and stored', {
      userId,
      consentId,
      itemCount: financialData.length,
    });

    return financialData;
  } catch (error) {
    logger.error('Financial data fetch failed', {
      consentId,
      error: (error as Error).message,
    });
    throw new Error('Failed to fetch financial data. Please try again.');
  }
}

// ─────────────────────────────────────────────
// Revoke Consent
// ─────────────────────────────────────────────

export async function revokeConsent(
  consentId: string,
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const client = createSetuClient();

  try {
    if (process.env.NODE_ENV === 'production') {
      await client.put(`/v2/consents/${consentId}/revoke`);
    }

    await pool.query(
      "UPDATE consents SET status = 'REVOKED', revoked_at = NOW() WHERE consent_id = $1 AND user_id = $2",
      [consentId, userId]
    );

    await auditLogger.log(userId, 'CONSENT_REVOKED', 'consents', consentId, ipAddress, userAgent);

    logger.info('Consent revoked', { userId, consentId });
  } catch (error) {
    logger.error('Failed to revoke consent', {
      consentId,
      error: (error as Error).message,
    });
    throw new Error('Failed to revoke consent');
  }
}

// ─────────────────────────────────────────────
// Data Normalisation
// ─────────────────────────────────────────────

const normaliseTypeName = (type: unknown): string =>
  String(type ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');

export function normalizeFinancialData(rawData: any[]): FinancialDataItem[] {
  return rawData.flatMap((item) => {
    // v2 nests the ReBIT account under data.account; the older flat shape has it at the top level
    const account = accountObject(item);
    const summary = account.summary ?? item.summary ?? {};
    // The Setu-level FI type (what the consent asked for) is authoritative; the ReBIT account.type
    // is the fallback. An unknown type is skipped, not silently filed as a bank deposit.
    const fiType = mapFIType(item.fiType) ?? mapFIType(account.type) ?? mapFIType(item.type);
    if (!fiType) {
      logger.warn('Skipping AA account with unrecognised FI type', {
        fiType: String(item.fiType ?? ''),
        accountType: String(account.type ?? item.type ?? ''),
      });
      return [];
    }
    return [{
      fiType,
      institutionName: item.fipName || item.institutionName || item.fipID || item.fipId || 'Unknown',
      accountRef: item.maskedAccNumber || account.maskedAccNumber || item.accountRef || item.linkRefNumber || '',
      balance: parseFloat(summary.currentBalance ?? summary.currentValue ?? item.balance ?? '0') || 0,
      currency: summary.currency || item.currency || 'INR',
      rawJson: item,
      fipId: String(item.fipID ?? item.fipId ?? ''),
      rawType: normaliseTypeName(account.type ?? item.type ?? item.fiType),
      linkRefNumber: item.linkRefNumber ? String(item.linkRefNumber) : undefined,
    }];
  });
}

/** Maps a Setu FI type (DEPOSIT, EQUITIES, MUTUAL_FUNDS, GSTR1_3B, …) or a ReBIT account.type. */
export function mapFIType(type: unknown): FIType | null {
  const typeMap: Record<string, FIType> = {
    deposit: 'DEPOSIT',
    savings: 'DEPOSIT',
    current: 'DEPOSIT',
    term_deposit: 'DEPOSIT',
    recurring_deposit: 'DEPOSIT',
    equity: 'EQUITY',
    equities: 'EQUITY',
    shares: 'EQUITY',
    etf: 'EQUITY',
    etfs: 'EQUITY',
    bonds: 'EQUITY',
    mutual_funds: 'MUTUAL_FUND',
    mutual_fund: 'MUTUAL_FUND',
    mutualfund: 'MUTUAL_FUND',
    mutualfunds: 'MUTUAL_FUND',
    mf: 'MUTUAL_FUND',
    sip: 'MUTUAL_FUND',
    insurance: 'INSURANCE_POLICIES',
    insurance_policies: 'INSURANCE_POLICIES',
    insurancepolicies: 'INSURANCE_POLICIES',
    life_insurance: 'INSURANCE_POLICIES',
    general_insurance: 'INSURANCE_POLICIES',
    ulip: 'INSURANCE_POLICIES',
    nps: 'NPS',
    pension: 'NPS',
    gstn: 'GSTN',
    gst: 'GSTN',
    gstr: 'GSTN',
    gstr1_3b: 'GSTN',
  };
  return typeMap[normaliseTypeName(type)] ?? null;
}

// ─────────────────────────────────────────────
// Mock Data Generator (Sandbox)
// ─────────────────────────────────────────────

function generateMockFinancialData(fiTypes: FIType[]): FinancialDataItem[] {
  const mockData: FinancialDataItem[] = [];

  if (fiTypes.includes('DEPOSIT')) {
    mockData.push(
      {
        fiType: 'DEPOSIT',
        institutionName: 'State Bank of India',
        accountRef: 'XXXX1234',
        balance: 485320.50,
        currency: 'INR',
        rawJson: { type: 'SAVINGS', branch: 'MG Road, Bengaluru' },
      },
      {
        fiType: 'DEPOSIT',
        institutionName: 'HDFC Bank',
        accountRef: 'XXXX5678',
        balance: 1250000.00,
        currency: 'INR',
        rawJson: { type: 'FIXED_DEPOSIT', maturityDate: '2025-12-31' },
      },
      {
        fiType: 'DEPOSIT',
        institutionName: 'ICICI Bank',
        accountRef: 'XXXX9012',
        balance: 78450.25,
        currency: 'INR',
        rawJson: { type: 'SAVINGS', branch: 'Koramangala, Bengaluru' },
      }
    );
  }

  if (fiTypes.includes('EQUITY')) {
    mockData.push(
      {
        fiType: 'EQUITY',
        institutionName: 'Zerodha',
        accountRef: 'ZRD-45678',
        balance: 2340000.00,
        currency: 'INR',
        rawJson: { holdings: 15, demat: 'CDSL' },
      },
      {
        fiType: 'EQUITY',
        institutionName: 'Groww',
        accountRef: 'GRW-12345',
        balance: 560000.00,
        currency: 'INR',
        rawJson: { holdings: 8, demat: 'NSDL' },
      }
    );
  }

  if (fiTypes.includes('MUTUAL_FUND')) {
    mockData.push(
      {
        fiType: 'MUTUAL_FUND',
        institutionName: 'SBI Mutual Fund',
        accountRef: 'SBIMF-789',
        balance: 1875000.00,
        currency: 'INR',
        rawJson: { schemeName: 'SBI Blue Chip Fund - Direct Growth', nav: 78.45 },
      },
      {
        fiType: 'MUTUAL_FUND',
        institutionName: 'HDFC AMC',
        accountRef: 'HDFCMF-456',
        balance: 950000.00,
        currency: 'INR',
        rawJson: { schemeName: 'HDFC Mid Cap Opportunities Fund', nav: 112.30 },
      },
      {
        fiType: 'MUTUAL_FUND',
        institutionName: 'Parag Parikh AMC',
        accountRef: 'PPFAS-123',
        balance: 720000.00,
        currency: 'INR',
        rawJson: { schemeName: 'Parag Parikh Flexi Cap Fund', nav: 65.20 },
      }
    );
  }

  if (fiTypes.includes('INSURANCE_POLICIES')) {
    mockData.push(
      {
        fiType: 'INSURANCE_POLICIES',
        institutionName: 'LIC of India',
        accountRef: 'LIC-2345678',
        balance: 2500000.00,
        currency: 'INR',
        rawJson: { policyType: 'Endowment', sumAssured: 2500000, premium: 24000 },
      },
      {
        fiType: 'INSURANCE_POLICIES',
        institutionName: 'ICICI Prudential',
        accountRef: 'ICICI-P-567',
        balance: 1000000.00,
        currency: 'INR',
        rawJson: { policyType: 'Term Life', coverAmount: 10000000, premium: 15000 },
      }
    );
  }

  if (fiTypes.includes('NPS')) {
    mockData.push({
      fiType: 'NPS',
      institutionName: 'PFRDA - NPS',
      accountRef: 'NPS-PRAN-1234',
      balance: 890000.00,
      currency: 'INR',
      rawJson: { pranNumber: 'XXXX1234', tier: 'Tier I', fundManager: 'SBI Pension' },
    });
  }

  return mockData;
}
