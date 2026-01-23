/**
 * x402 Client Utilities
 *
 * Utilities for handling x402 HTTP payment protocol responses on the frontend.
 * Provides detection and parsing of 402 Payment Required responses.
 *
 * @module config/x402Client
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Asset information in a payment requirement
 */
export interface PaymentAsset {
  /** Token contract address */
  address: string
  /** Token name */
  name: string
  /** Token decimals */
  decimals: number
  /** Token symbol */
  symbol: string
}

/**
 * EIP-712 domain from server
 */
export interface ServerEIP712Domain {
  /** Contract name for the domain */
  name: string
  /** Contract version */
  version: string
  /** Chain ID */
  chainId: number
  /** Verifying contract address */
  verifyingContract: string
}

/**
 * Payment method accepted by the server
 */
export interface AcceptedPaymentMethod {
  /** Payment scheme (e.g., 'exact') */
  scheme: string
  /** Network identifier (e.g., 'cronos-testnet') */
  network: string
  /** Maximum amount required in smallest units */
  maxAmountRequired: string
  /** Resource being purchased */
  resource: string
  /** Payment recipient address */
  payTo: string
  /** Token asset information */
  asset: PaymentAsset
  /** EIP-712 domain for signing */
  eip712Domain: ServerEIP712Domain
}

/**
 * 402 Payment Required response body
 *
 * Returned by the server when payment is required to access a resource.
 */
export interface PaymentRequiredResponse {
  /** Protocol version identifier */
  x402Version: '1'
  /** Array of accepted payment methods */
  accepts: AcceptedPaymentMethod[]
  /** Payment amount in smallest units */
  amount: string
  /** Token symbol (e.g., 'USDC') */
  currency: string
  /** Payment recipient address */
  payTo: string
  /** Blockchain chain ID */
  chainId: number
  /** Token contract address */
  tokenAddress: string
  /** Human-readable description */
  description?: string
  /** Resource being purchased */
  resource?: string
  /** Maximum validity time in seconds */
  maxValiditySeconds?: number
}

/**
 * Parsed payment requirements ready for use
 */
export interface PaymentRequirements {
  /** Payment amount in smallest units as bigint */
  amount: bigint
  /** Payment recipient address */
  payTo: `0x${string}`
  /** Token contract address */
  tokenAddress: `0x${string}`
  /** Chain ID */
  chainId: number
  /** Token symbol */
  currency: string
  /** Token decimals */
  decimals: number
  /** Resource being purchased */
  resource?: string
  /** Description of the payment */
  description?: string
  /** EIP-712 domain for signing */
  eip712Domain: ServerEIP712Domain
  /** Raw response for reference */
  raw: PaymentRequiredResponse
}

/**
 * x402 error types
 */
export type X402ErrorCode =
  | 'PAYMENT_REQUIRED'       // Normal 402 - payment needed
  | 'UNEXPECTED_402'         // 402 without proper headers
  | 'INVALID_RESPONSE'       // Malformed 402 response
  | 'UNSUPPORTED_VERSION'    // Unknown x402 version
  | 'UNSUPPORTED_SCHEME'     // Unknown payment scheme
  | 'CHAIN_MISMATCH'         // Wrong chain ID

/**
 * x402 specific error
 */
export class X402Error extends Error {
  readonly code: X402ErrorCode
  readonly requirements?: PaymentRequirements

