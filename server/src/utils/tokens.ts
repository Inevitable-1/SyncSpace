import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { AuthPayload, TokenPair } from '../types/index.js';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

function getJwtSecret(): jwt.Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Set it in your .env file or environment.',
    );
  }
  return secret;
}

function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(): { token: string; hashedToken: string; expiresAt: Date } {
  const token = crypto.randomBytes(40).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return { token, hashedToken, expiresAt };
}

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

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
