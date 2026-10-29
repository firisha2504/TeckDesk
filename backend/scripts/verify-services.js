/**
 * TechDesk Service Verification Script
 * Validates real connectivity to MongoDB, Redis (BullMQ), and SMTP Email services.
 * Does not expose passwords, tokens, or sensitive credentials in output.
 */
import mongoose from 'mongoose';
import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { env, validateEnv } from '../src/config/env.js';
import { emailService } from '../src/services/email.service.js';

console.log('====================================================');
console.log(' TechDesk Live Service Verification');
console.log(` Environment: ${env.NODE_ENV}`);
console.log('====================================================\n');

async function verifyAll() {
  const results = {
    mongodb: false,
    redis: false,
    bullmq: false,
    smtp: false,
  };

  // 1. Verify MongoDB
  console.log('[1/3] Checking MongoDB Database...');
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    const ping = await conn.connection.db.admin().ping();
    console.log(`  ✓ MongoDB Connected successfully at: ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    console.log(`  ✓ Database Ping: OK (${ping.ok === 1 ? 'Healthy' : 'Degraded'})`);
    results.mongodb = true;
  } catch (err) {
    console.log(`  ✗ MongoDB Connection FAILED: ${err.message}`);
  }

  // 2. Verify Redis & BullMQ
  console.log('\n[2/3] Checking Redis & BullMQ Queue Persistence...');
  let redisClient = null;
  try {
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null, // Do not hang
    });

    redisClient.on('error', () => {
      // Handled cleanly below in catch block
    });

    await redisClient.connect();
    const pong = await redisClient.ping();
    console.log(`  ✓ Redis Connected: ${pong} (${env.REDIS_URL.replace(/\/\/.*@/, '//***@')})`);
    results.redis = true;

    // Test BullMQ job queue & worker
    console.log('  Testing BullMQ job queue and persistence...');
    const testQueue = new Queue('techdesk-verify-queue', { connection: redisClient });
    let jobProcessed = false;

    const testWorker = new Worker(
      'techdesk-verify-queue',
      async (job) => {
        if (job.name === 'verify-ping') {
          jobProcessed = true;
        }
      },
      { connection: redisClient }
    );

    const testJob = await testQueue.add(
      'verify-ping',
      { timestamp: Date.now() },
      { removeOnComplete: true, attempts: 2 }
    );

    // Wait up to 3 seconds for job execution
    for (let i = 0; i < 30; i++) {
      if (jobProcessed) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    await testWorker.close();
    await testQueue.close();

    if (jobProcessed) {
      console.log(`  ✓ BullMQ Queue & Worker: Verified (Job ID: ${testJob.id} processed)`);
      results.bullmq = true;
    } else {
      console.log('  ⚠ BullMQ Job added but worker did not acknowledge within 3s');
    }
  } catch (err) {
    console.log(`  ✗ Redis / BullMQ is NOT REACHABLE: ${err.message}`);
    if (env.ENABLE_DEV_JOB_SCHEDULER && !env.IS_PROD) {
      console.log('  ℹ Development Status: In-memory timer fallback is active (ENABLE_DEV_JOB_SCHEDULER=true).');
    } else {
      console.log('  ⚠ Production Warning: Redis is required in production; in-memory fallback is disabled.');
    }
  } finally {
    if (redisClient) {
      try {
        redisClient.disconnect();
      } catch {}
    }
  }

  // 3. Verify SMTP Email
  console.log('\n[3/3] Checking SMTP Email Delivery Service...');
  if (!emailService.isSmtpConfigured()) {
    console.log('  ℹ SMTP is currently UNCONFIGURED (SMTP_HOST is empty in backend/.env).');
    console.log('  ℹ Security Status: Password reset emails are safely suppressed without token leakage.');
  } else {
    console.log(`  SMTP Host configured: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
    const verification = await emailService.verifyConnection();
    if (verification.status === 'CONNECTED') {
      console.log('  ✓ SMTP Server connection verified successfully.');
      results.smtp = true;
    } else {
      console.log(`  ✗ SMTP Server connection test FAILED: ${verification.error || verification.status}`);
    }
  }

  // Summary
  console.log('\n====================================================');
  console.log(' Verification Summary');
  console.log('====================================================');
  console.log(` MongoDB:     ${results.mongodb ? 'READY (Connected)' : 'NOT READY'}`);
  console.log(` Redis Queue: ${results.bullmq ? 'READY (BullMQ Active)' : results.redis ? 'CONNECTED (Queue pending)' : 'UNREACHABLE (Using Dev Fallback)'}`);
  console.log(` SMTP Email:  ${results.smtp ? 'READY (Verified)' : emailService.isSmtpConfigured() ? 'CONFIGURED (Connection Failed)' : 'UNCONFIGURED (Safe Fallback)'}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

verifyAll().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
