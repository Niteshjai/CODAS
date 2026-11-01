import { logger } from './logger'

// Process lifecycle: background components register how to stop, and the shutdown sequence in
// index.ts runs them after the HTTP server has drained. `isShuttingDown()` flips the readiness
// probe to 503 so the load balancer stops sending new traffic first.

type Closer = { name: string; close: () => Promise<unknown> | unknown }

const closers: Closer[] = []
let shuttingDown = false

export function onShutdown(name: string, close: Closer['close']): void {
  closers.push({ name, close })
}

export function isShuttingDown(): boolean {
  return shuttingDown
}

export function markShuttingDown(): void {
  shuttingDown = true
}

/** Runs every registered closer in parallel; one failing doesn't stop the others. */
export async function runClosers(): Promise<void> {
  await Promise.all(closers.map(async ({ name, close }) => {
    try {
      await close()
    } catch (err) {
      logger.warn('Shutdown step failed', { step: name, error: (err as Error).message })
    }
  }))
}
