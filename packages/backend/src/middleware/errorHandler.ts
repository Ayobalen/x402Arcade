/**
 * Global Error Handler Middleware
 *
 * Centralized error handling for the Express application.
 * Catches all errors thrown in routes and middleware, logs them,
 * and returns appropriate JSON responses.
 *
 * This middleware must be registered AFTER all routes.
 *
 * @module middleware/errorHandler
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { X402Error } from '../server/x402/errors.js';

/**
 * HTTP Error
 *
 * Custom error class for HTTP errors with status codes.
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Global Error Handler
 *
 * Express error handling middleware that:
 * - Logs error details for debugging
 * - Returns appropriate HTTP status codes
 * - Never exposes stack traces in production
 * - Handles known error types (X402Error, HttpError, etc.)
 *
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function (required for error handler signature)
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,

  _next: NextFunction
): void => {
  // Log error for debugging
  // In production, this should integrate with a logging service (e.g., Sentry, Winston)
   
   
  console.error('Error occurred:', {
    message: err.message,
    name: err.name,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    // Only log stack in development
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  // Handle X402 payment errors
  if (err instanceof X402Error) {
    res.status(err.httpStatus).json(err.toJSON());
    return;
  }

  // Handle custom HTTP errors
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.details && { details: err.details }),
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Zod validation errors (if Zod is used in routes)
  if (err.name === 'ZodError') {
    res.status(400).json({
      error: {
        message: 'Validation error',
        details: (err as { issues?: unknown }).issues,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Express built-in errors
  if (err.name === 'SyntaxError' && 'status' in err && (err as { status: number }).status === 400) {
    // JSON parse error from express.json()
    res.status(400).json({
      error: {
        message: 'Invalid JSON in request body',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle generic errors with 500 Internal Server Error
  // Never expose error details or stack traces in production
  const statusCode =
    'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500;

  res.status(statusCode).json({
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      // Only include stack trace in development
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Default export for convenience
 */
export default errorHandler;
