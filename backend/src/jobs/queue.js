import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { slaService } from '../services/sla.service.js';

let redisConnection = null;
let slaQueue = null;
let slaWorker = null;
let localIntervalId = null;

/**
 * Initializes BullMQ queues and workers backed by Redis.
 * In production, requires a connected Redis instance and strictly prevents silent in-memory fallback.
 * In development, in-memory fallback is only used if explicitly enabled via ENABLE_DEV_JOB_SCHEDULER=true.
 */
export const initBackgroundQueues = async () => {
  if (env.IS_PROD) {
    logger.info(`[Queue] Initializing production BullMQ queues connected to Redis: ${env.REDIS_URL}`);
    return initProductionQueues();
  }

  // Development / Test environment
  return initDevelopmentQueues();
};

/**
 * Production queue setup: Connects to Redis and fails fast if unavailable.
 */
async function initProductionQueues() {
  return new Promise((resolve, reject) => {
    let settled = false;

    const connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 5000,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 5) {
          return null; // Stop retrying after 5 attempts
        }
        return Math.min(times * 500, 2000);
      },
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        connection.disconnect();
        reject(
          new Error(
            `[Queue] Production connection timeout to Redis at ${env.REDIS_URL}. Production requires Redis for persistent SLA background jobs.`
          )
        );
      }
    }, 6000);

    connection.on('ready', async () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      redisConnection = connection;
      logger.info('[Queue] Connected to Redis for persistent BullMQ queues.');

      try {
        await setupBullMQ();
        resolve({ mode: 'bullmq', status: 'ready' });
      } catch (err) {
        reject(err);
      }
    });

    connection.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        connection.disconnect();
        reject(
          new Error(
            `[Queue] Failed to connect to Redis (${env.REDIS_URL}): ${err.message}. In-memory fallback is strictly disabled in production.`
          )
        );
      } else {
        logger.error(`[Queue] Redis connection error: ${err.message}`);
      }
    });
  });
}

/**
 * Development queue setup: Attempts Redis first; falls back to in-memory scheduler
 * ONLY if explicitly enabled via ENABLE_DEV_JOB_SCHEDULER=true.
 */
async function initDevelopmentQueues() {
  return new Promise((resolve) => {
    let resolved = false;

    const connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 2) {
          return null; // Stop retrying
        }
        return 500;
      },
    });

    const devTimeout = setTimeout(() => {
      handleDevFallback();
    }, 2500);

    const handleDevFallback = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(devTimeout);
      try {
        connection.disconnect();
      } catch {}

      if (env.ENABLE_DEV_JOB_SCHEDULER) {
        logger.warn(
          'Redis is not reachable. Using development local scheduler fallback (explicitly enabled via ENABLE_DEV_JOB_SCHEDULER=true).'
        );
        startLocalScheduler();
        resolve({ mode: 'local', status: 'active' });
      } else {
        logger.warn(
          'Redis is not reachable and ENABLE_DEV_JOB_SCHEDULER is false. Background jobs are disabled in this session.'
        );
        resolve({ mode: 'disabled', status: 'inactive' });
      }
    };

    connection.on('ready', async () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(devTimeout);
      redisConnection = connection;
      logger.info('Connected to Redis for BullMQ persistent job queues.');

      try {
        await setupBullMQ();
        resolve({ mode: 'bullmq', status: 'ready' });
      } catch (err) {
        logger.error('Failed to setup BullMQ in development:', err);
        handleDevFallback();
      }
    });

    connection.on('error', () => {
      handleDevFallback();
    });
  });
}

/**
 * Configures BullMQ queue, worker, retries, and repeatable deduplicated jobs.
 */
async function setupBullMQ() {
  slaQueue = new Queue('sla-monitoring', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  slaWorker = new Worker(
    'sla-monitoring',
    async (job) => {
      logger.info(`BullMQ processing job [${job.name}] with id: ${job.id}`);
      if (job.name === 'check-sla-breaches') {
        await slaService.checkAndApplyBreaches();
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );

  slaWorker.on('completed', (job) => {
    logger.debug(`BullMQ Job ${job.id} completed.`);
  });

  slaWorker.on('failed', (job, err) => {
    logger.error(`BullMQ Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err?.message);
  });

  // Add repeatable job with deduplication key running every 60 seconds
  await slaQueue.add(
    'check-sla-breaches',
    {},
    {
      jobId: 'repeatable-sla-breach-check',
      repeat: {
        every: 60 * 1000, // 60 seconds
      },
    }
  );

  logger.info('BullMQ SLA monitoring repeatable job scheduled with 3-attempt exponential backoff.');
}

/**
 * In-memory fallback for local development only.
 */
function startLocalScheduler() {
  if (localIntervalId) return;

  logger.info('Started active SLA monitor service (interval: 60s).');
  // Run once on startup
  setTimeout(() => {
    slaService.checkAndApplyBreaches().catch((err) => {
      logger.error('Initial SLA breach check error:', err);
    });
  }, 5000);

  // Repeat every 60 seconds
  localIntervalId = setInterval(async () => {
    try {
      await slaService.checkAndApplyBreaches();
    } catch (err) {
      logger.error('Scheduled SLA breach check error:', err);
    }
  }, 60 * 1000);
}

/**
 * Gracefully shuts down workers, queues, Redis connections, and local intervals.
 */
export const stopBackgroundQueues = async () => {
  if (localIntervalId) {
    clearInterval(localIntervalId);
    localIntervalId = null;
  }
  if (slaWorker) {
    await slaWorker.close();
    slaWorker = null;
  }
  if (slaQueue) {
    await slaQueue.close();
    slaQueue = null;
  }
  if (redisConnection) {
    try {
      await redisConnection.quit();
    } catch {
      redisConnection.disconnect();
    }
    redisConnection = null;
  }
  logger.info('Background job queues stopped gracefully.');
};

/**
 * Returns current queue operational status.
 */
export const getQueueStatus = () => ({
  mode: redisConnection && slaQueue ? 'bullmq' : localIntervalId ? 'local' : 'disabled',
  isRedisConnected: Boolean(redisConnection && redisConnection.status === 'ready'),
  isLocalSchedulerRunning: Boolean(localIntervalId),
});
