/**
 * Nonce Store for x402 Payment Replay Protection
 *
 * Tracks used payment authorization nonces to prevent replay attacks.
 * The nonce store ensures each EIP-3009 authorization can only be used once.
 *
 * ## Usage
 *
 * ```typescript
 * import { NonceStore, createInMemoryNonceStore } from './nonce-store.js';
 *
 * // Create store instance (singleton recommended)
 * const nonceStore = createInMemoryNonceStore();
 *
 * // Check if nonce has been used
 * const isUsed = await nonceStore.isUsed(nonce);
 *
 * // Mark nonce as used after successful settlement
 * await nonceStore.markUsed(nonce, {
 *   from: playerAddress,
 *   transactionHash: txHash,
 * });
 * ```
 *
 * @module server/x402/nonce-store
 */

/**
 * Nonce metadata stored with each used nonce
 */
export interface NonceMetadata {
  /**
   * Address that signed the authorization
   */
  from: string;

  /**
   * Settlement transaction hash
   */
  transactionHash?: string;

  /**
   * ISO timestamp when the nonce was used
   */
  usedAt: string;

  /**
   * Additional metadata (e.g., game session ID)
   */
  extra?: Record<string, unknown>;
}

/**
 * Nonce Store Interface
 *
 * Abstract interface for nonce tracking implementations.
 * Supports in-memory, Redis, or database backends.
 */
export interface NonceStore {
  /**
   * Check if a nonce has already been used
   *
   * @param nonce - The 32-byte hex nonce (0x + 64 chars)
   * @returns True if the nonce has been used
   */
  isUsed(nonce: string): Promise<boolean>;

  /**
   * Mark a nonce as used after successful settlement
   *
   * @param nonce - The 32-byte hex nonce to mark as used
   * @param metadata - Metadata about the usage
   */
  markUsed(nonce: string, metadata: Omit<NonceMetadata, 'usedAt'>): Promise<void>;

  /**
   * Get metadata for a used nonce
   *
   * @param nonce - The nonce to look up
   * @returns Metadata if found, undefined otherwise
   */
  getMetadata(nonce: string): Promise<NonceMetadata | undefined>;

  /**
   * Clear all stored nonces (for testing)
   */
  clear(): Promise<void>;

  /**
   * Get the count of stored nonces
   */
  size(): Promise<number>;
}

/**
 * In-Memory Nonce Store Implementation
 *
 * Simple Map-based nonce store for development and testing.
 * For production, use Redis or database-backed implementation.
 *
 * Features:
 * - Optional TTL for automatic expiration
 * - Optional max size to prevent unbounded growth
 * - Thread-safe for single-process Node.js
 *
 * Limitations:
 * - Data lost on process restart
 * - Not suitable for multi-process/multi-server deployments
 */
export class InMemoryNonceStore implements NonceStore {
  private readonly nonces: Map<string, NonceMetadata>;
  private readonly maxSize: number;
  private readonly ttlMs: number | null;

  /**
   * Create an in-memory nonce store
   *
   * @param options - Configuration options
   */
  constructor(options?: {
    /**
     * Maximum number of nonces to store
     * Oldest entries are evicted when limit is reached
     * @default 100000
     */
    maxSize?: number;

    /**
     * Time-to-live for nonce entries in milliseconds
     * Set to null to disable TTL
     * @default 86400000 (24 hours)
     */
    ttlMs?: number | null;
  }) {
    this.nonces = new Map();
    this.maxSize = options?.maxSize ?? 100000;
    this.ttlMs = options?.ttlMs ?? 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Check if a nonce has been used
   */
  async isUsed(nonce: string): Promise<boolean> {
    const normalizedNonce = this.normalizeNonce(nonce);
    const metadata = this.nonces.get(normalizedNonce);

    if (!metadata) {
      return false;
    }

    // Check TTL expiration
    if (this.ttlMs !== null) {
      const usedAt = new Date(metadata.usedAt).getTime();
      const now = Date.now();
      if (now - usedAt > this.ttlMs) {
        // Expired - remove and return false
        this.nonces.delete(normalizedNonce);
        return false;
      }
    }

    return true;
  }

  /**
   * Mark a nonce as used
   */
  async markUsed(
    nonce: string,
    metadata: Omit<NonceMetadata, 'usedAt'>,
  ): Promise<void> {
    const normalizedNonce = this.normalizeNonce(nonce);

    // Evict oldest entries if at capacity
    if (this.nonces.size >= this.maxSize) {
      this.evictOldest(Math.ceil(this.maxSize * 0.1)); // Evict 10%
    }

    this.nonces.set(normalizedNonce, {
      ...metadata,
      usedAt: new Date().toISOString(),
    });
  }

  /**
   * Get metadata for a used nonce
   */
  async getMetadata(nonce: string): Promise<NonceMetadata | undefined> {
    const normalizedNonce = this.normalizeNonce(nonce);
    return this.nonces.get(normalizedNonce);
  }

  /**
   * Clear all stored nonces
   */
  async clear(): Promise<void> {
    this.nonces.clear();
  }

  /**
   * Get the number of stored nonces
   */
  async size(): Promise<number> {
    // Clean expired entries first
    if (this.ttlMs !== null) {
      await this.cleanExpired();
    }
    return this.nonces.size;
  }

  /**
   * Normalize nonce to lowercase for consistent lookups
   */
  private normalizeNonce(nonce: string): string {
    return nonce.toLowerCase();
  }

  /**
   * Evict the oldest entries
   */
  private evictOldest(count: number): void {
    // Map maintains insertion order, so first entries are oldest
    const iterator = this.nonces.keys();
    for (let i = 0; i < count; i++) {
      const result = iterator.next();
      if (result.done) break;
      this.nonces.delete(result.value);
    }
  }

  /**
   * Remove expired entries
   */
  private async cleanExpired(): Promise<void> {
    if (this.ttlMs === null) return;

    const now = Date.now();
    const toDelete: string[] = [];

    for (const [nonce, metadata] of this.nonces.entries()) {
      const usedAt = new Date(metadata.usedAt).getTime();
      if (now - usedAt > this.ttlMs) {
        toDelete.push(nonce);
      }
    }

    for (const nonce of toDelete) {
      this.nonces.delete(nonce);
    }
  }
}

/**
 * Create an in-memory nonce store with default settings
 *
 * @returns Configured InMemoryNonceStore instance
 */
export function createInMemoryNonceStore(): NonceStore {
  return new InMemoryNonceStore();
}

/**
 * Singleton nonce store instance
 *
 * Use this for the default application-wide nonce tracking.
 */
let defaultNonceStore: NonceStore | null = null;

/**
 * Get the default nonce store instance
 *
 * Creates a singleton in-memory store on first call.
 * For production, replace with Redis/database implementation.
 *
 * @returns The default NonceStore instance
 */
export function getDefaultNonceStore(): NonceStore {
  if (!defaultNonceStore) {
    defaultNonceStore = createInMemoryNonceStore();
  }
  return defaultNonceStore;
}

/**
 * Set a custom nonce store as the default
 *
 * Use this to inject a Redis or database-backed store.
 *
 * @param store - The nonce store to use as default
 */
export function setDefaultNonceStore(store: NonceStore): void {
  defaultNonceStore = store;
}

/**
 * Reset the default nonce store
 *
 * Clears the singleton instance. Used for testing.
 */
export function resetDefaultNonceStore(): void {
  defaultNonceStore = null;
}
