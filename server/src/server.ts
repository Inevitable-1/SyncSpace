import 'dotenv/config';

import app from './app.js';
import { logger } from './utils/logger.js';
import connectDB from './configs/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
