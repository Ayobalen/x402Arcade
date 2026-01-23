/**
 * Wallet Store Unit Tests
 *
 * Comprehensive tests for the wallet Zustand store covering
 * connection state, actions, selectors, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  useWalletStore,
  selectAddress,
  selectIsConnected,
  selectIsConnecting,
  selectChainId,
  selectError,
  selectStatus,
  selectFormattedAddress,
  getWalletState,
} from './walletStore'

describe('walletStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useWalletStore.getState().reset()
  })

  // ============================================================
  // Initial State Tests
  // ============================================================
  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = useWalletStore.getState()

      expect(state.address).toBeNull()
      expect(state.chainId).toBeNull()
      expect(state.status).toBe('disconnected')
      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  // ============================================================
  // Connect Action Tests
  // ============================================================
  describe('connect action', () => {
    it('sets address and chainId on connect', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const state = useWalletStore.getState()
      expect(state.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
      expect(state.chainId).toBe(1)
    })

    it('sets isConnected to true on connect', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      expect(useWalletStore.getState().isConnected).toBe(true)
    })

    it('sets status to connected on connect', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      expect(useWalletStore.getState().status).toBe('connected')
    })

    it('clears isConnecting on connect', () => {
      useWalletStore.getState().startConnecting()
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      expect(useWalletStore.getState().isConnecting).toBe(false)
    })

    it('clears error on connect', () => {
      useWalletStore.getState().setError({
        code: 'USER_REJECTED',
        message: 'User rejected',
      })
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      expect(useWalletStore.getState().error).toBeNull()
    })
  })

  // ============================================================
  // Disconnect Action Tests
  // ============================================================
  describe('disconnect action', () => {
    beforeEach(() => {
      // Set up connected state
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })
    })

    it('clears address on disconnect', () => {
      useWalletStore.getState().disconnect()
      expect(useWalletStore.getState().address).toBeNull()
    })

    it('clears chainId on disconnect', () => {
      useWalletStore.getState().disconnect()
      expect(useWalletStore.getState().chainId).toBeNull()
    })

    it('sets isConnected to false on disconnect', () => {
      useWalletStore.getState().disconnect()
      expect(useWalletStore.getState().isConnected).toBe(false)
    })

    it('sets status to disconnected on disconnect', () => {
      useWalletStore.getState().disconnect()
      expect(useWalletStore.getState().status).toBe('disconnected')
    })

    it('clears error on disconnect', () => {
      useWalletStore.getState().setError({
        code: 'NETWORK_ERROR',
        message: 'Network error',
      })
      useWalletStore.getState().disconnect()

      expect(useWalletStore.getState().error).toBeNull()
    })
  })

  // ============================================================
  // Start Connecting Action Tests
  // ============================================================
  describe('startConnecting action', () => {
    it('sets isConnecting to true', () => {
      useWalletStore.getState().startConnecting()
      expect(useWalletStore.getState().isConnecting).toBe(true)
    })

    it('sets status to connecting', () => {
      useWalletStore.getState().startConnecting()
      expect(useWalletStore.getState().status).toBe('connecting')
    })

    it('clears any existing error', () => {
      useWalletStore.getState().setError({
        code: 'ERROR',
        message: 'Error',
      })
      useWalletStore.getState().startConnecting()

      expect(useWalletStore.getState().error).toBeNull()
    })
  })

  // ============================================================
  // Set Error Action Tests
  // ============================================================
  describe('setError action', () => {
    it('sets error with code and message', () => {
      useWalletStore.getState().setError({
        code: 'USER_REJECTED',
        message: 'User rejected the connection request',
      })

      const error = useWalletStore.getState().error
      expect(error).toEqual({
        code: 'USER_REJECTED',
        message: 'User rejected the connection request',
      })
    })

    it('sets status to error', () => {
      useWalletStore.getState().setError({
        code: 'ERROR',
        message: 'Error',
      })

      expect(useWalletStore.getState().status).toBe('error')
    })

    it('clears isConnecting', () => {
      useWalletStore.getState().startConnecting()
      useWalletStore.getState().setError({
        code: 'ERROR',
        message: 'Error',
      })

      expect(useWalletStore.getState().isConnecting).toBe(false)
    })
  })

  // ============================================================
  // Clear Error Action Tests
  // ============================================================
  describe('clearError action', () => {
    it('clears the error', () => {
      useWalletStore.getState().setError({
        code: 'ERROR',
        message: 'Error',
      })
      useWalletStore.getState().clearError()

      expect(useWalletStore.getState().error).toBeNull()
    })

    it('resets status to disconnected', () => {
      useWalletStore.getState().setError({
        code: 'ERROR',
        message: 'Error',
      })
      useWalletStore.getState().clearError()

      expect(useWalletStore.getState().status).toBe('disconnected')
    })
  })

  // ============================================================
  // Set Chain ID Action Tests
  // ============================================================
  describe('setChainId action', () => {
    it('updates chainId', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })
      useWalletStore.getState().setChainId(137)

      expect(useWalletStore.getState().chainId).toBe(137)
    })

    it('preserves other state when changing chainId', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })
      useWalletStore.getState().setChainId(137)

      const state = useWalletStore.getState()
      expect(state.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
      expect(state.isConnected).toBe(true)
    })
  })

  // ============================================================
  // Reset Action Tests
  // ============================================================
  describe('reset action', () => {
    it('resets to initial state', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })
      useWalletStore.getState().setError({
        code: 'ERROR',
        message: 'Error',
      })
      useWalletStore.getState().reset()

      const state = useWalletStore.getState()
      expect(state.address).toBeNull()
      expect(state.chainId).toBeNull()
      expect(state.status).toBe('disconnected')
      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  // ============================================================
  // Selector Tests
  // ============================================================
  describe('selectors', () => {
    beforeEach(() => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })
    })

    it('selectAddress returns address', () => {
      const state = useWalletStore.getState()
      expect(selectAddress(state)).toBe('0x1234567890abcdef1234567890abcdef12345678')
    })

    it('selectIsConnected returns connection status', () => {
      const state = useWalletStore.getState()
      expect(selectIsConnected(state)).toBe(true)
    })

    it('selectIsConnecting returns connecting status', () => {
      useWalletStore.getState().startConnecting()
      const state = useWalletStore.getState()
      expect(selectIsConnecting(state)).toBe(true)
    })

    it('selectChainId returns chain ID', () => {
      const state = useWalletStore.getState()
      expect(selectChainId(state)).toBe(1)
    })

    it('selectError returns error', () => {
      useWalletStore.getState().setError({
        code: 'ERROR',
        message: 'Error',
      })
      const state = useWalletStore.getState()
      expect(selectError(state)).toEqual({
        code: 'ERROR',
        message: 'Error',
      })
    })

    it('selectStatus returns status', () => {
      const state = useWalletStore.getState()
      expect(selectStatus(state)).toBe('connected')
    })

    it('selectFormattedAddress returns truncated address', () => {
      const state = useWalletStore.getState()
      expect(selectFormattedAddress(state)).toBe('0x1234...5678')
    })

    it('selectFormattedAddress returns null when disconnected', () => {
      useWalletStore.getState().disconnect()
      const state = useWalletStore.getState()
      expect(selectFormattedAddress(state)).toBeNull()
    })
  })

  // ============================================================
  // Utility Function Tests
  // ============================================================
  describe('utility functions', () => {
    it('getWalletState returns current state', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      })

      const state = getWalletState()
      expect(state.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
      expect(state.isConnected).toBe(true)
    })
  })
})
