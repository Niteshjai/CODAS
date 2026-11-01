// Application Insights via OpenTelemetry. Must be imported before anything else in index.ts so
// the HTTP, Fastify, pg, ioredis and winston instrumentations can patch those modules as they load.
// Off unless APPLICATIONINSIGHTS_CONNECTION_STRING is set, so local dev and tests are unaffected.
//
// Collected: request rates/durations/status codes, dependency calls (Postgres, Redis, outbound
// HTTP such as Setu/Claude) and every winston log record (already PII-masked by the logger's
// format, which runs before transports) — so logger.error calls for unhandled errors, uncaught
// exceptions and Redis/queue failures show up as traces. Alerts (5xx rate, 401 spikes, latency)
// are configured on the Application Insights resource in Azure.
import 'dotenv/config'
import { useAzureMonitor, shutdownAzureMonitor } from '@azure/monitor-opentelemetry'

const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

// Upper bound for the final export on shutdown, so a slow/unreachable ingestion endpoint can't
// hold the process past the platform's SIGKILL deadline.
const FLUSH_TIMEOUT_MS = 3000

if (connectionString) {
  const ratio = Number(process.env.APPINSIGHTS_SAMPLING_RATIO ?? '0.25')
  useAzureMonitor({
    azureMonitorExporterOptions: { connectionString },
    // Keep a fixed fraction of traces to control cost; metrics stay accurate. tracesPerSecond
    // must be 0, otherwise the distro's default rate limiter (5 traces/s) is used and
    // samplingRatio is ignored. OTEL_TRACES_SAMPLER / OTEL_TRACES_SAMPLER_ARG, if set in the app
    // settings, still override both.
    samplingRatio: Number.isFinite(ratio) && ratio > 0 && ratio <= 1 ? ratio : 0.25,
    tracesPerSecond: 0,
    enableLiveMetrics: true,
    // winston is opt-in in this distro; without it no application log reaches App Insights
    instrumentationOptions: { winston: { enabled: true } },
  })
}

// Export whatever spans/metrics/logs are still batched. Call right before process.exit on every
// shutdown path; never throws and never takes longer than FLUSH_TIMEOUT_MS.
export async function flushTelemetry(): Promise<void> {
  if (!connectionString) return
  let timer: NodeJS.Timeout | undefined
  try {
    await Promise.race([
      shutdownAzureMonitor(),
      new Promise<void>((resolve) => { timer = setTimeout(resolve, FLUSH_TIMEOUT_MS) }),
    ])
  } catch {
    // telemetry must never block or fail shutdown
  } finally {
    if (timer) clearTimeout(timer)
  }
}
