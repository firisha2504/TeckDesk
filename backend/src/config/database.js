import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let mongod = null;

export const connectDatabase = async () => {
  try {
    mongoose.set('strictQuery', true);
    
    // Attempt standard connection first
    logger.info(`Attempting MongoDB connection to ${env.MONGODB_URI}...`);
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      logger.info('Connected to MongoDB successfully.');
      return mongoose.connection;
    } catch (connError) {
      if (env.IS_PROD) {
        throw connError;
      }

      logger.warn(`Could not connect to external MongoDB: ${connError.message}. Starting embedded MongoDB for local execution...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'techdesk',
          port: 27017,
        }
      });
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      logger.info(`Connected to embedded MongoDB at ${memoryUri}`);
      return mongoose.connection;
    }
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    logger.info('Disconnected from MongoDB.');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};
