/**
 * Wallet Hook
 *
 * React hook for wallet connection and client management.
 * Provides wallet client for signing operations in the x402 payment flow.
 *
 * NOTE: This hook requires wagmi to be installed and configured.
 * Currently provides a placeholder implementation.
 *
 * @module hooks/useWallet
 * @see https://wagmi.sh/react/hooks/useWalletClient
 */

import { useCallback, useMemo } from 'react'
import { CRONOS_TESTNET_CHAIN_ID } from '../config/chain'

// ============================================================================
// Types
// ============================================================================

/**
 * Wallet connection status
 */
export type WalletStatus =
  | 'disconnected'    // No wallet connected
  | 'connecting'      // Connection in progress
  | 'connected'       // Wallet connected and ready
  | 'wrong_chain'     // Connected but on wrong network

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
 * Wallet client interface (matches wagmi's WalletClient)
 *
 * This interface describes the wallet client used for signing.
 * Will be fully typed when wagmi is installed.
 */
export interface WalletClient {
  /** The connected account address */
  account: {
    address: `0x${string}`
  }
  /** Chain information */
  chain: {
    id: number
    name: string
  }
  /**
   * Sign typed data using EIP-712
   * @param params - Typed data parameters
   * @returns Signature hex string
   */
  signTypedData: (params: {
    domain: Record<string, unknown>
    types: Record<string, unknown[]>
    primaryType: string
    message: Record<string, unknown>
  }) => Promise<`0x${string}`>
}

/**
 * Hook state
 */
export interface UseWalletState {
  /** Current connection status */
  status: WalletStatus
  /** Connected wallet address (if connected) */
  address: `0x${string}` | undefined
  /** Current chain ID (if connected) */
  chainId: number | undefined
  /** Error information */
  error: WalletError | null
  /** Whether wallet is connected and on correct chain */
  isReady: boolean
  /** Whether wallet is connected (any chain) */
  isConnected: boolean
  /** Whether wallet is on the expected chain */
  isCorrectChain: boolean
}

/**
 * Typed data parameters for signing
 */
export interface SignTypedDataParams {
  /** EIP-712 domain */
  domain: {
    name: string
    version: string
    chainId: number | bigint
    verifyingContract: `0x${string}`
  }
  /** Type definitions */
  types: Record<string, Array<{ name: string; type: string }>>
  /** Primary type name */
  primaryType: string
  /** Message to sign */
  message: Record<string, unknown>
}

/**
 * Hook actions
 */
export interface UseWalletActions {
  /**
   * Get the wallet client for signing operations
   * @throws Error if wallet not connected or on wrong chain
   */
  getWalletClient: () => Promise<WalletClient>
  /**
   * Sign typed data using EIP-712
   *
   * Calls the wallet's signTypedData method with the provided parameters.
   * Handles user rejection with a specific error.
   *
   * @param params - Typed data parameters (domain, types, primaryType, message)
   * @returns Signature hex string
   * @throws Error if wallet not ready or user rejects
   */
  signTypedData: (params: SignTypedDataParams) => Promise<`0x${string}`>
  /**
   * Request wallet connection
   * @returns Promise resolving when connected
   */
  connect: () => Promise<void>
  /**
   * Disconnect the wallet
   */
  disconnect: () => void
  /**
   * Switch to the expected chain
   * @returns Promise resolving when switched
   */
  switchChain: () => Promise<void>
}

/**
 * Hook options
 */
export interface UseWalletOptions {
  /** Expected chain ID (default: CRONOS_TESTNET_CHAIN_ID) */
  expectedChainId?: number
  /** Callback when connection succeeds */
  onConnect?: (address: `0x${string}`) => void
  /** Callback when disconnected */
  onDisconnect?: () => void
  /** Callback when error occurs */
  onError?: (error: WalletError) => void
}

/**
 * Hook return value
 */
export interface UseWalletResult extends UseWalletState, UseWalletActions {}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useWallet - React hook for wallet connection management
 *
 * Provides wallet connection status and client for signing operations.
 * Verifies the connected chain matches the expected chain.
 *
 * @param options - Hook configuration options
 * @returns Hook state and actions
 *
 * @example
 * ```tsx
 * function WalletButton() {
 *   const { status, address, connect, disconnect, isReady } = useWallet({
 *     onConnect: (addr) => console.log('Connected:', addr),
 *   })
 *
 *   if (!isReady) {
 *     return <button onClick={connect}>Connect Wallet</button>
 *   }
 *
 *   return (
 *     <div>
 *       <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
 *       <button onClick={disconnect}>Disconnect</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWallet(options: UseWalletOptions = {}): UseWalletResult {
  const {
    expectedChainId = CRONOS_TESTNET_CHAIN_ID,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onConnect: _onConnect,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDisconnect: _onDisconnect,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError: _onError,
  } = options

  // TODO: Replace with actual wagmi hooks when installed
  // const { data: walletClient } = useWalletClient()
  // const { address, isConnected, chain } = useAccount()
  // const { connect: wagmiConnect } = useConnect()
  // const { disconnect: wagmiDisconnect } = useDisconnect()
  // const { switchChain: wagmiSwitchChain } = useSwitchChain()

  // Placeholder state (always disconnected until wagmi is installed)
  // Note: These will be replaced with actual wagmi hook values
  const status: WalletStatus = 'disconnected' as WalletStatus
  const address: `0x${string}` | undefined = undefined
  const chainId: number | undefined = undefined
  const error: WalletError | null = null

  // Derived state
  // Using as-cast to allow for future wagmi integration where status can change
  const isConnected = (status as WalletStatus) === 'connected' || (status as WalletStatus) === 'wrong_chain'
  const isCorrectChain = chainId === expectedChainId
  const isReady = isConnected && isCorrectChain

  /**
   * Get wallet client for signing
   */
  const getWalletClient = useCallback(async (): Promise<WalletClient> => {
    // TODO: Implement with wagmi's useWalletClient
    if (!isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }

    if (!isCorrectChain) {
      throw new Error(
        `Wrong network. Please switch to Cronos Testnet (chain ID: ${expectedChainId}).`
      )
    }

    // Placeholder - will return actual wagmi wallet client
    throw new Error(
      'Wallet client not available. Please install and configure wagmi.'
    )
  }, [isConnected, isCorrectChain, expectedChainId])

  /**
   * Sign typed data using EIP-712
   *
   * Calls the wallet's signTypedData method with domain, types, primaryType, and message.
   * Handles user rejection with a specific error message.
   */
  const signTypedData = useCallback(
    async (params: SignTypedDataParams): Promise<`0x${string}`> => {
      // Verify wallet is ready
      if (!isConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.')
      }

      if (!isCorrectChain) {
        throw new Error(
          `Wrong network. Please switch to Cronos Testnet (chain ID: ${expectedChainId}).`
        )
      }

      try {
        // Get wallet client
        const client = await getWalletClient()

        // Call signTypedData on the wallet client
        // This will prompt the user to sign in their wallet
        const signature = await client.signTypedData({
          domain: params.domain,
          types: params.types,
          primaryType: params.primaryType,
          message: params.message,
        })

        return signature
      } catch (error) {
        // Handle user rejection
        if (
          error instanceof Error &&
          (error.message.includes('rejected') ||
            error.message.includes('denied') ||
            error.message.includes('cancelled') ||
            error.message.includes('User rejected'))
        ) {
          throw new Error('User rejected the signature request.')
        }

        // Re-throw other errors
        throw error
      }
    },
    [isConnected, isCorrectChain, expectedChainId, getWalletClient]
  )

  /**
   * Connect wallet
   */
  const connect = useCallback(async (): Promise<void> => {
    // TODO: Implement with wagmi's useConnect
    throw new Error(
      'Wallet connection not available. Please install and configure wagmi.'
    )
  }, [])

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback((): void => {
    // TODO: Implement with wagmi's useDisconnect
    console.warn('Wallet disconnect not available. Please install wagmi.')
  }, [])

  /**
   * Switch to expected chain
   */
  const switchChain = useCallback(async (): Promise<void> => {
    // TODO: Implement with wagmi's useSwitchChain
    throw new Error(
      'Chain switching not available. Please install and configure wagmi.'
    )
  }, [])

  // Memoize the return value
  return useMemo(
    () => ({
      // State
      status,
      address,
      chainId,
      error,
      isReady,
      isConnected,
      isCorrectChain,
      // Actions
      getWalletClient,
      signTypedData,
      connect,
      disconnect,
      switchChain,
    }),
    [
      status,
      address,
      chainId,
      error,
      isReady,
      isConnected,
      isCorrectChain,
      getWalletClient,
      signTypedData,
      connect,
      disconnect,
      switchChain,
    ]
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format an address for display
 *
 * @param address - Full wallet address
 * @param prefixLength - Characters to show at start (default: 6)
 * @param suffixLength - Characters to show at end (default: 4)
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (address.length <= prefixLength + suffixLength) {
    return address
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`
}

/**
 * Validate an Ethereum address format
 *
 * @param address - Address to validate
 * @returns true if valid format
 */
export function isValidAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
