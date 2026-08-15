import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncspace';
const STARTUP_RETRIES = 20;
const STARTUP_RETRY_DELAY_MS = 2000;

// Fail DB operations immediately (instead of buffering for 10s) when MongoDB is
// unreachable, so API requests return a fast, clear 503 rather than hanging and
// then surfacing a vague 500. Mongoose handles reconnecting automatically once
// the server is available again.
mongoose.set('bufferCommands', false);

async function connectDBOnce(): Promise<void> {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  const dbName = mongoose.connection.db?.databaseName || 'unknown';
  logger.info(`Connected to MongoDB`);
  logger.info(`Database: ${dbName}`);
}

async function connectDB(): Promise<void> {
  for (let attempt = 1; attempt <= STARTUP_RETRIES; attempt++) {
    try {
      await connectDBOnce();
      return;
    } catch (error) {
      const last = attempt === STARTUP_RETRIES;
      logger.error(
        `Failed to connect to MongoDB (attempt ${attempt}/${STARTUP_RETRIES})` +
          (last ? '' : `, retrying in ${STARTUP_RETRY_DELAY_MS}ms`),
        error,
      );
      if (last) {
        logger.error('MongoDB unreachable — giving up after all retries.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, STARTUP_RETRY_DELAY_MS));
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

export default connectDB;
