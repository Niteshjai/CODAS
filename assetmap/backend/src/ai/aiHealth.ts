import { getClaude, describeClaudeError } from './claudeClient'

// In-process view of whether Claude calls are currently working, so the UI can say
// "AI unavailable — showing standard analysis" instead of pretending. No request data kept.

const DEGRADED_WINDOW_MS = 15 * 60 * 1000

let lastFailureAt: number | null = null
let lastFailure: string | null = null
let lastSuccessAt: number | null = null

/** configured = key present but no call yet this process; available = last call succeeded */
export type AiAvailability = 'available' | 'configured' | 'degraded' | 'not_configured'

export const aiHealth = {
  recordSuccess(): void {
    lastSuccessAt = Date.now()
  },
  recordFailure(err: unknown): void {
    lastFailureAt = Date.now()
    lastFailure = describeClaudeError(err)
  },
  status(): { availability: AiAvailability; lastError: string | null } {
    if (!getClaude()) return { availability: 'not_configured', lastError: null }
    const recentFailure = lastFailureAt !== null && Date.now() - lastFailureAt < DEGRADED_WINDOW_MS
    const recoveredSince = lastSuccessAt !== null && lastFailureAt !== null && lastSuccessAt > lastFailureAt
    if (recentFailure && !recoveredSince) return { availability: 'degraded', lastError: lastFailure }
    if (lastSuccessAt === null && lastFailureAt === null) return { availability: 'configured', lastError: null }
    return { availability: 'available', lastError: null }
  },
  /** Test hook */
  reset(): void {
    lastFailureAt = null; lastFailure = null; lastSuccessAt = null
  },
}
