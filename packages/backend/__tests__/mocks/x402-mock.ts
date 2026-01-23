/**
 * x402 Payment Mock Utilities
 *
 * Comprehensive mocks for x402 HTTP 402 payment protocol testing
 * without real blockchain transactions.
 *
 * The x402 protocol flow:
 * 1. Client requests protected resource
 * 2. Server returns 402 Payment Required with payment requirements
 * 3. Client signs EIP-3009 authorization and resubmits with X-Payment header
 * 4. Server verifies payment via Facilitator and grants access
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * x402 Payment Requirements returned in 402 response.
 */
export interface PaymentRequirements {
  /** Network identifier (e.g., 'cronos-testnet') */
  network: string;
  /** USDC token contract address */
  token: string;
  /** Payment amount in token's smallest unit (e.g., 10000 for 0.01 USDC) */
  amount: string;
  /** Recipient wallet address */
  recipient: string;
  /** Maximum chain ID for the transaction */
  maxChainId: number;
  /** Facilitator URL for settlement */
  facilitatorUrl: string;
  /** Optional resource description */
  resource?: string;
  /** Optional expiration timestamp */
  expiresAt?: number;
}

/**
 * x402 Payment Header structure (sent by client).
 */
export interface X402PaymentHeader {
  /** Signature version */
  version: string;
  /** Payment amount in token units */
  amount: string;
  /** Token contract address */
  token: string;
  /** Payer's wallet address */
  from: string;
  /** Recipient's wallet address */
  to: string;
  /** Unique nonce */
  nonce: string;
  /** Expiration timestamp */
  deadline: string;
  /** EIP-3009 signature */
  signature: string;
}

/**
 * Settlement result from facilitator.
 */
export interface SettlementResult {
  success: boolean;
  txHash?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Configuration for MockX402Server.
 */
export interface MockX402ServerConfig {
  /** Default payment requirements */
  defaultRequirements?: Partial<PaymentRequirements>;
  /** Simulate network latency (ms) */
  latency?: number;
  /** Always fail settlements */
  alwaysFail?: boolean;
  /** Custom settlement validator */
  settlementValidator?: (header: X402PaymentHeader) => SettlementResult;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default payment requirements for Cronos testnet.
 */
export const DEFAULT_PAYMENT_REQUIREMENTS: PaymentRequirements = {
  network: 'cronos-testnet',
  token: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0', // devUSDC.e
  amount: '10000', // 0.01 USDC
  recipient: '0xARCADE0000000000000000000000000000000001',
  maxChainId: 338,
  facilitatorUrl: 'https://facilitator.cronoslabs.org',
  resource: 'game-session',
};

/**
 * Game prices in USDC (6 decimals).
 */
export const GAME_PRICES = {
  snake: '10000', // 0.01 USDC
  tetris: '20000', // 0.02 USDC
};

// ============================================================================
// MockX402Server Class
// ============================================================================

/**
 * Mock x402 Server for simulating payment-protected endpoints.
 *
 * @example
 * ```typescript
 * const mockServer = new MockX402Server();
 *
 * // Configure payment requirements
 * mockServer.setRequirements({
 *   amount: '20000',
 *   resource: 'tetris-session',
 * });
 *
 * // Simulate payment scenarios
 * mockServer.mockPaymentRequired(res);  // Returns 402
 * mockServer.mockPaymentVerified(res);  // Returns 200 with session
 * mockServer.mockPaymentFailed(res, 'insufficient_funds');  // Returns 402 with error
 * ```
 */
export class MockX402Server {
  private config: MockX402ServerConfig;
  private requirements: PaymentRequirements;
  private settlementHistory: Array<{ header: X402PaymentHeader; result: SettlementResult; timestamp: Date }> = [];
  private pendingNonces: Set<string> = new Set();
  private usedNonces: Set<string> = new Set();

  constructor(config: MockX402ServerConfig = {}) {
    this.config = config;
    this.requirements = {
      ...DEFAULT_PAYMENT_REQUIREMENTS,
      ...config.defaultRequirements,
    };
  }

  // --------------------------------------------------------------------------
  // Configuration Methods
  // --------------------------------------------------------------------------

  /**
   * Update payment requirements.
   */
  setRequirements(requirements: Partial<PaymentRequirements>): void {
    this.requirements = {
      ...this.requirements,
      ...requirements,
    };
  }

