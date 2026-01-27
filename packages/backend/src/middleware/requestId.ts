/**
 * Request ID Middleware
 *
 * Generates or extracts unique request IDs for tracing requests through the system.
 * Request IDs are:
 * - Generated using crypto.randomUUID()
 * - Attached to the request object
 * - Included in response headers (X-Request-ID)
 * - Used in structured logging for correlation
 *
 * This enables:
 * - End-to-end request tracing
 * - Log aggregation and correlation
 * - Debugging distributed systems
 * - Client-side error reporting
 *
 * @module middleware/requestId
 */

import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Request ID header name
 */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Extended Request interface with requestId
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Unique request identifier for tracing
       */
      requestId: string;
    }
  }
}

/**
 * Request ID middleware
 *
 * Generates a unique ID for each request or uses existing ID from header.
 * Attaches the ID to req.requestId and includes it in response headers.
 *
 * Usage:
 * ```ts
 * app.use(requestIdMiddleware);
 *
 * // In route handlers or other middleware:
 * req.requestId // => '123e4567-e89b-12d3-a456-426614174000'
 * ```
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use existing request ID from header if present (for distributed tracing)
  const existingId = req.get(REQUEST_ID_HEADER);

  // Generate new ID if not present
  const requestId = existingId || randomUUID();

  // Attach to request object
  req.requestId = requestId;

  // Add to response headers for client-side correlation
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}

/**
 * Default export for convenience
 */
export default requestIdMiddleware;
