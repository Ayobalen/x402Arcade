/**
 * Mock User Factory
 *
 * Generates test user data with realistic wallet addresses.
 */

/**
 * Generate a random Ethereum-compatible wallet address.
 */
function generateWalletAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Generate a deterministic wallet address based on a seed.
 */
function generateDeterministicAddress(seed: number): string {
  const seedStr = seed.toString(16).padStart(8, '0');
  return `0x${seedStr.repeat(5)}`;
}

export interface MockUser {
  id: string;
  address: string;
  displayName: string | null;
  totalGamesPlayed: number;
  totalScore: number;
  highestScore: number;
  usdcBalance: number;
  createdAt: string;
  lastPlayedAt: string | null;
}

export interface CreateMockUserOptions {
  id?: string;
  address?: string;
  displayName?: string | null;
  totalGamesPlayed?: number;
  totalScore?: number;
  highestScore?: number;
  usdcBalance?: number;
  createdAt?: string;
  lastPlayedAt?: string | null;
}

let userCounter = 0;

/**
 * Create a mock user with sensible defaults.
 *
 * @param overrides - Optional overrides for any user field
 * @returns A mock user object
 *
 * @example
 * const user = createMockUser();
 * const richUser = createMockUser({ usdcBalance: 1000 });
 * const namedUser = createMockUser({ displayName: 'CryptoGamer42' });
 */
export function createMockUser(overrides: CreateMockUserOptions = {}): MockUser {
  userCounter++;

  const id = overrides.id ?? `user_${Date.now()}_${userCounter}`;
  const address = overrides.address ?? generateWalletAddress();

  return {
    id,
    address,
    displayName: overrides.displayName ?? null,
    totalGamesPlayed: overrides.totalGamesPlayed ?? 0,
    totalScore: overrides.totalScore ?? 0,
    highestScore: overrides.highestScore ?? 0,
    usdcBalance: overrides.usdcBalance ?? 10.0, // Default 10 USDC
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    lastPlayedAt: overrides.lastPlayedAt ?? null,
  };
}

/**
 * Create multiple mock users.
 *
 * @param count - Number of users to create
 * @param overridesGenerator - Optional function to generate overrides for each user
 * @returns Array of mock users
 */
export function createMockUsers(
  count: number,
  overridesGenerator?: (index: number) => CreateMockUserOptions
): MockUser[] {
  return Array.from({ length: count }, (_, index) =>
    createMockUser(overridesGenerator?.(index))
  );
}

/**
 * Create a deterministic mock user (same input always produces same output).
 * Useful for snapshot testing.
 *
 * @param seed - Seed number for deterministic generation
 * @param overrides - Optional overrides
 */
export function createDeterministicUser(
  seed: number,
  overrides: CreateMockUserOptions = {}
): MockUser {
  return {
    id: overrides.id ?? `user_seed_${seed}`,
    address: overrides.address ?? generateDeterministicAddress(seed),
    displayName: overrides.displayName ?? `TestUser${seed}`,
    totalGamesPlayed: overrides.totalGamesPlayed ?? seed % 100,
    totalScore: overrides.totalScore ?? seed * 100,
    highestScore: overrides.highestScore ?? seed * 10,
    usdcBalance: overrides.usdcBalance ?? 10.0,
    createdAt: overrides.createdAt ?? `2026-01-01T00:00:0${seed % 10}.000Z`,
    lastPlayedAt: overrides.lastPlayedAt ?? null,
  };
}

/**
 * Well-known test addresses for specific scenarios.
 */
export const testAddresses = {
  /** Standard test player */
  player1: '0x1111111111111111111111111111111111111111',
  /** Another test player */
  player2: '0x2222222222222222222222222222222222222222',
  /** Rich player with high balance */
  richPlayer: '0x3333333333333333333333333333333333333333',
  /** New player (no games) */
  newPlayer: '0x4444444444444444444444444444444444444444',
  /** Leaderboard champion */
  champion: '0x5555555555555555555555555555555555555555',
  /** Arcade wallet (receives payments) */
  arcadeWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  /** Zero address (invalid) */
  zeroAddress: '0x0000000000000000000000000000000000000000',
};
