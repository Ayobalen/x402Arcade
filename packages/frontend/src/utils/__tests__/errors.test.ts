/**
 * Error Utilities Tests
 *
 * Tests for error creation, categorization, and recovery suggestions.
 */

import { describe, it, expect } from 'vitest'
import {
  createAppError,
  fromUnknownError,
  isAppError,
  getRecoverySuggestions,
  getUserMessage,
  formatErrorMessage,
  getPrimaryRecovery,
  getSeverityClass,
  getCategoryIcon,
} from '../errors'
import type { AppError, AppErrorCode } from '../../types/errors'

describe('Error Utilities', () => {
  describe('createAppError', () => {
    it('should create error with correct category', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      expect(error.category).toBe('wallet')
      expect(error.code).toBe('WALLET_NOT_CONNECTED')
    })

    it('should create payment error', () => {
      const error = createAppError('INSUFFICIENT_BALANCE')
      expect(error.category).toBe('payment')
      expect(error.code).toBe('INSUFFICIENT_BALANCE')
    })

    it('should create game error', () => {
      const error = createAppError('GAME_SESSION_EXPIRED')
      expect(error.category).toBe('game')
      expect(error.code).toBe('GAME_SESSION_EXPIRED')
    })

    it('should create network error', () => {
      const error = createAppError('NETWORK_TIMEOUT')
      expect(error.category).toBe('network')
      expect(error.code).toBe('NETWORK_TIMEOUT')
    })

    it('should include user message', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      expect(error.message).toBe('Please connect your wallet to continue')
    })

    it('should include recovery suggestions', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      expect(error.recoverySuggestions).toHaveLength(1)
      expect(error.recoverySuggestions[0].action).toBe('RECONNECT_WALLET')
    })

    it('should set correct severity', () => {
      const critical = createAppError('WALLET_NOT_FOUND')
      expect(critical.severity).toBe('critical')

      const error = createAppError('INSUFFICIENT_BALANCE')
      expect(error.severity).toBe('error')

      const warning = createAppError('WALLET_CHAIN_MISMATCH')
      expect(warning.severity).toBe('warning')
    })

    it('should set retryable flag correctly', () => {
      const retryable = createAppError('NETWORK_TIMEOUT')
      expect(retryable.retryable).toBe(true)

      const nonRetryable = createAppError('WALLET_NOT_FOUND')
      expect(nonRetryable.retryable).toBe(false)
    })

    it('should include timestamp', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should allow overrides', () => {
      const error = createAppError('WALLET_NOT_CONNECTED', {
        message: 'Custom message',
        context: { foo: 'bar' },
      })

      expect(error.message).toBe('Custom message')
      expect(error.context).toEqual({ foo: 'bar' })
    })
  })

  describe('fromUnknownError', () => {
    it('should return existing AppError as-is', () => {
      const original = createAppError('WALLET_NOT_CONNECTED')
      const converted = fromUnknownError(original)

      expect(converted).toEqual(original)
    })

    it('should convert Error with code property', () => {
      const jsError = new Error('Insufficient balance')
      ;(jsError as Error & { code?: string }).code = 'INSUFFICIENT_BALANCE'

      const error = fromUnknownError(jsError)
      expect(error.code).toBe('INSUFFICIENT_BALANCE')
      expect(error.category).toBe('payment')
    })

    it('should detect user rejection from message', () => {
      const jsError = new Error('User rejected the request')
      const error = fromUnknownError(jsError)

      expect(error.code).toBe('WALLET_SIGNATURE_REJECTED')
    })

    it('should detect network errors from message', () => {
      const jsError = new Error('Network request failed')
      const error = fromUnknownError(jsError)

      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.category).toBe('network')
    })

    it('should detect timeout errors from message', () => {
      const jsError = new Error('Request timeout')
      const error = fromUnknownError(jsError)

      expect(error.code).toBe('NETWORK_TIMEOUT')
    })

    it('should detect insufficient balance from message', () => {
      const jsError = new Error('Insufficient funds')
      const error = fromUnknownError(jsError)

      expect(error.code).toBe('INSUFFICIENT_BALANCE')
    })

    it('should convert string error', () => {
      const error = fromUnknownError('Something went wrong')

      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.message).toBe('Something went wrong')
    })

    it('should convert object with message/code', () => {
      const obj = {
        code: 'PAYMENT_EXPIRED',
        message: 'Authorization expired',
      }

      const error = fromUnknownError(obj)
      expect(error.code).toBe('PAYMENT_EXPIRED')
    })

    it('should use default code for unknown errors', () => {
      const error = fromUnknownError({ foo: 'bar' }, 'NETWORK_ERROR')

      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.category).toBe('network')
    })

    it('should preserve original error for debugging', () => {
      const jsError = new Error('Test error')
      const error = fromUnknownError(jsError)

      expect(error.originalError).toBe(jsError)
    })
  })

  describe('isAppError', () => {
    it('should return true for AppError', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      expect(isAppError(error)).toBe(true)
    })

    it('should return false for Error', () => {
      const error = new Error('Test')
      expect(isAppError(error)).toBe(false)
    })

    it('should return false for string', () => {
      expect(isAppError('error')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isAppError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isAppError(undefined)).toBe(false)
    })
  })

  describe('getRecoverySuggestions', () => {
    it('should return suggestions for wallet errors', () => {
      const suggestions = getRecoverySuggestions('WALLET_NOT_CONNECTED')

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].action).toBe('RECONNECT_WALLET')
      expect(suggestions[0].primary).toBe(true)
    })

    it('should return suggestions for payment errors', () => {
      const suggestions = getRecoverySuggestions('INSUFFICIENT_BALANCE')

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].action).toBe('ADD_FUNDS')
    })

    it('should return multiple suggestions', () => {
      const suggestions = getRecoverySuggestions('WALLET_SIGNATURE_REJECTED')

      expect(suggestions.length).toBeGreaterThanOrEqual(2)
      expect(suggestions.some((s) => s.action === 'RETRY')).toBe(true)
      expect(suggestions.some((s) => s.action === 'DISMISS')).toBe(true)
    })

    it('should mark primary suggestion', () => {
      const suggestions = getRecoverySuggestions('WALLET_CHAIN_MISMATCH')

      const primary = suggestions.find((s) => s.primary)
      expect(primary).toBeDefined()
      expect(primary!.action).toBe('SWITCH_NETWORK')
    })

    it('should include helpful descriptions', () => {
      const suggestions = getRecoverySuggestions('NETWORK_TIMEOUT')

      expect(suggestions[0].description).toContain('Retry')
    })

    it('should include href for external actions', () => {
      const suggestions = getRecoverySuggestions('WALLET_NOT_FOUND')

      const primary = suggestions.find((s) => s.primary)
      expect(primary?.href).toBeDefined()
      expect(primary?.href).toContain('metamask.io')
    })

    it('should return default suggestions for unmapped errors', () => {
      const suggestions = getRecoverySuggestions('UNKNOWN_ERROR' as AppErrorCode)

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].action).toBe('REFRESH_PAGE')
    })
  })

  describe('getUserMessage', () => {
    it('should return user-friendly message', () => {
      const message = getUserMessage('WALLET_NOT_CONNECTED')
      expect(message).toBe('Please connect your wallet to continue')
    })

    it('should return message for payment errors', () => {
      const message = getUserMessage('INSUFFICIENT_BALANCE')
      expect(message).toContain('USDC')
      expect(message).toContain('balance')
    })

    it('should return message for game errors', () => {
      const message = getUserMessage('GAME_SESSION_EXPIRED')
      expect(message).toContain('session')
      expect(message).toContain('expired')
    })

    it('should return default message for unknown codes', () => {
      const message = getUserMessage('UNKNOWN_CODE' as AppErrorCode)
      expect(message).toBe('An error occurred')
    })
  })

  describe('formatErrorMessage', () => {
    it('should format without code by default', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      const formatted = formatErrorMessage(error)

      expect(formatted).toBe(error.message)
      expect(formatted).not.toContain('WALLET_NOT_CONNECTED')
    })

    it('should include code when requested', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      const formatted = formatErrorMessage(error, true)

      expect(formatted).toContain(error.message)
      expect(formatted).toContain('WALLET_NOT_CONNECTED')
    })
  })

  describe('getPrimaryRecovery', () => {
    it('should return primary recovery suggestion', () => {
      const error = createAppError('WALLET_NOT_CONNECTED')
      const primary = getPrimaryRecovery(error)

      expect(primary).toBeDefined()
      expect(primary?.primary).toBe(true)
    })

    it('should return first suggestion if no primary marked', () => {
      const error = createAppError('UNKNOWN_ERROR')
      const primary = getPrimaryRecovery(error)

      expect(primary).toBeDefined()
      expect(primary).toBe(error.recoverySuggestions[0])
    })

    it('should return null for error with no suggestions', () => {
      const error: AppError = {
        category: 'system',
        code: 'UNKNOWN_ERROR',
        message: 'Test',
        severity: 'error',
        retryable: false,
        recoverySuggestions: [],
        timestamp: new Date(),
      }

      const primary = getPrimaryRecovery(error)
      expect(primary).toBeNull()
    })
  })

  describe('getSeverityClass', () => {
    it('should return class for info severity', () => {
      const className = getSeverityClass('info')
      expect(className).toContain('blue')
    })

    it('should return class for warning severity', () => {
      const className = getSeverityClass('warning')
      expect(className).toContain('yellow')
    })

    it('should return class for error severity', () => {
      const className = getSeverityClass('error')
      expect(className).toContain('red')
    })

    it('should return class for critical severity', () => {
      const className = getSeverityClass('critical')
      expect(className).toContain('red')
    })
  })

  describe('getCategoryIcon', () => {
    it('should return icon for wallet category', () => {
      const icon = getCategoryIcon('wallet')
      expect(icon).toBe('Wallet')
    })

    it('should return icon for payment category', () => {
      const icon = getCategoryIcon('payment')
      expect(icon).toBe('CreditCard')
    })

    it('should return icon for game category', () => {
      const icon = getCategoryIcon('game')
      expect(icon).toBe('Gamepad2')
    })

    it('should return icon for network category', () => {
      const icon = getCategoryIcon('network')
      expect(icon).toBe('Wifi')
    })

    it('should return icon for system category', () => {
      const icon = getCategoryIcon('system')
      expect(icon).toBe('AlertCircle')
    })
  })

  describe('Error Code Mapping', () => {
    it('should map HTTP 402 to PAYMENT_REQUIRED', () => {
      const obj = { code: 402, message: 'Payment required' }
      const error = fromUnknownError(obj)

      expect(error.code).toBe('PAYMENT_REQUIRED')
    })

    it('should map HTTP 429 to RATE_LIMITED', () => {
      const obj = { code: 429, message: 'Too many requests' }
      const error = fromUnknownError(obj)

      expect(error.code).toBe('RATE_LIMITED')
    })

    it('should map HTTP 503 to API_UNAVAILABLE', () => {
      const obj = { code: 503, message: 'Service unavailable' }
      const error = fromUnknownError(obj)

      expect(error.code).toBe('API_UNAVAILABLE')
    })

    it('should map wallet error code 4001 to WALLET_SIGNATURE_REJECTED', () => {
      const obj = { code: 4001, message: 'User rejected' }
      const error = fromUnknownError(obj)

      expect(error.code).toBe('WALLET_SIGNATURE_REJECTED')
    })

    it('should map ECONNREFUSED to NETWORK_ERROR', () => {
      const obj = { code: 'ECONNREFUSED', message: 'Connection refused' }
      const error = fromUnknownError(obj)

      expect(error.code).toBe('NETWORK_ERROR')
    })
  })
})
