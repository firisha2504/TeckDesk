import http from 'http';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initSocketServer } from './sockets/socketServer.js';
import { initBackgroundQueues, stopBackgroundQueues } from './jobs/queue.js';
import { logger } from './utils/logger.js';

const httpServer = http.createServer(app);

// Initialize real-time Socket.IO server
initSocketServer(httpServer);

async function startServer() {
  try {
    // Validate critical environment settings
    validateEnv();

    // Connect to database
    await connectDatabase();

    // Initialize background job queue and SLA monitor
    await initBackgroundQueues();

    // Start HTTP & WebSocket server
    httpServer.listen(env.PORT, () => {
      logger.info(`====================================================`);
      logger.info(` TechDesk Smart IT Support Server running on port ${env.PORT}`);
      logger.info(` Environment: ${env.NODE_ENV}`);
      logger.info(` API URL: http://localhost:${env.PORT}/api`);
      logger.info(` Healthcheck: http://localhost:${env.PORT}/api/health`);
      logger.info(`====================================================`);
    });
  } catch (error) {
    logger.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  
  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    await stopBackgroundQueues();
    await disconnectDatabase();
    logger.info('TechDesk graceful shutdown completed.');
    process.exit(0);
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forcefully terminating process due to shutdown timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export { app, httpServer };
