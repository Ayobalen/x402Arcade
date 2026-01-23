/**
 * Card Component Tests
 *
 * Comprehensive unit tests for the Card component and its subcomponents.
 * Covers all variants, interactive states, and accessibility requirements.
 */

import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Card, CardHeader, CardBody, CardFooter } from './Card'

expect.extend(toHaveNoViolations)

describe('Card', () => {
  describe('Default Rendering', () => {
    it('renders with children content', () => {
      render(<Card>Test content</Card>)
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('renders as a div element by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card.tagName).toBe('DIV')
    })

    it('applies base styles', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('relative', 'rounded-lg', 'transition-all')
    })

    it('applies default variant styles', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-surface-primary', 'border', 'border-border')
    })

    it('applies default padding (md)', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-4')
    })

    it('forwards ref to the DOM element', () => {
      const ref = createRef<HTMLDivElement>()
      render(<Card ref={ref}>Content</Card>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('has correct displayName', () => {
      expect(Card.displayName).toBe('Card')
    })
  })

  describe('Variant Rendering', () => {
    it('renders default variant correctly', () => {
      render(<Card data-testid="card" variant="default">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-surface-primary', 'border', 'border-border')
      expect(card).not.toHaveClass('shadow-lg', 'backdrop-blur-md')
    })

    it('renders elevated variant with shadow', () => {
      render(<Card data-testid="card" variant="elevated">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-surface-primary', 'shadow-lg')
    })

    it('renders outlined variant with transparent background', () => {
      render(<Card data-testid="card" variant="outlined">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-transparent', 'border-2')
    })

    it('renders glass variant with glassmorphism effect', () => {
      render(<Card data-testid="card" variant="glass">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('backdrop-blur-md')
    })
  })

  describe('Padding Options', () => {
    it('applies no padding when padding="none"', () => {
      render(<Card data-testid="card" padding="none">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-0')
    })

    it('applies small padding when padding="sm"', () => {
      render(<Card data-testid="card" padding="sm">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-3')
    })

    it('applies medium padding when padding="md"', () => {
      render(<Card data-testid="card" padding="md">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-4')
    })

    it('applies large padding when padding="lg"', () => {
      render(<Card data-testid="card" padding="lg">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-6')
    })
  })

  describe('Hoverable Behavior', () => {
    it('does not apply hover styles by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('hover:border-primary/50', 'hover:bg-surface-secondary')
    })

    it('applies hover styles when hoverable is true', () => {
      render(<Card data-testid="card" hoverable>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('hover:border-primary/50', 'hover:bg-surface-secondary')
    })

    it('applies cursor-pointer when hoverable for better UX', () => {
      render(<Card data-testid="card" hoverable>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('applies scale transform on hover for hoverable cards', () => {
      render(<Card data-testid="card" hoverable>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('hover:scale-[1.02]')
    })

    it('applies increased shadow on hover for hoverable cards', () => {
      render(<Card data-testid="card" hoverable>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('hover:shadow-lg')
    })

    it('applies will-change for performance optimization', () => {
      render(<Card data-testid="card" hoverable>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('will-change-transform')
    })
  })

  describe('Interactive Behavior', () => {
    it('does not apply interactive styles by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('cursor-pointer')
      expect(card).not.toHaveAttribute('tabIndex')
      expect(card).not.toHaveAttribute('role')
    })

    it('applies interactive styles when interactive is true', () => {
      render(<Card data-testid="card" interactive>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('cursor-pointer')
      expect(card).toHaveClass('active:scale-[0.99]')
    })

    it('sets tabIndex to 0 when interactive', () => {
      render(<Card data-testid="card" interactive>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('sets role to button when interactive', () => {
      render(<Card data-testid="card" interactive>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('role', 'button')
    })

    it('handles click events when interactive', () => {
      const handleClick = vi.fn()
      render(
        <Card data-testid="card" interactive onClick={handleClick}>
          Clickable content
        </Card>
      )
      const card = screen.getByTestId('card')
      card.click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard events when interactive', () => {
      const handleKeyDown = vi.fn()
      render(
        <Card data-testid="card" interactive onKeyDown={handleKeyDown}>
          Keyboard accessible
        </Card>
      )
      const card = screen.getByTestId('card')
      card.focus()
      // Simulate keydown event
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      card.dispatchEvent(event)
      expect(handleKeyDown).toHaveBeenCalled()
    })
  })

  describe('Glow Border Rendering', () => {
    it('does not apply glow styles by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('hover:shadow-glow-cyan')
    })

    it('applies glow styles when glowOnHover is true', () => {
      render(<Card data-testid="card" glowOnHover>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('hover:shadow-glow-cyan', 'hover:border-primary/70')
    })

    it('combines glow with hoverable', () => {
      render(<Card data-testid="card" hoverable glowOnHover>Content</Card>)
      const card = screen.getByTestId('card')
      // glowOnHover uses /70 opacity which takes precedence over hoverable's /50
      expect(card).toHaveClass('hover:bg-surface-secondary', 'hover:shadow-glow-cyan', 'hover:border-primary/70')
    })
  })

  describe('Static Glow Colors', () => {
    it('applies cyan glow when glowColor="cyan"', () => {
      render(<Card data-testid="card" glowColor="cyan">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-cyan-md', 'border-primary/60')
    })

    it('applies magenta glow when glowColor="magenta"', () => {
      render(<Card data-testid="card" glowColor="magenta">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-magenta-md', 'border-secondary/60')
    })

    it('applies green glow when glowColor="green"', () => {
      render(<Card data-testid="card" glowColor="green">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-green-lg', 'border-success/60')
    })

    it('applies orange glow when glowColor="orange"', () => {
      render(<Card data-testid="card" glowColor="orange">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-orange-lg', 'border-warning/60')
    })

    it('applies red glow when glowColor="red"', () => {
      render(<Card data-testid="card" glowColor="red">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-red-lg', 'border-error/60')
    })

    it('applies white glow when glowColor="white"', () => {
      render(<Card data-testid="card" glowColor="white">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-white-md', 'border-white/60')
    })

    it('applies rainbow glow when glowColor="rainbow"', () => {
      render(<Card data-testid="card" glowColor="rainbow">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-rainbow', 'border-primary/50')
    })

    it('glowColor takes precedence over glowOnHover', () => {
      render(<Card data-testid="card" glowColor="cyan" glowOnHover>Content</Card>)
      const card = screen.getByTestId('card')
      // Static glow applied, hover glow styles NOT applied
      expect(card).toHaveClass('shadow-glow-cyan-md')
      expect(card).not.toHaveClass('hover:shadow-glow-cyan')
    })
  })

  describe('Glow Intensity', () => {
    it('applies small intensity glow', () => {
      render(<Card data-testid="card" glowColor="cyan" glowIntensity="sm">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-cyan', 'border-primary/40')
    })

    it('applies medium intensity glow (default)', () => {
      render(<Card data-testid="card" glowColor="cyan" glowIntensity="md">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-cyan-md', 'border-primary/60')
    })

    it('applies large intensity glow', () => {
      render(<Card data-testid="card" glowColor="cyan" glowIntensity="lg">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-cyan-lg', 'border-primary/80')
    })

    it('defaults to medium intensity when not specified', () => {
      render(<Card data-testid="card" glowColor="magenta">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-glow-magenta-md', 'border-secondary/60')
    })
  })

  describe('Glow Pulse Animation', () => {
    it('does not apply pulse by default', () => {
      render(<Card data-testid="card" glowColor="cyan">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('animate-glow-pulse')
    })

    it('applies pulse animation when glowPulse is true with glowColor', () => {
      render(<Card data-testid="card" glowColor="cyan" glowPulse>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('animate-glow-pulse')
    })

    it('does not apply pulse without glowColor', () => {
      render(<Card data-testid="card" glowPulse>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('animate-glow-pulse')
    })

    it('applies pulse with different glow colors', () => {
      render(<Card data-testid="card" glowColor="magenta" glowPulse>Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('animate-glow-pulse', 'shadow-glow-magenta-md')
    })
  })

  describe('Children Rendering', () => {
    it('renders string children', () => {
      render(<Card>Simple text</Card>)
      expect(screen.getByText('Simple text')).toBeInTheDocument()
    })

    it('renders JSX children', () => {
      render(
        <Card>
          <span data-testid="child">Child element</span>
        </Card>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('renders multiple children', () => {
      render(
        <Card>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
        </Card>
      )
      expect(screen.getByTestId('first')).toBeInTheDocument()
      expect(screen.getByTestId('second')).toBeInTheDocument()
    })

    it('renders nested Card components', () => {
      render(
        <Card data-testid="outer">
          <Card data-testid="inner">Nested content</Card>
        </Card>
      )
      expect(screen.getByTestId('outer')).toBeInTheDocument()
      expect(screen.getByTestId('inner')).toBeInTheDocument()
      expect(screen.getByText('Nested content')).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('merges custom className with default classes', () => {
      render(
        <Card data-testid="card" className="custom-class">
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
      expect(card).toHaveClass('relative', 'rounded-lg') // base styles preserved
    })

    it('passes through data attributes', () => {
      render(
        <Card data-testid="card" data-custom="value">
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-custom', 'value')
    })

    it('passes through aria attributes', () => {
      render(
        <Card data-testid="card" aria-label="Card label">
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('aria-label', 'Card label')
    })

    it('passes through style props', () => {
      render(
        <Card data-testid="card" style={{ minWidth: '200px' }}>
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveStyle({ minWidth: '200px' })
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations in default state', async () => {
      const { container } = render(<Card>Accessible content</Card>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when interactive', async () => {
      const { container } = render(
        <Card interactive aria-label="Click me">
          Interactive card
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('can receive focus when interactive', () => {
      render(<Card data-testid="card" interactive>Content</Card>)
      const card = screen.getByTestId('card')
      card.focus()
      expect(document.activeElement).toBe(card)
    })

    it('is not focusable when not interactive', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveAttribute('tabIndex')
    })
  })

  describe('Compound Variant Combinations', () => {
    it('combines elevated variant with interactive', () => {
      render(
        <Card data-testid="card" variant="elevated" interactive>
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-lg', 'cursor-pointer')
    })

    it('combines glass variant with glow', () => {
      render(
        <Card data-testid="card" variant="glass" glowOnHover>
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('backdrop-blur-md', 'hover:shadow-glow-cyan')
    })

    it('applies all modifier props together', () => {
      render(
        <Card data-testid="card" hoverable interactive glowOnHover>
          Full featured
        </Card>
      )
      const card = screen.getByTestId('card')
      // All modifiers applied - interactive takes precedence for some classes
      expect(card).toHaveClass(
        'hover:bg-surface-secondary',
        'cursor-pointer',
        'hover:shadow-glow-cyan',
        'active:scale-[0.99]'
      )
      expect(card).toHaveAttribute('role', 'button')
    })
  })
})

describe('CardHeader', () => {
  it('renders children content', () => {
    render(<CardHeader>Header Title</CardHeader>)
    expect(screen.getByText('Header Title')).toBeInTheDocument()
  })

  it('applies header styles', () => {
    render(<CardHeader data-testid="header">Title</CardHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'pb-4')
  })

  it('applies bottom border', () => {
    render(<CardHeader data-testid="header">Title</CardHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('border-b')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardHeader ref={ref}>Title</CardHeader>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    render(
      <CardHeader data-testid="header" className="custom-header">
        Title
      </CardHeader>
    )
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('custom-header', 'pb-4')
  })

  it('has correct displayName', () => {
    expect(CardHeader.displayName).toBe('CardHeader')
  })

  it('renders within Card correctly', () => {
    render(
      <Card>
        <CardHeader data-testid="header">Card Title</CardHeader>
      </Card>
    )
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })
})

describe('CardBody', () => {
  it('renders children content', () => {
    render(<CardBody>Body content</CardBody>)
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('applies body styles', () => {
    render(<CardBody data-testid="body">Content</CardBody>)
    const body = screen.getByTestId('body')
    expect(body).toHaveClass('py-4')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardBody ref={ref}>Content</CardBody>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    render(
      <CardBody data-testid="body" className="custom-body">
        Content
      </CardBody>
    )
    const body = screen.getByTestId('body')
    expect(body).toHaveClass('custom-body', 'py-4')
  })

  it('has correct displayName', () => {
    expect(CardBody.displayName).toBe('CardBody')
  })

  it('renders within Card correctly', () => {
    render(
      <Card>
        <CardBody data-testid="body">Card content</CardBody>
      </Card>
    )
    expect(screen.getByTestId('body')).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('renders children content', () => {
    render(<CardFooter>Footer actions</CardFooter>)
    expect(screen.getByText('Footer actions')).toBeInTheDocument()
  })

  it('applies footer styles', () => {
    render(<CardFooter data-testid="footer">Actions</CardFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('flex', 'items-center', 'pt-4')
  })

  it('applies top border', () => {
    render(<CardFooter data-testid="footer">Actions</CardFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('border-t')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardFooter ref={ref}>Actions</CardFooter>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    render(
      <CardFooter data-testid="footer" className="custom-footer">
        Actions
      </CardFooter>
    )
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('custom-footer', 'pt-4')
  })

  it('has correct displayName', () => {
    expect(CardFooter.displayName).toBe('CardFooter')
  })

  it('renders within Card correctly', () => {
    render(
      <Card>
        <CardFooter data-testid="footer">
          <button type="button">Action</button>
        </CardFooter>
      </Card>
    )
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })
})

describe('Card Composition', () => {
  it('renders complete card with all subcomponents', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <h2>Card Title</h2>
        </CardHeader>
        <CardBody data-testid="body">
          <p>Main content goes here</p>
        </CardBody>
        <CardFooter data-testid="footer">
          <button type="button">Submit</button>
        </CardFooter>
      </Card>
    )

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('body')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument()
    expect(screen.getByText('Main content goes here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('has no accessibility violations with full composition', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <h2>Accessible Card</h2>
        </CardHeader>
        <CardBody>
          <p>This is accessible content</p>
        </CardBody>
        <CardFooter>
          <button type="button">Action</button>
        </CardFooter>
      </Card>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('works without CardHeader', () => {
    render(
      <Card data-testid="card">
        <CardBody>Content without header</CardBody>
      </Card>
    )
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Content without header')).toBeInTheDocument()
  })

  it('works without CardFooter', () => {
    render(
      <Card data-testid="card">
        <CardHeader>Title</CardHeader>
        <CardBody>Content without footer</CardBody>
      </Card>
    )
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Content without footer')).toBeInTheDocument()
  })

  it('works with only Card and direct content', () => {
    render(<Card data-testid="card">Simple content</Card>)
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Simple content')).toBeInTheDocument()
  })
})
