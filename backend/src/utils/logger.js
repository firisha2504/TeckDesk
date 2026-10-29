const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = process.env.NODE_ENV === 'test' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;

const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = '') => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(`[${formatTimestamp()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  warn: (message, meta = '') => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[${formatTimestamp()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  error: (message, error = '') => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[${formatTimestamp()}] [ERROR] ${message}`, error?.stack || error || '');
    }
  },
  debug: (message, meta = '') => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};
