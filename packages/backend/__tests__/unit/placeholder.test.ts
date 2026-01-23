/**
 * Placeholder test to verify Jest is configured correctly.
 * This file demonstrates that Jest works with TypeScript
 * and ESM modules in the backend environment.
 */

import { jest } from '@jest/globals';

describe('Jest Configuration', () => {
  it('should have access to Jest test functions', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toContain('ell');
    expect([1, 2, 3]).toHaveLength(3);
  });

  it('should support async tests', async () => {
    const result = await Promise.resolve('async value');
    expect(result).toBe('async value');
  });

  it('should support mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should have Node.js environment available', () => {
    expect(typeof process).toBe('object');
    expect(typeof global).toBe('object');
  });
});
