/**
 * EIP-3009 TransferWithAuthorization Types
 *
 * Type definitions and constants for EIP-3009 gasless token transfers.
 * Used for signing TransferWithAuthorization messages via wallets.
 *
 * @module config/eip3009
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 * @see https://eips.ethereum.org/EIPS/eip-712 - EIP-712 Typed Data Standard
 */

import { CRONOS_TESTNET_CHAIN_ID, USDC_CONTRACT_ADDRESS } from './chain'

// ============================================================================
// USDC Token Constants
// ============================================================================

/**
 * USDC Token Name for EIP-712 Domain
 *
 * This MUST match the deployed contract's name() function return value.
 * Used in the EIP-712 domain separator for signature verification.
 */
export const USDC_NAME = 'Bridged USDC (Stargate)'

/**
 * USDC EIP-712 Domain Version
 *
 * This MUST match the version used in the deployed contract's domain separator.
 *
 * **CRITICAL**: The version differs between networks:
 * - Testnet (devUSDC.e): "1"
 * - Mainnet (USDC): "2"
 */
export const USDC_VERSION = '1'

/**
 * USDC Token Decimals
 *
 * USDC uses 6 decimals unlike most ERC-20 tokens that use 18.
 * - 1 USDC = 1,000,000 (10^6) smallest units
 * - $0.01 = 10,000 smallest units
 */
export const USDC_DECIMALS = 6 as const

// ============================================================================
// EIP-712 Domain Types
// ============================================================================

/**
 * EIP-712 TypedDataField Interface
 *
 * Represents a single field in an EIP-712 typed data structure.
 */
export interface TypedDataField {
  /** The name of the field */
  name: string
  /** The Solidity type of the field */
  type: string
}

/**
 * EIP-712 Domain Type Definition
 *
 * The type structure for the EIP712Domain.
 * This is used to construct the domain separator.
 */
export const EIP712_DOMAIN_TYPE: readonly TypedDataField[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
] as const

/**
 * EIP-712 Domain Configuration Interface
 *
 * The actual domain values used when signing typed data.
 */
export interface EIP712Domain {
  /** Human-readable name of the signing domain */
  name: string
  /** Current version of the signing domain */
  version: string
  /** EIP-155 chain ID */
  chainId: number | bigint
  /** Address of the contract that will verify the signature */
  verifyingContract: `0x${string}`
}

// ============================================================================
// TransferWithAuthorization Types
// ============================================================================

/**
 * EIP-3009 TransferWithAuthorization Type Definition
 *
 * The type structure for the TransferWithAuthorization message.
 * This enables gasless token transfers via signed authorizations.
 *
 * **Message Fields:**
 * - `from`: Token sender's address (the signer)
 * - `to`: Token recipient's address
 * - `value`: Amount of tokens to transfer (in smallest units)
 * - `validAfter`: Unix timestamp after which the authorization is valid
 * - `validBefore`: Unix timestamp before which the authorization is valid
 * - `nonce`: Unique nonce to prevent replay attacks (32 bytes)
 */
export const TRANSFER_WITH_AUTHORIZATION_TYPE: readonly TypedDataField[] = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'validAfter', type: 'uint256' },
  { name: 'validBefore', type: 'uint256' },
  { name: 'nonce', type: 'bytes32' },
] as const

/**
 * TransferWithAuthorization Message Interface
 *
 * The message values that get signed by the token sender.
 */
export interface TransferWithAuthorizationMessage {
  /** Token sender's address (must match the signer) */
  from: `0x${string}`
  /** Token recipient's address */
  to: `0x${string}`
  /** Amount to transfer in smallest units (as string for uint256) */
  value: string | bigint
  /** Unix timestamp after which the authorization is valid */
  validAfter: string | bigint
  /** Unix timestamp before which the authorization is valid */
  validBefore: string | bigint
  /** Unique 32-byte nonce (as hex string with 0x prefix) */
  nonce: `0x${string}`
}

/**
 * Signature Components Interface
 *
 * The ECDSA signature components from signTypedData.
 */
