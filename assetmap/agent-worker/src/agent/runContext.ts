import type { Queryable } from '../db/types'
import { config } from '../config'
import { decryptOptional } from '../utils/encryption'
import {
  AgentContext, AgentJobData, DB_SOURCES, EXTERNAL_SOURCES, SourceKey,
} from './schemas/canonicalAsset'

// ─────────────────────────────────────────────
// Builds the run context at run time from the database, so the queue only
// ever carries { runId, userId, triggerType }. Decrypted values stay in this
// process's memory for the duration of the run.
// ─────────────────────────────────────────────

function safeDecrypt(value: string | null): string | undefined {
  try {
    return decryptOptional(value) ?? undefined
  } catch {
    return undefined // a bad ciphertext must not fail the run; never log the value
  }
}

export function sourcesForRun(): SourceKey[] {
  return config.externalSourcesEnabled() ? [...DB_SOURCES, ...EXTERNAL_SOURCES] : [...DB_SOURCES]
}

export async function loadRunContext(db: Queryable, job: AgentJobData): Promise<AgentContext> {
  const res = await db.query<{
    name_encrypted: string | null
    pan_encrypted:  string | null
    consent_id:     string | null
    state:          string | null
    state_code:     string | null
    district:       string | null
  }>(`
    SELECT u.name_encrypted, u.pan_encrypted,
      (SELECT c.consent_id FROM consents c
        WHERE c.user_id = u.id AND c.status = 'ACTIVE'
        ORDER BY c.created_at DESC LIMIT 1) AS consent_id,
      lr.state, lr.state_code, lr.district
    FROM users u
    LEFT JOIN LATERAL (
      SELECT state, state_code, district FROM land_records
      WHERE user_id = u.id AND is_active IS NOT FALSE
      ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 1
    ) lr ON true
    WHERE u.id = $1
  `, [job.userId])

  const row = res.rows[0]
  if (!row) throw new UserNotFoundError()

  return {
    runId:       job.runId,
    userId:      job.userId,
    triggerType: job.triggerType,
    consentId:   row.consent_id ?? undefined,
    userProfile: {
      name:      safeDecrypt(row.name_encrypted),
      pan:       safeDecrypt(row.pan_encrypted),
      state:     row.state ?? undefined,
      stateCode: row.state_code ?? undefined,
      district:  row.district ?? undefined,
    },
    sourcesToFetch: sourcesForRun(),
    options: { enrichWithAI: true, detectAnomalies: true },
  }
}

export class UserNotFoundError extends Error {
  constructor() { super('User not found') }
}
