import { demoUser } from '../data/demoData';
import type { AuthResponse } from '../types';

const DEMO_TOKEN = 'demo-token';

interface DemoEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// True when the current session was started via "Try Demo". Demo fallbacks must
// only ever apply inside the demo session so real users never see seeded data.
export function isDemoSession(): boolean {
  try {
    const stored = localStorage.getItem('auth');
    if (!stored) return false;
    const parsed = JSON.parse(stored) as { state?: { isDemo?: boolean } };
    return parsed?.state?.isDemo === true;
  } catch {
    return false;
  }
}

export function ok<T>(data: T, message = 'Demo mode'): DemoEnvelope<T> {
  return { success: true, message, data };
}

export function demoAuth(): AuthResponse {
  return { user: demoUser, accessToken: DEMO_TOKEN };
}

// Picks between the demo implementation and the real API implementation based on
// the active session. Demo users never hit the network; real users never touch
// seeded data.
export function branch<T>(demoImpl: () => T | Promise<T>, realImpl: () => Promise<T>): Promise<T> {
  return isDemoSession() ? Promise.resolve(demoImpl()) : realImpl();
}

// Picks the demo payload in demo mode and NEVER touches the network. Real users
// always hit the API so failures surface properly.
export async function demo<T>(
  realCall: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (isDemoSession()) {
    return await fallback();
  }
  return await realCall();
}

// No-op in demo mode (zero network). In real mode the mutation runs and errors
// propagate so mutations never silently appear to succeed.
export async function noop(realCall: () => Promise<void>): Promise<void> {
  if (!isDemoSession()) {
    await realCall();
  }
}
