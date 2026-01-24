/**
 * Error Store Tests
 *
 * Tests for global error state management.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useErrorStore } from '../errorStore'
import { createAppError } from '../../utils/errors'

describe('Error Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useErrorStore.getState().clearAll()
  })

  describe('Initial State', () => {
    it('should start with empty state', () => {
      const state = useErrorStore.getState()

      expect(state.errors).toEqual([])
      expect(state.currentError).toBeNull()
      expect(state.errorsByCategory).toEqual({})
    })

    it('should have no visible errors initially', () => {
      const { hasVisibleErrors } = useErrorStore.getState()

      expect(hasVisibleErrors()).toBe(false)
    })

    it('should have zero visible error count', () => {
      const { getVisibleErrorCount } = useErrorStore.getState()

      expect(getVisibleErrorCount()).toBe(0)
    })
  })

  describe('showError', () => {
    it('should add error to store', () => {
      const { showError } = useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(1)
      expect(state.errors[0].id).toBe(errorId)
      expect(state.errors[0].code).toBe('WALLET_NOT_CONNECTED')
    })

    it('should set error as current', () => {
      const { showError } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')

      const state = useErrorStore.getState()
      expect(state.currentError).not.toBeNull()
      expect(state.currentError?.code).toBe('WALLET_NOT_CONNECTED')
    })

    it('should set error as visible', () => {
      const { showError } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')

      const state = useErrorStore.getState()
      expect(state.errors[0].visible).toBe(true)
      expect(state.errors[0].dismissed).toBe(false)
    })

    it('should group errors by category', () => {
      const { showError } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      showError('INSUFFICIENT_BALANCE')
      showError('GAME_SESSION_EXPIRED')

      const state = useErrorStore.getState()
      expect(state.errorsByCategory.wallet).toHaveLength(1)
      expect(state.errorsByCategory.payment).toHaveLength(1)
      expect(state.errorsByCategory.game).toHaveLength(1)
    })

    it('should accept overrides', () => {
      const { showError } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED', {
        message: 'Custom message',
        context: { foo: 'bar' },
      })

      const state = useErrorStore.getState()
      expect(state.errors[0].message).toBe('Custom message')
      expect(state.errors[0].context).toEqual({ foo: 'bar' })
    })

    it('should return unique error ID', () => {
      const { showError } = useErrorStore.getState()

      const id1 = showError('WALLET_NOT_CONNECTED')
      const id2 = showError('WALLET_NOT_CONNECTED')

      expect(id1).not.toBe(id2)
    })

    it('should update hasVisibleErrors', () => {
      const { showError, hasVisibleErrors } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')

      expect(hasVisibleErrors()).toBe(true)
    })

    it('should update visible error count', () => {
      const { showError, getVisibleErrorCount } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      showError('INSUFFICIENT_BALANCE')

      expect(getVisibleErrorCount()).toBe(2)
    })
  })

  describe('showUnknownError', () => {
    it('should convert Error to AppError', () => {
      const { showUnknownError } = useErrorStore.getState()

      const jsError = new Error('Something went wrong')
      showUnknownError(jsError)

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(1)
      expect(state.errors[0].code).toBe('UNKNOWN_ERROR')
    })

    it('should use default code', () => {
      const { showUnknownError } = useErrorStore.getState()

      showUnknownError({ foo: 'bar' }, 'NETWORK_ERROR')

      const state = useErrorStore.getState()
      expect(state.errors[0].code).toBe('NETWORK_ERROR')
    })
  })

  describe('showCustomError', () => {
    it('should add custom error', () => {
      const { showCustomError } = useErrorStore.getState()

      const customError = createAppError('WALLET_NOT_CONNECTED')
      const errorId = showCustomError(customError)

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(1)
      expect(state.errors[0].id).toBe(errorId)
    })
  })

  describe('clearError', () => {
    it('should remove error by ID', () => {
      const { showError, clearError } = useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      clearError(errorId)

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(0)
    })

    it('should update category grouping', () => {
      const { showError, clearError } = useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      clearError(errorId)

      const state = useErrorStore.getState()
      expect(state.errorsByCategory.wallet).toBeUndefined()
    })

    it('should update current error', () => {
      const { showError, clearError } = useErrorStore.getState()

      const errorId1 = showError('WALLET_NOT_CONNECTED')
      const errorId2 = showError('INSUFFICIENT_BALANCE')

      clearError(errorId1)

      const state = useErrorStore.getState()
      expect(state.currentError?.id).toBe(errorId2)
    })

    it('should set current error to null if no visible errors remain', () => {
      const { showError, clearError } = useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      clearError(errorId)

      const state = useErrorStore.getState()
      expect(state.currentError).toBeNull()
    })
  })

  describe('clearAll', () => {
    it('should remove all errors', () => {
      const { showError, clearAll } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      showError('INSUFFICIENT_BALANCE')
      showError('GAME_SESSION_EXPIRED')

      clearAll()

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(0)
      expect(state.currentError).toBeNull()
      expect(state.errorsByCategory).toEqual({})
    })
  })

  describe('clearCategory', () => {
    it('should remove errors in category', () => {
      const { showError, clearCategory } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      showError('WALLET_CHAIN_MISMATCH')
      showError('INSUFFICIENT_BALANCE')

      clearCategory('wallet')

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(1)
      expect(state.errors[0].category).toBe('payment')
    })

    it('should update category grouping', () => {
      const { showError, clearCategory } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      clearCategory('wallet')

      const state = useErrorStore.getState()
      expect(state.errorsByCategory.wallet).toBeUndefined()
    })

    it('should update current error if it was in the category', () => {
      const { showError, clearCategory } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      const errorId2 = showError('INSUFFICIENT_BALANCE')

      clearCategory('wallet')

      const state = useErrorStore.getState()
      expect(state.currentError?.id).toBe(errorId2)
    })
  })

  describe('dismissError', () => {
    it('should mark error as dismissed', () => {
      const { showError, dismissError } = useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      dismissError(errorId)

      const state = useErrorStore.getState()
      expect(state.errors[0].dismissed).toBe(true)
      expect(state.errors[0].visible).toBe(false)
    })

    it('should keep error in store', () => {
      const { showError, dismissError } = useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      dismissError(errorId)

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(1)
    })

    it('should update current error to next visible error', () => {
      const { showError, dismissError } = useErrorStore.getState()

      const errorId1 = showError('WALLET_NOT_CONNECTED')
      const errorId2 = showError('INSUFFICIENT_BALANCE')

      dismissError(errorId1)

      const state = useErrorStore.getState()
      expect(state.currentError?.id).toBe(errorId2)
    })

    it('should set current error to null if no visible errors remain', () => {
      const { showError, dismissError } = useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      dismissError(errorId)

      const state = useErrorStore.getState()
      expect(state.currentError).toBeNull()
    })

    it('should update visible error count', () => {
      const { showError, dismissError, getVisibleErrorCount } =
        useErrorStore.getState()

      const errorId1 = showError('WALLET_NOT_CONNECTED')
      showError('INSUFFICIENT_BALANCE')

      dismissError(errorId1)

      expect(getVisibleErrorCount()).toBe(1)
    })
  })

  describe('getErrorsByCategory', () => {
    it('should return errors in category', () => {
      const { showError, getErrorsByCategory } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      showError('WALLET_CHAIN_MISMATCH')
      showError('INSUFFICIENT_BALANCE')

      const walletErrors = getErrorsByCategory('wallet')

      expect(walletErrors).toHaveLength(2)
      expect(walletErrors.every((e) => e.category === 'wallet')).toBe(true)
    })

    it('should return only visible errors by default', () => {
      const { showError, dismissError, getErrorsByCategory } =
        useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      showError('WALLET_CHAIN_MISMATCH')

      dismissError(errorId)

      const walletErrors = getErrorsByCategory('wallet')
      expect(walletErrors).toHaveLength(1)
    })

    it('should return all errors when visibleOnly=false', () => {
      const { showError, dismissError, getErrorsByCategory } =
        useErrorStore.getState()

      const errorId = showError('WALLET_NOT_CONNECTED')
      showError('WALLET_CHAIN_MISMATCH')

      dismissError(errorId)

      const walletErrors = getErrorsByCategory('wallet', false)
      expect(walletErrors).toHaveLength(2)
    })

    it('should return empty array for category with no errors', () => {
      const { getErrorsByCategory } = useErrorStore.getState()

      const gameErrors = getErrorsByCategory('game')
      expect(gameErrors).toEqual([])
    })
  })

  describe('getMostRecentError', () => {
    it('should return most recently added error', () => {
      const { showError, getMostRecentError } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      const errorId2 = showError('INSUFFICIENT_BALANCE')

      const recent = getMostRecentError()
      expect(recent?.id).toBe(errorId2)
    })

    it('should return null when no errors', () => {
      const { getMostRecentError } = useErrorStore.getState()

      const recent = getMostRecentError()
      expect(recent).toBeNull()
    })
  })

  describe('Multiple Errors', () => {
    it('should handle multiple errors of same type', () => {
      const { showError } = useErrorStore.getState()

      const id1 = showError('NETWORK_TIMEOUT')
      const id2 = showError('NETWORK_TIMEOUT')
      const id3 = showError('NETWORK_TIMEOUT')

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(3)
      expect(state.errors.map((e) => e.id)).toEqual([id1, id2, id3])
    })

    it('should handle errors from different categories', () => {
      const { showError } = useErrorStore.getState()

      showError('WALLET_NOT_CONNECTED')
      showError('INSUFFICIENT_BALANCE')
      showError('GAME_SESSION_EXPIRED')
      showError('NETWORK_TIMEOUT')

      const state = useErrorStore.getState()
      expect(state.errors).toHaveLength(4)
      expect(Object.keys(state.errorsByCategory)).toHaveLength(4)
    })
  })
})
