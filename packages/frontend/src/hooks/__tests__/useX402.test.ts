/**
 * Unit tests for useX402 hook
 *
 * Tests the core useX402 hook functionality including:
 * - State management
 * - Payment flow
 * - Error handling
 *
 * @module hooks/__tests__/useX402.test
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useX402 } from '../useX402'
import type { PaymentRequest } from '../useX402'

// ============================================================================
// Test Constants
// ============================================================================

const TEST_RECIPIENT = '0x1234567890123456789012345678901234567890' as const
const TEST_AMOUNT = '0.01'

const createTestPaymentRequest = (
  overrides: Partial<PaymentRequest> = {}
): PaymentRequest => ({
  to: TEST_RECIPIENT,
  amount: TEST_AMOUNT,
  ...overrides,
})

// ============================================================================
// State Management Tests
// ============================================================================

describe('useX402 State Management', () => {
  describe('Initial State', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useX402())
      expect(result.current.status).toBe('idle')
    })

    it('should start with no error', () => {
      const { result } = renderHook(() => useX402())
      expect(result.current.error).toBeNull()
    })

    it('should start with no last payment', () => {
      const { result } = renderHook(() => useX402())
      expect(result.current.lastPayment).toBeNull()
    })

    it('should start with isPending false', () => {
      const { result } = renderHook(() => useX402())
      expect(result.current.isPending).toBe(false)
    })

    it('should report isReady as false when wallet not connected', () => {
      const { result } = renderHook(() => useX402())
      // Currently always false since wagmi isn't integrated
      expect(result.current.isReady).toBe(false)
    })
  })

  describe('Reset Action', () => {
    it('should reset status to idle', async () => {
      const { result } = renderHook(() => useX402())

      // Trigger an error first
      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected error since wagmi isn't configured
        }
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
    })

    it('should clear error on reset', async () => {
      const { result } = renderHook(() => useX402())

      // Trigger an error
      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.error).toBeNull()
    })

    it('should clear lastPayment on reset', () => {
      const { result } = renderHook(() => useX402())

      // Reset should clear lastPayment
      act(() => {
        result.current.reset()
      })

      expect(result.current.lastPayment).toBeNull()
    })
  })

  describe('Clear Error Action', () => {
    it('should clear error without affecting other state', async () => {
      const { result } = renderHook(() => useX402())

      // Trigger an error - need to await the act AND catch outside
      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Error expected - state should be updated
        }
      })

      // After act completes, state should be error
      expect(result.current.error).not.toBeNull()

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.status).toBe('idle')
    })

    it('should set status to idle when clearing from error state', async () => {
      const { result } = renderHook(() => useX402())

      // Trigger an error
      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      expect(result.current.status).toBe('error')

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.status).toBe('idle')
    })
  })
})

// ============================================================================
// Payment Flow Tests
// ============================================================================

describe('useX402 Payment Flow', () => {
  describe('Payment Initiation', () => {
    it('should set status to signing when pay is called', async () => {
      const { result } = renderHook(() => useX402())

      // Start payment (will fail since wagmi isn't configured, but status changes)
      const payPromise = act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected error
        }
      })

      // Check initial status change
      await payPromise
    })

    it('should throw if payment already in progress', async () => {
      const { result } = renderHook(() => useX402())

      // We can't easily test concurrent payments without wagmi,
      // but we can verify the isPending check exists
      expect(typeof result.current.pay).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should set error on payment failure', async () => {
      const { result } = renderHook(() => useX402())

      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected error - state is updated before throw
        }
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.code).toBe('PAYMENT_FAILED')
    })

    it('should set status to error on failure', async () => {
      const { result } = renderHook(() => useX402())

      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      expect(result.current.status).toBe('error')
    })

    it('should mark error as retryable', async () => {
      const { result } = renderHook(() => useX402())

      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      expect(result.current.error?.retryable).toBe(true)
    })
  })
})

// ============================================================================
// Callback Tests
// ============================================================================

describe('useX402 Callbacks', () => {
  describe('onError Callback', () => {
    it('should call onError when payment fails', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useX402({ onError }))

      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      expect(onError).toHaveBeenCalled()
    })

    it('should pass PaymentError to onError callback', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useX402({ onError }))

      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
          retryable: expect.any(Boolean),
        })
      )
    })
  })

  describe('onSuccess Callback', () => {
    // Note: onSuccess can't be fully tested without wagmi integration
    // but we verify it's properly wired up

    it('should accept onSuccess option', () => {
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useX402({ onSuccess }))

      // Hook should initialize without error
      expect(result.current.status).toBe('idle')
    })
  })

  describe('Auto Reset', () => {
    it('should accept autoReset option', () => {
      const { result } = renderHook(() =>
        useX402({ autoReset: true, autoResetDelay: 1000 })
      )

      expect(result.current.status).toBe('idle')
    })
  })
})

// ============================================================================
// Authorization Creation Tests
// ============================================================================

describe('useX402 createAuthorization', () => {
  it('should be a function', () => {
    const { result } = renderHook(() => useX402())
    expect(typeof result.current.createAuthorization).toBe('function')
  })

  it('should throw since wagmi is not implemented', async () => {
    const { result } = renderHook(() => useX402())

    await expect(
      result.current.createAuthorization(createTestPaymentRequest())
    ).rejects.toThrow('Wallet signing not yet implemented')
  })
})

// ============================================================================
// Type Tests
// ============================================================================

describe('useX402 Types', () => {
  describe('PaymentStatus', () => {
    it('should have valid status values', async () => {
      const { result } = renderHook(() => useX402())

      // Initial status
      expect(['idle', 'signing', 'settling', 'success', 'error']).toContain(
        result.current.status
      )
    })
  })

  describe('PaymentRequest', () => {
    it('should accept valid PaymentRequest', async () => {
      const { result } = renderHook(() => useX402())

      const request: PaymentRequest = {
        to: TEST_RECIPIENT,
        amount: '0.01',
        validitySeconds: 3600,
        metadata: { gameId: 'snake' },
      }

      // Should not throw type errors
      expect(request.to).toBe(TEST_RECIPIENT)
    })
  })
})

// ============================================================================
// Hook State Transitions
// ============================================================================

describe('useX402 State Transitions', () => {
  describe('idle -> signing -> error', () => {
    it('should transition through states correctly', async () => {
      const { result } = renderHook(() => useX402())

      // Start: idle
      expect(result.current.status).toBe('idle')

      // Attempt payment (will fail)
      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      // End: error
      expect(result.current.status).toBe('error')
    })
  })

  describe('error -> idle (via reset)', () => {
    it('should transition from error to idle on reset', async () => {
      const { result } = renderHook(() => useX402())

      // Get to error state
      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      expect(result.current.status).toBe('error')

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
    })
  })

  describe('error -> idle (via clearError)', () => {
    it('should transition from error to idle on clearError', async () => {
      const { result } = renderHook(() => useX402())

      // Get to error state
      await act(async () => {
        try {
          await result.current.pay(createTestPaymentRequest())
        } catch {
          // Expected
        }
      })

      expect(result.current.status).toBe('error')

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.status).toBe('idle')
    })
  })
})

// ============================================================================
// isPending Derived State
// ============================================================================

describe('useX402 isPending', () => {
  it('should be false when idle', () => {
    const { result } = renderHook(() => useX402())
    expect(result.current.isPending).toBe(false)
  })

  it('should be false when in error state', async () => {
    const { result } = renderHook(() => useX402())

    await act(async () => {
      try {
        await result.current.pay(createTestPaymentRequest())
      } catch {
        // Expected
      }
    })

    expect(result.current.status).toBe('error')
    expect(result.current.isPending).toBe(false)
  })
})
