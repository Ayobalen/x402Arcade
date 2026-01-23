/**
 * useToast Hook
 *
 * A custom hook for triggering toast notifications from any component.
 * Must be used within a ToastProvider context.
 *
 * @example
 * // Basic usage
 * const { toast } = useToast()
 *
 * // Success toast
 * toast.success('Note saved!', 'Your note has been encrypted and stored.')
 *
 * // Error toast
 * toast.error('Transaction failed', 'Unable to connect to the network.')
 *
 * // Custom toast with options
 * const { addToast } = useToast()
 * addToast({
 *   variant: 'warning',
 *   title: 'Low balance',
 *   description: 'Your wallet balance is running low.',
 *   duration: 8000,
 *   action: {
 *     label: 'Add funds',
 *     onClick: () => navigate('/wallet'),
 *   },
 * })
 */

import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from './ToastContext'

/**
 * useToast Hook
 *
 * Provides access to toast notification functions.
 * Throws an error if used outside of ToastProvider.
 *
 * @returns {ToastContextValue} Toast context value with methods to manage toasts
 * @throws {Error} If used outside of ToastProvider context
 *
 * @example
 * function MyComponent() {
 *   const { toast, addToast, removeToast, clearToasts } = useToast()
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData()
 *       toast.success('Saved!', 'Your changes have been saved.')
 *     } catch (error) {
 *       toast.error('Error', 'Failed to save changes.')
 *     }
 *   }
 *
 *   return <button onClick={handleSave}>Save</button>
 * }
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error(
      'useToast must be used within a ToastProvider. ' +
        'Make sure to wrap your app with <ToastProvider>.'
    )
  }

  return context
}

export default useToast
