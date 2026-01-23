/**
 * Frontend Test Utility Helpers
 *
 * Reusable test utilities for common testing patterns in the frontend.
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

/**
 * Wait for an element to appear in the DOM.
 * Useful for testing async UI updates.
 *
 * @param selector - CSS selector or function that returns an element
 * @param options - Configuration options
 * @returns Promise that resolves to the element or null
 */
export async function waitForElement<T extends Element = Element>(
  selector: string | (() => T | null),
  options: {
    timeout?: number;
    interval?: number;
    container?: Element | Document;
  } = {}
): Promise<T | null> {
  const { timeout = 3000, interval = 50, container = document } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      let element: T | null = null;

      if (typeof selector === 'function') {
        element = selector();
      } else {
        element = container.querySelector<T>(selector);
      }

      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        resolve(null);
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

/**
 * Wait for an element to be removed from the DOM.
 *
 * @param selector - CSS selector or element to watch
 * @param options - Configuration options
 * @returns Promise that resolves when element is removed
 */
export async function waitForElementToBeRemoved(
  selector: string | Element,
  options: {
    timeout?: number;
    interval?: number;
    container?: Element | Document;
  } = {}
): Promise<boolean> {
  const { timeout = 3000, interval = 50, container = document } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      let exists = false;

      if (typeof selector === 'string') {
        exists = container.querySelector(selector) !== null;
      } else {
        exists = container.contains(selector);
      }

      if (!exists) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        resolve(false);
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

/**
 * Mock fetch API for testing API calls.
 * Returns a mock function that can be configured with responses.
 *
 * @returns Object with mock fetch and helper methods
 */
export function mockFetch(): {
  mock: Mock;
  mockResolve: (data: unknown, options?: ResponseInit) => void;
  mockReject: (error: Error) => void;
  mockResponses: (responses: Array<{ data: unknown; options?: ResponseInit }>) => void;
  restore: () => void;
} {
  const originalFetch = global.fetch;
  const mock = vi.fn();

  global.fetch = mock;

  return {
    mock,

    /**
     * Configure mock to resolve with JSON data
     */
    mockResolve(data: unknown, options: ResponseInit = {}) {
      mock.mockResolvedValue(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          ...options,
        })
      );
    },

    /**
     * Configure mock to reject with an error
     */
    mockReject(error: Error) {
      mock.mockRejectedValue(error);
    },

    /**
     * Configure mock to respond with multiple sequential responses
     */
    mockResponses(responses: Array<{ data: unknown; options?: ResponseInit }>) {
      responses.forEach((response) => {
        mock.mockResolvedValueOnce(
          new Response(JSON.stringify(response.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            ...response.options,
          })
        );
      });
    },

    /**
     * Restore original fetch
     */
    restore() {
      global.fetch = originalFetch;
    },
  };
}

/**
 * Create a mock Zustand store for testing.
 * Useful for testing components that depend on global state.
 *
 * @param initialState - Initial state for the store
 * @returns Store creator function compatible with Zustand
 */
export function createTestStore<T extends object>(initialState: T) {
  let state = { ...initialState };
  const listeners = new Set<() => void>();

  const getState = () => state;

  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const newState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...newState };
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const reset = () => {
    state = { ...initialState };
    listeners.forEach((listener) => listener());
  };

  return {
    getState,
    setState,
    subscribe,
    reset,
    // Compatibility with Zustand's store API
    destroy: () => listeners.clear(),
  };
}

/**
 * Wrapper for testing async state updates.
 * Waits for state to settle after an action.
 *
 * @param action - Function that triggers a state update
 * @param predicate - Function to check if state has settled
 * @param timeout - Maximum time to wait
 */
export async function waitForStateUpdate<T>(
  action: () => void,
  predicate: () => T | null,
  timeout = 3000
): Promise<T | null> {
  action();
  const startTime = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      const result = predicate();
      if (result !== null) {
        resolve(result);
        return;
      }
      if (Date.now() - startTime >= timeout) {
        resolve(null);
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

/**
 * Create a deferred promise for controlling async flow in tests.
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Simulate user events with proper timing.
 */
export const userEvents = {
  /**
   * Type text into an input element
   */
  async type(element: HTMLInputElement | HTMLTextAreaElement, text: string): Promise<void> {
    element.focus();
    for (const char of text) {
      const event = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: char,
      });
      element.value += char;
      element.dispatchEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  },

  /**
   * Click an element
   */
  click(element: Element): void {
    element.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  },

  /**
   * Press a key
   */
  keyPress(element: Element, key: string, code?: string): void {
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        code: code || key,
        bubbles: true,
        cancelable: true,
      })
    );
    element.dispatchEvent(
      new KeyboardEvent('keyup', {
        key,
        code: code || key,
        bubbles: true,
        cancelable: true,
      })
    );
  },
};
