/**
 * Button Component Tests
 *
 * Comprehensive unit tests for the Button component covering all variants,
 * sizes, states, and interactions using Vitest and Testing Library.
 */

import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../src/components/ui/Button/Button';
import { renderSimple, screen, userEvent } from '../utils';
import { Play, Wallet, Trophy } from 'lucide-react';

describe('Button Component', () => {
  describe('Default Render', () => {
    it('renders with default props', () => {
      renderSimple(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders children correctly', () => {
      renderSimple(<Button>Test Button</Button>);

      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('has default variant of primary', () => {
      renderSimple(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      // Primary variant has cyan glow classes
      expect(button).toHaveClass('bg-gradient-to-r');
    });

    it('has default size of md', () => {
      renderSimple(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });
  });

  describe('Variant Rendering', () => {
    it('renders primary variant with gradient and cyan glow', () => {
      renderSimple(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r');
      expect(button).toHaveClass('from-primary');
      expect(button).toHaveClass('hover:shadow-glow-cyan');
    });

    it('renders secondary variant with magenta glow', () => {
      renderSimple(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r');
      expect(button).toHaveClass('from-secondary');
      expect(button).toHaveClass('hover:shadow-glow-magenta');
    });

    it('renders outline variant with border', () => {
      renderSimple(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-primary');
    });

    it('renders ghost variant with transparent background', () => {
      renderSimple(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('text-text-secondary');
    });

    it('renders danger variant with error color', () => {
      renderSimple(<Button variant="danger">Danger</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-error');
      expect(button).toHaveClass('hover:shadow-glow-red');
    });

    it('renders success variant with success color', () => {
      renderSimple(<Button variant="success">Success</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-success');
      expect(button).toHaveClass('hover:shadow-glow-green');
    });
  });

  describe('Size Rendering', () => {
    it('renders xs size correctly', () => {
      renderSimple(<Button size="xs">XS</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-2');
      expect(button).toHaveClass('py-1');
      expect(button).toHaveClass('text-xs');
    });

    it('renders sm size correctly', () => {
      renderSimple(<Button size="sm">SM</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-sm');
    });

    it('renders md size correctly', () => {
      renderSimple(<Button size="md">MD</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-base');
    });

    it('renders lg size correctly', () => {
      renderSimple(<Button size="lg">LG</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-lg');
    });

    it('renders xl size correctly', () => {
      renderSimple(<Button size="xl">XL</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-8');
      expect(button).toHaveClass('py-4');
      expect(button).toHaveClass('text-xl');
    });
  });

  describe('Loading State Behavior', () => {
    it('shows loading spinner when isLoading is true', () => {
      renderSimple(<Button isLoading>Submit</Button>);

      const button = screen.getByRole('button');
      // Check for spinner SVG
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('shows loading text when isLoading is true', () => {
      renderSimple(
        <Button isLoading loadingText="Submitting...">
          Submit
        </Button>
      );

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    it('uses default loading text when loadingText is not provided', () => {
      renderSimple(<Button isLoading>Submit</Button>);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('disables button when isLoading is true', () => {
      renderSimple(<Button isLoading>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('sets aria-busy to true when loading', () => {
      renderSimple(<Button isLoading>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('does not trigger onClick when loading', async () => {
      const handleClick = vi.fn();
      renderSimple(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State Behavior', () => {
    it('applies disabled attribute when disabled is true', () => {
      renderSimple(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('sets aria-disabled to true when disabled', () => {
      renderSimple(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies reduced opacity when disabled', () => {
      renderSimple(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('shows not-allowed cursor when disabled', () => {
      renderSimple(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('does not trigger onClick when disabled', async () => {
      const handleClick = vi.fn();
      renderSimple(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Handler', () => {
    it('calls onClick when button is clicked', async () => {
      const handleClick = vi.fn();
      renderSimple(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick multiple times for multiple clicks', async () => {
      const handleClick = vi.fn();
      renderSimple(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('passes event to onClick handler', async () => {
      const handleClick = vi.fn();
      renderSimple(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
        })
      );
    });

    it('triggers onClick on Enter key press', async () => {
      const handleClick = vi.fn();
      renderSimple(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('triggers onClick on Space key press', async () => {
      const handleClick = vi.fn();
      renderSimple(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Rendering', () => {
    it('renders left icon when provided', () => {
      renderSimple(
        <Button leftIcon={<Play data-testid="play-icon" />}>Play</Button>
      );

      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });

    it('renders right icon when provided', () => {
      renderSimple(
        <Button rightIcon={<Trophy data-testid="trophy-icon" />}>
          Leaderboard
        </Button>
      );

      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    });

    it('renders both left and right icons when provided', () => {
      renderSimple(
        <Button
          leftIcon={<Play data-testid="play-icon" />}
          rightIcon={<Trophy data-testid="trophy-icon" />}
        >
          Game
        </Button>
      );

      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    });

    it('renders icon-only button when iconOnly is true', () => {
      renderSimple(
        <Button
          iconOnly
          leftIcon={<Wallet data-testid="wallet-icon" />}
          aria-label="Connect wallet"
        />
      );

      const button = screen.getByRole('button', { name: /connect wallet/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
      // Icon-only uses square padding
      expect(button).toHaveClass('p-2');
    });

    it('auto-detects icon-only mode when no children and icon provided', () => {
      renderSimple(
        <Button
          leftIcon={<Play data-testid="play-icon" />}
          aria-label="Play"
        />
      );

      const button = screen.getByRole('button', { name: /play/i });
      // Should have icon-only padding
      expect(button).toHaveClass('p-2');
    });

    it('wraps icons in icon wrapper with correct sizing', () => {
      renderSimple(
        <Button size="lg" leftIcon={<Play data-testid="play-icon" />}>
          Play
        </Button>
      );

      const iconWrapper = screen.getByTestId('play-icon').parentElement;
      expect(iconWrapper).toHaveClass('h-5');
      expect(iconWrapper).toHaveClass('w-5');
    });

    it('does not show icon when loading, shows spinner instead', () => {
      renderSimple(
        <Button
          isLoading
          leftIcon={<Play data-testid="play-icon" />}
        >
          Play
        </Button>
      );

      expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
      const spinner = screen.getByRole('button').querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Accessibility Attributes', () => {
    it('has correct type attribute', () => {
      renderSimple(<Button>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('allows type to be overridden', () => {
      renderSimple(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('accepts and applies aria-label', () => {
      renderSimple(
        <Button aria-label="Close dialog">X</Button>
      );

      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('accepts and applies aria-describedby', () => {
      renderSimple(
        <>
          <span id="description">This button submits the form</span>
          <Button aria-describedby="description">Submit</Button>
        </>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('is focusable', () => {
      renderSimple(<Button>Focus me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has focus-visible ring styles', () => {
      renderSimple(<Button>Focus me</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('sets aria-busy correctly when not loading', () => {
      renderSimple(<Button>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('sets aria-disabled correctly when not disabled', () => {
      renderSimple(<Button>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'false');
    });
  });

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      renderSimple(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('does not apply full width class when fullWidth is false', () => {
      renderSimple(<Button fullWidth={false}>Normal Width</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Custom className', () => {
    it('accepts and applies custom className', () => {
      renderSimple(<Button className="my-custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-custom-class');
    });

    it('merges custom className with default classes', () => {
      renderSimple(<Button className="my-custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      // Has custom class
      expect(button).toHaveClass('my-custom-class');
      // Still has default classes
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      renderSimple(<Button ref={ref}>Ref Test</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toContain('Ref Test');
    });
  });

  describe('Transitions and Animations', () => {
    it('has transition classes applied', () => {
      renderSimple(<Button>Animated</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });
  });

  describe('Layout and Styling', () => {
    it('is displayed as inline-flex', () => {
      renderSimple(<Button>Flex Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
    });

    it('centers content', () => {
      renderSimple(<Button>Centered</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('has gap between icon and text', () => {
      renderSimple(<Button>Flex Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('gap-2');
    });

    it('prevents text selection', () => {
      renderSimple(<Button>No Select</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('select-none');
    });
  });
});
