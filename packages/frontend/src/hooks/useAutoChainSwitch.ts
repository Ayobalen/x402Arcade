/**
 * Auto Chain Switch Hook
 *
 * React hook that automatically prompts users to switch chains when connected
 * to the wrong network. Monitors wallet connection state and triggers
 * chain switch when needed.
 *
 * @module hooks/useAutoChainSwitch
 */

import { useEffect, useCallback, useState, useRef } from 'react'
import {
  useWalletStore,
  REQUIRED_CHAIN_ID,
  type ChainId,
  type WalletError,
} from '@/stores/walletStore'

// ============================================================================
// Types
// ============================================================================

/**
 * Chain switch result status
 */
export type ChainSwitchStatus =
  | 'idle' // No switch needed or not yet attempted
  | 'switching' // Currently switching chains
  | 'success' // Successfully switched to correct chain
  | 'rejected' // User rejected the switch
  | 'error' // Switch failed for other reasons

/**
 * Hook options
 */
export interface UseAutoChainSwitchOptions {
  /**
   * Enable automatic chain switching on connection
   * @default true
   */
  autoSwitch?: boolean

  /**
   * Target chain ID to switch to
   * @default REQUIRED_CHAIN_ID
   */
  targetChainId?: ChainId

  /**
   * Delay before prompting for chain switch (ms)
   * Allows the connection animation to complete
   * @default 500
   */
  switchDelay?: number

  /**
   * Callback when chain switch is initiated
   */
  onSwitchStart?: () => void

  /**
   * Callback when chain switch succeeds
   */
  onSwitchSuccess?: (chainId: ChainId) => void

  /**
   * Callback when user rejects chain switch
   */
  onSwitchRejected?: () => void

  /**
   * Callback when chain switch fails
   */
  onSwitchError?: (error: WalletError) => void
}

/**
 * Hook return value
 */
export interface UseAutoChainSwitchResult {
  /**
   * Current chain switch status
   */
  status: ChainSwitchStatus

  /**
   * Whether the wallet is on the correct chain
   */
  isCorrectChain: boolean

  /**
   * Whether a chain switch is currently in progress
   */
  isSwitching: boolean

  /**
   * Last error that occurred during switch
   */
  error: WalletError | null

  /**
   * Manually trigger chain switch
   * @returns Promise<boolean> indicating success
   */
  switchChain: () => Promise<boolean>

  /**
   * Reset the hook state (clear errors, reset status)
   */
  reset: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useAutoChainSwitch - Automatic chain switching hook
 *
 * Monitors wallet connection state and automatically prompts users to switch
 * to the correct chain when connected to the wrong network.
 *
 * @param options - Hook configuration options
 * @returns Hook state and actions
 *
 * @example
 * ```tsx
 * function WalletManager() {
 *   const { status, isCorrectChain, switchChain } = useAutoChainSwitch({
 *     autoSwitch: true,
 *     onSwitchSuccess: () => console.log('Switched to correct chain!'),
 *   })
 *
 *   return (
 *     <div>
 *       {status === 'switching' && <span>Switching networks...</span>}
 *       {!isCorrectChain && (
 *         <button onClick={switchChain}>Switch Network</button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAutoChainSwitch(
  options: UseAutoChainSwitchOptions = {}
): UseAutoChainSwitchResult {
  const {
    autoSwitch = true,
    targetChainId = REQUIRED_CHAIN_ID,
    switchDelay = 500,
    onSwitchStart,
    onSwitchSuccess,
    onSwitchRejected,
    onSwitchError,
  } = options

  // Local state
  const [status, setStatus] = useState<ChainSwitchStatus>('idle')
  const [error, setError] = useState<WalletError | null>(null)

  // Track if we've already attempted auto-switch for this connection
  const hasAttemptedSwitch = useRef(false)
  const prevChainId = useRef<ChainId | null>(null)

  // Get wallet state from store
  const isConnected = useWalletStore((state) => state.isConnected)
  const chainId = useWalletStore((state) => state.chainId)
  const storeSwitchChain = useWalletStore((state) => state.switchChain)
  const storeError = useWalletStore((state) => state.error)

  // Derived state
  const isCorrectChain = chainId === targetChainId
  const isSwitching = status === 'switching'

  /**
   * Manually trigger chain switch
   */
  const switchChain = useCallback(async (): Promise<boolean> => {
    if (isSwitching) {
      return false
    }

    setStatus('switching')
    setError(null)
    onSwitchStart?.()

    try {
      const success = await storeSwitchChain(targetChainId)

      if (success) {
        setStatus('success')
        onSwitchSuccess?.(targetChainId)
        return true
      } else {
        // Check the store error for more details
        const currentError = useWalletStore.getState().error

        if (currentError?.code === 'USER_REJECTED') {
          setStatus('rejected')
          setError(currentError)
          onSwitchRejected?.()
        } else {
          setStatus('error')
          setError(
            currentError || {
              code: 'SWITCH_FAILED',
              message: 'Failed to switch network.',
            }
          )
          onSwitchError?.(
            currentError || {
              code: 'SWITCH_FAILED',
              message: 'Failed to switch network.',
            }
          )
        }

        return false
      }
    } catch (err) {
      const walletError: WalletError = {
        code: 'SWITCH_ERROR',
        message: err instanceof Error ? err.message : 'Failed to switch network.',
      }

      setStatus('error')
      setError(walletError)
      onSwitchError?.(walletError)

      return false
    }
  }, [
    isSwitching,
    storeSwitchChain,
    targetChainId,
    onSwitchStart,
    onSwitchSuccess,
    onSwitchRejected,
    onSwitchError,
  ])

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    hasAttemptedSwitch.current = false
  }, [])

  // Auto-switch effect
  useEffect(() => {
    // Only proceed if auto-switch is enabled
    if (!autoSwitch) {
      return
    }

    // Only proceed if connected and on wrong chain
    if (!isConnected || isCorrectChain) {
      // Reset attempt flag when disconnected or on correct chain
      if (!isConnected || isCorrectChain) {
        hasAttemptedSwitch.current = false
      }
      return
    }

    // Don't auto-switch if we've already attempted for this connection
    if (hasAttemptedSwitch.current && prevChainId.current === chainId) {
      return
    }

    // Don't auto-switch if currently switching
    if (isSwitching) {
      return
    }

    // Mark that we've attempted switch for this chain
    hasAttemptedSwitch.current = true
    prevChainId.current = chainId

    // Delay the switch to allow connection animation to complete
    const timeoutId = setTimeout(() => {
      switchChain()
    }, switchDelay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [
    autoSwitch,
    isConnected,
    isCorrectChain,
    chainId,
    isSwitching,
    switchDelay,
    switchChain,
  ])

  // Sync store error to local error state
  useEffect(() => {
    if (storeError && status === 'switching') {
      setError(storeError)
    }
  }, [storeError, status])

  // Reset status to idle when chain changes to correct chain
  useEffect(() => {
    if (isCorrectChain && status !== 'idle') {
      setStatus('success')
      // Reset to idle after a brief moment
      const timeoutId = setTimeout(() => {
        setStatus('idle')
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [isCorrectChain, status])

  return {
    status,
    isCorrectChain,
    isSwitching,
    error,
    switchChain,
    reset,
  }
}

export default useAutoChainSwitch
