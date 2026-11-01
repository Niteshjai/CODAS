import { api, type ApiResponse } from './api';

/* Typed client for the asset-organiser endpoints (/api/agent).
   The backend queues runs for the agent worker; everything shown in the UI comes from here. */

export type AgentRunStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type AgentTriggerType = 'consent_granted' | 'data_updated' | 'user_refresh' | 'cron_scheduled' | 'manual_admin';

export interface AgentRun {
  id: string;
  status: AgentRunStatus;
  triggerType: AgentTriggerType | string;
  currentStep: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeduplicated: number;
  anomaliesDetected: number;
  sourcesFetched: string[];
  stepsFailed: string[];
  aiUsed: boolean;
}

export interface AgentStatus {
  latestRun: AgentRun | null;
  inFlight: boolean;
  canonicalAssetCount: number;
  openAnomalies: number;
  lastSuccessfulAt: string | null;
}

export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface AgentAnomaly {
  id: string;
  type: string;
  severity: AnomalySeverity;
  description: string | null;
  aiExplanation: string | null;
  institution: string | null;
  assetClass: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrences: number;
}

export interface RequestRunResult {
  runId: string;
  deduped: boolean;
}

export async function getAgentStatus(signal?: AbortSignal): Promise<AgentStatus> {
  const res = await api.get<ApiResponse<AgentStatus>>('/agent/status', { signal });
  return res.data.data!;
}

/** Ask for a fresh scan. Resolves to the queued run (deduped=true when one was already waiting). */
export async function requestAgentRun(): Promise<RequestRunResult> {
  const res = await api.post<ApiResponse<RequestRunResult>>('/agent/runs', {});
  return res.data.data!;
}

export async function getAgentAnomalies(signal?: AbortSignal): Promise<AgentAnomaly[]> {
  const res = await api.get<ApiResponse<{ items: AgentAnomaly[] }>>('/agent/anomalies', { signal });
  return res.data.data?.items ?? [];
}

export async function resolveAgentAnomaly(id: string): Promise<void> {
  await api.patch<ApiResponse<unknown>>(`/agent/anomalies/${encodeURIComponent(id)}`, { resolved: true });
}

/** HTTP status of an api.* error, if any. */
export function errorStatus(err: unknown): number | undefined {
  const e = err as { response?: { status?: number }; statusCode?: number | null } | null;
  return e?.response?.status ?? e?.statusCode ?? undefined;
}

/** Seconds from a 429's Retry-After header (delta-seconds or HTTP date), if the server sent one. */
export function retryAfterSeconds(err: unknown): number | null {
  const headers = (err as { response?: { headers?: Headers } } | null)?.response?.headers;
  const raw = headers?.get?.('Retry-After');
  if (!raw) return null;
  const secs = Number(raw);
  if (Number.isFinite(secs) && secs >= 0) return Math.ceil(secs);
  const at = Date.parse(raw);
  return Number.isNaN(at) ? null : Math.max(0, Math.ceil((at - Date.now()) / 1000));
}