export interface SignatureComponents {
  /** Signature recovery identifier (27 or 28) */
  v: number
  /** First 32 bytes of the ECDSA signature */
  r: `0x${string}`
  /** Second 32 bytes of the ECDSA signature */
  s: `0x${string}`
}

/**
 * Signed TransferWithAuthorization Interface
 *
 * A complete signed authorization including the message and signature.
 * This is what gets submitted to the facilitator for settlement.
 */
export interface SignedTransferWithAuthorization extends SignatureComponents {
  /** The authorization message that was signed */
  message: TransferWithAuthorizationMessage
}

// ============================================================================
// Types Object for signTypedData
// ============================================================================

/**
 * EIP-712 Types Object for TransferWithAuthorization
 *
 * This is the complete types object for use with viem/wagmi signTypedData.
 * Does NOT include EIP712Domain as viem handles that automatically.
 *
 * @example
 * ```typescript
 * import { signTypedData } from 'wagmi/actions'
 * import { TRANSFER_WITH_AUTHORIZATION_TYPES, getUsdcEip712Domain } from '@/config/eip3009'
 *
 * const signature = await signTypedData({
 *   domain: getUsdcEip712Domain(),
 *   types: TRANSFER_WITH_AUTHORIZATION_TYPES,
 *   primaryType: 'TransferWithAuthorization',
 *   message: {
 *     from: playerAddress,
 *     to: arcadeWallet,
 *     value: '10000',
 *     validAfter: '0',
 *     validBefore: validBefore.toString(),
 *     nonce: generateNonce()
 *   }
 * })
 * ```
 */
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const

/**
 * Primary type for TransferWithAuthorization
 *
 * Use this constant when calling signTypedData to ensure type safety.
 */
export const TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE = 'TransferWithAuthorization' as const

// ============================================================================
// Domain Configuration
// ============================================================================

/**
 * Get the USDC EIP-712 Domain for Cronos Testnet
 *
 * Returns the domain configuration for signing EIP-3009 authorization
 * messages for the devUSDC.e contract.
 *
 * @returns EIP-712 domain configuration for USDC
 *
 * @example
 * ```typescript
 * const domain = getUsdcEip712Domain()
 * // => {
 * //   name: 'Bridged USDC (Stargate)',
 * //   version: '1',
 * //   chainId: 338,
 * //   verifyingContract: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0'
 * // }
 * ```
 */
export function getUsdcEip712Domain(): EIP712Domain {
  return {
    name: USDC_NAME,
    version: USDC_VERSION,
    chainId: CRONOS_TESTNET_CHAIN_ID,
    verifyingContract: USDC_CONTRACT_ADDRESS,
  }
}

/**
 * Create a custom EIP-712 Domain
 *
 * Factory function for creating domain configurations for different
 * contracts or networks.
 *
 * @param options - Domain configuration options
 * @returns EIP-712 domain configuration
 *
 * @example
 * ```typescript
 * const mainnetDomain = createEip712Domain({
 *   name: 'USDC',
 *   version: '2',
 *   chainId: 25, // Cronos Mainnet
 *   verifyingContract: '0x...'
 * })
 * ```
 */
export function createEip712Domain(options: {
  name: string
  version: string
  chainId: number | bigint
  verifyingContract: `0x${string}`
}): EIP712Domain {
  return {
    name: options.name,
    version: options.version,
    chainId: options.chainId,
    verifyingContract: options.verifyingContract,
  }
}

// ============================================================================
// Message Utilities
// ============================================================================

/**
 * Create a TransferWithAuthorization message
 *
 * Factory function to create properly formatted authorization messages.
 *
 * @param options - Authorization parameters
 * @returns Formatted TransferWithAuthorizationMessage
 *
 * @example
 * ```typescript
 * const message = createTransferWithAuthorizationMessage({
 *   from: '0x1234...5678',
 *   to: '0xabcd...ef01',
 *   value: parseUSDC(0.01),
 *   validitySeconds: 3600, // 1 hour
 *   nonce: generateNonce()
 * })
 * ```
 */
