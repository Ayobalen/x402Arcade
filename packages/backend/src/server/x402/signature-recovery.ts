/**
 * EIP-712 Signature Recovery
 *
 * Utilities for recovering signer addresses from EIP-712 typed data signatures.
 * Used to verify that x402 payment authorizations were signed by the claimed payer.
 *
 * @module server/x402/signature-recovery
 * @see https://eips.ethereum.org/EIPS/eip-712 - EIP-712 Typed Data Standard
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */

import {
  hashTypedData,
  recoverTypedDataAddress as viemRecoverTypedDataAddress,
} from 'viem';
import type { TypedDataDomain } from 'viem';
import {
  type EIP712Domain,
  type TransferWithAuthorizationMessage,
  type SignedTransferWithAuthorization,
  getUsdcEip712Domain,
  normalizeAddress,
} from '../../lib/chain/constants.js';
import { X402Error, X402ValidationError } from './errors.js';

/**
 * Signature recovery result
 *
 * Contains the recovered address and verification status.
 */
export interface SignatureRecoveryResult {
  /**
   * Whether signature recovery was successful
   */
  success: boolean;

  /**
   * The recovered signer address (checksummed)
   * Present only if success is true
   */
  recoveredAddress?: string;

  /**
   * Whether the recovered address matches the expected 'from' address
   * Present only if expectedAddress was provided
   */
  isValid?: boolean;

  /**
   * Error message if recovery failed
   */
  error?: string;

  /**
   * The EIP-712 typed data hash that was signed
   */
  typedDataHash?: string;
}

/**
 * Types definition for TransferWithAuthorization EIP-712 typed data
 */
const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * Recover signer address from EIP-712 typed data signature
 *
 * Reconstructs the EIP-712 typed data hash and uses ecrecover to
 * determine which address signed the message.
 *
 * @param message - The TransferWithAuthorization message that was signed
 * @param signature - The signature components (r, s, v)
 * @param domain - The EIP-712 domain (defaults to USDC on Cronos Testnet)
 * @returns Recovery result with the recovered address
 *
 * @example
 * ```typescript
 * const result = await recoverSignerAddress(
 *   paymentPayload.message,
 *   { r: payload.r, s: payload.s, v: payload.v }
 * );
 *
 * if (result.success) {
 *   console.log(`Signed by: ${result.recoveredAddress}`);
 * }
 * ```
 */
export async function recoverSignerAddress(
  message: TransferWithAuthorizationMessage,
  signature: { r: string; s: string; v: number },
  domain: EIP712Domain = getUsdcEip712Domain(),
): Promise<SignatureRecoveryResult> {
  try {
    // Validate signature components
    validateSignatureComponents(signature);

    // Convert message values to proper format for viem
    const viemMessage = {
      from: message.from as `0x${string}`,
      to: message.to as `0x${string}`,
      value: BigInt(message.value),
      validAfter: BigInt(message.validAfter),
      validBefore: BigInt(message.validBefore),
      nonce: message.nonce as `0x${string}`,
    };

    // Convert domain to viem format
    const viemDomain: TypedDataDomain = {
      name: domain.name,
      version: domain.version,
      chainId: BigInt(domain.chainId),
      verifyingContract: domain.verifyingContract as `0x${string}`,
    };

    // Construct signature in the format viem expects for recoverTypedDataAddress
    // viem can accept separate r, s, v components
    const sig = {
      r: signature.r as `0x${string}`,
      s: signature.s as `0x${string}`,
      v: BigInt(signature.v),
    };

    // Reconstruct the EIP-712 typed data hash
    // This is keccak256("\x19\x01" ++ domainSeparator ++ hashStruct(message))
    const typedDataHash = hashTypedData({
      domain: viemDomain,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: 'TransferWithAuthorization',
      message: viemMessage,
    });

    // Use viem's recoverTypedDataAddress to recover the signer
    // This internally uses ecrecover with the r, s, v values
    const recoveredAddress = await viemRecoverTypedDataAddress({
      domain: viemDomain,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: 'TransferWithAuthorization',
      message: viemMessage,
      signature: sig,
    });

    return {
      success: true,
      recoveredAddress: recoveredAddress,
      typedDataHash: typedDataHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during signature recovery',
    };
  }
}


