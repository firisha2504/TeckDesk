import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { env } from '../src/config/env.js';
import { initBackgroundQueues, stopBackgroundQueues, getQueueStatus } from '../src/jobs/queue.js';

describe('Redis & SLA Background Job Queue Tests', () => {
  beforeEach(async () => {
    await stopBackgroundQueues();
  });

  afterEach(async () => {
    await stopBackgroundQueues();
    vi.restoreAllMocks();
  });

  it('should strictly reject and fail startup in production if Redis is unreachable (preventing silent job loss)', async () => {
    // Simulate production environment
    const origProd = env.IS_PROD;
    const origUrl = env.REDIS_URL;
    env.IS_PROD = true;
    // Point to non-existent redis port
    env.REDIS_URL = 'redis://127.0.0.1:49999';

    try {
      await expect(initBackgroundQueues()).rejects.toThrow(/In-memory fallback is strictly disabled in production/i);
      const status = getQueueStatus();
      // Verify local fallback is NEVER running in production
      expect(status.isLocalSchedulerRunning).toBe(false);
      expect(status.mode).not.toBe('local');
    } finally {
      env.IS_PROD = origProd;
      env.REDIS_URL = origUrl;
    }
  });

  it('should NOT run in-memory fallback in development if ENABLE_DEV_JOB_SCHEDULER is false', async () => {
    const origDevSched = env.ENABLE_DEV_JOB_SCHEDULER;
    const origUrl = env.REDIS_URL;
    env.ENABLE_DEV_JOB_SCHEDULER = false;
    env.REDIS_URL = 'redis://127.0.0.1:49999';

    try {
      const result = await initBackgroundQueues();
      expect(result.mode).toBe('disabled');
      expect(result.status).toBe('inactive');

      const status = getQueueStatus();
      expect(status.isLocalSchedulerRunning).toBe(false);
      expect(status.mode).toBe('disabled');
    } finally {
      env.ENABLE_DEV_JOB_SCHEDULER = origDevSched;
      env.REDIS_URL = origUrl;
    }
  });

  it('should run in-memory fallback in development ONLY when ENABLE_DEV_JOB_SCHEDULER is explicitly true', async () => {
    const origDevSched = env.ENABLE_DEV_JOB_SCHEDULER;
    const origUrl = env.REDIS_URL;
    env.ENABLE_DEV_JOB_SCHEDULER = true;
    env.REDIS_URL = 'redis://127.0.0.1:49999';

    try {
      const result = await initBackgroundQueues();
      expect(result.mode).toBe('local');
      expect(result.status).toBe('active');

      const status = getQueueStatus();
      expect(status.isLocalSchedulerRunning).toBe(true);
      expect(status.mode).toBe('local');
    } finally {
      env.ENABLE_DEV_JOB_SCHEDULER = origDevSched;
      env.REDIS_URL = origUrl;
    }
  });

  it('should shut down gracefully and stop all intervals and connections', async () => {
    const origDevSched = env.ENABLE_DEV_JOB_SCHEDULER;
    env.ENABLE_DEV_JOB_SCHEDULER = true;
    env.REDIS_URL = 'redis://127.0.0.1:49999';

    try {
      await initBackgroundQueues();
      expect(getQueueStatus().isLocalSchedulerRunning).toBe(true);

      await stopBackgroundQueues();
      const status = getQueueStatus();
      expect(status.isLocalSchedulerRunning).toBe(false);
      expect(status.mode).toBe('disabled');
    } finally {
      env.ENABLE_DEV_JOB_SCHEDULER = origDevSched;
    }
  });
});