export function createTransferWithAuthorizationMessage(options: {
  from: `0x${string}`
  to: `0x${string}`
  value: bigint | string | number
  validAfter?: bigint | string | number
  validBefore?: bigint | string | number
  validitySeconds?: number
  nonce: `0x${string}`
}): TransferWithAuthorizationMessage {
  // Calculate validity window
  const now = Math.floor(Date.now() / 1000)
  const validAfter = options.validAfter !== undefined
    ? BigInt(options.validAfter)
    : BigInt(0)
  const validBefore = options.validBefore !== undefined
    ? BigInt(options.validBefore)
    : BigInt(now + (options.validitySeconds || 3600)) // Default 1 hour

  // Convert value to string (for uint256 compatibility)
  const value = typeof options.value === 'bigint'
    ? options.value.toString()
    : typeof options.value === 'number'
      ? BigInt(Math.floor(options.value)).toString()
      : options.value

  return {
    from: options.from,
    to: options.to,
    value,
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce: options.nonce,
  }
}

/**
 * Check if a TransferWithAuthorization is currently valid
 *
 * Validates that the current time is within the authorization's validity window.
 *
 * @param message - The authorization message to check
 * @returns true if the authorization is currently valid
 */
export function isAuthorizationValid(
  message: TransferWithAuthorizationMessage
): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000))
  const validAfter = BigInt(message.validAfter)
  const validBefore = BigInt(message.validBefore)

  return now > validAfter && now < validBefore
}

/**
 * Generate a random 32-byte nonce for TransferWithAuthorization
 *
 * Creates a cryptographically secure random nonce suitable for
 * preventing replay attacks.
 *
 * @returns Random 32-byte hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const nonce = generateNonce()
 * // => '0x1a2b3c4d...' (64 hex chars after 0x)
 * ```
 */
export function generateNonce(): `0x${string}` {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

// ============================================================================
// USDC Utilities
// ============================================================================

/**
 * Parse a human-readable USDC amount into smallest units
 *
 * @param amount - The USDC amount (e.g., "1.50", 1.5, "0.01")
 * @returns The amount in smallest units as a bigint
 *
 * @example
 * ```typescript
 * parseUSDC("1.50")  // => 1500000n
 * parseUSDC(0.01)    // => 10000n
 * parseUSDC("100")   // => 100000000n
 * ```
 */
export function parseUSDC(amount: string | number): bigint {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    throw new Error(`Invalid USDC amount: ${amount}`)
  }

  if (numAmount < 0) {
    throw new Error(`USDC amount cannot be negative: ${amount}`)
  }

  // Multiply by 10^6 and round to avoid floating point issues
  const multiplier = 10 ** USDC_DECIMALS
  const smallestUnits = Math.round(numAmount * multiplier)

  return BigInt(smallestUnits)
}

/**
 * Format a smallest unit USDC amount into a human-readable string
 *
 * @param amount - The amount in smallest units
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * formatUSDC(1500000n)    // => "1.50"
 * formatUSDC(10000n)      // => "0.01"
 * formatUSDC(1500000n, 6) // => "1.500000"
 * ```
 */
export function formatUSDC(
  amount: bigint | number | string,
  decimalPlaces: number = 2
): string {
  const bigAmount = typeof amount === 'bigint'
    ? amount
    : BigInt(typeof amount === 'string' ? amount : Math.floor(amount))

  const divisor = BigInt(10 ** USDC_DECIMALS)
  const wholePart = bigAmount / divisor
  const fractionalPart = bigAmount % divisor

  // Pad fractional part with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, '0')

  // Truncate or pad to desired decimal places
  const truncatedFractional = fractionalStr.slice(0, decimalPlaces).padEnd(decimalPlaces, '0')

  return `${wholePart}.${truncatedFractional}`
}

/**
 * Format a USDC amount with currency symbol
 *
 * @param amount - The amount in smallest units
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted string with $ prefix
 *
 * @example
 * ```typescript
 * formatUSDCWithSymbol(1500000n) // => "$1.50"
 * formatUSDCWithSymbol(10000n)   // => "$0.01"
 * ```
 */
export function formatUSDCWithSymbol(
  amount: bigint | number | string,
  decimalPlaces: number = 2
): string {
  return `$${formatUSDC(amount, decimalPlaces)}`
}

// ============================================================================
// Signature Utilities
// ============================================================================

