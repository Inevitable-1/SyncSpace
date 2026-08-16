import axios from 'axios';
import { clearStoredSession, notifySessionExpired, SESSION_EXPIRED_MESSAGE } from './session';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Endpoints that can legitimately return 401 without meaning "token expired"
// (e.g. bad credentials). These must never trigger a refresh attempt. The
// refresh endpoint itself is included so a failed refresh can never recursively
// trigger another refresh.
const PUBLIC_AUTH_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/demo',
  '/auth/verify-email',
  '/auth/refresh-token',
];

export const NETWORK_ERROR_MESSAGE =
  'Cannot reach the SyncSpace server. Check your connection and try again.';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let sessionExpired = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      return JSON.parse(stored)?.state?.accessToken ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

function setStoredToken(token: string) {
  const stored = localStorage.getItem('auth');
  if (stored) {
    const parsed = JSON.parse(stored);
    parsed.state.accessToken = token;
    localStorage.setItem('auth', JSON.stringify(parsed));
  }
  // Let real-time sockets (and any other consumers) re-authenticate with the
  // freshly refreshed token instead of silently failing on the stale one.
  window.dispatchEvent(new CustomEvent('syncspace:token-updated', { detail: { token } }));
}

// Call when a fresh session starts (login / demo login / logout) so a new
// session is allowed to attempt token refresh again.
export function resetAuthSessionState() {
  sessionExpired = false;
}

interface ApiErrorLike {
  response?: { data?: { message?: string; errors?: Record<string, { msg?: string }> } };
  message?: string;
}

// Best-effort extraction of a user-friendly message from any thrown value.
// Prefers server-provided messages (including first validation error), then the
// error's own message, then a caller-provided fallback. Never returns empty.
export function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as ApiErrorLike;
  const firstValidationError = Object.values(err.response?.data?.errors ?? {})[0]?.msg ?? undefined;
  return (
    firstValidationError ||
    err.response?.data?.message ||
    (typeof err.message === 'string' && err.message.length > 0 ? err.message : undefined) ||
    fallback
  );
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function markSessionExpired(error: unknown): unknown {
  const err = error as {
    message?: string;
    response?: { data?: { message?: string } };
  };
  if (err?.message) {
    err.message = SESSION_EXPIRED_MESSAGE;
  }
  if (err?.response?.data) {
    err.response.data.message = SESSION_EXPIRED_MESSAGE;
  }
  return err;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // No HTTP response at all — the server is unreachable (offline, not running,
    // DNS failure). Attach a structured body so every caller that reads
    // `error.response?.data?.message` shows a precise, actionable message
    // instead of falling back to a generic "… failed" string.
    if (!error.response) {
      error.response = {
        status: 0,
        data: { message: NETWORK_ERROR_MESSAGE },
      };
      return Promise.reject(error);
    }

    if (error.response?.data?.errors && error.response.data.message === 'Validation failed') {
      const firstError = Object.values(error.response.data.errors)[0] as
        { msg?: string } | undefined;
      if (firstError?.msg) {
        error.response.data = { ...error.response.data, message: firstError.msg };
      }
    }

    const status = error.response?.status;
    const isPublicAuthUrl = PUBLIC_AUTH_URLS.some((u) => originalRequest?.url?.includes(u));

    if (status !== 401 || isPublicAuthUrl) {
      return Promise.reject(error);
    }

    // A previous refresh attempt already failed for this session. Do NOT retry
    // the refresh; just surface the session-expired error and let the caller
    // deal with it. The session-expired notification was already emitted once.
    if (sessionExpired) {
      return Promise.reject(markSessionExpired(error));
    }

    // A retried request (after a successful refresh) still 401s => the new
    // token is invalid too, so the session really is over.
    if (originalRequest._retry) {
      sessionExpired = true;
      clearStoredSession();
      notifySessionExpired();
      return Promise.reject(markSessionExpired(error));
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/refresh-token`,
        {},
        { withCredentials: true },
      );

      const newToken = data.data.accessToken;
      setStoredToken(newToken);

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      sessionExpired = true;
      const sessionExpiredError = markSessionExpired(refreshError);
      processQueue(sessionExpiredError, null);
      clearStoredSession();
      notifySessionExpired();
      return Promise.reject(sessionExpiredError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
