import { useToastStore } from '../store/toastStore'
import { useNetworkStore } from '../store/networkStore'
import { AppError, type ErrorCategory } from '../errors/AppError'
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const REQUEST_TIMEOUT_MS = 20000;   // a request hanging longer than this is treated as a connection problem
const SLOW_REQUEST_MS    = 5000;    // successful but slower than this → "slow connection" hint
const GET_RETRY_DELAYS   = [800, 2000]; // GETs are idempotent, so retry transient network failures

// ── User-facing copy. Raw server/driver/network text never reaches the UI.
const MSG = {
  offline:     "You're offline. Check your internet connection and try again.",
  timeout:     'This is taking longer than usual. Please check your connection and try again.',
  unreachable: "We couldn't reach AssetMap. Please try again in a moment.",
  server:      'Something went wrong on our side. Please try again.',
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  session:     'Your session has expired. Please sign in again.',
  forbidden:   "You don't have access to this.",
  notFound:    "We couldn't find what you were looking for.",
  invalid:     "Some of the details entered aren't valid. Please check and try again.",
  plan:        'This feature is not available on your current plan.',
  generic:     'Something went wrong. Please try again.',
};

// Authored 4xx messages ("Name does not match PAN records.") are meant for users.
// Framework/driver text (schema validation, SQL, stack traces) is not.
const TECHNICAL_TEXT = /^(body|querystring|params|headers)\b|\/[a-z_]+ must |must (be|have|match|NOT|equal)|\bat position\b|\bsql\b|\bselect |\binsert |relation "|column "|violates|constraint|syntax error|ECONN|ETIMEDOUT|ENOTFOUND|\bnull value\b|undefined|TypeError|ReferenceError|stack|Error:|Internal Server Error|Route [A-Z]+:/i;

function safeServerMessage(data: any): string | undefined {
  const msg = data?.error?.message ?? data?.message;
  if (typeof msg !== 'string') return undefined;
  const trimmed = msg.trim();
  if (!trimmed || trimmed.length > 240 || TECHNICAL_TEXT.test(trimmed)) return undefined;
  return trimmed;
}

function userMessageFor(status: number, data: any): { message: string; category: ErrorCategory } {
  if (status === 401) return { message: MSG.session, category: 'auth' };
  if (status === 402) return { message: safeServerMessage(data) ?? MSG.plan, category: 'plan' };
  if (status === 403) return { message: safeServerMessage(data) ?? MSG.forbidden, category: 'auth' };
  if (status === 404) return { message: safeServerMessage(data) ?? MSG.notFound, category: 'not_found' };
  if (status === 408) return { message: MSG.timeout, category: 'network' };
  if (status === 429) return { message: MSG.rateLimited, category: 'validation' };
  if (status >= 500)  return { message: MSG.server, category: 'server' };
  if (status >= 400)  return { message: safeServerMessage(data) ?? MSG.invalid, category: 'validation' };
  return { message: MSG.generic, category: 'unknown' };
}

/**
 * Error thrown by every api.* call. It is an AppError (so ErrorCard & co. recognise it), its
 * `message` is always safe to show, and it keeps the axios-like `response` shape existing
 * callers read (err.response.status / err.response.data.error.message — sanitised too).
 */
function buildError(params: {
  status:   number;
  data?:    any;
  code:     string;
  message:  string;
  category: ErrorCategory;
  retryable?: boolean;
}): AppError {
  const err = new AppError({
    message:     params.message,
    userMessage: params.message,
    code:        params.code,
    category:    params.category,
    statusCode:  params.status || undefined,
    isRetryable: params.retryable ?? false,
    severity:    params.category === 'network' ? 'warning' : 'error',
  });
  const data = {
    ...(params.data && typeof params.data === 'object' ? params.data : {}),
    success: false,
    error:   { ...(params.data?.error ?? {}), code: params.code, message: params.message },
    message: params.message,
  };
  return Object.assign(err, { response: { status: params.status, data } });
}

// Collapse bursts (a page firing 6 requests during an outage) into one toast
const recentToasts = new Map<string, number>();
function toastOnce(type: 'error' | 'warning', title: string, message: string) {
  const now = Date.now();
  if ((recentToasts.get(title) ?? 0) > now - 8000) return;
  recentToasts.set(title, now);
  useToastStore.getState().add({ type, title, message });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: Error | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
}

/** One network round-trip with timeout + connectivity reporting. Throws AppError on transport failure. */
async function send(url: string, config: RequestInit): Promise<Response> {
  const network = useNetworkStore.getState();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    network.setOffline();
    network.reportRequestFailure(!config.method || config.method.toUpperCase() === 'GET');
    throw buildError({ status: 0, code: 'OFFLINE', message: MSG.offline, category: 'network', retryable: true });
  }

  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = config.signal ? AbortSignal.any([config.signal, timeoutSignal]) : timeoutSignal;
  const started = performance.now();

  try {
    const response = await fetch(url, { ...config, signal });
    network.reportRequestSuccess();
    network.setSlow(performance.now() - started > SLOW_REQUEST_MS);
    return response;
  } catch (err) {
    // Caller cancelled (component unmounted etc.): not a connectivity problem
    if (config.signal?.aborted) throw err;

    const timedOut = timeoutSignal.aborted;
    const isRead = !config.method || config.method.toUpperCase() === 'GET';
    network.reportRequestFailure(isRead);
    if (timedOut) network.setSlow(true);
    throw buildError({
      status:    0,
      code:      timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      message:   timedOut ? MSG.timeout : MSG.unreachable,
      category:  'network',
      retryable: true,
    });
  }
}

