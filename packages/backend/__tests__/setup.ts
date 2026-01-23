/**
 * Global test setup for backend tests.
 * This file is automatically imported by Jest before each test file.
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory SQLite for tests

// Mock console methods during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Test constants for x402Arcade
export const TEST_CONSTANTS = {
  // Wallet addresses
  PLAYER_ADDRESS: '0x1234567890abcdef1234567890abcdef12345678',
  ARCADE_ADDRESS: '0xabcdef1234567890abcdef1234567890abcdef12',

  // Chain configuration
  CHAIN_ID: 338,
  USDC_ADDRESS: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',

  // Game configuration
  SNAKE_PRICE_USDC: 0.01,
  TETRIS_PRICE_USDC: 0.02,
  PRIZE_POOL_PERCENTAGE: 70,

  // Test transactions
  TX_HASH: '0x' + 'a'.repeat(64),
  SESSION_ID: 'test-session-001',
};

// Helper to create a mock Express request
export function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
}

// Helper to create a mock Express response
export function createMockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}

// Helper to create a mock next function
export function createMockNext() {
  return jest.fn();
}