  /**
   * Get current payment requirements.
   */
  getRequirements(): PaymentRequirements {
    return { ...this.requirements };
  }

  /**
   * Reset server state.
   */
  reset(): void {
    this.settlementHistory = [];
    this.pendingNonces.clear();
    this.usedNonces.clear();
    this.requirements = {
      ...DEFAULT_PAYMENT_REQUIREMENTS,
      ...this.config.defaultRequirements,
    };
  }

  // --------------------------------------------------------------------------
  // Mock Response Methods
  // --------------------------------------------------------------------------

  /**
   * Return a 402 Payment Required response.
   */
  mockPaymentRequired(res: Response, customRequirements?: Partial<PaymentRequirements>): Response {
    const requirements = customRequirements
      ? { ...this.requirements, ...customRequirements }
      : this.requirements;

    res.status(402).json({
      error: 'Payment Required',
      code: 'PAYMENT_REQUIRED',
      requirements,
    });

    return res;
  }

  /**
   * Return a successful payment verification response.
   */
  mockPaymentVerified(
    res: Response,
    data?: Record<string, unknown>
  ): Response {
    const txHash = this.generateMockTxHash();
    res.status(200).json({
      success: true,
      txHash,
      ...data,
    });

    return res;
  }

  /**
   * Return a payment failure response.
   */
  mockPaymentFailed(
    res: Response,
    errorCode: string = 'PAYMENT_FAILED',
    errorMessage?: string
  ): Response {
    const errorMessages: Record<string, string> = {
      PAYMENT_FAILED: 'Payment verification failed',
      INSUFFICIENT_FUNDS: 'Insufficient USDC balance',
      INVALID_SIGNATURE: 'Payment signature is invalid',
      EXPIRED_PAYMENT: 'Payment authorization has expired',
      NONCE_ALREADY_USED: 'Payment nonce has already been used',
      WRONG_RECIPIENT: 'Payment recipient does not match requirements',
      WRONG_AMOUNT: 'Payment amount does not match requirements',
      FACILITATOR_ERROR: 'Facilitator service unavailable',
      NETWORK_ERROR: 'Network communication error',
    };

    res.status(402).json({
      error: errorMessage || errorMessages[errorCode] || 'Payment failed',
      code: errorCode,
      requirements: this.requirements,
    });

    return res;
  }

  // --------------------------------------------------------------------------
  // Payment Header Validation
  // --------------------------------------------------------------------------

