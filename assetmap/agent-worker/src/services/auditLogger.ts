import type { Queryable } from '../db/types'

// ─────────────────────────────────────────────
// Audit Logger
// Writes to the backend's append-only audit_logs table. Actions must be values
// of the audit_action enum (agent ones added by migration 034). The worker has
// no request context, so ip_address / user_agent are NULL. Metadata holds
// counts and statuses only — never PII.
// ─────────────────────────────────────────────

export type AgentAuditAction = 'AGENT_RUN_COMPLETED' | 'AGENT_RUN_FAILED'

export interface AuditLogEntry {
  userId:     string
  action:     AgentAuditAction
  entityType: string
  entityId:   string
  metadata?:  Record<string, unknown>
}

/**
 * Never throws: an audit failure is logged and must not turn a finished run into
 * a failed one (the run row itself is the source of truth for run state).
 */
export async function writeAuditLog(db: Queryable, entry: AuditLogEntry): Promise<void> {
  try {
    await db.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
      VALUES ($1, $2::audit_action, $3, $4, NULL, NULL, $5)
    `, [entry.userId, entry.action, entry.entityType, entry.entityId, JSON.stringify(entry.metadata ?? {})])
  } catch (err: any) {
    console.error(`[AuditLog] Could not write ${entry.action} for ${entry.entityType} ${entry.entityId}: ${err?.message ?? err}`)
  }
}
