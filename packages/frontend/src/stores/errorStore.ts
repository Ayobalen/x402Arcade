/**
 * Error Store
 *
 * Global error state management using Zustand.
 * Manages application-wide errors with categorization, recovery suggestions,
 * and display state.
 *
 * @example
 * ```typescript
 * // Display an error
 * const { showError } = useErrorStore()
 * showError('WALLET_NOT_CONNECTED')
 *
 * // With context
 * showError('INSUFFICIENT_BALANCE', {
 *   context: { balance: '0.00', required: '0.01' }
 * })
 *
 * // Clear errors
 * const { clearError, clearAll } = useErrorStore()
 * clearError('error-id')
 * clearAll()
 * ```
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppError, AppErrorCode, ErrorCategory } from '../types/errors'
import { createAppError, fromUnknownError } from '../utils/errors'

// ============================================================================
// Types
// ============================================================================

/**
 * Error entry with ID and display state
 */
export interface ErrorEntry extends AppError {
  /** Unique identifier for this error instance */
  id: string
  /** Whether this error is currently displayed */
  visible: boolean
  /** Whether this error has been dismissed by user */
  dismissed: boolean
}

/**
 * Error store state interface
 */
export interface ErrorState {
  // ---- Error State ----
  /** All errors (current and historical) */
  errors: ErrorEntry[]

  /** Currently visible error (null if none) */
  currentError: ErrorEntry | null

  /** Errors grouped by category */
  errorsByCategory: Partial<Record<ErrorCategory, ErrorEntry[]>>

  // ---- Actions ----
  /**
   * Show an error using error code
   * @param code - The error code
   * @param overrides - Optional overrides for error details
   * @returns The error ID
   */
  showError: (code: AppErrorCode, overrides?: Partial<AppError>) => string

  /**
   * Show an error from an unknown error object
   * @param error - The error to show
   * @param defaultCode - Fallback error code
   * @returns The error ID
   */
  showUnknownError: (
    error: unknown,
    defaultCode?: AppErrorCode
  ) => string

  /**
   * Show a custom error
   * @param error - Complete error object
   * @returns The error ID
   */
  showCustomError: (error: AppError) => string

  /**
   * Clear a specific error
   * @param errorId - The ID of the error to clear
   */
  clearError: (errorId: string) => void

  /**
   * Clear all errors
   */
  clearAll: () => void

  /**
   * Clear all errors in a category
   * @param category - The category to clear
   */
  clearCategory: (category: ErrorCategory) => void

  /**
   * Dismiss an error (mark as dismissed but keep in history)
   * @param errorId - The ID of the error to dismiss
   */
  dismissError: (errorId: string) => void

  /**
   * Get errors by category
   * @param category - The category to filter by
   * @param visibleOnly - Only return visible errors (default: true)
   * @returns Array of errors in the category
   */
  getErrorsByCategory: (
    category: ErrorCategory,
    visibleOnly?: boolean
  ) => ErrorEntry[]

  /**
   * Get the most recent error
   * @returns Most recent error or null
   */
  getMostRecentError: () => ErrorEntry | null

  /**
   * Check if any errors are currently visible
   * @returns True if there are visible errors
   */
  hasVisibleErrors: () => boolean