/**
 * Parse signature from compact hex format into r, s, v components
 *
 * Converts a 65-byte compact signature (0x + 130 hex chars) into r, s, v components.
 * Handles both legacy (v=27/28) and EIP-155 (v=0/1) signature formats.
 *
 * @param signature - Compact signature hex string (65 bytes = 0x + 130 hex chars)
 * @returns Object with r, s, v components
 * @throws Error if signature format is invalid
 *
 * @example
 * ```typescript
 * // Parse a signature from signTypedData
 * const sig = parseSignature('0x1234...abcd'); // 65 bytes
 * console.log(sig.r); // '0x...' (32 bytes)
 * console.log(sig.s); // '0x...' (32 bytes)
 * console.log(sig.v); // 27 or 28
 * ```
 */
export function parseSignature(signature: string): SignatureComponents {
  // Validate signature format: 0x + 130 hex chars = 65 bytes
  if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    throw new Error(
      `Invalid signature format: expected 0x + 130 hex characters (65 bytes), got ${signature.length - 2} hex characters`
    )
  }

  // Extract r (bytes 0-32): chars 2-66 (first 64 hex chars after 0x)
  const r = `0x${signature.slice(2, 66)}` as `0x${string}`

  // Extract s (bytes 32-64): chars 66-130 (next 64 hex chars)
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`

  // Extract v (byte 64): chars 130-132 (last 2 hex chars)
  const v = parseInt(signature.slice(130, 132), 16)

  // Normalize v to 27/28 if it's 0/1 (EIP-155 to legacy format)
  const normalizedV = v < 27 ? v + 27 : v

  return { r, s, v: normalizedV }
}

/**
 * Combine signature components into compact hex format
 *
 * Creates a 65-byte compact signature from r, s, v components.
 * The v value is normalized to 0/1 format in the output.
 *
 * @param r - First 32 bytes of the signature (hex string)
 * @param s - Second 32 bytes of the signature (hex string)
 * @param v - Recovery identifier (27, 28, 0, or 1)
 * @returns Compact signature hex string (65 bytes)
 *
 * @example
 * ```typescript
 * const compact = combineSignature(
 *   '0x1234...', // r (32 bytes)
 *   '0xabcd...', // s (32 bytes)
 *   27
 * );
 * // compact = '0x1234...abcd...00' (65 bytes)
 * ```
 */
export function combineSignature(
  r: string,
  s: string,
  v: number
): `0x${string}` {
  // Strip 0x prefix if present
  const normalizedR = r.startsWith('0x') ? r.slice(2) : r
  const normalizedS = s.startsWith('0x') ? s.slice(2) : s

  // Normalize v to 0/1 format for compact signature
  const vByte = v >= 27 ? v - 27 : v
  const vHex = vByte.toString(16).padStart(2, '0')

  return `0x${normalizedR}${normalizedS}${vHex}`
}

/**
 * Validate signature components format
 *
 * Checks that r, s, and v values have the correct format.
 *
 * @param signature - The signature components to validate
 * @throws Error if any component is invalid
 */
export function validateSignatureComponents(signature: {
  r: string
  s: string
  v: number
}): void {
  // Validate r (32 bytes = 64 hex chars + 0x prefix)
  if (!/^0x[a-fA-F0-9]{64}$/.test(signature.r)) {
    throw new Error(
      `Invalid signature component 'r': expected 0x-prefixed hex string with 64 characters (32 bytes), got '${signature.r}'`
    )
  }

  // Validate s (32 bytes = 64 hex chars + 0x prefix)
  if (!/^0x[a-fA-F0-9]{64}$/.test(signature.s)) {
    throw new Error(
      `Invalid signature component 's': expected 0x-prefixed hex string with 64 characters (32 bytes), got '${signature.s}'`
    )
  }

  // Validate v (should be 27 or 28 for legacy, or 0/1 for EIP-155)
  if (signature.v !== 27 && signature.v !== 28 && signature.v !== 0 && signature.v !== 1) {
    throw new Error(
      `Invalid signature component 'v': expected 27, 28, 0, or 1, got ${signature.v}`
    )
  }
}
