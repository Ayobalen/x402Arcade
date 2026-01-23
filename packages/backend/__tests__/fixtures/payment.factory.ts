/**
 * Payment Fixture Factory
 *
 * Generates x402 payment test data with various states and amounts.
 * Supports creating pending, verified, failed, and refunded payment scenarios.
 *
 * @example
 * ```typescript
 * import {
 *   createPayment,
 *   createPendingPayment,
 *   createVerifiedPayment,
 *   createFailedPayment,
 *   createRefundedPayment,
 * } from '../fixtures/payment.factory';
 *
 * const payment = createPayment();
 * const pending = createPendingPayment();
 * const verified = createVerifiedPayment(0.02, 'tetris');
 * const failed = createFailedPayment('INSUFFICIENT_FUNDS');
 * const refunded = createRefundedPayment();
 * ```
 */

import { TEST_ADDRESSES, generateTxHash, generateWalletAddress } from './game-session.factory';

// ============================================================================
// Types
// ============================================================================

export type GameType = 'snake' | 'tetris';
export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'refunded';
export type PaymentPurpose = 'game_payment' | 'prize_payout' | 'refund';

/**
 * Failure reason codes from the x402 facilitator.
 */
export type FailureReason =
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_AUTHORIZATION'
  | 'NONCE_ALREADY_USED'
  | 'WRONG_RECIPIENT'
  | 'WRONG_AMOUNT'
  | 'TOKEN_NOT_SUPPORTED'
  | 'NETWORK_ERROR'
  | 'SETTLEMENT_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * Payment database record structure.
 */
export interface Payment {
  id: number;
  tx_hash: string | null;
  from_address: string;
  to_address: string;
  amount_usdc: number;
  purpose: PaymentPurpose;
  game_type: GameType | null;
  session_id: string | null;
  status: PaymentStatus;
  failure_reason: FailureReason | null;
  verified_at: string | null;
  refund_tx_hash: string | null;
  refunded_at: string | null;
  block_number: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * x402 payment header structure.
 */
export interface X402PaymentHeader {
  version: string;
  authorization: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: `0x${string}`;
    signature: `0x${string}`;
  };
}

/**
 * Options for creating a payment.
 */
