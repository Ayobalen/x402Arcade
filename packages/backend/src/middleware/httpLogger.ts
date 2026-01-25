/**
 * HTTP Request Logging Middleware
 *
 * Structured HTTP request/response logging with:
 * - Request ID tracing
 * - Response time measurement
 * - Status code categorization
 * - Error tracking
 * - Skip patterns for noise reduction
 *
 * Replaces morgan with structured JSON logging for production.
 *
 * @module middleware/httpLogger
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * HTTP logger middleware options
 */
interface HttpLoggerOptions {
  /**
   * Paths to skip logging (e.g., health checks)
   */
  skip?: string[];

  /**
   * Whether to log request body (sanitized)
   */
  logBody?: boolean;

  /**
   * Whether to log query parameters
   */
  logQuery?: boolean;

  /**
   * Fields to redact from body/query (e.g., passwords, tokens)
   */
  redactFields?: string[];
}

/**
 * Default redacted fields
 */
const DEFAULT_REDACT_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'privateKey',
  'private_key',
  'authorization',
];

/**
 * Sanitize object by redacting sensitive fields
 */
function sanitize(
  obj: Record<string, unknown>,
  redactFields: string[]
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if field should be redacted
    if (redactFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitize(value as Record<string, unknown>, redactFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create HTTP logger middleware
 *
 * Logs all HTTP requests with structured data:
 * - Request ID
 * - Method and path
 * - Status code
 * - Response time
 * - User agent
 * - IP address
 * - Query parameters (optional)
 * - Request body (optional, sanitized)
 *
 * @param options - Logger configuration
 * @returns Express middleware function
 */
export function createHttpLogger(options: HttpLoggerOptions = {}): (
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  const {
    skip = ['/health', '/health/live', '/health/ready'],
    logBody = false,
    logQuery = true,
    redactFields = DEFAULT_REDACT_FIELDS,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip logging for specified paths
    if (skip.includes(req.path)) {
      next();
      return;
    }

    const startTime = Date.now();

    // Capture response finish event
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { method, path, query, body } = req;
      const { statusCode } = res;

      // Build context
      const context: Record<string, unknown> = {
        requestId: req.requestId,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      // Add query parameters if enabled
      if (logQuery && Object.keys(query).length > 0) {
        context.query = sanitize(query as Record<string, unknown>, redactFields);
      }

      // Add request body if enabled
      if (logBody && body && Object.keys(body).length > 0) {
        context.body = sanitize(body as Record<string, unknown>, redactFields);
      }

      // Add user ID if available (from auth middleware)
      if ((req as Request & { userId?: string }).userId) {
        context.userId = (req as Request & { userId?: string }).userId;
      }

      // Log the request
      logger.http(method, path, statusCode, duration, req.requestId, context);
    });

    next();
  };
}

/**
 * Default HTTP logger middleware with standard configuration
 */
export const httpLogger = createHttpLogger();

/**
 * Default export for convenience
 */
export default httpLogger;
