/**
 * Global error handling middleware for Express.
 *
 * Catches all unhandled errors and returns appropriate HTTP responses:
 * - AppError instances: Returns the error's status code and message
 * - MongoDB connection issues: Returns 503 with retryable message
 * - All other errors: Returns generic 500 Internal Server Error
 *
 * @see server/src/middleware/auth.ts for AppError usage
 */
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Operational error class for expected errors that should be surfaced to the client.
 *
 * Unlike programming errors (bugs), operational errors are expected failures
 * like "user not found" or "invalid credentials". They have a clear status code
 * and should be shown to the user.
 *
 * @example
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Invalid credentials', 401);
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handler middleware.
 *
 * Must be registered last (after all routes) to catch unhandled errors.
 * Uses the 4-argument signature required by Express for error middleware.
 *
 * @param err - The error that was thrown
 * @param _req - Express request (unused)
 * @param res - Express response
 * @param _next - Next middleware (unused, required for Express to识别 this as error middleware)
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Operational errors are expected failures with clear status codes
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Programming errors (bugs) are logged for debugging
  logger.error('Unhandled error:', err);

  // MongoDB unreachable (no command buffering means queries fail fast). Return
  // a clear, retryable status so the client can show a helpful message instead
  // of a generic "Internal server error".
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Database unavailable. Please try again.',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
