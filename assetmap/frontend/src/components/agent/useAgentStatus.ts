import { useCallback, useEffect, useRef, useState } from 'react';
import { getAgentStatus, type AgentStatus } from '../../services/agent';

const POLL_MS = 5_000;
const VISIBLE_REFRESH_AFTER_MS = 60_000;

const isAbort = (err: unknown) => (err as { name?: string } | null)?.name === 'AbortError';

/**
 * Status of the asset organiser. Polls every 5s only while a run is queued/running and the tab
 * is visible; when the tab comes back it refreshes at once (or, when idle, if the data is stale).
 */
export function useAgentStatus() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const lastFetchedAt = useRef(0);

  const refresh = useCallback(async (): Promise<AgentStatus | null> => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    try {
      const next = await getAgentStatus(ctrl.signal);
      if (ctrl.signal.aborted) return null;
      lastFetchedAt.current = Date.now();
      setStatus(next);
      setError(null);
      return next;
    } catch (err) {
      if (ctrl.signal.aborted || isAbort(err)) return null;
      setError(err);
      return null;
    } finally {
      if (controller.current === ctrl) {
        controller.current = null;
        setLoading(false);
      }
    }
  }, []);

  // First load; abort anything in flight on unmount
  useEffect(() => {
    void refresh();
    return () => controller.current?.abort();
  }, [refresh]);

  const inFlight = status?.inFlight ?? false;

  // Poll while a run is queued/running, only while the tab is visible
  useEffect(() => {
    if (!inFlight) return;
    let cancelled = false;
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      if (!cancelled && document.visibilityState === 'visible') timer = window.setTimeout(tick, POLL_MS);
    };
    const tick = async () => {
      await refresh();
      schedule();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tick();
      else window.clearTimeout(timer);
    };
    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [inFlight, refresh]);

  // When idle, pick up runs started elsewhere (daily check, new data) once the user comes back
  useEffect(() => {
    if (inFlight) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetchedAt.current > VISIBLE_REFRESH_AFTER_MS) {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [inFlight, refresh]);

  return { status, error, loading, refresh, setStatus };
}

/** Current time, re-rendered every `intervalMs` so relative times stay fresh. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
