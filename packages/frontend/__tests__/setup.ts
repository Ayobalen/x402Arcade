/**
 * Global test setup for frontend tests.
 * This file is automatically imported by Vitest before each test file.
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for responsive components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for lazy loading and scroll effects
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch for API tests
global.fetch = vi.fn();

// Mock localStorage
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
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// Clean up after tests
afterEach(() => {
  vi.restoreAllMocks();
});

// Suppress console errors during tests (optional - uncomment if needed)
// console.error = vi.fn();

// Custom test utilities can be exported from here
export const mockWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
export const mockChainId = 338; // Cronos Testnet
export const mockUsdcAddress = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';
