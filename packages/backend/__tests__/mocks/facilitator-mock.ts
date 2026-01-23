/**
 * Facilitator Mock Server
 *
 * Mock implementation of the x402 facilitator service for end-to-end
 * payment flow testing without real network calls.
 *
 * The x402 facilitator is responsible for:
 * 1. Verifying payment signatures (EIP-3009)
 * 2. Settling payments on-chain
 * 3. Processing refunds when needed
 *
 * @see https://facilitator.cronoslabs.org/
 */

import { jest } from '@jest/globals';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * EIP-3009 transferWithAuthorization parameters.
 */
export interface TransferAuthorization {
  /** Payer address */
  from: `0x${string}`;
  /** Recipient address */
  to: `0x${string}`;
  /** Transfer amount in token's smallest unit */
  value: string;
  /** Deadline timestamp */
  validAfter: string;
  /** Deadline timestamp */
  validBefore: string;
  /** Unique nonce */
  nonce: `0x${string}`;
  /** EIP-712 signature */
  signature: `0x${string}`;
}

/**
 * x402 payment header structure (version 2).
 */
export interface X402PaymentHeaderV2 {
  /** Protocol version */
  version: '2';
  /** Payment authorization */
  authorization: TransferAuthorization;
  /** Resource being purchased */
  resource?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Settlement request body.
 */
export interface SettlementRequest {
  /** Payment authorization header (base64-encoded) */
  paymentHeader: string;
  /** Expected recipient address */
  recipient?: string;
  /** Expected amount */
  amount?: string;
  /** Token contract address */
  token?: string;
}

/**
 * Settlement response.
 */
export interface SettlementResponse {
  /** Whether settlement was successful */
  success: boolean;
  /** Transaction hash if successful */
  txHash?: string;
  /** Block number of the transaction */
  blockNumber?: number;
  /** Timestamp of the transaction */
  timestamp?: number;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: FacilitatorErrorCode;
}

/**
 * Verification request body.
 */
export interface VerificationRequest {
  /** Transaction hash to verify */
  txHash: string;
  /** Expected sender address */
  from?: string;
  /** Expected recipient address */
  to?: string;
  /** Expected amount */
  amount?: string;
}

/**
 * Verification response.
 */
export interface VerificationResponse {
  /** Whether verification was successful */
  verified: boolean;
  /** Transaction details if verified */
  transaction?: {
    txHash: string;
    from: string;
    to: string;
    amount: string;
    blockNumber: number;
    timestamp: number;
    confirmations: number;
  };
  /** Error message if verification failed */
  error?: string;
  /** Error code if verification failed */
  errorCode?: FacilitatorErrorCode;
}

/**
 * Refund request body.
 */
export interface RefundRequest {
  /** Original payment transaction hash */
  originalTxHash: string;
  /** Reason for refund */
  reason: string;
  /** Amount to refund (defaults to full amount) */
  amount?: string;
}

/**
 * Refund response.
 */
export interface RefundResponse {
  /** Whether refund was successful */
  success: boolean;
  /** Refund transaction hash if successful */
  refundTxHash?: string;
  /** Amount refunded */
  amountRefunded?: string;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: FacilitatorErrorCode;
}

/**
 * Supported assets response.
 */
export interface SupportedAssetsResponse {
  /** List of supported networks */
  networks: NetworkInfo[];
  /** List of supported tokens */
  tokens: TokenInfo[];
}

/**
 * Network information.
 */
export interface NetworkInfo {
  /** Chain ID */
  chainId: number;
  /** Network name */
  name: string;
  /** Whether the network is a testnet */
  testnet: boolean;
  /** Facilitator contract address on this network */
  facilitatorAddress: string;
}

/**
 * Token information.
 */
export interface TokenInfo {
  /** Token contract address */
  address: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Chain IDs where this token is supported */
  chainIds: number[];
}

/**
 * Facilitator error codes.
 */
export type FacilitatorErrorCode =
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_AUTHORIZATION'
  | 'INSUFFICIENT_BALANCE'
  | 'NONCE_ALREADY_USED'
  | 'WRONG_RECIPIENT'
  | 'WRONG_AMOUNT'
  | 'UNSUPPORTED_NETWORK'
  | 'UNSUPPORTED_TOKEN'
  | 'TRANSACTION_NOT_FOUND'
  | 'TRANSACTION_PENDING'
  | 'TRANSACTION_FAILED'
  | 'REFUND_ALREADY_PROCESSED'
  | 'REFUND_WINDOW_EXPIRED'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

/**
 * Request log entry.
 */
export interface RequestLogEntry {
  /** Request timestamp */
  timestamp: Date;
  /** Endpoint path */
  endpoint: string;
  /** HTTP method */
  method: string;
  /** Request body */
  body: unknown;
  /** Response */
  response: unknown;
  /** Response status code */
  statusCode: number;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Mock facilitator server configuration.
 */
export interface MockFacilitatorServerConfig {
  /** Base URL (used for logging) */
  baseUrl?: string;
  /** Simulated network latency in milliseconds */
  latency?: number;
  /** Probability of random failures (0-1) */
  failRate?: number;
  /** Always fail with this error code */
  alwaysFailWith?: FacilitatorErrorCode;
  /** Custom settlement validator */
  settlementValidator?: (req: SettlementRequest) => SettlementResponse;
  /** Custom verification validator */
  verificationValidator?: (req: VerificationRequest) => VerificationResponse;
  /** Enable request logging */
  enableLogging?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default facilitator configuration for Cronos testnet.
 */
export const DEFAULT_FACILITATOR_CONFIG = {
  baseUrl: 'https://facilitator.cronoslabs.org',
  settleEndpoint: '/v2/x402/settle',
  verifyEndpoint: '/v2/x402/verify',
  refundEndpoint: '/v2/x402/refund',
  supportedEndpoint: '/v2/x402/supported',
};

/**
 * Cronos testnet network info.
 */
export const CRONOS_TESTNET_NETWORK: NetworkInfo = {
  chainId: 338,
  name: 'Cronos Testnet',
  testnet: true,
  facilitatorAddress: '0x0000000000000000000000000000000000000402',
};

/**
 * Cronos mainnet network info.
 */
export const CRONOS_MAINNET_NETWORK: NetworkInfo = {
  chainId: 25,
  name: 'Cronos',
  testnet: false,
  facilitatorAddress: '0x0000000000000000000000000000000000000402',
};

/**
 * devUSDC.e token info.
 */
export const DEV_USDC_TOKEN: TokenInfo = {
  address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
  symbol: 'devUSDC.e',
  name: 'Bridged USDC (Stargate)',
  decimals: 6,
  chainIds: [338],
};

/**
 * Error messages for each error code.
 */
export const ERROR_MESSAGES: Record<FacilitatorErrorCode, string> = {
  INVALID_SIGNATURE: 'Payment signature is invalid or cannot be verified',
  EXPIRED_AUTHORIZATION: 'Payment authorization has expired',
  INSUFFICIENT_BALANCE: 'Insufficient token balance in payer wallet',
  NONCE_ALREADY_USED: 'Payment nonce has already been used',
  WRONG_RECIPIENT: 'Payment recipient does not match expected address',
  WRONG_AMOUNT: 'Payment amount does not match expected amount',
  UNSUPPORTED_NETWORK: 'Network is not supported by the facilitator',
  UNSUPPORTED_TOKEN: 'Token is not supported by the facilitator',
  TRANSACTION_NOT_FOUND: 'Transaction not found on the blockchain',
  TRANSACTION_PENDING: 'Transaction is still pending confirmation',
  TRANSACTION_FAILED: 'Transaction failed or was reverted',
  REFUND_ALREADY_PROCESSED: 'Refund for this transaction has already been processed',
  REFUND_WINDOW_EXPIRED: 'Refund window has expired for this transaction',
  INTERNAL_ERROR: 'Internal facilitator error',
  RATE_LIMITED: 'Request rate limit exceeded',
  SERVICE_UNAVAILABLE: 'Facilitator service is temporarily unavailable',
};

// ============================================================================
// Utility Functions
// ============================================================================

let txCounter = 1000;
let blockCounter = 5000000;

/**
 * Generate a mock transaction hash.
 */
export function generateMockTxHash(): `0x${string}` {
  txCounter++;
  const counterHex = txCounter.toString(16).padStart(8, '0');
  const randomPart = Array.from({ length: 56 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `0x${counterHex}${randomPart}` as `0x${string}`;
}

/**
 * Generate a mock block number.
 */
export function generateMockBlockNumber(): number {
  blockCounter++;
  return blockCounter;
}

/**
 * Reset mock counters for test isolation.
 */
export function resetFacilitatorCounters(): void {
  txCounter = 1000;
  blockCounter = 5000000;
}

/**
 * Decode a base64-encoded payment header.
 */
export function decodePaymentHeader(encoded: string): X402PaymentHeaderV2 | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as X402PaymentHeaderV2;
  } catch {
    return null;
  }
}

/**
 * Encode a payment header to base64.
 */
export function encodePaymentHeader(header: X402PaymentHeaderV2): string {
  return Buffer.from(JSON.stringify(header)).toString('base64');
}

/**
 * Create a mock payment header for testing.
 */
export function createMockPaymentHeaderV2(options: {
  from: `0x${string}`;
  to?: `0x${string}`;
  value?: string;
  nonce?: `0x${string}`;
  validUntil?: number;
}): string {
  const header: X402PaymentHeaderV2 = {
    version: '2',
    authorization: {
      from: options.from,
      to: options.to || '0xA0CADE0000000000000000000000000000000001' as `0x${string}`,
      value: options.value || '10000', // 0.01 USDC
      validAfter: '0',
      validBefore: (options.validUntil || Math.floor(Date.now() / 1000) + 3600).toString(),
      nonce: options.nonce || `0x${Math.random().toString(16).slice(2, 34).padEnd(32, '0')}` as `0x${string}`,
      signature: `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as `0x${string}`,
    },
  };

  return encodePaymentHeader(header);
}

// ============================================================================
// MockFacilitatorServer Class
// ============================================================================

/**
 * Mock Facilitator Server for end-to-end payment flow testing.
 *
 * Simulates the Cronos x402 facilitator service behavior including:
 * - Payment settlement via EIP-3009 transferWithAuthorization
 * - Transaction verification
 * - Refund processing
 * - Rate limiting and error scenarios
 *
 * @example
 * ```typescript
 * const facilitator = new MockFacilitatorServer({
 *   latency: 100,
 *   enableLogging: true,
 * });
 *
 * // Simulate successful settlement
 * const result = await facilitator.settle({
 *   paymentHeader: createMockPaymentHeaderV2({ from: playerAddress }),
 *   recipient: arcadeWallet,
 *   amount: '10000',
 * });
 *
 * // Verify the transaction
 * const verification = await facilitator.verify({
 *   txHash: result.txHash!,
 * });
 *
 * // Process a refund
 * const refund = await facilitator.refund({
 *   originalTxHash: result.txHash!,
 *   reason: 'Game crashed',
 * });
 * ```
 */
export class MockFacilitatorServer {
  private config: MockFacilitatorServerConfig;
  private settlements: Map<string, SettlementResponse & { request: SettlementRequest }> = new Map();
  private refunds: Map<string, RefundResponse & { request: RefundRequest }> = new Map();
  private usedNonces: Set<string> = new Set();
  private requestLog: RequestLogEntry[] = [];

  constructor(config: MockFacilitatorServerConfig = {}) {
    this.config = {
      baseUrl: DEFAULT_FACILITATOR_CONFIG.baseUrl,
      latency: 0,
      failRate: 0,
      enableLogging: false,
      ...config,
    };
  }

  // --------------------------------------------------------------------------
  // Configuration Methods
  // --------------------------------------------------------------------------

  /**
   * Update server configuration.
   */
  configure(config: Partial<MockFacilitatorServerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration.
   */
  getConfig(): MockFacilitatorServerConfig {
    return { ...this.config };
  }

  /**
   * Reset server state (clears all settlements, refunds, and logs).
   */
  reset(): void {
    this.settlements.clear();
    this.refunds.clear();
    this.usedNonces.clear();
    this.requestLog = [];
    resetFacilitatorCounters();
  }

  /**
   * Set always-fail mode for testing error scenarios.
   */
  setAlwaysFail(errorCode: FacilitatorErrorCode | null): void {
    this.config.alwaysFailWith = errorCode || undefined;
  }

  /**
   * Set simulated latency.
   */
  setLatency(ms: number): void {
    this.config.latency = ms;
  }

  // --------------------------------------------------------------------------
  // Core Endpoint Methods
  // --------------------------------------------------------------------------

  /**
   * Simulate the /v2/x402/settle endpoint.
   *
   * Validates the payment header and simulates on-chain settlement.
   */
  async settle(request: SettlementRequest): Promise<SettlementResponse> {
    const startTime = Date.now();

    // Simulate network latency
    if (this.config.latency && this.config.latency > 0) {
      await this.delay(this.config.latency);
    }

    let response: SettlementResponse;

    // Check for forced failures
    if (this.config.alwaysFailWith) {
      response = this.createErrorResponse(this.config.alwaysFailWith);
    } else if (this.shouldRandomlyFail()) {
      response = this.createErrorResponse('INTERNAL_ERROR');
    } else if (this.config.settlementValidator) {
      response = this.config.settlementValidator(request);
    } else {
      response = this.validateAndSettle(request);
    }

    // Log the request
    this.logRequest('/v2/x402/settle', 'POST', request, response, startTime);

    // Store successful settlements
    if (response.success && response.txHash) {
      this.settlements.set(response.txHash, { ...response, request });
    }

    return response;
  }

  /**
   * Simulate the /v2/x402/verify endpoint.
   *
   * Verifies a transaction on the blockchain.
   */
  async verify(request: VerificationRequest): Promise<VerificationResponse> {
    const startTime = Date.now();

    // Simulate network latency
    if (this.config.latency && this.config.latency > 0) {
      await this.delay(this.config.latency);
    }

    let response: VerificationResponse;

    // Check for forced failures
    if (this.config.alwaysFailWith) {
      response = {
        verified: false,
        error: ERROR_MESSAGES[this.config.alwaysFailWith],
        errorCode: this.config.alwaysFailWith,
      };
    } else if (this.shouldRandomlyFail()) {
      response = {
        verified: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        errorCode: 'INTERNAL_ERROR',
      };
    } else if (this.config.verificationValidator) {
      response = this.config.verificationValidator(request);
    } else {
      response = this.validateAndVerify(request);
    }

    // Log the request
    this.logRequest('/v2/x402/verify', 'POST', request, response, startTime);

    return response;
  }

  /**
   * Simulate the /v2/x402/refund endpoint.
   *
   * Processes a refund for a previous payment.
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    const startTime = Date.now();

    // Simulate network latency
    if (this.config.latency && this.config.latency > 0) {
      await this.delay(this.config.latency);
    }

    let response: RefundResponse;

    // Check for forced failures
    if (this.config.alwaysFailWith) {
      response = {
        success: false,
        error: ERROR_MESSAGES[this.config.alwaysFailWith],
        errorCode: this.config.alwaysFailWith,
      };
    } else if (this.shouldRandomlyFail()) {
      response = {
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        errorCode: 'INTERNAL_ERROR',
      };
    } else {
      response = this.processRefund(request);
    }

    // Log the request
    this.logRequest('/v2/x402/refund', 'POST', request, response, startTime);

    // Store successful refunds
    if (response.success && response.refundTxHash) {
      this.refunds.set(response.refundTxHash, { ...response, request });
    }

    return response;
  }

  /**
   * Simulate the /v2/x402/supported endpoint.
   *
   * Returns supported networks and tokens.
   */
  async getSupported(): Promise<SupportedAssetsResponse> {
    const startTime = Date.now();

    // Simulate network latency
    if (this.config.latency && this.config.latency > 0) {
      await this.delay(this.config.latency);
    }

    const response: SupportedAssetsResponse = {
      networks: [CRONOS_TESTNET_NETWORK, CRONOS_MAINNET_NETWORK],
      tokens: [DEV_USDC_TOKEN],
    };

    // Log the request
    this.logRequest('/v2/x402/supported', 'GET', null, response, startTime);

    return response;
  }

  // --------------------------------------------------------------------------
  // Internal Validation Methods
  // --------------------------------------------------------------------------

  /**
   * Validate and process a settlement request.
   */
  private validateAndSettle(request: SettlementRequest): SettlementResponse {
    // Decode the payment header
    const header = decodePaymentHeader(request.paymentHeader);
    if (!header) {
      return this.createErrorResponse('INVALID_SIGNATURE');
    }

    const auth = header.authorization;

    // Validate deadline
    const now = Math.floor(Date.now() / 1000);
    if (parseInt(auth.validBefore) < now) {
      return this.createErrorResponse('EXPIRED_AUTHORIZATION');
    }

    // Validate nonce not already used
    const nonceKey = `${auth.from.toLowerCase()}-${auth.nonce}`;
    if (this.usedNonces.has(nonceKey)) {
      return this.createErrorResponse('NONCE_ALREADY_USED');
    }

    // Validate recipient if specified
    if (request.recipient && auth.to.toLowerCase() !== request.recipient.toLowerCase()) {
      return this.createErrorResponse('WRONG_RECIPIENT');
    }

    // Validate amount if specified
    if (request.amount && auth.value !== request.amount) {
      return this.createErrorResponse('WRONG_AMOUNT');
    }

    // Mark nonce as used
    this.usedNonces.add(nonceKey);

    // Return successful settlement
    return {
      success: true,
      txHash: generateMockTxHash(),
      blockNumber: generateMockBlockNumber(),
      timestamp: Date.now(),
    };
  }

  /**
   * Validate and process a verification request.
   */
  private validateAndVerify(request: VerificationRequest): VerificationResponse {
    // Check if this transaction was settled by this mock
    const settlement = this.settlements.get(request.txHash);
    if (!settlement) {
      return {
        verified: false,
        error: ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
        errorCode: 'TRANSACTION_NOT_FOUND',
      };
    }

    // Decode the original payment header
    const header = decodePaymentHeader(settlement.request.paymentHeader);
    if (!header) {
      return {
        verified: false,
        error: 'Could not decode original payment',
        errorCode: 'INTERNAL_ERROR',
      };
    }

    const auth = header.authorization;

    // Validate from address if specified
    if (request.from && auth.from.toLowerCase() !== request.from.toLowerCase()) {
      return {
        verified: false,
        error: `Expected from ${request.from}, got ${auth.from}`,
        errorCode: 'TRANSACTION_FAILED',
      };
    }

    // Validate to address if specified
    if (request.to && auth.to.toLowerCase() !== request.to.toLowerCase()) {
      return {
        verified: false,
        error: `Expected to ${request.to}, got ${auth.to}`,
        errorCode: 'TRANSACTION_FAILED',
      };
    }

    // Validate amount if specified
    if (request.amount && auth.value !== request.amount) {
      return {
        verified: false,
        error: `Expected amount ${request.amount}, got ${auth.value}`,
        errorCode: 'WRONG_AMOUNT',
      };
    }

    return {
      verified: true,
      transaction: {
        txHash: request.txHash,
        from: auth.from,
        to: auth.to,
        amount: auth.value,
        blockNumber: settlement.blockNumber || 0,
        timestamp: settlement.timestamp || Date.now(),
        confirmations: 12, // Assume 12 confirmations
      },
    };
  }

  /**
   * Process a refund request.
   */
  private processRefund(request: RefundRequest): RefundResponse {
    // Check if the original transaction was settled
    const settlement = this.settlements.get(request.originalTxHash);
    if (!settlement) {
      return {
        success: false,
        error: ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
        errorCode: 'TRANSACTION_NOT_FOUND',
      };
    }

    // Check if refund was already processed
    const existingRefund = Array.from(this.refunds.values()).find(
      (r) => r.request.originalTxHash === request.originalTxHash
    );
    if (existingRefund) {
      return {
        success: false,
        error: ERROR_MESSAGES.REFUND_ALREADY_PROCESSED,
        errorCode: 'REFUND_ALREADY_PROCESSED',
      };
    }

    // Get original amount
    const header = decodePaymentHeader(settlement.request.paymentHeader);
    const originalAmount = header?.authorization.value || '0';
    const refundAmount = request.amount || originalAmount;

    return {
      success: true,
      refundTxHash: generateMockTxHash(),
      amountRefunded: refundAmount,
    };
  }

  /**
   * Create an error response with the given error code.
   */
  private createErrorResponse(errorCode: FacilitatorErrorCode): SettlementResponse {
    return {
      success: false,
      error: ERROR_MESSAGES[errorCode],
      errorCode,
    };
  }

  /**
   * Determine if this request should randomly fail.
   */
  private shouldRandomlyFail(): boolean {
    return this.config.failRate ? Math.random() < this.config.failRate : false;
  }

  /**
   * Delay for simulated latency.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // Request Logging
  // --------------------------------------------------------------------------

  /**
   * Log a request/response pair.
   */
  private logRequest(
    endpoint: string,
    method: string,
    body: unknown,
    response: unknown,
    startTime: number
  ): void {
    if (!this.config.enableLogging) return;

    const statusCode = this.getStatusCode(response);
    this.requestLog.push({
      timestamp: new Date(),
      endpoint,
      method,
      body,
      response,
      statusCode,
      durationMs: Date.now() - startTime,
    });
  }

  /**
   * Get status code from response.
   */
  private getStatusCode(response: unknown): number {
    if (typeof response !== 'object' || response === null) return 500;
    const res = response as { success?: boolean; verified?: boolean };
    if ('success' in res) return res.success ? 200 : 400;
    if ('verified' in res) return res.verified ? 200 : 404;
    return 200;
  }

  /**
   * Get the request log.
   */
  getRequestLog(): RequestLogEntry[] {
    return [...this.requestLog];
  }

  /**
   * Clear the request log.
   */
  clearRequestLog(): void {
    this.requestLog = [];
  }

  // --------------------------------------------------------------------------
  // Test Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Get all settlements.
   */
  getSettlements(): Map<string, SettlementResponse & { request: SettlementRequest }> {
    return new Map(this.settlements);
  }

  /**
   * Get all refunds.
   */
  getRefunds(): Map<string, RefundResponse & { request: RefundRequest }> {
    return new Map(this.refunds);
  }

  /**
   * Get used nonces.
   */
  getUsedNonces(): Set<string> {
    return new Set(this.usedNonces);
  }

  /**
   * Manually add a settlement (for testing verification).
   */
  addSettlement(txHash: string, request: SettlementRequest): void {
    this.settlements.set(txHash, {
      success: true,
      txHash,
      blockNumber: generateMockBlockNumber(),
      timestamp: Date.now(),
      request,
    });
  }

  /**
   * Check if a nonce has been used.
   */
  isNonceUsed(from: string, nonce: string): boolean {
    return this.usedNonces.has(`${from.toLowerCase()}-${nonce}`);
  }
}

// ============================================================================
// Response Generators (for Custom Scenarios)
// ============================================================================

/**
 * Generate a successful settlement response.
 */
export function generateSuccessfulSettlement(
  options: Partial<SettlementResponse> = {}
): SettlementResponse {
  return {
    success: true,
    txHash: generateMockTxHash(),
    blockNumber: generateMockBlockNumber(),
    timestamp: Date.now(),
    ...options,
  };
}

/**
 * Generate a failed settlement response.
 */
export function generateFailedSettlement(
  errorCode: FacilitatorErrorCode,
  customMessage?: string
): SettlementResponse {
  return {
    success: false,
    error: customMessage || ERROR_MESSAGES[errorCode],
    errorCode,
  };
}

/**
 * Generate a successful verification response.
 */
export function generateSuccessfulVerification(
  txHash: string,
  options: Partial<VerificationResponse['transaction']> = {}
): VerificationResponse {
  return {
    verified: true,
    transaction: {
      txHash,
      from: '0x0000000000000000000000000000000000000001',
      to: '0x0000000000000000000000000000000000000002',
      amount: '10000',
      blockNumber: generateMockBlockNumber(),
      timestamp: Date.now(),
      confirmations: 12,
      ...options,
    },
  };
}

/**
 * Generate a failed verification response.
 */
export function generateFailedVerification(
  errorCode: FacilitatorErrorCode,
  customMessage?: string
): VerificationResponse {
  return {
    verified: false,
    error: customMessage || ERROR_MESSAGES[errorCode],
    errorCode,
  };
}

/**
 * Generate a successful refund response.
 */
export function generateSuccessfulRefund(
  amount: string,
  options: Partial<RefundResponse> = {}
): RefundResponse {
  return {
    success: true,
    refundTxHash: generateMockTxHash(),
    amountRefunded: amount,
    ...options,
  };
}

/**
 * Generate a failed refund response.
 */
export function generateFailedRefund(
  errorCode: FacilitatorErrorCode,
  customMessage?: string
): RefundResponse {
  return {
    success: false,
    error: customMessage || ERROR_MESSAGES[errorCode],
    errorCode,
  };
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a mock facilitator client with Jest mock functions.
 */
export function createMockFacilitatorClient() {
  return {
    settle: jest.fn<(req: SettlementRequest) => Promise<SettlementResponse>>(),
    verify: jest.fn<(req: VerificationRequest) => Promise<VerificationResponse>>(),
    refund: jest.fn<(req: RefundRequest) => Promise<RefundResponse>>(),
    getSupported: jest.fn<() => Promise<SupportedAssetsResponse>>(),
  };
}

/**
 * Create a pre-configured mock facilitator server for common test scenarios.
 */
export function createTestFacilitatorServer(
  scenario: 'success' | 'fail' | 'slow' | 'flaky' = 'success'
): MockFacilitatorServer {
  switch (scenario) {
    case 'success':
      return new MockFacilitatorServer({ enableLogging: true });
    case 'fail':
      return new MockFacilitatorServer({
        alwaysFailWith: 'INTERNAL_ERROR',
        enableLogging: true,
      });
    case 'slow':
      return new MockFacilitatorServer({
        latency: 500,
        enableLogging: true,
      });
    case 'flaky':
      return new MockFacilitatorServer({
        failRate: 0.3, // 30% chance of failure
        enableLogging: true,
      });
    default:
      return new MockFacilitatorServer({ enableLogging: true });
  }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a settlement response indicates success.
 */
export function assertSettlementSuccess(response: SettlementResponse): void {
  if (!response.success) {
    throw new Error(
      `Expected successful settlement, got error: ${response.error} (${response.errorCode})`
    );
  }
  if (!response.txHash) {
    throw new Error('Expected txHash in successful settlement');
  }
  if (!response.txHash.startsWith('0x') || response.txHash.length !== 66) {
    throw new Error(`Invalid txHash format: ${response.txHash}`);
  }
}

/**
 * Assert that a settlement response indicates failure with specific error code.
 */
export function assertSettlementFailed(
  response: SettlementResponse,
  expectedErrorCode?: FacilitatorErrorCode
): void {
  if (response.success) {
    throw new Error('Expected failed settlement, but it succeeded');
  }
  if (!response.error) {
    throw new Error('Expected error message in failed settlement');
  }
  if (expectedErrorCode && response.errorCode !== expectedErrorCode) {
    throw new Error(
      `Expected error code ${expectedErrorCode}, got ${response.errorCode}`
    );
  }
}

/**
 * Assert that a verification response indicates success.
 */
export function assertVerificationSuccess(response: VerificationResponse): void {
  if (!response.verified) {
    throw new Error(
      `Expected successful verification, got error: ${response.error} (${response.errorCode})`
    );
  }
  if (!response.transaction) {
    throw new Error('Expected transaction details in successful verification');
  }
}

/**
 * Assert that a verification response indicates failure.
 */
export function assertVerificationFailed(
  response: VerificationResponse,
  expectedErrorCode?: FacilitatorErrorCode
): void {
  if (response.verified) {
    throw new Error('Expected failed verification, but it succeeded');
  }
  if (expectedErrorCode && response.errorCode !== expectedErrorCode) {
    throw new Error(
      `Expected error code ${expectedErrorCode}, got ${response.errorCode}`
    );
  }
}

/**
 * Assert that a refund response indicates success.
 */
export function assertRefundSuccess(response: RefundResponse): void {
  if (!response.success) {
    throw new Error(
      `Expected successful refund, got error: ${response.error} (${response.errorCode})`
    );
  }
  if (!response.refundTxHash) {
    throw new Error('Expected refundTxHash in successful refund');
  }
}

/**
 * Assert that a refund response indicates failure.
 */
export function assertRefundFailed(
  response: RefundResponse,
  expectedErrorCode?: FacilitatorErrorCode
): void {
  if (response.success) {
    throw new Error('Expected failed refund, but it succeeded');
  }
  if (expectedErrorCode && response.errorCode !== expectedErrorCode) {
    throw new Error(
      `Expected error code ${expectedErrorCode}, got ${response.errorCode}`
    );
  }
}
