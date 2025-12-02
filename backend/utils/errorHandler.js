/**
 * Centralized Error Handler for QuickServe
 * Provides consistent error responses and logging
 */

import { createLogger } from './logger.js';

const logger = createLogger('ErrorHandler');

/**
 * Standard error response structure
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error types
 */
export const ErrorTypes = {
  VALIDATION_ERROR: (message, details) => new AppError(message, 400, true, details),
  UNAUTHORIZED: (message = 'Unauthorized access') => new AppError(message, 401, true),
  FORBIDDEN: (message = 'Access forbidden') => new AppError(message, 403, true),
  NOT_FOUND: (message = 'Resource not found') => new AppError(message, 404, true),
  CONFLICT: (message, details) => new AppError(message, 409, true, details),
  INTERNAL_ERROR: (message = 'Internal server error') => new AppError(message, 500, false),
};

/**
 * Express error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Default to 500 if no status code
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational || false;

  // Log error
  logger.error(err.message, {
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
    details: err.details,
    body: req.body,
  });

  // Send error response
  const response = {
    success: false,
    message: err.message,
    ...(err.details && { details: err.details }),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
}

/**
 * Async route handler wrapper to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation helper
 */
export function validateRequired(data, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw ErrorTypes.VALIDATION_ERROR(
      'Missing required fields',
      { missing }
    );
  }
}

/**
 * Database transaction wrapper with error handling
 */
export async function withTransaction(sequelize, callback) {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Transaction failed and rolled back', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export default {
  AppError,
  ErrorTypes,
  errorHandler,
  asyncHandler,
  validateRequired,
  withTransaction,
};
