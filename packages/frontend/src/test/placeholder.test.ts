/**
 * Placeholder test to verify Vitest is configured correctly.
 * This file demonstrates that Vitest globals (describe, it, expect) work
 * without explicit imports, and that the test environment is properly set up.
 */

describe('Vitest Configuration', () => {
  it('should have access to global test functions', () => {
    // Verify globals are available
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
    expect(expect).toBeDefined()
    expect(vi).toBeDefined()
  })

  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toContain('ell')
    expect([1, 2, 3]).toHaveLength(3)
  })

  it('should support async tests', async () => {
    const result = await Promise.resolve('async value')
    expect(result).toBe('async value')
  })

  it('should have jsdom environment available', () => {
    // Verify jsdom provides browser APIs
    expect(window).toBeDefined()
    expect(document).toBeDefined()
    expect(document.createElement).toBeDefined()
  })

  it('should support vi mock functions', () => {
    const mockFn = vi.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