  /**
   * Get count of visible errors
   * @returns Number of visible errors
   */
  getVisibleErrorCount: () => number
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Error store
 *
 * Manages global error state throughout the application.
 */
export const useErrorStore = create<ErrorState>()(
  devtools(
    (set, get) => ({
      // ---- Initial State ----
      errors: [],
      currentError: null,
      errorsByCategory: {},

      // ---- Actions ----
      showError: (code, overrides) => {
        const error = createAppError(code, overrides)
        return get().showCustomError(error)
      },

      showUnknownError: (error, defaultCode = 'UNKNOWN_ERROR') => {
        const appError = fromUnknownError(error, defaultCode)
        return get().showCustomError(appError)
      },

      showCustomError: (error) => {
        const id = generateErrorId()
        const entry: ErrorEntry = {
          ...error,
          id,
          visible: true,
          dismissed: false,
        }

        set((state) => {
          // Add to errors array
          const errors = [...state.errors, entry]

          // Update category grouping
          const category = error.category
          const categoryErrors = state.errorsByCategory[category] || []
          const errorsByCategory = {
            ...state.errorsByCategory,
            [category]: [...categoryErrors, entry],
          }

          // Set as current error
          const currentError = entry

          return {
            errors,
            errorsByCategory,
            currentError,
          }
        })

        return id
      },

      clearError: (errorId) => {
        set((state) => {
          // Remove from errors array
          const errors = state.errors.filter((e) => e.id !== errorId)

          // Update category grouping
          const errorsByCategory: Partial<Record<ErrorCategory, ErrorEntry[]>> = {}
          errors.forEach((error) => {
            const category = error.category
            if (!errorsByCategory[category]) {
              errorsByCategory[category] = []
            }
            errorsByCategory[category]!.push(error)
          })

          // Update current error
          const currentError =
            state.currentError?.id === errorId
              ? errors.find((e) => e.visible) || null
              : state.currentError

          return {
            errors,
            errorsByCategory,
            currentError,
          }
        })
      },

      clearAll: () => {
        set({
          errors: [],
          currentError: null,
          errorsByCategory: {},
        })
      },

      clearCategory: (category) => {
        set((state) => {
          // Remove errors in this category
          const errors = state.errors.filter((e) => e.category !== category)

          // Update category grouping
          const errorsByCategory = { ...state.errorsByCategory }
          delete errorsByCategory[category]

          // Update current error
          const currentError =
            state.currentError?.category === category
              ? errors.find((e) => e.visible) || null
              : state.currentError

          return {
            errors,
            errorsByCategory,
            currentError,
          }
        })
      },

      dismissError: (errorId) => {
        set((state) => {
          const errors = state.errors.map((e) =>
            e.id === errorId
              ? { ...e, visible: false, dismissed: true }
              : e
          )

          // Update category grouping
          const errorsByCategory: Partial<Record<ErrorCategory, ErrorEntry[]>> = {}
          errors.forEach((error) => {
            const category = error.category
            if (!errorsByCategory[category]) {
              errorsByCategory[category] = []
            }
            errorsByCategory[category]!.push(error)
          })

          // Update current error to next visible error
          const currentError =
            state.currentError?.id === errorId
              ? errors.find((e) => e.visible) || null
              : state.currentError

          return {
            errors,
            errorsByCategory,
            currentError,
          }
        })
      },

      getErrorsByCategory: (category, visibleOnly = true) => {
        const categoryErrors = get().errorsByCategory[category] || []
        if (visibleOnly) {
          return categoryErrors.filter((e) => e.visible)
        }
        return categoryErrors
      },

      getMostRecentError: () => {
        const errors = get().errors
        return errors.length > 0 ? errors[errors.length - 1] : null
      },

      hasVisibleErrors: () => {
        return get().errors.some((e) => e.visible)
      },

      getVisibleErrorCount: () => {
        return get().errors.filter((e) => e.visible).length
      },
    }),
    {
      name: 'error-store',
    }
  )
)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique error ID
 */
function generateErrorId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get current error state
 */
export function useCurrentError(): ErrorEntry | null {
  return useErrorStore((state) => state.currentError)
}

/**
 * Hook to get visible error count
 */
export function useVisibleErrorCount(): number {
  return useErrorStore((state) => state.getVisibleErrorCount())
}

/**
 * Hook to get errors by category
 */
export function useCategoryErrors(
  category: ErrorCategory,
  visibleOnly = true
): ErrorEntry[] {
  return useErrorStore((state) => state.getErrorsByCategory(category, visibleOnly))
}

/**
 * Hook to check if errors exist
 */
export function useHasErrors(): boolean {
  return useErrorStore((state) => state.hasVisibleErrors())
}
