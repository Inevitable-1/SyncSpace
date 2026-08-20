/**
 * Server entry point for SyncSpace.
 *
 * Startup sequence:
 * 1. Load environment variables from .env
 * 2. Connect to MongoDB (waits for connection before starting)
 * 3. Start Express HTTP server on configured port
 * 4. Log registered routes for debugging
 *
 * If startup fails (e.g., MongoDB unreachable), the process exits with code 1.
 */
import 'dotenv/config';

import app, { printRoutes } from './app.js';
import { logger } from './utils/logger.js';
import connectDB from './configs/db.js';

const PORT = process.env.PORT || 5000;

/**
 * Starts the server by connecting to the database first, then listening for
 * incoming requests. Database connection must succeed before the server
 * can handle any requests.
 */
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    printRoutes();
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
