/**
 * useAutoChainSwitch Hook Tests
 *
 * Tests for the automatic chain switching hook that prompts users
 * to switch networks when connected to the wrong chain.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutoChainSwitch } from '../../src/hooks/useAutoChainSwitch'
import { useWalletStore, REQUIRED_CHAIN_ID } from '../../src/stores/walletStore'

// ============================================================================
// Test Setup
// ============================================================================

// Mock provider
const mockProvider = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
}

describe('useAutoChainSwitch', () => {
  beforeEach(() => {
    // Reset wallet store
    useWalletStore.getState().reset()
    // Reset mocks
    vi.clearAllMocks()
    // Set up window.ethereum mock
    ;(window as Window & { ethereum?: typeof mockProvider }).ethereum = mockProvider
    // Use fake timers for controlling delays
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Clean up
    delete (window as Window & { ethereum?: typeof mockProvider }).ethereum
    vi.useRealTimers()
  })

  // ============================================================================
  // Initial State Tests
  // ============================================================================
  describe('initial state', () => {
    it('returns idle status when disconnected', () => {
      const { result } = renderHook(() => useAutoChainSwitch())

      expect(result.current.status).toBe('idle')
      expect(result.current.isCorrectChain).toBe(false)
      expect(result.current.isSwitching).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('returns correct chain status when connected to required chain', () => {
      // Connect to correct chain
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: REQUIRED_CHAIN_ID,
      })

      const { result } = renderHook(() => useAutoChainSwitch())

      expect(result.current.isCorrectChain).toBe(true)
      expect(result.current.status).toBe('idle')
    })

    it('returns wrong chain status when connected to different chain', () => {
      // Connect to wrong chain
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1, // Ethereum mainnet, not required chain
      })

      const { result } = renderHook(() => useAutoChainSwitch())

      expect(result.current.isCorrectChain).toBe(false)
    })
  })

  // ============================================================================
  // Auto-Switch Tests
  // ============================================================================
  describe('auto-switch behavior', () => {
    it('auto-switches when connected to wrong chain', async () => {
      mockProvider.request.mockResolvedValueOnce(null) // wallet_switchEthereumChain

      // Connect to wrong chain
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const onSwitchStart = vi.fn()
      const onSwitchSuccess = vi.fn()

      const { result } = renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: true,
          switchDelay: 100,
          onSwitchStart,
          onSwitchSuccess,
        })
      )

      // Advance timer past the delay
      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Wait for switch to complete
      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(onSwitchStart).toHaveBeenCalled()
      expect(onSwitchSuccess).toHaveBeenCalledWith(REQUIRED_CHAIN_ID)
      expect(mockProvider.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'wallet_switchEthereumChain' })
      )
    })

    it('does not auto-switch when autoSwitch is false', async () => {
      mockProvider.request.mockResolvedValueOnce(null)

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const onSwitchStart = vi.fn()

      renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: false,
          onSwitchStart,
        })
      )

      // Advance timer
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(onSwitchStart).not.toHaveBeenCalled()
      expect(mockProvider.request).not.toHaveBeenCalled()
    })

    it('does not auto-switch when already on correct chain', async () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: REQUIRED_CHAIN_ID,
      })

      const onSwitchStart = vi.fn()

      renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: true,
          onSwitchStart,
        })
      )

      // Advance timer
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(onSwitchStart).not.toHaveBeenCalled()
    })

    it('only attempts auto-switch once per connection', async () => {
      // First attempt rejects
      mockProvider.request.mockRejectedValueOnce({ code: 4001, message: 'User rejected' })

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const onSwitchStart = vi.fn()

      renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: true,
          switchDelay: 100,
          onSwitchStart,
        })
      )

      // First auto-switch attempt
      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(onSwitchStart).toHaveBeenCalledTimes(1)
      })

      // Clear mock to track new calls
      onSwitchStart.mockClear()

      // Advance more time - should NOT trigger another switch
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(onSwitchStart).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Manual Switch Tests
  // ============================================================================
  describe('manual switchChain', () => {
    it('switches chain successfully when called manually', async () => {
      mockProvider.request.mockResolvedValueOnce(null)

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const { result } = renderHook(() =>
        useAutoChainSwitch({ autoSwitch: false })
      )

      let success: boolean = false
      await act(async () => {
        success = await result.current.switchChain()
      })

      expect(success).toBe(true)
      expect(result.current.status).toBe('success')
    })

    it('handles user rejection during manual switch', async () => {
      mockProvider.request.mockRejectedValueOnce({
        code: 4001,
        message: 'User rejected',
      })

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const onSwitchRejected = vi.fn()

      const { result } = renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: false,
          onSwitchRejected,
        })
      )

      let success: boolean = true
      await act(async () => {
        success = await result.current.switchChain()
      })

      expect(success).toBe(false)
      expect(result.current.status).toBe('rejected')
      expect(onSwitchRejected).toHaveBeenCalled()
    })

    it('handles switch error', async () => {
      mockProvider.request.mockRejectedValueOnce({
        code: -32002,
        message: 'Request pending',
      })

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const onSwitchError = vi.fn()

      const { result } = renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: false,
          onSwitchError,
        })
      )

      let success: boolean = true
      await act(async () => {
        success = await result.current.switchChain()
      })

      expect(success).toBe(false)
      expect(result.current.status).toBe('error')
      expect(onSwitchError).toHaveBeenCalled()
      expect(result.current.error).not.toBeNull()
    })

    it('prevents concurrent switch calls', async () => {
      // Slow response
      mockProvider.request.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const { result } = renderHook(() =>
        useAutoChainSwitch({ autoSwitch: false })
      )

      // Start first switch
      act(() => {
        result.current.switchChain()
      })

      expect(result.current.isSwitching).toBe(true)

      // Try second switch - should return false immediately
      let secondResult: boolean = true
      await act(async () => {
        secondResult = await result.current.switchChain()
      })

      expect(secondResult).toBe(false)
    })
  })

  // ============================================================================
  // Reset Tests
  // ============================================================================
  describe('reset', () => {
    it('resets state to initial values', async () => {
      mockProvider.request.mockRejectedValueOnce({
        code: 4001,
        message: 'User rejected',
      })

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const { result } = renderHook(() =>
        useAutoChainSwitch({ autoSwitch: false })
      )

      // Trigger an error
      await act(async () => {
        await result.current.switchChain()
      })

      expect(result.current.status).toBe('rejected')
      expect(result.current.error).not.toBeNull()

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.error).toBeNull()
    })
  })

  // ============================================================================
  // Custom Target Chain Tests
  // ============================================================================
  describe('custom target chain', () => {
    it('uses custom target chain ID', async () => {
      const customChainId = 137 // Polygon

      mockProvider.request.mockResolvedValueOnce(null)

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const { result } = renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: false,
          targetChainId: customChainId,
        })
      )

      await act(async () => {
        await result.current.switchChain()
      })

      // Check that switchChain was called with the custom chain
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }], // 137 in hex
      })
    })

    it('reports correct chain based on custom target', () => {
      const customChainId = 137

      // Connect to the custom chain
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: customChainId,
      })

      const { result } = renderHook(() =>
        useAutoChainSwitch({
          targetChainId: customChainId,
        })
      )

      expect(result.current.isCorrectChain).toBe(true)
    })
  })

  // ============================================================================
  // Callback Tests
  // ============================================================================
  describe('callbacks', () => {
    it('calls all success callbacks in order', async () => {
      mockProvider.request.mockResolvedValueOnce(null)

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const callOrder: string[] = []

      const onSwitchStart = vi.fn(() => callOrder.push('start'))
      const onSwitchSuccess = vi.fn(() => callOrder.push('success'))

      const { result } = renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: false,
          onSwitchStart,
          onSwitchSuccess,
        })
      )

      await act(async () => {
        await result.current.switchChain()
      })

      expect(callOrder).toEqual(['start', 'success'])
    })

    it('calls onSwitchError with error details', async () => {
      mockProvider.request.mockRejectedValueOnce({
        code: 4902,
        message: 'Chain not added',
      })
      // Second call for adding chain also fails
      mockProvider.request.mockRejectedValueOnce({
        code: -32000,
        message: 'Add chain failed',
      })

      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const onSwitchError = vi.fn()

      const { result } = renderHook(() =>
        useAutoChainSwitch({
          autoSwitch: false,
          onSwitchError,
        })
      )

      await act(async () => {
        await result.current.switchChain()
      })

      expect(onSwitchError).toHaveBeenCalled()
      const errorArg = onSwitchError.mock.calls[0][0]
      expect(errorArg).toHaveProperty('code')
      expect(errorArg).toHaveProperty('message')
    })
  })
})
