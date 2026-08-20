/**
 * JWT token utilities for authentication.
 *
 * Implements a dual-token system:
 * - Access token: Short-lived JWT (15 minutes) for API authentication
 * - Refresh token: Long-lived random string (7 days) for session persistence
 *
 * Refresh tokens are stored hashed (SHA-256) in the database to prevent
 * token theft from database breaches.
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { AuthPayload, TokenPair } from '../types/index.js';

/** Access token expiry duration (default: 15 minutes) */
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];

/** Refresh token validity period in days */
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

/**
 * Retrieves the JWT signing secret from environment variables.
 * Throws immediately if not configured to prevent silent auth failures.
 *
 * @throws {Error} If JWT_SECRET environment variable is not set
 * @returns The JWT signing secret
 */
function getJwtSecret(): jwt.Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Set it in your .env file or environment.',
    );
  }
  return secret;
}

/**
 * Generates a signed JWT access token.
 *
 * @param payload - User payload to encode (userId, email)
 * @returns Signed JWT string
 */
function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generates a cryptographically secure refresh token.
 *
 * The raw token is returned to the client (stored in httpOnly cookie).
 * The SHA-256 hash is stored in the database for verification.
 * This way, even if the database is compromised, the raw refresh tokens
 * cannot be used to impersonate users.
 *
 * @returns Object containing raw token, hashed token, and expiration date
 */
function generateRefreshToken(): { token: string; hashedToken: string; expiresAt: Date } {
  const token = crypto.randomBytes(40).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return { token, hashedToken, expiresAt };
}

/**
 * Generates a complete token pair (access + refresh) for login/registration.
 *
 * @param payload - User payload to encode in the access token
 * @returns Token pair with raw refresh token, hashed refresh token, and expiration
 */
export function generateTokenPair(
  payload: AuthPayload,
): TokenPair & { hashedRefreshToken: string; refreshExpiresAt: Date } {
  const accessToken = generateAccessToken(payload);
  const {
    token: refreshToken,
    hashedToken: hashedRefreshToken,
    expiresAt: refreshExpiresAt,
  } = generateRefreshToken();
  return { accessToken, refreshToken, hashedRefreshToken, refreshExpiresAt };
}

/**
 * Verifies a JWT access token and returns the decoded payload.
 *
 * @param token - JWT string to verify
 * @returns Decoded payload containing userId and email
 * @throws {jwt.VerifyErrors} If token is invalid or expired
 */
export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}

/**
 * Hashes a token using SHA-256 for secure storage.
 *
 * Used to hash refresh tokens before storing in the database.
 * Also used to hash incoming refresh tokens for comparison.
 *
 * @param token - Plain text token to hash
 * @returns SHA-256 hex digest
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
