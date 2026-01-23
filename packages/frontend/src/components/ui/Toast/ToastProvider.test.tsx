/**
 * ToastProvider Component Unit Tests
 *
 * Tests for Toast context provider, animations, and reduced motion support.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'

// Mock framer-motion's useReducedMotion hook
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  }
})

// Test component that uses the toast hook
function TestConsumer() {
  const { toast } = useToast()

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>
        Show Success
      </button>
      <button onClick={() => toast.error('Error message')}>
        Show Error
      </button>
      <button onClick={() => toast.warning('Warning message')}>
        Show Warning
      </button>
      <button onClick={() => toast.info('Info message')}>
        Show Info
      </button>
    </div>
  )
}

describe('ToastProvider', () => {
  // ============================================================
  // Basic Rendering Tests
  // ============================================================
  describe('rendering', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('creates toast container in portal', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Success'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  // ============================================================
  // Toast Creation Tests
  // ============================================================
  describe('toast creation', () => {
    it('creates success toast with correct variant', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Success'))

      await waitFor(() => {
        const toast = screen.getByRole('alert')
        expect(toast).toHaveTextContent('Success message')
        expect(toast.className).toContain('border-success')
      })
    })

    it('creates error toast with correct variant', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Error'))

      await waitFor(() => {
        const toast = screen.getByRole('alert')
        expect(toast).toHaveTextContent('Error message')
        expect(toast.className).toContain('border-error')
      })
    })

    it('creates warning toast with correct variant', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Warning'))

      await waitFor(() => {
        const toast = screen.getByRole('alert')
        expect(toast).toHaveTextContent('Warning message')
        expect(toast.className).toContain('border-warning')
      })
    })

    it('creates info toast with correct variant', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Info'))

      await waitFor(() => {
        const toast = screen.getByRole('alert')
        expect(toast).toHaveTextContent('Info message')
        expect(toast.className).toContain('border-info')
      })
    })
  })

  // ============================================================
  // Multiple Toasts Tests
  // ============================================================
  describe('multiple toasts', () => {
    it('can show multiple toasts at once', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Success'))
      await user.click(screen.getByText('Show Error'))

      await waitFor(() => {
        const toasts = screen.getAllByRole('alert')
        expect(toasts).toHaveLength(2)
      })
    })
  })

  // ============================================================
  // Position Tests
  // ============================================================
  describe('positioning', () => {
    it('applies top-right position by default', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Success'))

      await waitFor(() => {
        const container = screen.getByLabelText('Notifications')
        expect(container.className).toContain('top-4')
        expect(container.className).toContain('right-4')
      })
    })

    it('applies bottom-left position when specified', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider position="bottom-left">
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Success'))

      await waitFor(() => {
        const container = screen.getByLabelText('Notifications')
        expect(container.className).toContain('bottom-4')
        expect(container.className).toContain('left-4')
      })
    })
  })

  // ============================================================
  // Accessibility Tests
  // ============================================================
  describe('accessibility', () => {
    it('container has aria-live="polite"', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Success'))

      await waitFor(() => {
        const container = screen.getByLabelText('Notifications')
        expect(container).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('container has accessible label', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )

      await user.click(screen.getByText('Show Success'))

      await waitFor(() => {
        const container = screen.getByLabelText('Notifications')
        expect(container).toBeInTheDocument()
      })
    })
  })
})