/**
 * Verify that a signature was created by a specific address
 *
 * Combines signature recovery with address comparison to verify
 * the payment authorization came from the claimed sender.
 *
 * @param signedAuthorization - The complete signed authorization
 * @param expectedAddress - The address that should have signed (optional)
 * @param domain - The EIP-712 domain (defaults to USDC on Cronos Testnet)
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const result = await verifyPaymentSignature(
 *   { message: payload, v: 27, r: '0x...', s: '0x...' },
 *   payload.from
 * );
 *
 * if (!result.isValid) {
 *   throw X402Error.invalidSignature();
 * }
 * ```
 */
export async function verifyPaymentSignature(
  signedAuthorization: SignedTransferWithAuthorization,
  expectedAddress?: string,
  domain: EIP712Domain = getUsdcEip712Domain(),
): Promise<SignatureRecoveryResult> {
  // Extract message from either nested format or flat format
  const message = signedAuthorization.message || {
    from: signedAuthorization.from,
    to: signedAuthorization.to,
    value: signedAuthorization.value,
    validAfter: signedAuthorization.validAfter,
    validBefore: signedAuthorization.validBefore,
    nonce: signedAuthorization.nonce,
  };

  const result = await recoverSignerAddress(
    message,
    {
      r: signedAuthorization.r,
      s: signedAuthorization.s,
      v: signedAuthorization.v,
    },
    domain,
  );

  if (!result.success) {
    return result;
  }

  // If expected address provided, check if it matches
  if (expectedAddress && result.recoveredAddress) {
    const normalizedExpected = normalizeAddress(expectedAddress);
    const normalizedRecovered = normalizeAddress(result.recoveredAddress);
    result.isValid = normalizedExpected === normalizedRecovered;
  }

  return result;
}

/**
 * Verify payment signature and throw on failure
 *
 * Convenience function that verifies the signature and throws an
 * X402Error if verification fails. Use this in middleware for cleaner code.
 *
 * @param signedAuthorization - The complete signed authorization
 * @param domain - The EIP-712 domain (defaults to USDC on Cronos Testnet)
 * @returns The recovered signer address
 * @throws {X402Error} If signature is invalid or recovery fails
 *
 * @example
 * ```typescript
 * try {
 *   const signer = await verifyPaymentSignatureOrThrow(signedAuth);
 *   console.log(`Verified payment from ${signer}`);
 * } catch (error) {
 *   // Handle invalid signature
 * }
 * ```
 */
export async function verifyPaymentSignatureOrThrow(
  signedAuthorization: SignedTransferWithAuthorization,
  domain: EIP712Domain = getUsdcEip712Domain(),
): Promise<string> {
  const result = await verifyPaymentSignature(
    signedAuthorization,
    signedAuthorization.from,
    domain,
  );

  if (!result.success) {
    throw X402Error.invalidSignature();
  }

  if (result.isValid === false) {
    throw X402ValidationError.recipientMismatch(
      signedAuthorization.from,
      result.recoveredAddress || 'unknown',
    );
  }

  return result.recoveredAddress!;
}

/**
 * Validate signature components format
 *
 * Checks that r, s, and v values have the correct format before attempting recovery.
 *
 * @param signature - The signature components to validate
 * @throws {X402ValidationError} If any component is invalid
 */
export function validateSignatureComponents(signature: {
  r: string;
  s: string;
  v: number;
}): void {
  // Validate r (32 bytes = 64 hex chars + 0x prefix)
  if (!/^0x[a-fA-F0-9]{64}$/.test(signature.r)) {
    throw X402ValidationError.invalidSignatureComponent(
      'r',
      signature.r,
      '0x-prefixed hex string with 64 characters (32 bytes)',
    );
  }

  // Validate s (32 bytes = 64 hex chars + 0x prefix)
  if (!/^0x[a-fA-F0-9]{64}$/.test(signature.s)) {
    throw X402ValidationError.invalidSignatureComponent(
      's',
      signature.s,
      '0x-prefixed hex string with 64 characters (32 bytes)',
    );
  }

  // Validate v (should be 27 or 28 for legacy, or 0/1 for EIP-155)
  if (signature.v !== 27 && signature.v !== 28 && signature.v !== 0 && signature.v !== 1) {
    throw X402ValidationError.invalidSignatureComponent(
      'v',
      signature.v,
      '27, 28, 0, or 1',
    );
  }
}

