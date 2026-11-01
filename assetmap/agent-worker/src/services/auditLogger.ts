// ─────────────────────────────────────────────
// Audit Logger Service
// Logs all agent actions for compliance and
// debugging. Wire to your DB/logging backend.
// ─────────────────────────────────────────────

interface AuditLogEntry {
  userId:     string
  action:     string
  entityType: string
  entityId:   string
  metadata?:  Record<string, any>
  ipAddress?: string
}

class AuditLogger {
  async log(entry: AuditLogEntry): Promise<void> {
    console.log(`[AuditLog] ${entry.action}`, {
      userId:     entry.userId,
      entityType: entry.entityType,
      entityId:   entry.entityId,
      metadata:   entry.metadata,
      timestamp:  new Date().toISOString(),
    })

    // TODO: Persist to audit_logs table when available
    // await pool.query(`
    //   INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
    //   VALUES ($1, $2, $3, $4, $5)
    // `, [entry.userId, entry.action, entry.entityType, entry.entityId, entry.metadata])
  }

  async logBulk(entries: AuditLogEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.log(entry)
    }
  }
}

export const auditLogger = new AuditLogger()
