/**
 * Button Component Unit Tests
 *
 * Comprehensive test suite covering all variants, sizes, states, and interactions
 * for the Button component using Vitest and Testing Library.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'
import type { ButtonVariant, ButtonSize } from './Button.types'

// Test icon component
const TestIcon = () => (
  <svg data-testid="test-icon" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>
)

describe('Button', () => {
  // ============================================================
  // Default Render Tests
  // ============================================================
  describe('default render', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })

      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).not.toBeDisabled()
    })

    it('renders children correctly', () => {
      render(<Button>Test Content</Button>)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies default variant styles (primary)', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')

      // Primary variant should have gradient background class
      expect(button.className).toContain('from-primary')
    })

    it('applies default size styles (md)', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByRole('button')

      // Medium size should have specific padding
      expect(button.className).toContain('px-4')
      expect(button.className).toContain('py-2')
    })

    it('has correct display name for debugging', () => {
      expect(Button.displayName).toBe('Button')
    })
  })

  // ============================================================
  // Variant Tests
  // ============================================================
  describe('variants', () => {
    const variants: ButtonVariant[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
      'success',
    ]

    it.each(variants)('renders %s variant correctly', (variant) => {
      render(<Button variant={variant}>{variant} button</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeInTheDocument()
      // Each variant should have unique styles applied
      expect(button.className).toBeTruthy()
    })

    it('applies primary gradient styles', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('from-primary')
      expect(button.className).toContain('to-primary-600')
    })

    it('applies secondary gradient styles', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('from-secondary')
      expect(button.className).toContain('to-secondary-600')
    })

    it('applies outline border styles', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('border-2')
      expect(button.className).toContain('border-primary')
      expect(button.className).toContain('bg-transparent')
    })

    it('applies ghost transparent background', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('bg-transparent')
    })

    it('applies danger background color', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('bg-error')
    })

    it('applies success background color', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('bg-success')
    })
  })

  // ============================================================
  // Size Tests
  // ============================================================
  describe('sizes', () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

    it.each(sizes)('renders %s size correctly', (size) => {
      render(<Button size={size}>{size} button</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeInTheDocument()
    })

    it('applies xs size styles', () => {
      render(<Button size="xs">XS</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('px-2')
      expect(button.className).toContain('py-1')
      expect(button.className).toContain('text-xs')
    })

    it('applies sm size styles', () => {
      render(<Button size="sm">SM</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('px-3')
      expect(button.className).toContain('py-1.5')
      expect(button.className).toContain('text-sm')
    })

    it('applies md size styles', () => {
      render(<Button size="md">MD</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('px-4')
      expect(button.className).toContain('py-2')
      expect(button.className).toContain('text-base')
    })

    it('applies lg size styles', () => {
      render(<Button size="lg">LG</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('px-6')
      expect(button.className).toContain('py-3')
      expect(button.className).toContain('text-lg')
    })

    it('applies xl size styles', () => {
      render(<Button size="xl">XL</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('px-8')
      expect(button.className).toContain('py-4')
      expect(button.className).toContain('text-xl')
    })
  })

  // ============================================================
  // Loading State Tests
  // ============================================================
  describe('loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>)
      const button = screen.getByRole('button')

      // Should have a spinner (svg with animate-spin)
      const spinner = button.querySelector('svg.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('shows loading text when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows custom loading text when provided', () => {
      render(
        <Button isLoading loadingText="Processing...">
          Submit
        </Button>
      )

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })

    it('is disabled when loading', () => {
      render(<Button isLoading>Submit</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
    })

    it('sets aria-busy when loading', () => {
      render(<Button isLoading>Submit</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('hides children when loading', () => {
      render(<Button isLoading>Original Text</Button>)

      expect(screen.queryByText('Original Text')).not.toBeInTheDocument()
    })

    it('does not show spinner when not loading', () => {
      render(<Button>Submit</Button>)
      const button = screen.getByRole('button')

      const spinner = button.querySelector('svg.animate-spin')
      expect(spinner).not.toBeInTheDocument()
    })
  })

  // ============================================================
  // Disabled State Tests
  // ============================================================
  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
    })

    it('sets aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )
      const button = screen.getByRole('button')

      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('applies disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('disabled:cursor-not-allowed')
      expect(button.className).toContain('disabled:opacity-50')
    })

    it('is disabled when both disabled and isLoading are true', () => {
      render(
        <Button disabled isLoading>
          Test
        </Button>
      )
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
    })
  })

  // ============================================================
  // Click Handler Tests
  // ============================================================
  describe('click handler', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')

      await user.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('passes event to onClick handler', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
        })
      )
    })

    it('handles multiple clicks', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')

      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(handleClick).toHaveBeenCalledTimes(3)
    })

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn()
      render(
        <Button isLoading onClick={handleClick}>
          Loading
        </Button>
      )
      const button = screen.getByRole('button')

      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // Icon Rendering Tests
  // ============================================================
  describe('icon rendering', () => {
    it('renders left icon', () => {
      render(<Button leftIcon={<TestIcon />}>With Icon</Button>)

      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders right icon', () => {
      render(<Button rightIcon={<TestIcon />}>With Icon</Button>)

      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders both left and right icons', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Both Icons
        </Button>
      )

      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('hides icons when loading', () => {
      render(
        <Button isLoading leftIcon={<TestIcon />}>
          Loading
        </Button>
      )

      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
    })

    it('renders icon-only button correctly', () => {
      render(
        <Button iconOnly leftIcon={<TestIcon />} aria-label="Icon button" />
      )
      const button = screen.getByRole('button')

      expect(button).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('applies icon-only styles when iconOnly is true', () => {
      render(
        <Button iconOnly size="md" leftIcon={<TestIcon />} aria-label="Icon" />
      )
      const button = screen.getByRole('button')

      // Icon-only md buttons have p-2 instead of px-4 py-2
      expect(button.className).toContain('p-2')
      expect(button.className).not.toContain('px-4')
    })

    it('auto-detects icon-only when no children provided', () => {
      render(<Button leftIcon={<TestIcon />} aria-label="Auto icon-only" />)
      const button = screen.getByRole('button')

      // Should apply icon-only styles (p-* instead of px-* py-*)
      expect(button.className).toContain('p-')
    })
  })

  // ============================================================
  // Full Width Tests
  // ============================================================
  describe('fullWidth prop', () => {
    it('applies full width class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('w-full')
    })

    it('does not apply full width class when fullWidth is false', () => {
      render(<Button fullWidth={false}>Not Full Width</Button>)
      const button = screen.getByRole('button')

      expect(button.className).not.toContain('w-full')
    })
  })

  // ============================================================
  // Custom ClassName Tests
  // ============================================================
  describe('className prop', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('custom-class')
    })

    it('merges custom className with default styles', () => {
      render(<Button className="my-custom-style">Custom</Button>)
      const button = screen.getByRole('button')

      // Should have both custom class and default styles
      expect(button.className).toContain('my-custom-style')
      expect(button.className).toContain('inline-flex')
    })
  })

  // ============================================================
  // Button Type Tests
  // ============================================================
  describe('button type', () => {
    it('has type="button" by default', () => {
      render(<Button>Default Type</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('type', 'button')
    })

    it('supports type="submit"', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('type', 'submit')
    })

    it('supports type="reset"', () => {
      render(<Button type="reset">Reset</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('type', 'reset')
    })
  })

  // ============================================================
  // Accessibility Tests
  // ============================================================
  describe('accessibility', () => {
    it('supports aria-label', () => {
      render(<Button aria-label="Accessible button">Click</Button>)
      const button = screen.getByRole('button', { name: /accessible button/i })

      expect(button).toBeInTheDocument()
    })

    it('supports aria-describedby', () => {
      render(
        <>
          <span id="desc">This is a description</span>
          <Button aria-describedby="desc">Described</Button>
        </>
      )
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-describedby', 'desc')
    })

    it('sets aria-disabled for disabled buttons', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('sets aria-busy for loading buttons', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('spinner has aria-hidden', () => {
      render(<Button isLoading>Loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')

      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('has visible focus ring styles', () => {
      render(<Button>Focus me</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('focus-visible:ring-2')
    })

    it('is keyboard focusable', () => {
      render(<Button>Focusable</Button>)
      const button = screen.getByRole('button')

      button.focus()
      expect(button).toHaveFocus()
    })

    it('can be triggered with keyboard', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press Enter</Button>)
      const button = screen.getByRole('button')

      button.focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('can be triggered with space key', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press Space</Button>)
      const button = screen.getByRole('button')

      button.focus()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================
  // Ref Forwarding Tests
  // ============================================================
  describe('ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null }

      render(<Button ref={ref}>With Ref</Button>)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('allows imperative focus via ref', () => {
      const ref = { current: null as HTMLButtonElement | null }

      render(<Button ref={ref}>Focus via Ref</Button>)

      ref.current?.focus()
      expect(ref.current).toHaveFocus()
    })
  })

  // ============================================================
  // Additional HTML Attributes Tests
  // ============================================================
  describe('additional HTML attributes', () => {
    it('passes through data attributes', () => {
      render(<Button data-testid="custom-button">Data Attr</Button>)
      const button = screen.getByTestId('custom-button')

      expect(button).toBeInTheDocument()
    })

    it('passes through id attribute', () => {
      render(<Button id="my-button">With ID</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('id', 'my-button')
    })

    it('passes through name attribute', () => {
      render(<Button name="submit-btn">Named</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('name', 'submit-btn')
    })

    it('passes through title attribute', () => {
      render(<Button title="Button tooltip">With Title</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('title', 'Button tooltip')
    })

    it('passes through tabIndex', () => {
      render(<Button tabIndex={-1}>Not Tabbable</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('tabindex', '-1')
    })
  })

  // ============================================================
  // Combined Props Tests
  // ============================================================
  describe('combined props', () => {
    it('handles multiple props correctly', () => {
      render(
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<TestIcon />}
          className="extra-class"
        >
          Complete Button
        </Button>
      )
      const button = screen.getByRole('button')

      expect(button).toHaveTextContent('Complete Button')
      expect(button.className).toContain('from-secondary')
      expect(button.className).toContain('px-6')
      expect(button.className).toContain('w-full')
      expect(button.className).toContain('extra-class')
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('prioritizes disabled over loading for click handlers', async () => {
      const handleClick = vi.fn()

      render(
        <Button disabled isLoading onClick={handleClick}>
          Both States
        </Button>
      )
      const button = screen.getByRole('button')

      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
      expect(button).toBeDisabled()
    })
  })
})
