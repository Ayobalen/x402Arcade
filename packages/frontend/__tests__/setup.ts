/**
 * Global test setup for frontend tests.
 * This file is automatically imported by Vitest before each test file.
 *
 * Includes:
 * - @testing-library/jest-dom matchers (toBeInTheDocument, toHaveTextContent, etc.)
 * - Automatic cleanup after each test (via RTL)
 * - Browser API mocks (matchMedia, ResizeObserver, IntersectionObserver)
 * - Storage mocks (localStorage, sessionStorage)
 *
 * NOTE: Browser API mocks (matchMedia, ResizeObserver, IntersectionObserver)
 * are defined in src/test/setup.ts using class-based implementations.
 * This file should NOT override those with vi.fn() mocks.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test to remove rendered components
// This is automatically done by @testing-library/react in Vitest,
// but we explicitly call it for clarity and consistency
afterEach(() => {
  cleanup();
});

/**
 * Mock fetch for API tests
 * Using vi.fn() here is intentional - we want to configure/reset it per test
 */
global.fetch = vi.fn();

/**
 * Mock localStorage
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/**
 * Mock sessionStorage (separate instance from localStorage)
 */
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

/**
 * Mock scrollTo for scroll-based components
 */
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

/**
 * Mock requestAnimationFrame for animations
 * Using function implementation instead of vi.fn() to avoid reset issues
 */
global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number;
}) as typeof requestAnimationFrame;

global.cancelAnimationFrame = ((id: number) => {
  clearTimeout(id);
}) as typeof cancelAnimationFrame;

/**
 * Reset mocks before each test
 */
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
  // Reset fetch mock
  (global.fetch as ReturnType<typeof vi.fn>).mockReset();
});

/**
 * Clean up after tests
 * NOTE: We don't call vi.restoreAllMocks() here because it would break
 * the class-based mocks defined in src/test/setup.ts
 */
afterEach(() => {
  // vi.restoreAllMocks() - REMOVED to preserve browser API mocks
});

// Suppress specific console warnings during tests (optional)
// Uncomment if you have noisy warnings that are expected
// const originalWarn = console.warn;
// console.warn = (...args: unknown[]) => {
//   const message = args[0];
//   if (typeof message === 'string' && message.includes('Warning: ReactDOM.render')) {
//     return; // Suppress React 18 render warnings
//   }
//   originalWarn.apply(console, args);
// };

// Custom test utilities exported from here
export const mockWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
export const mockChainId = 338; // Cronos Testnet
export const mockUsdcAddress = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

// Helper to generate unique test wallet addresses
export const generateTestWalletAddress = (suffix = '1') =>
  `0x${suffix.padStart(40, '0')}` as `0x${string}`;
