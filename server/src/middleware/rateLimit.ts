/**
 * Rate limiting middleware for Express routes.
 *
 * Uses an in-memory store to track request counts per IP+path combination.
 * Entries are automatically cleaned up every 60 seconds to prevent memory leaks.
 *
 * Trade-offs:
 * - In-memory: Fast, no external dependencies, but resets on server restart
 * - Per-IP+path: Prevents brute-force attacks on specific endpoints
 * - Cleanup timer: Prevents unbounded memory growth from expired entries
 */
import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** In-memory store for rate limit counters. Key format: `${ip}:${path}` */
const store = new Map<string, RateLimitEntry>();

/**
 * Periodic cleanup of expired rate limit entries.
 * Runs every 60 seconds to prevent memory leaks.
 */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}
setInterval(cleanup, 60_000);

/**
 * Creates a rate limiting middleware with configurable limits.
 *
 * @param options - Rate limit configuration
 * @param options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param options.max - Maximum requests per window (default: 100)
 * @param options.message - Error message when limit is exceeded
 * @returns Express middleware function
 *
 * @example
 *   const strictLimit = rateLimit({ windowMs: 60000, max: 10 });
 *   router.post('/login', strictLimit, loginHandler);
 */
export function rateLimit({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later',
}: {
  windowMs?: number;
  max?: number;
  message?: string;
} = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = store.get(key);

    // First request or window expired: start new window
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    // Increment counter and check limit
    entry.count++;
    if (entry.count > max) {
      res.status(429).json({ success: false, message });
      return;
    }
    next();
  };
}

/**
 * Strict rate limit for authentication endpoints.
 * 20 requests per 15 minutes to prevent brute-force attacks.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again in 15 minutes',
});

/**
 * General API rate limit.
 * 200 requests per 15 minutes for standard API endpoints.
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later',
});
