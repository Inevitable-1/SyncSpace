import { logger } from '../utils/logger.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export function buildVerificationUrl(token: string): string {
  return `${CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Sends the "Verify your SyncSpace account" email.
 *
 * No SMTP provider is configured in this environment, so the email is logged
 * to the server console instead. In production this function would hand the
 * message to nodemailer (or a transactional email provider). The returned URL
 * lets the API surface the link to the client in development so the flow can
 * be completed without a mail server.
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<string> {
  const url = buildVerificationUrl(token);
  const subject = 'Verify your SyncSpace account';
  logger.info(`[DEV EMAIL] To: ${to} | Name: ${name} | Subject: "${subject}" | Link: ${url}`);
  return url;
}