export interface CreatePaymentOptions {
  id?: number;
  tx_hash?: string | null;
  from_address?: string;
  to_address?: string;
  amount_usdc?: number;
  purpose?: PaymentPurpose;
  game_type?: GameType | null;
  session_id?: string | null;
  status?: PaymentStatus;
  failure_reason?: FailureReason | null;
  verified_at?: string | null;
  refund_tx_hash?: string | null;
  refunded_at?: string | null;
  block_number?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Game prices in USDC.
 */
export const GAME_PRICES = {
  snake: 0.01,
  tetris: 0.02,
} as const;

/**
 * devUSDC.e contract address on Cronos testnet.
 */
export const DEVUSDC_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

/**
 * Cronos testnet chain ID.
 */
export const CRONOS_TESTNET_CHAIN_ID = 338;

/**
 * Default gas values for transaction simulation.
 */
export const DEFAULT_GAS = {
  gasLimit: 100000n,
  gasPrice: 5000000000n, // 5 gwei
  maxFeePerGas: 10000000000n, // 10 gwei
  maxPriorityFeePerGas: 2000000000n, // 2 gwei
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

let paymentCounter = 0;
let blockCounter = 1000000;

/**
 * Reset counters for test isolation.
 */
export function resetPaymentCounters(): void {
  paymentCounter = 0;
  blockCounter = 1000000;
}

/**
 * Generate a unique block number.
 */
export function generateBlockNumber(): number {
  blockCounter++;
  return blockCounter;
}

/**
 * Generate a random nonce.
 */
export function generateNonce(): `0x${string}` {
  const chars = '0123456789abcdef';
  let nonce = '0x';
  for (let i = 0; i < 64; i++) {
    nonce += chars[Math.floor(Math.random() * chars.length)];
  }
  return nonce as `0x${string}`;
}

/**
 * Generate a random signature (mock).
 */
export function generateSignature(): `0x${string}` {
  const chars = '0123456789abcdef';
  let sig = '0x';
  for (let i = 0; i < 130; i++) {
    sig += chars[Math.floor(Math.random() * chars.length)];
  }
  return sig as `0x${string}`;
}

/**
 * Convert USDC amount to atomic units (6 decimals).
 */
export function toUsdcAtomic(amount: number): string {
  return Math.floor(amount * 1_000_000).toString();
}

/**
 * Convert atomic USDC to decimal amount.
 */
export function fromUsdcAtomic(atomicAmount: string | bigint): number {
  const value = typeof atomicAmount === 'bigint' ? atomicAmount : BigInt(atomicAmount);
  return Number(value) / 1_000_000;
}

// ============================================================================
// Core Factory Functions
// ============================================================================

/**
 * Create a payment with sensible defaults.
 *
 * @param options - Optional overrides for any payment field
 * @returns A payment object
 *
 * @example
 * ```typescript
 * const payment = createPayment();
 * const tetrisPayment = createPayment({ game_type: 'tetris', amount_usdc: 0.02 });
 * ```
 */
export function createPayment(options: CreatePaymentOptions = {}): Payment {
  paymentCounter++;

  const status = options.status ?? 'verified';
  const now = new Date().toISOString();

  // Determine tx_hash - only generate for verified status unless explicitly provided
  let tx_hash: string | null;
  if ('tx_hash' in options) {
    tx_hash = options.tx_hash ?? null;
  } else {
    tx_hash = status === 'verified' ? generateTxHash() : null;
  }

  // Determine game_type - allow null to be set explicitly
  let game_type: 'snake' | 'tetris' | null;
  if ('game_type' in options) {
    game_type = options.game_type ?? null;
  } else {
    game_type = 'snake';
  }

  return {
    id: options.id ?? paymentCounter,
    tx_hash,
    from_address: options.from_address ?? TEST_ADDRESSES.player1,
    to_address: options.to_address ?? TEST_ADDRESSES.arcade,
    amount_usdc: options.amount_usdc ?? GAME_PRICES.snake,
    purpose: options.purpose ?? 'game_payment',
    game_type,
    session_id: options.session_id ?? null,
    status,
    failure_reason: options.failure_reason ?? null,
    verified_at: options.verified_at ?? (status === 'verified' ? now : null),
    refund_tx_hash: options.refund_tx_hash ?? null,
    refunded_at: options.refunded_at ?? null,
    block_number: options.block_number ?? (status === 'verified' ? generateBlockNumber() : null),
    created_at: options.created_at ?? now,
    updated_at: options.updated_at ?? now,
  };
}

/**
 * Create a pending payment (awaiting verification).
 *
 * @param gameType - Game type for the payment
 * @param options - Additional payment options
 * @returns A pending payment
 *
 * @example
 * ```typescript
 * const pending = createPendingPayment();
 * const pendingTetris = createPendingPayment('tetris');
 * ```
 */
export function createPendingPayment(
  gameType: GameType = 'snake',
  options: CreatePaymentOptions = {}
): Payment {
  return createPayment({
    ...options,
    game_type: gameType,
    amount_usdc: options.amount_usdc ?? GAME_PRICES[gameType],
    status: 'pending',
    tx_hash: null,
    verified_at: null,
    block_number: null,
  });
}

/**
 * Create a verified payment (confirmed on chain).
 *
 * @param amount - Payment amount in USDC
 * @param gameType - Game type
 * @param options - Additional payment options
 * @returns A verified payment
 *
 * @example
 * ```typescript
 * const verified = createVerifiedPayment();
 * const tetrisPayment = createVerifiedPayment(0.02, 'tetris');
 * ```
 */
export function createVerifiedPayment(
  amount?: number,
  gameType: GameType = 'snake',
  options: CreatePaymentOptions = {}
): Payment {
  const now = new Date().toISOString();

  return createPayment({
    ...options,
    game_type: gameType,
    amount_usdc: amount ?? GAME_PRICES[gameType],
    status: 'verified',
    tx_hash: options.tx_hash ?? generateTxHash(),
    verified_at: options.verified_at ?? now,
    block_number: options.block_number ?? generateBlockNumber(),
  });
}

/**
 * Create a failed payment with a specific error.
 *
 * @param reason - Failure reason code
 * @param options - Additional payment options
 * @returns A failed payment
 *
 * @example
 * ```typescript
 * const failed = createFailedPayment('INSUFFICIENT_FUNDS');
 * const expired = createFailedPayment('EXPIRED_AUTHORIZATION');
 * ```
 */
export function createFailedPayment(
  reason: FailureReason = 'INSUFFICIENT_FUNDS',
  options: CreatePaymentOptions = {}
): Payment {
  return createPayment({
    ...options,
    status: 'failed',
    failure_reason: reason,
    tx_hash: null,
    verified_at: null,
    block_number: null,
  });
}

/**
 * Create a refunded payment.
 *
 * @param originalPayment - Original payment that was refunded (optional)
 * @param options - Additional payment options
 * @returns A refunded payment
 *
 * @example
 * ```typescript
 * const refunded = createRefundedPayment();
 * const refundWithOriginal = createRefundedPayment(originalPayment);
 * ```
 */
export function createRefundedPayment(
  originalPayment?: Payment,
  options: CreatePaymentOptions = {}
): Payment {
  const now = new Date().toISOString();

  return createPayment({
    ...(originalPayment && {
      from_address: originalPayment.from_address,
      to_address: originalPayment.to_address,
      amount_usdc: originalPayment.amount_usdc,
      game_type: originalPayment.game_type,
      session_id: originalPayment.session_id,
    }),
    ...options,
    status: 'refunded',
    refund_tx_hash: options.refund_tx_hash ?? generateTxHash(),
    refunded_at: options.refunded_at ?? now,
  });
}

// ============================================================================
// x402 Payment Header Factories
// ============================================================================

/**
 * Create a valid x402 payment header.
 *
 * @param amount - Payment amount in USDC
 * @param options - Header options
 * @returns A payment header object
 */
export function createPaymentHeader(
  amount: number = GAME_PRICES.snake,
  options: {
    from?: string;
    to?: string;
    validUntil?: number;
    nonce?: `0x${string}`;
  } = {}
): X402PaymentHeader {
  const now = Math.floor(Date.now() / 1000);

  return {
    version: '2',
    authorization: {
      from: (options.from ?? TEST_ADDRESSES.player1) as `0x${string}`,
      to: (options.to ?? TEST_ADDRESSES.arcade) as `0x${string}`,
      value: toUsdcAtomic(amount),
      validAfter: '0',
      validBefore: (options.validUntil ?? now + 3600).toString(),
      nonce: options.nonce ?? generateNonce(),
      signature: generateSignature(),
    },
  };
}

/**
 * Encode a payment header to base64.
 *
 * @param header - Payment header object
 * @returns Base64-encoded header string
 */
export function encodePaymentHeader(header: X402PaymentHeader): string {
  return Buffer.from(JSON.stringify(header)).toString('base64');
}

/**
 * Decode a payment header from base64.
 *
 * @param encoded - Base64-encoded header string
 * @returns Payment header object or null if invalid
 */
export function decodePaymentHeader(encoded: string): X402PaymentHeader | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as X402PaymentHeader;
  } catch {
    return null;
  }
}

