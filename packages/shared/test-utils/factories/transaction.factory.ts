/**
 * Mock Transaction Factory
 *
 * Generates test blockchain transaction data.
 */

import { testAddresses } from './user.factory';

export type TransactionPurpose = 'game_payment' | 'prize_payout';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface MockTransaction {
  id: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount_usdc: number;
  purpose: TransactionPurpose;
  status: TransactionStatus;
  created_at: string;
  confirmed_at: string | null;
  block_number: number | null;
  gas_used: number | null;
}

export interface CreateMockTransactionOptions {
  id?: number;
  tx_hash?: string;
  from_address?: string;
  to_address?: string;
  amount_usdc?: number;
  purpose?: TransactionPurpose;
  status?: TransactionStatus;
  created_at?: string;
  confirmed_at?: string | null;
  block_number?: number | null;
  gas_used?: number | null;
}

let txCounter = 0;

/**
 * Generate a random transaction hash.
 */
function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Create a mock transaction with sensible defaults.
 *
 * @param overrides - Optional overrides for any transaction field
 * @returns A mock transaction object
 *
 * @example
 * const tx = createMockTransaction();
 * const payout = createMockTransaction({ purpose: 'prize_payout', amount_usdc: 5.0 });
 */
export function createMockTransaction(
  overrides: CreateMockTransactionOptions = {}
): MockTransaction {
  txCounter++;

  const purpose = overrides.purpose ?? 'game_payment';
  const status = overrides.status ?? 'pending';

  // Set confirmed_at and block_number for confirmed transactions
  let confirmed_at = overrides.confirmed_at ?? null;
  let block_number = overrides.block_number ?? null;
  let gas_used = overrides.gas_used ?? null;

  if (status === 'confirmed') {
    confirmed_at = confirmed_at ?? new Date().toISOString();
    block_number = block_number ?? Math.floor(Math.random() * 10000000) + 1000000;
    gas_used = gas_used ?? Math.floor(Math.random() * 100000) + 50000;
  }

  return {
    id: overrides.id ?? txCounter,
    tx_hash: overrides.tx_hash ?? generateTxHash(),
    from_address: overrides.from_address ?? testAddresses.player1,
    to_address: overrides.to_address ?? testAddresses.arcadeWallet,
    amount_usdc: overrides.amount_usdc ?? 0.01,
    purpose,
    status,
    created_at: overrides.created_at ?? new Date().toISOString(),
    confirmed_at,
    block_number,
    gas_used,
  };
}

/**
 * Create a pending game payment transaction.
 */
export function createPendingPayment(
  fromAddress: string,
  amount: number = 0.01
): MockTransaction {
  return createMockTransaction({
    from_address: fromAddress,
    to_address: testAddresses.arcadeWallet,
    amount_usdc: amount,
    purpose: 'game_payment',
    status: 'pending',
  });
}

/**
 * Create a confirmed game payment transaction.
 */
export function createConfirmedPayment(
  fromAddress: string,
  amount: number = 0.01
): MockTransaction {
  return createMockTransaction({
    from_address: fromAddress,
    to_address: testAddresses.arcadeWallet,
    amount_usdc: amount,
    purpose: 'game_payment',
    status: 'confirmed',
  });
}

/**
 * Create a prize payout transaction.
 */
export function createPrizePayout(
  toAddress: string,
  amount: number
): MockTransaction {
  return createMockTransaction({
    from_address: testAddresses.arcadeWallet,
    to_address: toAddress,
    amount_usdc: amount,
    purpose: 'prize_payout',
    status: 'confirmed',
  });
}

/**
 * Create a failed transaction.
 */
export function createFailedTransaction(
  overrides: CreateMockTransactionOptions = {}
): MockTransaction {
  return createMockTransaction({
    ...overrides,
    status: 'failed',
    confirmed_at: null,
    block_number: null,
    gas_used: null,
  });
}

/**
 * Well-known transaction hashes for specific scenarios.
 */
export const testTxHashes = {
  /** Valid confirmed payment */
  confirmedPayment: '0x' + '1'.repeat(64),
  /** Valid confirmed payout */
  confirmedPayout: '0x' + '2'.repeat(64),
  /** Pending transaction */
  pending: '0x' + '3'.repeat(64),
  /** Failed transaction */
  failed: '0x' + '4'.repeat(64),
  /** Invalid/non-existent */
  invalid: '0x' + '0'.repeat(64),
};

/**
 * x402 payment header format.
 */
export interface X402PaymentHeader {
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

/**
 * Create a mock x402 payment header.
 */
export function createMockX402Header(
  overrides: Partial<X402PaymentHeader['payload']['authorization']> = {}
): X402PaymentHeader {
  const validAfter = Math.floor(Date.now() / 1000) - 300; // 5 min ago
  const validBefore = Math.floor(Date.now() / 1000) + 300; // 5 min from now

  return {
    payload: {
      signature: '0x' + 'abcd'.repeat(32) + '1b', // 65 bytes
      authorization: {
        from: overrides.from ?? testAddresses.player1,
        to: overrides.to ?? testAddresses.arcadeWallet,
        value: overrides.value ?? '10000', // 0.01 USDC (6 decimals)
        validAfter: overrides.validAfter ?? validAfter.toString(),
        validBefore: overrides.validBefore ?? validBefore.toString(),
        nonce: overrides.nonce ?? '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
      },
    },
  };
}
