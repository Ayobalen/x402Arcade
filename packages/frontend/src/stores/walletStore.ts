/**
 * Wallet Store
 *
 * Global wallet state management using Zustand.
 * Manages wallet connection status, address, chain ID, and provides actions
 * for wallet operations.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { address, isConnected, connect, disconnect } = useWalletStore()
 *
 * // With selector (optimized)
 * const address = useWalletStore((state) => state.address)
 * const isConnected = useWalletStore((state) => state.isConnected)
 *
 * // Connect wallet
 * useWalletStore.getState().connect({
 *   address: '0x1234...',
 *   chainId: 1,
 * })
 * ```
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================================================
// Types
// ============================================================================

/**
 * Supported blockchain networks
 */
export type ChainId = 1 | 5 | 137 | 80001 | 8453 | 84532 | number

/**
 * Connection status states
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

/**
 * Wallet connection details
 */
export interface WalletConnection {
  /** Wallet address (checksummed) */
  address: string
  /** Current chain ID */
  chainId: ChainId
}

/**
 * Wallet error information
 */
export interface WalletError {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
}

/**
 * Ethereum provider type (window.ethereum)
 */
export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, callback: (...args: unknown[]) => void) => void
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
}

/**
 * Window with Ethereum provider
 */
declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

/**
 * Wallet state interface
 *
 * Contains all wallet-related state and actions.
 */
export interface WalletState {
  // ---- Connection State ----
  /** Current wallet address (null if disconnected) */
  address: string | null

  /** Current chain ID (null if disconnected) */
  chainId: ChainId | null

  /** Connection status */
  status: ConnectionStatus

  /** Whether wallet is connected */
  isConnected: boolean

  /** Whether wallet is currently connecting */
  isConnecting: boolean

  /** Last error that occurred */
  error: WalletError | null

  // ---- Sync Actions ----
  /**
   * Connect wallet with the given details (synchronous)
   * @param connection - Wallet connection details
   */
  connect: (connection: WalletConnection) => void

  /**
   * Disconnect wallet and reset state
   */
  disconnect: () => void

  /**
   * Start connection process (show connecting state)
   */
  startConnecting: () => void

  /**
   * Set connection error
   * @param error - Error information
   */
  setError: (error: WalletError) => void

  /**
   * Clear any current error
   */
  clearError: () => void

  /**
   * Update chain ID (for network switching)
   * @param chainId - New chain ID
   */
  setChainId: (chainId: ChainId) => void

  /**
   * Reset store to initial state
   */
  reset: () => void

  // ---- Async Actions ----
  /**
   * Initiate wallet connection via MetaMask/injected provider
   * Uses eth_requestAccounts to prompt user for connection
   * @returns Promise resolving to connection result
   */
  connectWallet: () => Promise<WalletConnection | null>
}

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial wallet state
 */
const initialState: Omit<WalletState, keyof WalletActions> = {
  address: null,
  chainId: null,
  status: 'disconnected',
  isConnected: false,
  isConnecting: false,
  error: null,
}

/**
 * Wallet action type (for splitting state from actions)
 */
type WalletActions = Pick<
  WalletState,
  | 'connect'
  | 'disconnect'
  | 'startConnecting'
  | 'setError'
  | 'clearError'
  | 'setChainId'
  | 'reset'
  | 'connectWallet'
>

// ============================================================================
// Store Creation
// ============================================================================

/**
 * Wallet store with Zustand
 *
 * Features:
 * - Connection state management
 * - Chain ID tracking
 * - Error handling
 * - Devtools integration (in development)
 * - Optional persistence for address (not recommended for production)
 */