/**
 * Hash EIP-712 typed data for TransferWithAuthorization
 *
 * Computes the EIP-712 hash of a TransferWithAuthorization message
 * that would be signed by a wallet.
 *
 * @param message - The authorization message
 * @param domain - The EIP-712 domain (defaults to USDC on Cronos Testnet)
 * @returns The typed data hash as a hex string
 *
 * @example
 * ```typescript
 * const hash = hashTransferWithAuthorization(message);
 * // Use hash for manual verification or logging
 * ```
 */
export function hashTransferWithAuthorization(
  message: TransferWithAuthorizationMessage,
  domain: EIP712Domain = getUsdcEip712Domain(),
): string {
  const viemDomain: TypedDataDomain = {
    name: domain.name,
    version: domain.version,
    chainId: BigInt(domain.chainId),
    verifyingContract: domain.verifyingContract as `0x${string}`,
  };

  const viemMessage = {
    from: message.from as `0x${string}`,
    to: message.to as `0x${string}`,
    value: BigInt(message.value),
    validAfter: BigInt(message.validAfter),
    validBefore: BigInt(message.validBefore),
    nonce: message.nonce as `0x${string}`,
  };

  return hashTypedData({
    domain: viemDomain,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: 'TransferWithAuthorization',
    message: viemMessage,
  });
}

/**
 * Create typed data structure for wallet signing
 *
 * Generates the complete EIP-712 typed data structure that can be
 * passed to a wallet's signTypedData function.
 *
 * @param message - The authorization message to sign
 * @param domain - The EIP-712 domain (defaults to USDC on Cronos Testnet)
 * @returns Complete typed data structure for wallet signing
 *
 * @example
 * ```typescript
 * const typedData = createTypedDataForSigning(message);
 * const signature = await wallet.signTypedData(typedData);
 * ```
 */
export function createTypedDataForSigning(
  message: TransferWithAuthorizationMessage,
  domain: EIP712Domain = getUsdcEip712Domain(),
) {
  return {
    domain: {
      name: domain.name,
      version: domain.version,
      chainId: Number(domain.chainId),
      verifyingContract: domain.verifyingContract,
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization' as const,
    message: {
      from: message.from,
      to: message.to,
      value: message.value.toString(),
      validAfter: message.validAfter.toString(),
      validBefore: message.validBefore.toString(),
      nonce: message.nonce,
    },
  };
}

/**
 * Parse signature from compact hex format
 *
 * Converts a 65-byte compact signature (0x + 130 hex chars) into r, s, v components.
 *
 * @param signature - Compact signature hex string
 * @returns Object with r, s, v components
 *
 * @example
 * ```typescript
 * const sig = parseSignature('0x1234...'); // 65 bytes
 * console.log(sig.r, sig.s, sig.v);
 * ```
 */
export function parseSignature(signature: string): { r: string; s: string; v: number } {
  if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    throw new Error(
      `Invalid signature format: expected 0x + 130 hex characters (65 bytes), got ${signature.length - 2} hex characters`,
    );
  }

  const r = `0x${signature.slice(2, 66)}`;
  const s = `0x${signature.slice(66, 130)}`;
  const v = parseInt(signature.slice(130, 132), 16);

  // Normalize v to 27/28 if it's 0/1
  const normalizedV = v < 27 ? v + 27 : v;

  return { r, s, v: normalizedV };
}

/**
 * Combine signature components into compact format
 *
 * @param r - First 32 bytes of the signature
 * @param s - Second 32 bytes of the signature
 * @param v - Recovery identifier (27 or 28)
 * @returns Compact signature hex string (65 bytes)
 */
export function combineSignature(r: string, s: string, v: number): string {
  const normalizedR = r.startsWith('0x') ? r.slice(2) : r;
  const normalizedS = s.startsWith('0x') ? s.slice(2) : s;
  const vHex = (v < 27 ? v : v - 27).toString(16).padStart(2, '0');

  return `0x${normalizedR}${normalizedS}${vHex}`;
}