/**
 * Create an expired payment header.
 *
 * @param amount - Payment amount
 * @param options - Header options
 * @returns An expired payment header
 */
export function createExpiredPaymentHeader(
  amount: number = GAME_PRICES.snake,
  options: { from?: string; to?: string } = {}
): X402PaymentHeader {
  const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  return createPaymentHeader(amount, {
    ...options,
    validUntil: pastTime,
  });
}

/**
 * Create a payment header with wrong amount.
 *
 * @param expectedAmount - Expected amount
 * @param actualAmount - Actual (wrong) amount
 * @param options - Header options
 * @returns A payment header with mismatched amount
 */
export function createWrongAmountPaymentHeader(
  expectedAmount: number = GAME_PRICES.snake,
  actualAmount: number = GAME_PRICES.snake * 0.5,
  options: { from?: string; to?: string } = {}
): X402PaymentHeader {
  return createPaymentHeader(actualAmount, options);
}

/**
 * Create a payment header with reused nonce.
 *
 * @param nonce - The reused nonce
 * @param amount - Payment amount
 * @param options - Header options
 * @returns A payment header with specific nonce
 */
export function createReusedNoncePaymentHeader(
  nonce: `0x${string}`,
  amount: number = GAME_PRICES.snake,
  options: { from?: string; to?: string } = {}
): X402PaymentHeader {
  return createPaymentHeader(amount, {
    ...options,
    nonce,
  });
}

