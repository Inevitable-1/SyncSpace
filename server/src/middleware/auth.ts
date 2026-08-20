/**
 * Authentication middleware for Express routes.
 *
 * Extracts the JWT access token from the Authorization header, verifies it,
 * and attaches the decoded payload (userId, email) to `req.user`.
 *
 * Usage:
 *   router.get('/protected', authenticate, handler);
 *
 * @see server/src/utils/tokens.ts for token verification logic
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';
import type { AuthPayload } from '../types/index.js';

/**
 * Extended Request type with authenticated user payload.
 * `req.user` is populated by the `authenticate` middleware.
 */
export interface AuthRequest extends Request {
  user?: AuthPayload;
}

/**
 * Middleware that validates the JWT access token from the Authorization header.
 *
 * - Returns 401 if no token is provided
 * - Returns 401 if the token is invalid or expired
 * - Attaches the decoded payload to `req.user` on success
 *
 * @param req - Express request (extended with optional `user` property)
 * @param res - Express response
 * @param next - Next middleware function
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
}