  /**
   * Validate a payment header against requirements.
   */
  validatePaymentHeader(headerValue: string | undefined): {
    valid: boolean;
    header?: X402PaymentHeader;
    error?: string;
    errorCode?: string;
  } {
    if (!headerValue) {
      return { valid: false, error: 'Missing X-Payment header', errorCode: 'MISSING_HEADER' };
    }

    try {
      const header = this.parsePaymentHeader(headerValue);

      // Validate amount
      if (header.amount !== this.requirements.amount) {
        return {
          valid: false,
          header,
          error: `Expected amount ${this.requirements.amount}, got ${header.amount}`,
          errorCode: 'WRONG_AMOUNT',
        };
      }

      // Validate recipient
      if (header.to.toLowerCase() !== this.requirements.recipient.toLowerCase()) {
        return {
          valid: false,
          header,
          error: `Expected recipient ${this.requirements.recipient}, got ${header.to}`,
          errorCode: 'WRONG_RECIPIENT',
        };
      }

      // Validate token
      if (header.token.toLowerCase() !== this.requirements.token.toLowerCase()) {
        return {
          valid: false,
          header,
          error: `Expected token ${this.requirements.token}, got ${header.token}`,
          errorCode: 'WRONG_TOKEN',
        };
      }

      // Validate deadline
      const deadline = parseInt(header.deadline);
      const now = Math.floor(Date.now() / 1000);
      if (deadline < now) {
        return {
          valid: false,
          header,
          error: 'Payment authorization has expired',
          errorCode: 'EXPIRED_PAYMENT',
        };
      }

      // Validate nonce not already used
      if (this.usedNonces.has(header.nonce)) {
        return {
          valid: false,
          header,
          error: 'Nonce has already been used',
          errorCode: 'NONCE_ALREADY_USED',
        };
      }

      // Validate signature format (basic check)
      if (!header.signature.startsWith('0x') || header.signature.length < 66) {
        return {
          valid: false,
          header,
          error: 'Invalid signature format',
          errorCode: 'INVALID_SIGNATURE',
        };
      }

      return { valid: true, header };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to parse payment header: ${(error as Error).message}`,
        errorCode: 'INVALID_HEADER',
      };
    }
  }

  /**
   * Parse a payment header from base64-encoded JSON.
   */
  parsePaymentHeader(headerValue: string): X402PaymentHeader {
    const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
    return JSON.parse(decoded) as X402PaymentHeader;
  }

  // --------------------------------------------------------------------------
  // Settlement Simulation
  // --------------------------------------------------------------------------

  /**
   * Simulate settlement via facilitator.
   */
  async settle(header: X402PaymentHeader): Promise<SettlementResult> {
    // Simulate network latency
    if (this.config.latency) {
      await new Promise((resolve) => setTimeout(resolve, this.config.latency));
    }

    // Check for forced failures
    if (this.config.alwaysFail) {
      const result: SettlementResult = {
        success: false,
        error: 'Settlement failed (mock)',
        errorCode: 'SETTLEMENT_FAILED',
      };
      this.settlementHistory.push({ header, result, timestamp: new Date() });
      return result;
    }

    // Use custom validator if provided
    if (this.config.settlementValidator) {
      const result = this.config.settlementValidator(header);
      this.settlementHistory.push({ header, result, timestamp: new Date() });
      return result;
    }

    // Default: successful settlement
    const result: SettlementResult = {
      success: true,
      txHash: this.generateMockTxHash(),
    };

    // Mark nonce as used
    this.usedNonces.add(header.nonce);

    this.settlementHistory.push({ header, result, timestamp: new Date() });
    return result;
  }

  /**
   * Get settlement history.
   */
  getSettlementHistory(): Array<{ header: X402PaymentHeader; result: SettlementResult; timestamp: Date }> {
    return [...this.settlementHistory];
  }

  /**
   * Generate a mock transaction hash.
   */
  private generateMockTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

// ============================================================================
// Express Middleware Factory
// ============================================================================

/**
 * Create an x402 middleware for testing.
 *
 * @example
 * ```typescript
 * const mockServer = new MockX402Server();
 * app.use('/api/play', createX402Middleware(mockServer));
 *
 * // Requests without X-Payment header get 402
 * // Requests with valid X-Payment header get processed
 * ```
 */
export function createX402Middleware(
  mockServer: MockX402Server,
  options: {
    onPaymentRequired?: (req: Request, res: Response) => void;
    onPaymentVerified?: (req: Request, res: Response, header: X402PaymentHeader) => void;
    onPaymentFailed?: (req: Request, res: Response, error: string, code: string) => void;
  } = {}
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const paymentHeader = req.header('X-Payment');

    // No payment header - return 402
    if (!paymentHeader) {
      if (options.onPaymentRequired) {
        options.onPaymentRequired(req, res);
      } else {
        mockServer.mockPaymentRequired(res);
      }
      return;
    }

    // Validate payment header
    const validation = mockServer.validatePaymentHeader(paymentHeader);

    if (!validation.valid || !validation.header) {
      if (options.onPaymentFailed) {
        options.onPaymentFailed(req, res, validation.error || 'Payment failed', validation.errorCode || 'PAYMENT_FAILED');
      } else {
        mockServer.mockPaymentFailed(res, validation.errorCode || 'PAYMENT_FAILED', validation.error);
      }
      return;
    }

    // Settle payment
    const settlementResult = await mockServer.settle(validation.header);

    if (!settlementResult.success) {
      if (options.onPaymentFailed) {
        options.onPaymentFailed(req, res, settlementResult.error || 'Settlement failed', settlementResult.errorCode || 'SETTLEMENT_FAILED');
      } else {
        mockServer.mockPaymentFailed(res, settlementResult.errorCode || 'SETTLEMENT_FAILED', settlementResult.error);
      }
      return;
    }

    // Attach payment info to request
    (req as Request & { x402?: { header: X402PaymentHeader; txHash: string } }).x402 = {
      header: validation.header,
      txHash: settlementResult.txHash!,
    };

    if (options.onPaymentVerified) {
      options.onPaymentVerified(req, res, validation.header);
    }

    next();
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a valid mock payment header for testing.
 */
export function createMockPaymentHeader(
  options: Partial<X402PaymentHeader> & { from: string },
  requirements: PaymentRequirements = DEFAULT_PAYMENT_REQUIREMENTS
): string {
  const header: X402PaymentHeader = {
    version: '1',
    amount: requirements.amount,
    token: requirements.token,
    to: requirements.recipient,
    nonce: Math.random().toString(16).slice(2, 18),
    deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour from now
    signature: '0x' + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    ...options,
  };

  return Buffer.from(JSON.stringify(header)).toString('base64');
}

/**
 * Create an expired payment header for testing error scenarios.
 */
export function createExpiredPaymentHeader(from: string): string {
  return createMockPaymentHeader({
    from,
    deadline: (Math.floor(Date.now() / 1000) - 3600).toString(), // 1 hour ago
  });
}

/**
 * Create a payment header with wrong amount for testing.
 */
export function createWrongAmountPaymentHeader(from: string, wrongAmount: string): string {
  return createMockPaymentHeader({
    from,
    amount: wrongAmount,
  });
}

/**
 * Create a payment header with invalid signature for testing.
 */
export function createInvalidSignaturePaymentHeader(from: string): string {
  const header: X402PaymentHeader = {
    version: '1',
    amount: DEFAULT_PAYMENT_REQUIREMENTS.amount,
    token: DEFAULT_PAYMENT_REQUIREMENTS.token,
    from,
    to: DEFAULT_PAYMENT_REQUIREMENTS.recipient,
    nonce: Math.random().toString(16).slice(2, 18),
    deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
    signature: 'invalid-signature', // Invalid format
  };

  return Buffer.from(JSON.stringify(header)).toString('base64');
}

/**
 * Assert that a response is a 402 Payment Required.
 */
export function assertPaymentRequired(
  res: { status: number; body: { code?: string; requirements?: PaymentRequirements } },
  expectedAmount?: string
): void {
  if (res.status !== 402) {
    throw new Error(`Expected 402 Payment Required, got ${res.status}`);
  }

  if (res.body.code !== 'PAYMENT_REQUIRED') {
    throw new Error(`Expected code PAYMENT_REQUIRED, got ${res.body.code}`);
  }

  if (!res.body.requirements) {
    throw new Error('Expected payment requirements in response');
  }

  if (expectedAmount && res.body.requirements.amount !== expectedAmount) {
    throw new Error(`Expected amount ${expectedAmount}, got ${res.body.requirements.amount}`);
  }
}

/**
 * Assert that a response indicates payment success.
 */
export function assertPaymentSuccess(
  res: { status: number; body: { success?: boolean; txHash?: string } }
): void {
  if (res.status !== 200) {
    throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(res.body)}`);
  }

