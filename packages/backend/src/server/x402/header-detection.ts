/**
 * X-Payment Header Detection
 *
 * Utilities for detecting and extracting the X-Payment header from HTTP requests.
 * Implements case-insensitive header matching per RFC 7230 and provides
 * debug logging for troubleshooting payment flow issues.
 *
 * @module server/x402/header-detection
 * @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2 - HTTP Message Headers
 */

import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';

/**
 * X-Payment Header Detection Result
 *
 * Result object returned by detectXPaymentHeader function.
 * Contains the header value (if present) and metadata about detection.
 */
export interface XPaymentHeaderDetectionResult {
  /**
   * Whether the X-Payment header was found
   */
  found: boolean;

  /**
   * The raw header value (null if not found)
   * This is the base64-encoded string ready for decoding
   */
  value: string | null;

  /**
   * The exact header name that was matched (for debugging)
   * Shows which case variant was used (e.g., 'X-Payment', 'x-payment')
   */
  matchedHeaderName: string | null;

  /**
   * Detection timestamp for logging/debugging
   */
  detectedAt: string;
}

/**
 * X-Payment header name variants
 *
 * HTTP headers are case-insensitive per RFC 7230, but different clients
 * may send different case variations. We check for common patterns.
 */
const X_PAYMENT_HEADER_VARIANTS = [
  'x-payment',
  'X-Payment',
  'X-PAYMENT',
  'x-Payment',
] as const;

/**
 * Detect and extract the X-Payment header from incoming request
 *
 * Searches for the X-Payment header using case-insensitive matching.
 * HTTP headers are case-insensitive per RFC 7230, so 'X-Payment',
 * 'x-payment', and 'X-PAYMENT' are all equivalent.
 *
 * This function:
 * 1. Checks for X-Payment header existence in the request
 * 2. Handles case-insensitive header matching
 * 3. Returns null if header is missing
 * 4. Logs header detection for debugging (when debug=true)
 *
 * @param headers - HTTP request headers (from req.headers)
 * @param debug - Whether to log debug information (default: false)
 * @returns Detection result with header value and metadata
 *
 * @example
 * ```typescript
 * // In Express middleware
 * const detection = detectXPaymentHeader(req.headers, config.debug);
 *
 * if (!detection.found) {
 *   // Return 402 Payment Required
 *   return res.status(402).json(paymentRequired);
 * }
 *
 * // Process payment with detection.value
 * const decoded = Buffer.from(detection.value!, 'base64').toString('utf-8');
 * ```
 *
 * @example
 * ```typescript
 * // Check various header casing scenarios
 * const headers1 = { 'x-payment': 'base64data...' };
 * const headers2 = { 'X-Payment': 'base64data...' };
 * const headers3 = { 'X-PAYMENT': 'base64data...' };
 *
 * // All of these will be detected
 * detectXPaymentHeader(headers1).found // true
 * detectXPaymentHeader(headers2).found // true
 * detectXPaymentHeader(headers3).found // true
 * ```
 */
export function detectXPaymentHeader(
  headers: IncomingHttpHeaders,
  debug: boolean = false,
): XPaymentHeaderDetectionResult {
  const detectedAt = new Date().toISOString();

  // Express normalizes headers to lowercase, but we check all variants
  // to be safe in case of direct header access or different HTTP servers
  for (const variant of X_PAYMENT_HEADER_VARIANTS) {
    // Check the specific variant
    const value = headers[variant];

    if (value !== undefined && value !== null) {
      // Handle array values (multiple headers with same name)
      const headerValue = Array.isArray(value) ? value[0] : value;

      if (typeof headerValue === 'string' && headerValue.length > 0) {
        if (debug) {
          console.log('[x402] X-Payment header detected:', {
            matchedHeaderName: variant,
            valueLength: headerValue.length,
            valuePreview:
              headerValue.substring(0, 50) +
              (headerValue.length > 50 ? '...' : ''),
            detectedAt,
          });
        }

        return {
          found: true,
          value: headerValue,
          matchedHeaderName: variant,
          detectedAt,
        };
      }
    }
  }

  // Also check using lowercase (Express normalizes to lowercase)
  const lowercaseValue = headers['x-payment'];
  if (lowercaseValue !== undefined && lowercaseValue !== null) {
    const headerValue = Array.isArray(lowercaseValue)
      ? lowercaseValue[0]
      : lowercaseValue;

    if (typeof headerValue === 'string' && headerValue.length > 0) {
      if (debug) {
        console.log('[x402] X-Payment header detected (lowercase):', {
          matchedHeaderName: 'x-payment',
          valueLength: headerValue.length,
          valuePreview:
            headerValue.substring(0, 50) +
            (headerValue.length > 50 ? '...' : ''),
          detectedAt,
        });
      }

      return {
        found: true,
        value: headerValue,
        matchedHeaderName: 'x-payment',
        detectedAt,
      };
    }
  }

  // Header not found
  if (debug) {
    console.log('[x402] X-Payment header not found:', {
      checkedVariants: X_PAYMENT_HEADER_VARIANTS,
      availableHeaders: Object.keys(headers).filter((h) =>
        h.toLowerCase().includes('payment'),
      ),
      detectedAt,
    });
  }

  return {
    found: false,
    value: null,
    matchedHeaderName: null,
    detectedAt,
  };
}

/**
 * Check if X-Payment header exists (simple boolean check)
 *
 * A simpler alternative to detectXPaymentHeader when you only
 * need to know if the header is present, not its value.
 *
 * @param headers - HTTP request headers
 * @returns True if X-Payment header is present with a non-empty value
 *
 * @example
 * ```typescript
 * if (!hasXPaymentHeader(req.headers)) {
 *   return res.status(402).json(paymentRequired);
 * }
 * ```
 */
export function hasXPaymentHeader(headers: IncomingHttpHeaders): boolean {
  return detectXPaymentHeader(headers, false).found;
}

/**
 * Extract X-Payment header value (returns null if not found)
 *
 * Convenience function that returns just the header value
 * without the detection metadata.
 *
 * @param headers - HTTP request headers
 * @param debug - Whether to log debug information
 * @returns Header value string or null if not found
 *
 * @example
 * ```typescript
 * const paymentHeader = extractXPaymentHeader(req.headers, config.debug);
 *
 * if (paymentHeader === null) {
 *   return res.status(402).json(paymentRequired);
 * }
 *
 * // Decode the base64 header
 * const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
 * ```
 */
export function extractXPaymentHeader(
  headers: IncomingHttpHeaders,
  debug: boolean = false,
): string | null {
  return detectXPaymentHeader(headers, debug).value;
}

/**
 * Extract X-Payment header from Express Request
 *
 * Convenience function that takes an Express Request object directly.
 *
 * @param req - Express Request object
 * @param debug - Whether to log debug information
 * @returns Header value string or null if not found
 *
 * @example
 * ```typescript
 * app.post('/api/play', (req, res) => {
 *   const paymentHeader = extractXPaymentHeaderFromRequest(req);
 *
 *   if (!paymentHeader) {
 *     return res.status(402).json({ error: 'Payment required' });
 *   }
 *
 *   // Process payment...
 * });
 * ```
 */
export function extractXPaymentHeaderFromRequest(
  req: Request,
  debug: boolean = false,
): string | null {
  return extractXPaymentHeader(req.headers, debug);
}