  constructor(
    code: X402ErrorCode,
    message: string,
    requirements?: PaymentRequirements
  ) {
    super(message)
    this.name = 'X402Error'
    this.code = code
    this.requirements = requirements
  }
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Check if a response is a 402 Payment Required
 *
 * @param response - Fetch API Response object
 * @returns true if the response is a 402
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/play/snake')
 * if (is402Response(response)) {
 *   const requirements = await parse402Response(response)
 *   // Handle payment
 * }
 * ```
 */
export function is402Response(response: Response): boolean {
  return response.status === 402
}

/**
 * Check if a response has the X-Payment-Required header
 *
 * This header indicates a valid x402 protocol response.
 * A 402 without this header may be from a different payment system.
 *
 * @param response - Fetch API Response object
 * @returns true if the response has X-Payment-Required header
 */
export function hasPaymentRequiredHeader(response: Response): boolean {
  return response.headers.has('X-Payment-Required')
}

/**
 * Get the X-Payment-Required header value
 *
 * @param response - Fetch API Response object
 * @returns The header value or null if not present
 */
export function getPaymentRequiredHeader(response: Response): string | null {
  return response.headers.get('X-Payment-Required')
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse a 402 Payment Required response
 *
 * Validates the response structure and extracts payment requirements.
 *
 * @param response - Fetch API Response object (must be 402)
 * @returns Parsed payment requirements
 * @throws {X402Error} If response is not a valid 402 or has invalid format
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/play/snake')
 * if (is402Response(response)) {
 *   try {
 *     const requirements = await parse402Response(response)
 *     console.log(`Pay ${requirements.amount} to ${requirements.payTo}`)
 *   } catch (e) {
 *     if (e instanceof X402Error) {
 *       console.error('Invalid 402:', e.code, e.message)
 *     }
 *   }
 * }
 * ```
 */
export async function parse402Response(
  response: Response
): Promise<PaymentRequirements> {
  // Check response status
  if (response.status !== 402) {
    throw new X402Error(
      'INVALID_RESPONSE',
      `Expected 402 status, got ${response.status}`
    )
  }

  // Check for X-Payment-Required header
  if (!hasPaymentRequiredHeader(response)) {
    throw new X402Error(
      'UNEXPECTED_402',
      '402 response missing X-Payment-Required header. This may not be an x402 endpoint.'
    )
  }

  // Parse response body
  let body: PaymentRequiredResponse
  try {
    body = await response.json()
  } catch {
    throw new X402Error(
      'INVALID_RESPONSE',
      'Failed to parse 402 response body as JSON'
    )
  }

  // Validate x402 version
  if (body.x402Version !== '1') {
    throw new X402Error(
      'UNSUPPORTED_VERSION',
      `Unsupported x402 version: ${body.x402Version}`
    )
  }

  // Validate required fields
  if (!body.amount || !body.payTo || !body.tokenAddress || !body.chainId) {
    throw new X402Error(
      'INVALID_RESPONSE',
      'Missing required fields in 402 response'
    )
  }

  // Get the first accepted payment method (usually only one)
  const acceptedMethod = body.accepts?.[0]
  if (!acceptedMethod) {
    throw new X402Error(
      'INVALID_RESPONSE',
      'No accepted payment methods in 402 response'
    )
  }

  // Validate payment scheme
  if (acceptedMethod.scheme !== 'exact') {
    throw new X402Error(
      'UNSUPPORTED_SCHEME',
      `Unsupported payment scheme: ${acceptedMethod.scheme}`
    )
  }

  // Build payment requirements
  const requirements: PaymentRequirements = {
    amount: BigInt(body.amount),
    payTo: body.payTo as `0x${string}`,
    tokenAddress: body.tokenAddress as `0x${string}`,
    chainId: body.chainId,
    currency: body.currency,
    decimals: acceptedMethod.asset?.decimals ?? 6,
    resource: body.resource,
    description: body.description,
    eip712Domain: acceptedMethod.eip712Domain,
    raw: body,
  }

  return requirements
}

// ============================================================================
// Fetching Functions
// ============================================================================

/**
 * Fetch payment requirements from an x402-protected endpoint
 *
 * Makes a request to the endpoint without a payment header to trigger
 * a 402 response, then parses and returns the payment requirements.
 *
 * @param endpoint - The URL of the x402-protected endpoint
 * @param options - Optional fetch options (method, headers, etc.)
 * @returns Payment requirements from the 402 response
 * @throws {X402Error} If the endpoint doesn't return 402 or response is invalid
 * @throws {Error} If the request fails entirely
 *
 * @example
 * ```typescript
 * // Get requirements for a game endpoint
 * const requirements = await getPaymentRequirements('/api/play/snake')
 * console.log(`Pay ${requirements.amount} ${requirements.currency} to play`)
 *
 * // With custom options
 * const requirements = await getPaymentRequirements('/api/premium', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ gameId: 'snake' }),
 * })
 * ```
 */
export async function getPaymentRequirements(
  endpoint: string,
  options?: RequestInit
): Promise<PaymentRequirements> {
  // Make request without X-Payment header to get 402 response
  const response = await fetch(endpoint, {
    ...options,
    // Ensure we don't send any payment header
    headers: {
      ...options?.headers,
      // Remove X-Payment if present
    },
  })

  // Check if we got a 402 response
  if (!is402Response(response)) {
    throw new X402Error(
      'INVALID_RESPONSE',
      `Expected 402 Payment Required, got ${response.status} ${response.statusText}. ` +
        'The endpoint may not require payment or may have an error.'
    )
  }

  // Parse and return the payment requirements
  return parse402Response(response)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Detect and handle a 402 response
 *
 * Combined detection and parsing for convenience.
 *
 * @param response - Fetch API Response object
 * @returns Payment requirements if 402, null otherwise
 * @throws {X402Error} If 402 but invalid format
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/play/snake')
 * const requirements = await detect402(response)
 * if (requirements) {
 *   // Handle payment
 * } else {
 *   // Process normal response
 * }
 * ```
 */
export async function detect402(
  response: Response
): Promise<PaymentRequirements | null> {
  if (!is402Response(response)) {
    return null
  }
  return parse402Response(response)
}

/**
 * Create a fetch wrapper that handles 402 responses
 *
 * @param handler - Function to handle payment when 402 is received
 * @returns Wrapped fetch function
 *
 * @example
 * ```typescript
 * const x402Fetch = createX402Fetch(async (requirements) => {
 *   // Show payment modal, get signature, etc.
 *   return signedAuthorization
 * })
 *
 * // Use like normal fetch, but handles 402 automatically
 * const response = await x402Fetch('/api/play/snake')
 * ```
 */
export function createX402Fetch(
  handler: (requirements: PaymentRequirements) => Promise<string>
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init)

    if (!is402Response(response)) {
      return response
    }

    // Parse 402 response
    const requirements = await parse402Response(response)

    // Get payment header from handler
    const paymentHeader = await handler(requirements)

    // Retry request with payment
    return fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        'X-Payment': paymentHeader,
      },
    })
  }
}
