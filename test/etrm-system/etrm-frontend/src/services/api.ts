import axios from 'axios';
import { useApiLogStore } from '@store/apiLogStore';
import { localId } from '@utils/localId';

/**
 * Single Axios instance for the whole app. Vite's dev server proxies
 * /api/v1 to the Spring Boot backend (see vite.config.ts), and in
 * production this is served from the same origin behind the gateway — so
 * baseURL stays relative rather than hardcoding a host.
 */
export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the auth token on every request once auth lands (JWT per the
// handoff doc's Spring Security setup). Left as a no-op interceptor now so
// the call site doesn't need to change later.
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('etrm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Stamped for the API Activity Log — read back in the response/error
  // interceptors below to compute real request duration.
  (config as typeof config & { _logId: string; _startedAt: number })._logId = localId();
  (config as typeof config & { _logId: string; _startedAt: number })._startedAt = performance.now();
  return config;
});

/**
 * RFC 7807 problem-detail shape, per the handoff doc's API error convention.
 * Components should catch on this shape rather than a raw Axios error so
 * error messaging stays consistent across every screen.
 */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

apiClient.interceptors.response.use(
  (response) => {
    const cfg = response.config as typeof response.config & { _logId?: string; _startedAt?: number };
    useApiLogStore.getState().addEntry({
      id: cfg._logId ?? localId(),
      method: (cfg.method ?? 'get').toUpperCase(),
      url: cfg.url ?? '',
      status: response.status,
      durationMs: cfg._startedAt ? Math.round(performance.now() - cfg._startedAt) : null,
      requestBody: cfg.data ? safeParse(cfg.data) : null,
      responseBody: response.data ?? null,
      error: null,
      startedAt: new Date().toISOString(),
    });
    return response;
  },
  (error) => {
    const cfg = error.config as typeof error.config & { _logId?: string; _startedAt?: number } | undefined;
    const problem: ProblemDetail | undefined = error.response?.data;
    if (cfg) {
      useApiLogStore.getState().addEntry({
        id: cfg._logId ?? localId(),
        method: (cfg.method ?? 'get').toUpperCase(),
        url: cfg.url ?? '',
        status: error.response?.status ?? null,
        durationMs: cfg._startedAt ? Math.round(performance.now() - cfg._startedAt) : null,
        requestBody: cfg.data ? safeParse(cfg.data) : null,
        responseBody: error.response?.data ?? null,
        error: problem?.detail ?? problem?.title ?? error.message ?? 'Request failed',
        startedAt: new Date().toISOString(),
      });
    }
    return Promise.reject(problem ?? error);
  },
);

function safeParse(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

