/**
 * Wallet Store Unit Tests
 *
 * Comprehensive tests for the wallet Zustand store covering
 * connection state, actions, selectors, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  useWalletStore,
  selectAddress,
  selectIsConnected,
  selectIsConnecting,
  selectChainId,
  selectError,
  selectStatus,
  selectFormattedAddress,
  selectIsCorrectChain,
  getWalletState,
  REQUIRED_CHAIN_ID,
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

    it('selectIsCorrectChain returns true when on required chain', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: REQUIRED_CHAIN_ID,
      })
      const state = useWalletStore.getState()
      expect(selectIsCorrectChain(state)).toBe(true)
    })

    it('selectIsCorrectChain returns false when on wrong chain', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1, // Mainnet, not required chain
      })
      const state = useWalletStore.getState()
      expect(selectIsCorrectChain(state)).toBe(false)
    })

    it('selectIsCorrectChain returns false when disconnected', () => {
      useWalletStore.getState().disconnect()
      const state = useWalletStore.getState()
      expect(selectIsCorrectChain(state)).toBe(false)
    })

    it('selectIsCorrectChain accepts custom required chain ID', () => {
      useWalletStore.getState().connect({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 137, // Polygon
      })
      const state = useWalletStore.getState()
      expect(selectIsCorrectChain(state, 137)).toBe(true)
      expect(selectIsCorrectChain(state, 1)).toBe(false)
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

  // ============================================================
  // Async Action Tests (connectWallet, switchChain)
  // ============================================================
  describe('async actions', () => {
    // Mock ethereum provider
    const mockProvider = {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    }

    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks()
      // Set up window.ethereum mock
      ;(window as Window & { ethereum?: typeof mockProvider }).ethereum = mockProvider
    })

    afterEach(() => {
      // Clean up
      delete (window as Window & { ethereum?: typeof mockProvider }).ethereum
    })

    describe('connectWallet action', () => {
      it('connects wallet successfully', async () => {
        mockProvider.request
          .mockResolvedValueOnce(['0xABCdef1234567890abcdef1234567890abcdef12']) // eth_requestAccounts
          .mockResolvedValueOnce('0x14a34') // eth_chainId (Base Sepolia = 84532)

        const result = await useWalletStore.getState().connectWallet()

        expect(result).toEqual({
          address: '0xABCdef1234567890abcdef1234567890abcdef12',
          chainId: 84532,
        })

        const state = useWalletStore.getState()
        expect(state.isConnected).toBe(true)
        expect(state.address).toBe('0xABCdef1234567890abcdef1234567890abcdef12')
        expect(state.chainId).toBe(84532)
        expect(state.status).toBe('connected')
      })

      it('returns null and sets error when no provider available', async () => {
        delete (window as Window & { ethereum?: typeof mockProvider }).ethereum

        const result = await useWalletStore.getState().connectWallet()

        expect(result).toBeNull()

        const state = useWalletStore.getState()
        expect(state.isConnected).toBe(false)
        expect(state.error).toEqual({
          code: 'NO_PROVIDER',
          message: 'No Ethereum provider found. Please install MetaMask.',
        })
      })

      it('handles user rejection (code 4001)', async () => {
        mockProvider.request.mockRejectedValueOnce({ code: 4001, message: 'User rejected' })

        const result = await useWalletStore.getState().connectWallet()

        expect(result).toBeNull()

        const state = useWalletStore.getState()
        expect(state.isConnected).toBe(false)
        expect(state.error?.code).toBe('USER_REJECTED')
      })

      it('handles no accounts returned', async () => {
        mockProvider.request.mockResolvedValueOnce([]) // Empty accounts array

        const result = await useWalletStore.getState().connectWallet()

        expect(result).toBeNull()

        const state = useWalletStore.getState()
        expect(state.error?.code).toBe('NO_ACCOUNTS')
      })

      it('sets connecting state during connection', async () => {
        // Create a promise that we can resolve manually
        let resolveAccounts: (value: string[]) => void
        const accountsPromise = new Promise<string[]>((resolve) => {
          resolveAccounts = resolve
        })
        mockProvider.request.mockImplementationOnce(() => accountsPromise)

        // Start connecting
        const connectPromise = useWalletStore.getState().connectWallet()

        // Check connecting state
        expect(useWalletStore.getState().isConnecting).toBe(true)
        expect(useWalletStore.getState().status).toBe('connecting')

        // Resolve and wait
        resolveAccounts!(['0x1234567890abcdef1234567890abcdef12345678'])
        mockProvider.request.mockResolvedValueOnce('0x1') // eth_chainId
        await connectPromise
      })
    })

    describe('switchChain action', () => {
      beforeEach(() => {
        // Set up connected state
        useWalletStore.getState().connect({
          address: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 1,
        })
      })

      it('switches chain successfully', async () => {
        mockProvider.request.mockResolvedValueOnce(null) // wallet_switchEthereumChain

        const result = await useWalletStore.getState().switchChain(84532)

        expect(result).toBe(true)

        const state = useWalletStore.getState()
        expect(state.chainId).toBe(84532)
      })

      it('returns false when no provider available', async () => {
        delete (window as Window & { ethereum?: typeof mockProvider }).ethereum

        const result = await useWalletStore.getState().switchChain(84532)

        expect(result).toBe(false)

        const state = useWalletStore.getState()
        expect(state.error?.code).toBe('NO_PROVIDER')
      })

      it('handles user rejection during switch', async () => {
        mockProvider.request.mockRejectedValueOnce({ code: 4001, message: 'User rejected' })

        const result = await useWalletStore.getState().switchChain(84532)

        expect(result).toBe(false)

        const state = useWalletStore.getState()
        expect(state.error?.code).toBe('USER_REJECTED')
      })

      it('tries to add chain when not found (code 4902)', async () => {
        // First call fails with 4902 (chain not found)
        mockProvider.request
          .mockRejectedValueOnce({ code: 4902, message: 'Chain not found' })
          .mockResolvedValueOnce(null) // wallet_addEthereumChain

        const result = await useWalletStore.getState().switchChain(84532)

        expect(result).toBe(true)

        // Verify wallet_addEthereumChain was called
        expect(mockProvider.request).toHaveBeenCalledWith(
          expect.objectContaining({ method: 'wallet_addEthereumChain' })
        )
      })
    })
  })
})
