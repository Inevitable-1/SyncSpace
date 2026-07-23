import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncspace';

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    logger.info(`Connected to MongoDB`);
    logger.info(`Database: ${dbName}`);
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

export default connectDB;