// ============================================================================
// Batch Factory Functions
// ============================================================================

/**
 * Create multiple payments.
 *
 * @param count - Number of payments to create
 * @param options - Options applied to all payments
 * @returns Array of payments
 */
export function createPayments(
  count: number,
  options: CreatePaymentOptions = {}
): Payment[] {
  return Array.from({ length: count }, () => createPayment(options));
}

/**
 * Create payment history for a player.
 *
 * @param playerAddress - Player's wallet address
 * @param count - Number of payments
 * @param gameType - Game type
 * @returns Array of verified payments
 */
export function createPlayerPaymentHistory(
  playerAddress: string,
  count: number,
  gameType: GameType = 'snake'
): Payment[] {
  const payments: Payment[] = [];
  const now = Date.now();
  const msPerDay = 86400000;

  for (let i = 0; i < count; i++) {
    const date = new Date(now - (count - 1 - i) * msPerDay);

    payments.push(
      createVerifiedPayment(GAME_PRICES[gameType], gameType, {
        from_address: playerAddress,
        created_at: date.toISOString(),
        verified_at: date.toISOString(),
      })
    );
  }

  return payments;
}

/**
 * Create a payment with linked session.
 *
 * @param sessionId - Game session ID
 * @param options - Additional payment options
 * @returns Payment linked to a session
 */
export function createPaymentForSession(
  sessionId: string,
  options: CreatePaymentOptions = {}
): Payment {
  return createPayment({
    ...options,
    session_id: sessionId,
    purpose: 'game_payment',
  });
}

/**
 * Create a prize payout payment.
 *
 * @param winnerAddress - Winner's wallet address
 * @param amount - Prize amount in USDC
 * @param options - Additional payment options
 * @returns A prize payout payment
 */
export function createPrizePayment(
  winnerAddress: string,
  amount: number,
  options: CreatePaymentOptions = {}
): Payment {
  return createPayment({
    ...options,
    from_address: TEST_ADDRESSES.arcade, // Arcade pays out
    to_address: winnerAddress,
    amount_usdc: amount,
    purpose: 'prize_payout',
    game_type: null, // Not game-specific
  });
}

/**
 * Create payments in various states for testing.
 *
 * @returns Object with payments in different states
 */
