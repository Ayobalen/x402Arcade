import '@testing-library/jest-dom'

/**
 * Browser API Mocks for Testing
 *
 * These mocks are persistent and will not be affected by vi.restoreAllMocks().
 * They use class-based implementations that work reliably across all tests.
 */

// Mock window.matchMedia for tests that use responsive design
const createMatchMediaMock = () => {
  return (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: createMatchMediaMock(),
});

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  get root() {
    return this.options?.root || null;
  }

  get rootMargin() {
    return this.options?.rootMargin || '0px';
  }

  get thresholds() {
    const threshold = this.options?.threshold || 0;
    return Array.isArray(threshold) ? threshold : [threshold];
  }
}

global.IntersectionObserver = MockIntersectionObserver;
