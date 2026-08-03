import { demoUser } from '../data/demoData';
import type { AuthResponse } from '../types';

export const DEMO_TOKEN = 'demo-token';

export interface DemoEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export function ok<T>(data: T, message = 'Demo mode'): DemoEnvelope<T> {
  return { success: true, message, data };
}

export function demoAuth(): AuthResponse {
  return { user: demoUser, accessToken: DEMO_TOKEN };
}

// Runs a real API call and silently falls back to the demo payload on ANY failure.
export async function demo<T>(
  realCall: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  try {
    return await realCall();
  } catch {
    return await fallback();
  }
}

// Runs a real void mutation, silently swallowing failures in demo mode.
export async function noop(realCall: () => Promise<void>): Promise<void> {
  try {
    await realCall();
  } catch {
    // silently ignore in demo mode
  }
}