  if (!res.body.success) {
    throw new Error(`Expected success: true, got ${res.body.success}`);
  }

  if (!res.body.txHash) {
    throw new Error('Expected txHash in successful payment response');
  }
}

/**
 * Assert that a response indicates payment failure with specific error code.
 */
export function assertPaymentFailed(
  res: { status: number; body: { code?: string; error?: string } },
  expectedCode?: string
): void {
  if (res.status !== 402) {
    throw new Error(`Expected 402 Payment Failed, got ${res.status}`);
  }

  if (expectedCode && res.body.code !== expectedCode) {
    throw new Error(`Expected error code ${expectedCode}, got ${res.body.code}`);
  }
}

// ============================================================================
// Mock Factories
// ============================================================================

/**
 * Create a mock facilitator client for testing.
 */
export function createMockFacilitatorClient() {
  return {
    settle: jest.fn<(header: X402PaymentHeader) => Promise<SettlementResult>>(),
    verify: jest.fn<(txHash: string) => Promise<boolean>>(),
    getSupported: jest.fn<() => Promise<{ networks: string[]; tokens: string[] }>>(),
  };
}

/**
 * Create a pre-configured mock server for common test scenarios.
 */
export function createTestX402Server(scenario: 'success' | 'fail' | 'slow' = 'success'): MockX402Server {
  switch (scenario) {
    case 'success':
      return new MockX402Server();
    case 'fail':
      return new MockX402Server({ alwaysFail: true });
    case 'slow':
      return new MockX402Server({ latency: 500 });
    default:
      return new MockX402Server();
  }
}
