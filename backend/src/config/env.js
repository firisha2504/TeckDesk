import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const IS_DEV = !IS_PROD;

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/techdesk',
  JWT_SECRET: process.env.JWT_SECRET || 'techdesk_jwt_secret_dev_key_must_be_changed_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  IS_PROD,
  IS_DEV,

  // Background Job Scheduler fallback configuration
  // Fallback is strictly disabled in production to prevent silent job loss
  ENABLE_DEV_JOB_SCHEDULER: IS_PROD
    ? false
    : process.env.ENABLE_DEV_JOB_SCHEDULER === 'true',

  // SMTP Email Delivery configuration
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'TechDesk Support <no-reply@techdesk.com>',
};

/**
 * Validates critical environment configuration at startup.
 * Prevents running in production with insecure defaults or missing requirements.
 */
export const validateEnv = () => {
  const insecureSecrets = [
    'techdesk_jwt_secret_dev_key_must_be_changed_in_prod',
    'replace_with_a_secure_random_string_in_production',
    'secret',
    'changeme',
    'password',
  ];

  if (env.IS_PROD) {
    if (!process.env.JWT_SECRET || insecureSecrets.includes(process.env.JWT_SECRET)) {
      throw new Error(
        'FATAL: In production, JWT_SECRET must be set to a secure, non-default random string.'
      );
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('FATAL: In production, MONGODB_URI environment variable is required.');
    }

    if (!process.env.REDIS_URL) {
      throw new Error('FATAL: In production, REDIS_URL environment variable is required.');
    }
  }
};