export function createMixedStatePayments(): {
  pending: Payment[];
  verified: Payment[];
  failed: Payment[];
  refunded: Payment[];
  all: Payment[];
} {
  const pending = [
    createPendingPayment('snake'),
    createPendingPayment('tetris'),
  ];

  const verified = [
    createVerifiedPayment(GAME_PRICES.snake, 'snake'),
    createVerifiedPayment(GAME_PRICES.tetris, 'tetris'),
    createVerifiedPayment(GAME_PRICES.snake, 'snake'),
  ];

  const failed = [
    createFailedPayment('INSUFFICIENT_FUNDS'),
    createFailedPayment('EXPIRED_AUTHORIZATION'),
  ];

  const refunded = [
    createRefundedPayment(),
  ];

  return {
    pending,
    verified,
    failed,
    refunded,
    all: [...pending, ...verified, ...failed, ...refunded],
  };
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that a payment has all required fields.
 *
 * @param payment - Payment to validate
 * @returns Whether the payment is valid
 */
export function isValidPayment(payment: unknown): payment is Payment {
  if (!payment || typeof payment !== 'object') return false;

  const p = payment as Record<string, unknown>;

  return (
    typeof p.id === 'number' &&
    (p.tx_hash === null || typeof p.tx_hash === 'string') &&
    typeof p.from_address === 'string' &&
    typeof p.to_address === 'string' &&
    typeof p.amount_usdc === 'number' &&
    (p.purpose === 'game_payment' || p.purpose === 'prize_payout' || p.purpose === 'refund') &&
    (p.game_type === null || p.game_type === 'snake' || p.game_type === 'tetris') &&
    (p.session_id === null || typeof p.session_id === 'string') &&
    (p.status === 'pending' || p.status === 'verified' || p.status === 'failed' || p.status === 'refunded') &&
    (p.failure_reason === null || typeof p.failure_reason === 'string') &&
    (p.verified_at === null || typeof p.verified_at === 'string') &&
    (p.refund_tx_hash === null || typeof p.refund_tx_hash === 'string') &&
    (p.refunded_at === null || typeof p.refunded_at === 'string') &&
    (p.block_number === null || typeof p.block_number === 'number') &&
    typeof p.created_at === 'string' &&
    typeof p.updated_at === 'string'
  );
}

/**
 * Validate that a payment header has all required fields.
 *
 * @param header - Header to validate
 * @returns Whether the header is valid
 */
export function isValidPaymentHeader(header: unknown): header is X402PaymentHeader {
  if (!header || typeof header !== 'object') return false;

  const h = header as Record<string, unknown>;

  if (typeof h.version !== 'string' || !h.authorization) return false;

  const auth = h.authorization as Record<string, unknown>;

  return (
    typeof auth.from === 'string' &&
    auth.from.startsWith('0x') &&
    typeof auth.to === 'string' &&
    auth.to.startsWith('0x') &&
    typeof auth.value === 'string' &&
    typeof auth.validAfter === 'string' &&
    typeof auth.validBefore === 'string' &&
    typeof auth.nonce === 'string' &&
    auth.nonce.startsWith('0x') &&
    typeof auth.signature === 'string' &&
    auth.signature.startsWith('0x')
  );
}

/**
 * Validate that a payment header is not expired.
 *
 * @param header - Payment header to check
 * @returns Whether the header is still valid
 */
export function isPaymentHeaderValid(header: X402PaymentHeader): boolean {
  const now = Math.floor(Date.now() / 1000);
  const validBefore = parseInt(header.authorization.validBefore, 10);
  const validAfter = parseInt(header.authorization.validAfter, 10);

  return now >= validAfter && now < validBefore;
}

/**
 * Calculate total payments for a player.
 *
 * @param payments - Array of payments
 * @param playerAddress - Player's address
 * @returns Total amount in USDC
 */
export function calculatePlayerTotal(
  payments: Payment[],
  playerAddress: string
): number {
  return payments
    .filter(p => p.from_address === playerAddress && p.status === 'verified')
    .reduce((sum, p) => sum + p.amount_usdc, 0);
}

/**
 * Calculate total payments for a game type.
 *
 * @param payments - Array of payments
 * @param gameType - Game type to filter
 * @returns Total amount in USDC
 */
export function calculateGameTotal(
  payments: Payment[],
  gameType: GameType
): number {
  return payments
    .filter(p => p.game_type === gameType && p.status === 'verified')
    .reduce((sum, p) => sum + p.amount_usdc, 0);
}
