/**
 * Toast Component Unit Tests
 *
 * Comprehensive test suite covering all variants, states, and interactions
 * for the Toast notification component using Vitest and Testing Library.
 */

import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Toast } from './Toast'
import type { ToastVariant } from './Toast.types'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  // ============================================================
  // Default Render Tests
  // ============================================================
  describe('default render', () => {
    it('renders when isOpen is true', () => {
      render(<Toast isOpen title="Test" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<Toast isOpen={false} title="Test" />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('renders title correctly', () => {
      render(<Toast isOpen title="Success!" />)
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })

    it('renders description correctly', () => {
      render(<Toast isOpen title="Title" description="This is a description" />)
      expect(screen.getByText('This is a description')).toBeInTheDocument()
    })

    it('renders title and description together', () => {
      render(<Toast isOpen title="Header" description="Body text" />)
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Body text')).toBeInTheDocument()
    })

    it('renders without title (description only)', () => {
      render(<Toast isOpen description="Just a description" />)
      expect(screen.getByText('Just a description')).toBeInTheDocument()
    })
  })

  // ============================================================
  // Variant Tests
  // ============================================================
  describe('variants', () => {
    const variants: ToastVariant[] = ['success', 'error', 'warning', 'info']

    it.each(variants)('renders %s variant correctly', (variant) => {
      render(<Toast isOpen variant={variant} title={`${variant} toast`} />)
      const toast = screen.getByRole('alert')
      expect(toast).toBeInTheDocument()
    })

    it('applies success variant styles', () => {
      render(<Toast isOpen variant="success" title="Success" />)
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('border-success')
    })

    it('applies error variant styles', () => {
      render(<Toast isOpen variant="error" title="Error" />)
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('border-error')
    })

    it('applies warning variant styles', () => {
      render(<Toast isOpen variant="warning" title="Warning" />)
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('border-warning')
    })

    it('applies info variant styles', () => {
      render(<Toast isOpen variant="info" title="Info" />)
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('border-info')
    })

    it('defaults to info variant', () => {
      render(<Toast isOpen title="Default" />)
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('border-info')
    })
  })

  // ============================================================
  // Icon Tests
  // ============================================================
  describe('icons', () => {
    it('renders success icon for success variant', () => {
      render(<Toast isOpen variant="success" title="Success" />)
      const toast = screen.getByRole('alert')
      // Icon should be present as SVG
      const icon = toast.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders error icon for error variant', () => {
      render(<Toast isOpen variant="error" title="Error" />)
      const toast = screen.getByRole('alert')
      const icon = toast.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders warning icon for warning variant', () => {
      render(<Toast isOpen variant="warning" title="Warning" />)
      const toast = screen.getByRole('alert')
      const icon = toast.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders info icon for info variant', () => {
      render(<Toast isOpen variant="info" title="Info" />)
      const toast = screen.getByRole('alert')
      const icon = toast.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders custom icon when provided', () => {
      const CustomIcon = () => <span data-testid="custom-icon">Custom</span>
      render(<Toast isOpen title="Custom" icon={<CustomIcon />} />)
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('custom icon replaces default icon', () => {
      const CustomIcon = () => <span data-testid="custom-icon">Custom</span>
      render(<Toast isOpen variant="success" title="Custom" icon={<CustomIcon />} showCloseButton={false} />)
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
      // Should only have the custom icon, not the default success icon
      const icons = screen.getByRole('alert').querySelectorAll('svg')
      // No SVG icons should remain (custom icon is a span, close button is hidden)
      expect(icons.length).toBe(0)
    })
  })

  // ============================================================
  // Close Button Tests
  // ============================================================
  describe('close button', () => {
    it('renders close button by default', () => {
      render(<Toast isOpen title="Test" onClose={() => {}} />)
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
    })

    it('does not render close button when showCloseButton is false', () => {
      render(<Toast isOpen title="Test" showCloseButton={false} onClose={() => {}} />)
      expect(screen.queryByLabelText('Close notification')).not.toBeInTheDocument()
    })

    it('does not render close button when no onClose provided', () => {
      render(<Toast isOpen title="Test" showCloseButton={true} />)
      expect(screen.queryByLabelText('Close notification')).not.toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const handleClose = vi.fn()
      render(<Toast isOpen title="Test" onClose={handleClose} />)

      await user.click(screen.getByLabelText('Close notification'))

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================
  // Auto-close Tests
  // ============================================================
  describe('auto-close', () => {
    it('auto-closes after default duration (5000ms)', () => {
      const handleClose = vi.fn()
      render(<Toast isOpen title="Test" onClose={handleClose} />)

      expect(handleClose).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('auto-closes after custom duration', () => {
      const handleClose = vi.fn()
      render(<Toast isOpen title="Test" onClose={handleClose} duration={2000} />)

      expect(handleClose).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('does not auto-close when duration is 0', () => {
      const handleClose = vi.fn()
      render(<Toast isOpen title="Test" onClose={handleClose} duration={0} />)

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(handleClose).not.toHaveBeenCalled()
    })

    it('does not auto-close when no onClose provided', () => {
      render(<Toast isOpen title="Test" duration={1000} />)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Should not throw, toast should remain visible
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('clears timer when unmounted', () => {
      const handleClose = vi.fn()
      const { unmount } = render(<Toast isOpen title="Test" onClose={handleClose} duration={5000} />)

      unmount()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(handleClose).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // Keyboard Interaction Tests
  // ============================================================
  describe('keyboard interactions', () => {
    it('closes on Escape key press', async () => {
      vi.useRealTimers() // Use real timers for this test
      const user = userEvent.setup()
      const handleClose = vi.fn()
      render(<Toast isOpen title="Test" onClose={handleClose} duration={0} />)

      const closeButton = screen.getByLabelText('Close notification')
      closeButton.focus()
      await user.keyboard('{Escape}')

      expect(handleClose).toHaveBeenCalledTimes(1)
      vi.useFakeTimers() // Restore fake timers
    })
  })

  // ============================================================
  // Action Button Tests
  // ============================================================
  describe('action button', () => {
    it('renders action button when provided', () => {
      const handleAction = vi.fn()
      render(
        <Toast
          isOpen
          title="Test"
          action={{ label: 'Undo', onClick: handleAction }}
        />
      )

      expect(screen.getByText('Undo')).toBeInTheDocument()
    })

    it('calls action onClick when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const handleAction = vi.fn()
      render(
        <Toast
          isOpen
          title="Test"
          action={{ label: 'Undo', onClick: handleAction }}
        />
      )

      await user.click(screen.getByText('Undo'))

      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    it('does not render action button when not provided', () => {
      render(<Toast isOpen title="Test" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  // ============================================================
  // Accessibility Tests
  // ============================================================
  describe('accessibility', () => {
    it('has role="alert"', () => {
      render(<Toast isOpen title="Test" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('has aria-live="polite"', () => {
      render(<Toast isOpen title="Test" />)
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
    })

    it('supports data-testid', () => {
      render(<Toast isOpen title="Test" data-testid="my-toast" />)
      expect(screen.getByTestId('my-toast')).toBeInTheDocument()
    })

    it('close button has accessible label', () => {
      render(<Toast isOpen title="Test" onClose={() => {}} />)
      const closeButton = screen.getByLabelText('Close notification')
      expect(closeButton).toBeInTheDocument()
    })
  })

  // ============================================================
  // Custom ClassName Tests
  // ============================================================
  describe('className prop', () => {
    it('applies custom className', () => {
      render(<Toast isOpen title="Test" className="custom-class" />)
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('custom-class')
    })

    it('merges custom className with default styles', () => {
      render(<Toast isOpen title="Test" className="my-custom-style" />)
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('my-custom-style')
      expect(toast.className).toContain('rounded-lg')
    })
  })

  // ============================================================
  // Combined Props Tests
  // ============================================================
  describe('combined props', () => {
    it('handles multiple props correctly', () => {
      const handleClose = vi.fn()
      const handleAction = vi.fn()
      render(
        <Toast
          isOpen
          variant="success"
          title="Note saved"
          description="Your note has been encrypted."
          onClose={handleClose}
          duration={3000}
          action={{ label: 'View', onClick: handleAction }}
          className="extra-class"
        />
      )

      const toast = screen.getByRole('alert')
      expect(toast).toBeInTheDocument()
      expect(toast.className).toContain('border-success')
      expect(toast.className).toContain('extra-class')
      expect(screen.getByText('Note saved')).toBeInTheDocument()
      expect(screen.getByText('Your note has been encrypted.')).toBeInTheDocument()
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
    })
  })
})
