/**
 * Application logger using Winston.
 *
 * Provides structured logging with timestamps, service name, and log levels.
 * In development, logs are colorized for readability. In production, logs
 * are output as JSON for machine parsing.
 *
 * Log levels (from most to least verbose):
 * - debug: Detailed debugging information
 * - info: General application events
 * - warn: Warning conditions
 * - error: Error conditions
 *
 * Configure via LOG_LEVEL environment variable (default: 'info').
 */
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'syncspace-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service }) => {
          return `${timestamp} [${service}] ${level}: ${message}`;
        }),
      ),
    }),
  ],
});
