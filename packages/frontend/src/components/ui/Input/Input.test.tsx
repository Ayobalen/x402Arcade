/**
 * Input Component Unit Tests
 *
 * Comprehensive test suite covering all variants, sizes, states, and interactions
 * for the Input component using Vitest and Testing Library.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input } from './Input'
import type { InputVariant, InputSize } from './Input.types'

// Test icon component
const TestIcon = () => (
  <svg data-testid="test-icon" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>
)

describe('Input', () => {
  // ============================================================
  // Default Render Tests
  // ============================================================
  describe('default render', () => {
    it('renders with default props', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText('Enter text')

      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('INPUT')
      expect(input).not.toBeDisabled()
    })

    it('renders input element correctly', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toBeInTheDocument()
    })

    it('applies default variant styles (default)', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      // Default variant should have surface background class
      expect(input.className).toContain('bg-surface-primary')
      expect(input.className).toContain('border')
    })

    it('applies default size styles (md)', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      // Medium size should have specific padding
      expect(input.className).toContain('px-4')
      expect(input.className).toContain('py-2')
      expect(input.className).toContain('text-base')
    })

    it('has correct display name for debugging', () => {
      expect(Input.displayName).toBe('Input')
    })

    it('is full width by default', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('w-full')
    })
  })

  // ============================================================
  // Variant Tests
  // ============================================================
  describe('variants', () => {
    const variants: InputVariant[] = ['default', 'filled', 'outline']

    it.each(variants)('renders %s variant correctly', (variant) => {
      render(<Input variant={variant} data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toBeInTheDocument()
      // Each variant should have unique styles applied
      expect(input.className).toBeTruthy()
    })

    it('applies default variant styles', () => {
      render(<Input variant="default" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('bg-surface-primary')
      expect(input.className).toContain('border')
      expect(input.className).toContain('border-border')
    })

    it('applies filled variant styles', () => {
      render(<Input variant="filled" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('bg-surface-secondary')
      expect(input.className).toContain('border-transparent')
    })

    it('applies outline variant styles', () => {
      render(<Input variant="outline" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('bg-transparent')
      expect(input.className).toContain('border-2')
    })
  })

  // ============================================================
  // Size Tests
  // ============================================================
  describe('sizes', () => {
    const sizes: InputSize[] = ['sm', 'md', 'lg']

    it.each(sizes)('renders %s size correctly', (size) => {
      render(<Input size={size} data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toBeInTheDocument()
    })

    it('applies sm size styles', () => {
      render(<Input size="sm" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('px-3')
      expect(input.className).toContain('py-1.5')
      expect(input.className).toContain('text-sm')
      expect(input.className).toContain('rounded-md')
    })

    it('applies md size styles', () => {
      render(<Input size="md" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('px-4')
      expect(input.className).toContain('py-2')
      expect(input.className).toContain('text-base')
      expect(input.className).toContain('rounded-lg')
    })

    it('applies lg size styles', () => {
      render(<Input size="lg" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('px-5')
      expect(input.className).toContain('py-3')
      expect(input.className).toContain('text-lg')
      expect(input.className).toContain('rounded-lg')
    })
  })

  // ============================================================
  // Error State Tests
  // ============================================================
  describe('error state', () => {
    it('applies error styles when error is true', () => {
      render(<Input error data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('border-error')
    })

    it('sets aria-invalid when error is true', () => {
      render(<Input error data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('does not set aria-invalid when error is false', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('aria-invalid', 'false')
    })

    it('shows error icon when error is true and no right icon', () => {
      render(<Input error data-testid="test-input" />)

      // Error icon SVG should be present
      const errorIcon = document.querySelector('svg[aria-hidden="true"]')
      expect(errorIcon).toBeInTheDocument()
    })

    it('does not show error icon when custom right icon is provided', () => {
      render(<Input error rightIcon={<TestIcon />} data-testid="test-input" />)

      // Custom icon should be present
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()

      // Should only have the test icon SVG, not the error icon
      const allSvgs = document.querySelectorAll('svg')
      expect(allSvgs.length).toBe(1)
    })
  })

  // ============================================================
  // Error Message Tests
  // ============================================================
  describe('error message', () => {
    it('renders error message when error and errorMessage provided', () => {
      render(
        <Input
          error
          errorMessage="This field is required"
          data-testid="test-input"
        />
      )

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('error message has role="alert"', () => {
      render(
        <Input
          error
          errorMessage="Error message"
          data-testid="test-input"
        />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent('Error message')
    })

    it('does not render error message when error is false', () => {
      render(
        <Input
          errorMessage="This field is required"
          data-testid="test-input"
        />
      )

      expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
    })

    it('input is described by error message via aria-describedby', () => {
      render(
        <Input
          error
          errorMessage="Error message"
          data-testid="test-input"
        />
      )
      const input = screen.getByTestId('test-input')
      const errorMsg = screen.getByRole('alert')

      expect(input).toHaveAttribute('aria-describedby', errorMsg.id)
    })

    it('error message has correct styling', () => {
      render(
        <Input
          error
          errorMessage="Error message"
          data-testid="test-input"
        />
      )

      const errorMsg = screen.getByRole('alert')
      expect(errorMsg.className).toContain('text-sm')
      expect(errorMsg.className).toContain('text-error')
    })
  })

  // ============================================================
  // Success State Tests
  // ============================================================
  describe('success state', () => {
    it('applies success styles when success is true', () => {
      render(<Input success data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('border-success')
    })

    it('error state takes precedence over success state', () => {
      render(<Input error success data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      // Error styles should be applied, not success
      expect(input.className).toContain('border-error')
    })
  })

  // ============================================================
  // Value Change Tests
  // ============================================================
  describe('value changes', () => {
    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<Input onChange={handleChange} data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      await user.type(input, 'hello')

      expect(handleChange).toHaveBeenCalled()
    })

    it('updates value correctly', async () => {
      const user = userEvent.setup()

      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input') as HTMLInputElement

      await user.type(input, 'hello world')

      expect(input.value).toBe('hello world')
    })

    it('supports controlled value', () => {
      const handleChange = vi.fn()

      render(
        <Input
          value="controlled"
          onChange={handleChange}
          data-testid="test-input"
        />
      )
      const input = screen.getByTestId('test-input') as HTMLInputElement

      expect(input.value).toBe('controlled')
    })

    it('passes event to onChange handler', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<Input onChange={handleChange} data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      await user.type(input, 'a')

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.any(Object),
        })
      )
    })
  })

  // ============================================================
  // Focus/Blur Event Tests
  // ============================================================
  describe('focus/blur events', () => {
    it('calls onFocus when input is focused', async () => {
      const handleFocus = vi.fn()
      const user = userEvent.setup()

      render(<Input onFocus={handleFocus} data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      await user.click(input)

      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('calls onBlur when input loses focus', async () => {
      const handleBlur = vi.fn()
      const user = userEvent.setup()

      render(
        <>
          <Input onBlur={handleBlur} data-testid="test-input" />
          <button>Other element</button>
        </>
      )
      const input = screen.getByTestId('test-input')

      await user.click(input)
      await user.tab()

      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('is focusable', async () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      input.focus()

      expect(input).toHaveFocus()
    })

    it('supports programmatic focus via ref', () => {
      const ref = { current: null as HTMLInputElement | null }

      render(<Input ref={ref} data-testid="test-input" />)

      ref.current?.focus()

      expect(ref.current).toHaveFocus()
    })
  })

  // ============================================================
  // Disabled State Tests
  // ============================================================
  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Input disabled data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Input disabled data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('disabled:cursor-not-allowed')
      expect(input.className).toContain('disabled:opacity-50')
    })

    it('does not call onChange when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<Input disabled onChange={handleChange} data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      await user.type(input, 'hello')

      expect(handleChange).not.toHaveBeenCalled()
    })

    it('cannot be focused when disabled', () => {
      render(<Input disabled data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      input.focus()

      expect(input).not.toHaveFocus()
    })
  })

  // ============================================================
  // Label Tests
  // ============================================================
  describe('label', () => {
    it('renders label when provided', () => {
      render(<Input label="Email Address" data-testid="test-input" />)

      expect(screen.getByText('Email Address')).toBeInTheDocument()
    })

    it('label is associated with input via htmlFor', () => {
      render(<Input label="Email Address" data-testid="test-input" />)
      const label = screen.getByText('Email Address')
      const input = screen.getByTestId('test-input')

      expect(label).toHaveAttribute('for', input.id)
    })

    it('clicking label focuses input', async () => {
      const user = userEvent.setup()

      render(<Input label="Email Address" data-testid="test-input" />)
      const label = screen.getByText('Email Address')

      await user.click(label)

      expect(screen.getByTestId('test-input')).toHaveFocus()
    })

    it('label has correct styling', () => {
      render(<Input label="Email" data-testid="test-input" />)
      const label = screen.getByText('Email')

      expect(label.className).toContain('text-sm')
      expect(label.className).toContain('font-medium')
    })
  })

  // ============================================================
  // Helper Text Tests
  // ============================================================
  describe('helper text', () => {
    it('renders helper text when provided', () => {
      render(
        <Input
          helperText="We'll never share your email"
          data-testid="test-input"
        />
      )

      expect(screen.getByText("We'll never share your email")).toBeInTheDocument()
    })

    it('input is described by helper text via aria-describedby', () => {
      render(
        <Input
          helperText="Helper text"
          data-testid="test-input"
        />
      )
      const input = screen.getByTestId('test-input')
      const helperText = screen.getByText('Helper text')

      expect(input).toHaveAttribute('aria-describedby', helperText.id)
    })

    it('does not show helper text when error is present', () => {
      render(
        <Input
          error
          errorMessage="Error message"
          helperText="Helper text"
          data-testid="test-input"
        />
      )

      expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('helper text has correct styling', () => {
      render(
        <Input
          helperText="Helper text"
          data-testid="test-input"
        />
      )
      const helperText = screen.getByText('Helper text')

      expect(helperText.className).toContain('text-sm')
      expect(helperText.className).toContain('text-text-muted')
    })
  })

  // ============================================================
  // Icon Rendering Tests
  // ============================================================
  describe('icon rendering', () => {
    it('renders left icon', () => {
      render(<Input leftIcon={<TestIcon />} data-testid="test-input" />)

      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders right icon', () => {
      render(<Input rightIcon={<TestIcon />} data-testid="test-input" />)

      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders both left and right icons', () => {
      render(
        <Input
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
          data-testid="test-input"
        />
      )

      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('applies padding adjustment for left icon', () => {
      render(<Input leftIcon={<TestIcon />} size="md" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('pl-11')
    })

    it('applies padding adjustment for right icon', () => {
      render(<Input rightIcon={<TestIcon />} size="md" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('pr-11')
    })

    it('icons are not clickable (pointer-events-none)', () => {
      render(<Input leftIcon={<TestIcon />} data-testid="test-input" />)
      const iconContainer = screen.getByTestId('test-icon').parentElement

      expect(iconContainer?.className).toContain('pointer-events-none')
    })
  })

  // ============================================================
  // Full Width Tests
  // ============================================================
  describe('fullWidth prop', () => {
    it('applies full width class when fullWidth is true (default)', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('w-full')
    })

    it('does not apply full width class when fullWidth is false', () => {
      render(<Input fullWidth={false} data-testid="test-input" />)
      const container = screen.getByTestId('test-input').parentElement?.parentElement

      expect(container?.className).not.toContain('w-full')
    })
  })

  // ============================================================
  // Custom ClassName Tests
  // ============================================================
  describe('className props', () => {
    it('applies custom className to input', () => {
      render(<Input className="custom-class" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('custom-class')
    })

    it('applies custom containerClassName to container', () => {
      render(
        <Input
          containerClassName="custom-container-class"
          data-testid="test-input"
        />
      )
      const container = screen.getByTestId('test-input').parentElement?.parentElement

      expect(container?.className).toContain('custom-container-class')
    })

    it('merges custom className with default styles', () => {
      render(<Input className="my-custom-style" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('my-custom-style')
      expect(input.className).toContain('w-full')
    })
  })

  // ============================================================
  // Accessibility Tests
  // ============================================================
  describe('accessibility', () => {
    it('generates unique ID for accessibility', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.id).toBeTruthy()
    })

    it('uses provided ID when available', () => {
      render(<Input id="my-custom-id" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.id).toBe('my-custom-id')
    })

    it('supports aria-label', () => {
      render(<Input aria-label="Accessible input" data-testid="test-input" />)
      const input = screen.getByLabelText('Accessible input')

      expect(input).toBeInTheDocument()
    })

    it('supports aria-describedby for custom descriptions', () => {
      render(
        <>
          <span id="desc">This is a description</span>
          <Input aria-describedby="desc" data-testid="test-input" />
        </>
      )
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('aria-describedby', 'desc')
    })

    it('has visible focus ring styles', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('focus:outline-none')
      expect(input.className).toContain('focus:border-primary')
    })

    it('placeholder is accessible', () => {
      render(<Input placeholder="Enter your name" />)

      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
    })

    it('placeholder has muted text style', () => {
      render(<Input data-testid="test-input" placeholder="Placeholder" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('placeholder:text-text-muted')
    })
  })

  // ============================================================
  // Ref Forwarding Tests
  // ============================================================
  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null }

      render(<Input ref={ref} data-testid="test-input" />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('allows imperative focus via ref', () => {
      const ref = { current: null as HTMLInputElement | null }

      render(<Input ref={ref} data-testid="test-input" />)

      ref.current?.focus()
      expect(ref.current).toHaveFocus()
    })

    it('allows value access via ref', async () => {
      const ref = { current: null as HTMLInputElement | null }
      const user = userEvent.setup()

      render(<Input ref={ref} data-testid="test-input" />)

      await user.type(screen.getByTestId('test-input'), 'test value')

      expect(ref.current?.value).toBe('test value')
    })
  })

  // ============================================================
  // Additional HTML Attributes Tests
  // ============================================================
  describe('additional HTML attributes', () => {
    it('passes through data attributes', () => {
      render(<Input data-testid="custom-input" data-custom="value" />)
      const input = screen.getByTestId('custom-input')

      expect(input).toHaveAttribute('data-custom', 'value')
    })

    it('passes through name attribute', () => {
      render(<Input name="email" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('name', 'email')
    })

    it('passes through type attribute', () => {
      render(<Input type="email" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('type', 'email')
    })

    it('passes through required attribute', () => {
      render(<Input required data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toBeRequired()
    })

    it('passes through readonly attribute', () => {
      render(<Input readOnly data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('readonly')
    })

    it('passes through maxLength attribute', () => {
      render(<Input maxLength={100} data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('maxlength', '100')
    })

    it('passes through autoComplete attribute', () => {
      render(<Input autoComplete="email" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input).toHaveAttribute('autocomplete', 'email')
    })
  })

  // ============================================================
  // Combined Props Tests
  // ============================================================
  describe('combined props', () => {
    it('handles multiple props correctly', () => {
      render(
        <Input
          variant="filled"
          size="lg"
          label="Email Address"
          helperText="Enter your email"
          leftIcon={<TestIcon />}
          className="extra-class"
          data-testid="test-input"
        />
      )
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('bg-surface-secondary')
      expect(input.className).toContain('px-5')
      expect(input.className).toContain('py-3')
      expect(input.className).toContain('extra-class')
      expect(screen.getByText('Email Address')).toBeInTheDocument()
      expect(screen.getByText('Enter your email')).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('handles error state with all features', () => {
      render(
        <Input
          error
          errorMessage="Invalid email"
          label="Email"
          leftIcon={<TestIcon />}
          data-testid="test-input"
        />
      )

      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByTestId('test-input')).toHaveAttribute('aria-invalid', 'true')
    })

    it('handles success state with label', () => {
      render(
        <Input
          success
          label="Username"
          helperText="Username is available"
          data-testid="test-input"
        />
      )
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('border-success')
      expect(screen.getByText('Username')).toBeInTheDocument()
      expect(screen.getByText('Username is available')).toBeInTheDocument()
    })
  })

  // ============================================================
  // Transition/Animation Tests
  // ============================================================
  describe('transitions', () => {
    it('applies transition classes for smooth animations', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')

      expect(input.className).toContain('transition-all')
      expect(input.className).toContain('duration-200')
    })
  })
})
