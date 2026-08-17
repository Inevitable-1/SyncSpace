export const SESSION_EXPIRED_EVENT = 'syncspace:session-expired';
export const SESSION_EXPIRED_MESSAGE = 'Session expired. Please sign in again.';

export function clearStoredSession(): void {
  try {
    localStorage.removeItem('auth');
  } catch {
    // ignore
  }
}

export function notifySessionExpired(): void {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}