async function sendWithRetry(url: string, config: RequestInit): Promise<Response> {
  const isIdempotent = !config.method || config.method.toUpperCase() === 'GET';
  for (let attempt = 0; ; attempt++) {
    try {
      return await send(url, config);
    } catch (err) {
      const retryable = err instanceof AppError && err.isRetryable && err.code !== 'OFFLINE';
      if (!isIdempotent || !retryable || attempt >= GET_RETRY_DELAYS.length) throw err;
      await sleep(GET_RETRY_DELAYS[attempt]);
    }
  }
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // HTML error page from a proxy/gateway instead of our JSON API
    return { __unparseable: true };
  }
}

async function customFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  const headers = new Headers(options.headers || {});
  // Only declare JSON when there is a JSON body: Fastify rejects an empty body sent as
  // application/json, which made every body-less DELETE (logout, revoke, remove…) fail with 400
  if (!headers.has('Content-Type') && options.body != null && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const storedToken = localStorage.getItem('access_token');
  if (storedToken) {
    headers.set('Authorization', `Bearer ${storedToken}`);
  }

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  let response: Response;
  try {
    response = await sendWithRetry(url, config);
  } catch (err) {
    // The offline/unreachable banner already explains outages; toast only for one-off failures
    const { isOnline, serverReachable } = useNetworkStore.getState();
    if (err instanceof AppError && err.code === 'TIMEOUT' && isOnline && serverReachable) {
      toastOnce('warning', 'Slow connection', MSG.timeout);
    }
    throw err;
  }

  const newAccessToken = response.headers.get('x-access-token');
  if (newAccessToken) {
    localStorage.setItem('access_token', newAccessToken);
  }
  const newRefreshToken = response.headers.get('x-refresh-token');
  if (newRefreshToken) {
    localStorage.setItem('refresh_token', newRefreshToken);
  }

  // Interceptor: Handle 401
  if (response.status === 401) {
    if (endpoint.includes('/auth/refresh') || endpoint.includes('/auth/phone')) {
      const errorData = await readJson(response);
      throw buildError({ status: 401, data: errorData, code: errorData?.error?.code ?? 'UNAUTHENTICATED', ...userMessageFor(401, errorData) });
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => customFetch(endpoint, options));
    }

    isRefreshing = true;
    try {
      const storedRefresh = localStorage.getItem('refresh_token');
      await customFetch('/auth/refresh', {
        method: 'POST',
        body: '{}',
        headers: storedRefresh ? { 'x-refresh-token': storedRefresh } : {},
      });
      processQueue(null);
      response = await sendWithRetry(url, config);
    } catch (refreshError) {
      processQueue(refreshError as Error);
      // A dropped connection during refresh is not a logout: keep the session and let the
      // banner/retry handle it. Only a real auth rejection signs the user out.
      const isNetwork = refreshError instanceof AppError && refreshError.category === 'network';
      if (!isNetwork) {
        sessionStorage.removeItem('authUser');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    const errorData = await readJson(response);

    if (response.status === 402) {
      window.dispatchEvent(new CustomEvent('upgrade-required', {
        detail: { message: safeServerMessage(errorData) ?? MSG.plan }
      }));
    }

    const { message, category } = userMessageFor(response.status, errorData);
    // Failed loads (GET) are shown inline by the page with a retry; toast only for actions
    const isRead = !config.method || config.method.toUpperCase() === 'GET';
    if (!isRead && (response.status >= 500 || errorData?.__unparseable)) {
      toastOnce('error', 'Something went wrong', message);
    }

    throw buildError({
      status:    response.status,
      data:      errorData?.__unparseable ? undefined : errorData,
      code:      errorData?.error?.code ?? (response.status >= 500 ? 'SERVER_ERROR' : `HTTP_${response.status}`),
      message,
      category,
      retryable: response.status >= 500 || response.status === 429,
    });
  }

  // Return the axios-like shape { data: ... }
  if ((config as any)?.responseType === 'blob') {
    const data = await response.blob();
    return { data, status: response.status, headers: response.headers };
  }

  const data = await readJson(response);
  if (data?.__unparseable) {
    // 2xx with a non-JSON body: almost always a captive portal / proxy page, not our API
    useNetworkStore.getState().reportRequestFailure(true);
    throw buildError({ status: response.status, code: 'NETWORK_ERROR', message: MSG.unreachable, category: 'network', retryable: true });
  }
  return { data, status: response.status, headers: response.headers };
}

export const api = {
  get: <T = any>(url: string, config?: { params?: Record<string, any>;[key: string]: any }) => {
    let finalUrl = url;
    if (config?.params) {
      const qs = new URLSearchParams(config.params).toString();
      finalUrl += `?${qs}`;
    }
    return customFetch(finalUrl, { method: 'GET', ...config }) as Promise<{ data: T }>;
  },
  post: <T = any>(url: string, data?: any, config?: RequestInit) => {
    // If data is FormData, do not JSON.stringify
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : "{}");
    // If data is FormData, browser will automatically set the correct Content-Type with boundary
    const headers: Record<string, string> = { ...(config?.headers as Record<string, string>) };
    if (data instanceof FormData) {
      // delete Content-Type so browser sets boundary
      delete headers['Content-Type'];
    }
    return customFetch(url, { method: 'POST', body, ...config, headers }) as Promise<{ data: T }>;
  },
  put: <T = any>(url: string, data?: any, config?: RequestInit) => {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : "{}");
    return customFetch(url, { method: 'PUT', body, ...config }) as Promise<{ data: T }>;
  },
  delete: <T = any>(url: string, config?: RequestInit) => {
    return customFetch(url, { method: 'DELETE', ...config }) as Promise<{ data: T }>;
  },
  patch: <T = any>(url: string, data?: any, config?: RequestInit) => {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : "{}");
    return customFetch(url, { method: 'PATCH', body, ...config }) as Promise<{ data: T }>;
  }
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
