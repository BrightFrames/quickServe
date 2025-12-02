/**
 * Centralized Logging System for QuickServe
 * Provides structured logging for debugging, monitoring, and error tracking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Write log entry to file and console
 */
function writeLog(level, category, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    category,
    message,
    ...metadata,
  };

  // Console output with color coding
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[90m', // Gray
  };
  const reset = '\x1b[0m';
  
  console.log(
    `${colors[level]}[${timestamp}] [${level}] [${category}]${reset} ${message}`,
    Object.keys(metadata).length > 0 ? metadata : ''
  );

  // Write to file (async, non-blocking)
  const logFile = path.join(logsDir, `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
}

/**
 * Logger class with category-specific methods
 */
class Logger {
  constructor(category) {
    this.category = category;
  }

  error(message, metadata = {}) {
    writeLog(LOG_LEVELS.ERROR, this.category, message, metadata);
  }

  warn(message, metadata = {}) {
    writeLog(LOG_LEVELS.WARN, this.category, message, metadata);
  }

  info(message, metadata = {}) {
    writeLog(LOG_LEVELS.INFO, this.category, message, metadata);
  }

  debug(message, metadata = {}) {
    writeLog(LOG_LEVELS.DEBUG, this.category, message, metadata);
  }

  // Specialized loggers for different flows
  orderFlow(action, orderId, metadata = {}) {
    this.info(`Order ${action}`, { orderId, ...metadata });
  }

  paymentFlow(action, orderId, amount, metadata = {}) {
    this.info(`Payment ${action}`, { orderId, amount, ...metadata });
  }

  apiRequest(method, path, statusCode, duration, metadata = {}) {
    this.info(`API ${method} ${path} - ${statusCode}`, { duration, ...metadata });
  }
}

/**
 * Create logger for specific category
 */
export function createLogger(category) {
  return new Logger(category);
}

/**
 * Express middleware for request logging
 */
export function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const logger = createLogger('API');

  // Log request
  logger.info(`Incoming ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    body: req.method !== 'GET' ? req.body : undefined,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.apiRequest(req.method, req.path, res.statusCode, duration, {
      responseSize: data?.length,
    });
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Global error logger
 */
export function logError(error, context = {}) {
  const logger = createLogger('ERROR');
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
}

export default createLogger;
