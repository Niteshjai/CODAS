import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config'

// ─────────────────────────────────────────────
// Shared Claude client and availability state.
//
// Claude is optional: without a key, or once the key is rejected (401/403),
// the worker runs the deterministic pipeline only. Any other API failure
// (overloaded after retries, timeout, network) falls back for that run.
// Errors are logged by message only — never request bodies.
// ─────────────────────────────────────────────

let client: Anthropic | undefined
let disabledReason: string | undefined
let warned = false

export function aiAvailable(): boolean {
  if (disabledReason) return false
  if (!config.hasAnthropicKey()) {
    disabledReason = 'ANTHROPIC_API_KEY not set'
  }
  if (disabledReason) {
    if (!warned) {
      warned = true
      console.warn(`[AI] Claude disabled (${disabledReason}); runs use the deterministic pipeline`)
    }
    return false
  }
  return true
}

export function anthropic(): Anthropic {
  client ??= new Anthropic({
    apiKey:     process.env.ANTHROPIC_API_KEY,
    timeout:    config.anthropicTimeoutMs,
    maxRetries: config.anthropicMaxRetries,
  })
  return client
}

export type AiErrorKind = 'auth' | 'transient' | 'other'

export function isAuthError(err: unknown): boolean {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return true
  const status = (err as any)?.status
  return status === 401 || status === 403
}

/**
 * Classify a Claude API error. Auth errors are not retryable and disable AI
 * for the rest of this process (the key only changes on restart).
 */
export function noteAiError(err: unknown, where: string): AiErrorKind {
  const message = err instanceof Error ? err.message : String(err)
  if (isAuthError(err)) {
    if (!disabledReason) {
      disabledReason = `authentication rejected (${(err as any)?.status ?? 'auth'})`
      warned = true
      console.warn(`[AI] ${where}: Claude rejected the API key; disabling AI for this process. Runs continue deterministically.`)
    }
    return 'auth'
  }
  const status = (err as any)?.status
  const transient = err instanceof Anthropic.APIConnectionError ||
    status === 429 || status === 529 || (typeof status === 'number' && status >= 500)
  console.warn(`[AI] ${where}: Claude call failed (${status ?? 'no status'}): ${message.slice(0, 200)}`)
  return transient ? 'transient' : 'other'
}