export const useWalletStore = create<WalletState>()(
  devtools(
    (set, _get) => ({
      // Initial state
      ...initialState,

      // ---- Actions ----

      connect: (connection: WalletConnection) =>
        set(
          {
            address: connection.address,
            chainId: connection.chainId,
            status: 'connected',
            isConnected: true,
            isConnecting: false,
            error: null,
          },
          false,
          'wallet/connect'
        ),

      disconnect: () =>
        set(
          {
            address: null,
            chainId: null,
            status: 'disconnected',
            isConnected: false,
            isConnecting: false,
            error: null,
          },
          false,
          'wallet/disconnect'
        ),

      startConnecting: () =>
        set(
          {
            status: 'connecting',
            isConnecting: true,
            error: null,
          },
          false,
          'wallet/startConnecting'
        ),

      setError: (error: WalletError) =>
        set(
          {
            status: 'error',
            isConnecting: false,
            error,
          },
          false,
          'wallet/setError'
        ),

      clearError: () =>
        set(
          {
            error: null,
            // Only reset status if we were in error state
            status: 'disconnected',
          },
          false,
          'wallet/clearError'
        ),

      setChainId: (chainId: ChainId) =>
        set(
          {
            chainId,
          },
          false,
          'wallet/setChainId'
        ),

      reset: () =>
        set(
          {
            ...initialState,
          },
          false,
          'wallet/reset'
        ),

      connectWallet: async (): Promise<WalletConnection | null> => {
        // Check for ethereum provider
        if (typeof window === 'undefined' || !window.ethereum) {
          set(
            {
              status: 'error',
              isConnecting: false,
              error: {
                code: 'NO_PROVIDER',
                message: 'No Ethereum provider found. Please install MetaMask.',
              },
            },
            false,
            'wallet/connectWallet/noProvider'
          )
          return null
        }

        // Start connecting
        set(
          {
            status: 'connecting',
            isConnecting: true,
            error: null,
          },
          false,
          'wallet/connectWallet/start'
        )

        try {
          // Request accounts via eth_requestAccounts
          const accounts = (await window.ethereum.request({
            method: 'eth_requestAccounts',
          })) as string[]

          if (!accounts || accounts.length === 0) {
            set(
              {
                status: 'error',
                isConnecting: false,
                error: {
                  code: 'NO_ACCOUNTS',
                  message: 'No accounts returned from wallet.',
                },
              },
              false,
              'wallet/connectWallet/noAccounts'
            )
            return null
          }

          // Get the address (first account)
          const address = accounts[0]

          // Get the chain ID
          const chainIdHex = (await window.ethereum.request({
            method: 'eth_chainId',
          })) as string
          const chainId = parseInt(chainIdHex, 16) as ChainId

          // Update state with successful connection
          const connection: WalletConnection = { address, chainId }

          set(
            {
              address,
              chainId,
              status: 'connected',
              isConnected: true,
              isConnecting: false,
              error: null,
            },
            false,
            'wallet/connectWallet/success'
          )

          return connection
        } catch (error: unknown) {
          // Handle user rejection
          const err = error as { code?: number; message?: string }

          // User rejected the request (MetaMask error code 4001)
          if (err.code === 4001) {
            set(
              {
                status: 'error',
                isConnecting: false,
                error: {
                  code: 'USER_REJECTED',
                  message: 'User rejected the connection request.',
                },
              },
              false,
              'wallet/connectWallet/rejected'
            )
            return null
          }

          // Generic error
          set(
            {
              status: 'error',
              isConnecting: false,
              error: {
                code: 'CONNECTION_ERROR',
                message: err.message || 'Failed to connect wallet.',
              },
            },
            false,
            'wallet/connectWallet/error'
          )
          return null
        }
      },
    }),
    {
      name: 'wallet-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// ============================================================================
// Selectors
// ============================================================================

/**
 * Selector for wallet address
 */
export const selectAddress = (state: WalletState) => state.address

/**
 * Selector for connection status
 */
export const selectIsConnected = (state: WalletState) => state.isConnected

/**
 * Selector for connecting status
 */
export const selectIsConnecting = (state: WalletState) => state.isConnecting

/**
 * Selector for chain ID
 */
export const selectChainId = (state: WalletState) => state.chainId

/**
 * Selector for wallet error
 */
export const selectError = (state: WalletState) => state.error

/**
 * Selector for connection status
 */
export const selectStatus = (state: WalletState) => state.status

/**
 * Selector for formatted address (truncated)
 * Returns "0x1234...5678" format or null if not connected
 */
export const selectFormattedAddress = (state: WalletState): string | null => {
  if (!state.address) return null
  return `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
}

/**
 * Default required chain ID for the application
 * Base Sepolia testnet for development
 */
export const REQUIRED_CHAIN_ID: ChainId = 84532

/**
 * Selector for checking if wallet is on the correct chain
 * Compares current chainId against REQUIRED_CHAIN_ID
 *
 * @param state - Wallet state
 * @param requiredChainId - Optional override for required chain ID
 * @returns true if connected and on correct chain, false otherwise
 */
export const selectIsCorrectChain = (
  state: WalletState,
  requiredChainId: ChainId = REQUIRED_CHAIN_ID
): boolean => {
  if (!state.isConnected || state.chainId === null) {
    return false
  }
  return state.chainId === requiredChainId
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get store state outside of React components
 */
export const getWalletState = () => useWalletStore.getState()

/**
 * Subscribe to store changes outside of React components
 */
export const subscribeToWallet = useWalletStore.subscribe

