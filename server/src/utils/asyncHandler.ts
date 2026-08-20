/**
 * Async error handler wrapper for Express route handlers.
 *
 * Express doesn't automatically catch errors thrown in async route handlers.
 * This wrapper ensures that rejected promises are forwarded to the error
 * middleware instead of causing unhandled promise rejections.
 *
 * @example
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await User.find();
 *     res.json(users);
 *   }));
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler to catch and forward errors.
 *
 * @param fn - Async route handler function
 * @returns Express-compatible request handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
