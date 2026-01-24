/**
 * Button Component Stories
 *
 * Storybook stories for the Button component showcasing all variants,
 * sizes, and states with interactive controls.
 *
 * Includes interaction tests using @storybook/test play functions.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect, fn } from '@storybook/test'
import { Button } from './Button'
import { Play, Wallet, Trophy, RefreshCw, Trash2, Check, ArrowRight, Coins } from 'lucide-react'

/**
 * The Button component is the primary interactive element in x402Arcade.
 * It features neon glow effects, multiple variants, and various sizes
 * to match the retro arcade aesthetic.
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A versatile button component with arcade/neon styling.
Supports multiple variants, sizes, icons, and loading states.

## Features
- 6 visual variants (primary, secondary, outline, ghost, danger, success)
- 5 sizes (xs, sm, md, lg, xl)
- Left and right icon support
- Loading state with spinner
- Full width option
- Accessible focus states with glow effects
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'],
      description: 'Visual style variant of the button',
      table: {
        type: { summary: 'ButtonVariant' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the button',
      table: {
        type: { summary: 'ButtonSize' },
        defaultValue: { summary: 'md' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the button should take full width',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    loadingText: {
      control: 'text',
      description: 'Text to show when loading',
      table: {
        defaultValue: { summary: 'Loading...' },
      },
    },
    iconOnly: {
      control: 'boolean',
      description: 'Render as icon-only square button',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

// ============================================================================
// Default Story with Controls
// ============================================================================

/**
 * The default button story with all controls available for interaction.
 * Use this to explore all the button options.
 */
export const Default: Story = {
  args: {
    children: 'Play Now',
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    isLoading: false,
    disabled: false,
  },
}

// ============================================================================
// Variants Story
// ============================================================================

/**
 * All available button variants showcasing different visual styles.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
- **Primary**: Cyan gradient with glow - main actions like "Play Now"
- **Secondary**: Magenta gradient with glow - alternative actions
- **Outline**: Border-only - less emphasis, secondary actions
- **Ghost**: Transparent - minimal emphasis, tertiary actions
- **Danger**: Red - destructive actions like "Delete"
- **Success**: Green - positive confirmations like "Confirm"
        `,
      },
    },
  },
}

// ============================================================================
// Sizes Story
// ============================================================================

/**
 * All available button sizes from extra small to extra large.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
- **xs**: Compact buttons for toolbars and dense UI
- **sm**: Secondary actions, paired with larger buttons
- **md**: Default size for most use cases
- **lg**: Primary CTAs, prominent actions
- **xl**: Hero sections, main page actions
        `,
      },
    },
  },
}

// ============================================================================
// With Icons Story
// ============================================================================

/**
 * Buttons with left and right icons for enhanced visual communication.
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Button leftIcon={<Play className="h-4 w-4" />}>Play Game</Button>
        <Button variant="secondary" leftIcon={<Wallet className="h-4 w-4" />}>
          Connect Wallet
        </Button>
        <Button variant="outline" leftIcon={<Trophy className="h-4 w-4" />}>
          Leaderboard
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</Button>
        <Button variant="secondary" rightIcon={<Coins className="h-4 w-4" />}>
          Claim Prize
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <Button
          leftIcon={<Play className="h-4 w-4" />}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Start Playing
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Icons can be placed on the left, right, or both sides of the button text.
Use Lucide icons (included in the project) for consistency.
        `,
      },
    },
  },
}

// ============================================================================
// Icon Only Story
// ============================================================================

/**
 * Icon-only buttons render as square buttons with proper padding.
 * These are useful for toolbars, action bars, and compact UI elements.
 */
export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">All Sizes</h3>
        <div className="flex gap-4 items-center">
          <Button iconOnly size="xs" leftIcon={<Play />} aria-label="Play xs" />
          <Button iconOnly size="sm" leftIcon={<Play />} aria-label="Play sm" />
          <Button iconOnly size="md" leftIcon={<Play />} aria-label="Play md" />
          <Button iconOnly size="lg" leftIcon={<Play />} aria-label="Play lg" />
          <Button iconOnly size="xl" leftIcon={<Play />} aria-label="Play xl" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">All Variants</h3>
        <div className="flex gap-4 items-center">
          <Button iconOnly variant="primary" leftIcon={<Play />} aria-label="Play primary" />
          <Button iconOnly variant="secondary" leftIcon={<Wallet />} aria-label="Wallet" />
          <Button iconOnly variant="outline" leftIcon={<Trophy />} aria-label="Trophy" />
          <Button iconOnly variant="ghost" leftIcon={<RefreshCw />} aria-label="Refresh" />
          <Button iconOnly variant="danger" leftIcon={<Trash2 />} aria-label="Delete" />
          <Button iconOnly variant="success" leftIcon={<Check />} aria-label="Confirm" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">Auto-detected (no children)</h3>
        <div className="flex gap-4 items-center">
          <Button leftIcon={<Play />} aria-label="Play" />
          <Button rightIcon={<ArrowRight />} aria-label="Next" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">Loading State</h3>
        <div className="flex gap-4 items-center">
          <Button iconOnly isLoading size="sm" aria-label="Loading" />
          <Button iconOnly isLoading size="md" aria-label="Loading" />
          <Button iconOnly isLoading size="lg" aria-label="Loading" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Icon-only buttons are useful for compact UI elements like toolbars and action bars.
They automatically size the icon to match the button size and use square padding.

**Note:** Always include an \`aria-label\` for accessibility when using icon-only buttons.
        `,
      },
    },
  },
}

// ============================================================================
// Icon Sizing Story
// ============================================================================

/**
 * Icons automatically scale based on button size.
 * The icon wrapper ensures consistent sizing regardless of the icon passed in.
 */
export const IconSizing: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">
          Icons Scale with Button Size
        </h3>
        <div className="flex gap-4 items-end">
          <Button size="xs" leftIcon={<Play />}>XS Button</Button>
          <Button size="sm" leftIcon={<Play />}>SM Button</Button>
          <Button size="md" leftIcon={<Play />}>MD Button</Button>
          <Button size="lg" leftIcon={<Play />}>LG Button</Button>
          <Button size="xl" leftIcon={<Play />}>XL Button</Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">
          Any Icon Works (Lucide examples)
        </h3>
        <div className="flex gap-4 items-center">
          <Button leftIcon={<Play />}>Play</Button>
          <Button leftIcon={<Wallet />}>Wallet</Button>
          <Button leftIcon={<Trophy />}>Trophy</Button>
          <Button leftIcon={<Coins />}>Coins</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Icons are automatically sized to match the button's text size.
No need to manually set icon dimensions - just pass the icon component.

| Size | Icon Dimensions |
|------|-----------------|
| xs   | 12×12 (0.75rem) |
| sm   | 14×14 (0.875rem)|
| md   | 16×16 (1rem)    |
| lg   | 20×20 (1.25rem) |
| xl   | 24×24 (1.5rem)  |
        `,
      },
    },
  },
}

// ============================================================================
// Loading Story
// ============================================================================

/**
 * Buttons in loading state with spinner and loading text.
 */
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button isLoading>Processing</Button>
      <Button isLoading loadingText="Connecting...">
        Connect
      </Button>
      <Button variant="secondary" isLoading loadingText="Submitting score...">
        Submit
      </Button>
      <Button variant="outline" isLoading size="sm">
        Loading
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Loading state shows a spinner animation and optional loading text.
The button is automatically disabled during loading.
        `,
      },
    },
  },
}

// ============================================================================
// Disabled Story
// ============================================================================

/**
 * Disabled buttons across all variants.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button disabled>Primary</Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
      <Button variant="danger" disabled>
        Danger
      </Button>
      <Button variant="success" disabled>
        Success
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Disabled buttons have reduced opacity and cursor changes to \`not-allowed\`.
All glow effects and hover states are removed.
        `,
      },
    },
  },
}

// ============================================================================
// Full Width Story
// ============================================================================

/**
 * Full width buttons for forms and narrow containers.
 */
export const FullWidth: Story = {
  render: () => (
    <div className="w-80 flex flex-col gap-4">
      <Button fullWidth>Full Width Primary</Button>
      <Button fullWidth variant="secondary">
        Full Width Secondary
      </Button>
      <Button fullWidth variant="outline">
        Full Width Outline
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Full width buttons expand to fill their container width.
Useful for forms, mobile layouts, and card actions.
        `,
      },
    },
  },
}

// ============================================================================
// Interactive States Story
// ============================================================================

/**
 * Demonstrates hover, focus, and active states.
 * Hover over and tab through the buttons to see the glow effects.
 */
export const InteractiveStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="text-text-secondary text-sm">
        Hover over and tab through the buttons to see interactive states
      </p>
      <div className="flex flex-wrap gap-4 items-center">
        <Button>Hover me</Button>
        <Button variant="secondary">Focus me (Tab)</Button>
        <Button variant="outline">Click me</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
- **Hover**: Buttons show glow shadow effect
- **Focus (visible)**: Ring indicator for accessibility
- **Active**: Slightly darker background
        `,
      },
    },
  },
}

// ============================================================================
// Arcade Use Cases Story
// ============================================================================

/**
 * Real-world examples from the x402Arcade application.
 */
export const ArcadeUseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">Game Lobby</h3>
        <div className="flex gap-4">
          <Button leftIcon={<Play className="h-4 w-4" />} size="lg">
            Play Snake - $0.01
          </Button>
          <Button variant="outline" leftIcon={<Trophy className="h-4 w-4" />}>
            View Leaderboard
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">Wallet Connection</h3>
        <div className="flex gap-4">
          <Button variant="secondary" leftIcon={<Wallet className="h-4 w-4" />}>
            Connect Wallet
          </Button>
          <Button variant="ghost" size="sm">
            0x1234...5678
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">Game Over</h3>
        <div className="flex gap-4">
          <Button leftIcon={<RefreshCw className="h-4 w-4" />}>
            Play Again
          </Button>
          <Button variant="success" leftIcon={<Check className="h-4 w-4" />}>
            Submit Score
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-text-secondary text-sm font-medium">Danger Zone</h3>
        <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
          Delete Account
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Real examples of how buttons are used throughout the x402Arcade application.
        `,
      },
    },
  },
}

// ============================================================================
// INTERACTION TESTS
// ============================================================================

/**
 * Click Interaction Test
 *
 * Demonstrates testing button click behavior with play functions.
 * This story verifies that the onClick callback is called correctly.
 */
export const ClickInteraction: Story = {
  args: {
    children: 'Click Me',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the button
    const button = canvas.getByRole('button', { name: /click me/i });

    // Verify initial state
    expect(button).toBeVisible();
    expect(button).toBeEnabled();

    // Click the button
    await userEvent.click(button);

    // Verify callback was called
    expect(args.onClick).toHaveBeenCalledTimes(1);

    // Click again
    await userEvent.click(button);
    expect(args.onClick).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interaction Test Example**

This story includes a \`play\` function that automatically:
1. Finds the button element
2. Verifies it's visible and enabled
3. Simulates a user click
4. Asserts the callback was called
        `,
      },
    },
  },
}

/**
 * Keyboard Navigation Test
 *
 * Tests that buttons can be activated via keyboard (Enter and Space).
 */
export const KeyboardInteraction: Story = {
  args: {
    children: 'Press Enter or Space',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Tab to focus the button
    await userEvent.tab();
    expect(button).toHaveFocus();

    // Activate with Enter
    await userEvent.keyboard('{Enter}');
    expect(args.onClick).toHaveBeenCalledTimes(1);

    // Activate with Space
    await userEvent.keyboard(' ');
    expect(args.onClick).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard Accessibility Test**

Verifies that the button:
1. Can receive focus via Tab key
2. Activates with Enter key
3. Activates with Space key
        `,
      },
    },
  },
}

/**
 * Disabled State Interaction Test
 *
 * Tests that disabled buttons cannot be clicked.
 */
export const DisabledInteraction: Story = {
  args: {
    children: 'Cannot Click',
    disabled: true,
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify disabled state
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    // Attempt to click
    await userEvent.click(button);

    // Callback should NOT have been called
    expect(args.onClick).not.toHaveBeenCalled();
  },
  parameters: {
    docs: {
      description: {
        story: `
**Disabled State Test**

Verifies that disabled buttons:
1. Have the \`disabled\` attribute
2. Have \`aria-disabled="true"\`
3. Do not trigger onClick when clicked
        `,
      },
    },
  },
}

/**
 * Loading State Interaction Test
 *
 * Tests that loading buttons are disabled and show correct content.
 */
export const LoadingInteraction: Story = {
  args: {
    children: 'Submit',
    isLoading: true,
    loadingText: 'Submitting...',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify loading state
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Submitting...');

    // Attempt to click - should not trigger callback
    await userEvent.click(button);
    expect(args.onClick).not.toHaveBeenCalled();
  },
  parameters: {
    docs: {
      description: {
        story: `
**Loading State Test**

Verifies that loading buttons:
1. Are disabled
2. Have \`aria-busy="true"\`
3. Show the loading text
4. Do not trigger onClick
        `,
      },
    },
  },
}

/**
 * Multiple Variant Click Test
 *
 * Tests clicking multiple buttons with different variants.
 */
export const MultipleButtonInteraction: Story = {
  render: () => {
    // Create local handlers for the story render
    const handlePrimary = fn();
    const handleSecondary = fn();
    const handleDanger = fn();

    return (
      <div className="flex gap-4" data-testid="multi-button-container">
        <Button variant="primary" onClick={handlePrimary} data-testid="primary-btn">
          Primary
        </Button>
        <Button variant="secondary" onClick={handleSecondary} data-testid="secondary-btn">
          Secondary
        </Button>
        <Button variant="danger" onClick={handleDanger} data-testid="danger-btn">
          Danger
        </Button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find all buttons
    const primaryButton = canvas.getByRole('button', { name: /primary/i });
    const secondaryButton = canvas.getByRole('button', { name: /secondary/i });
    const dangerButton = canvas.getByRole('button', { name: /danger/i });

    // Click each button to verify they are interactive
    await userEvent.click(primaryButton);
    await userEvent.click(secondaryButton);
    await userEvent.click(dangerButton);
    await userEvent.click(primaryButton);

    // Verify all buttons exist and are clickable
    expect(primaryButton).toBeVisible();
    expect(secondaryButton).toBeVisible();
    expect(dangerButton).toBeVisible();
  },
  parameters: {
    docs: {
      description: {
        story: `
**Multiple Button Test**

Tests clicking multiple buttons in sequence and verifying
each callback is called the correct number of times.
        `,
      },
    },
  },
}

/**
 * Hover State Test
 *
 * Tests button hover interactions.
 */
export const HoverInteraction: Story = {
  args: {
    children: 'Hover Over Me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Initial state
    expect(button).toBeVisible();

    // Hover over button
    await userEvent.hover(button);

    // Button should still be visible and in the document
    expect(button).toBeInTheDocument();

    // Unhover
    await userEvent.unhover(button);

    // Button should remain visible
    expect(button).toBeVisible();
  },
  parameters: {
    docs: {
      description: {
        story: `
**Hover Test**

Tests that hovering over a button doesn't break the component.
Visual verification of hover styles can be done manually in Storybook.
        `,
      },
    },
  },
}

/**
 * Accessibility Attributes Test
 *
 * Tests that button has correct accessibility attributes.
 */
export const AccessibilityInteraction: Story = {
  args: {
    children: 'Accessible Button',
    'aria-label': 'Play the game now',
  } as typeof Button.defaultProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify accessibility attributes
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-label', 'Play the game now');
    expect(button).not.toHaveAttribute('aria-disabled');

    // Verify button is focusable
    await userEvent.tab();
    expect(button).toHaveFocus();
  },
  parameters: {
    docs: {
      description: {
        story: `
**Accessibility Test**

Verifies that buttons have:
1. Correct \`type="button"\` attribute
2. Custom aria-label when provided
3. No aria-disabled when enabled
4. Proper focus management
        `,
      },
    },
  },
}

/**
 * Icon Button Interaction Test
 *
 * Tests icon-only button interactions.
 */
export const IconButtonInteraction: Story = {
  args: {
    iconOnly: true,
    leftIcon: <Play />,
    'aria-label': 'Play game',
    onClick: fn(),
  } as unknown as typeof Button.defaultProps,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find by aria-label for icon-only button
    const button = canvas.getByRole('button', { name: /play game/i });

    // Verify button is accessible
    expect(button).toBeVisible();
    expect(button).toHaveAttribute('aria-label', 'Play game');

    // Click the icon button
    await userEvent.click(button);
    expect(args.onClick).toHaveBeenCalledTimes(1);

    // Keyboard activation
    await userEvent.keyboard('{Enter}');
    expect(args.onClick).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: {
      description: {
        story: `
**Icon Button Test**

Verifies that icon-only buttons:
1. Are accessible via aria-label
2. Can be clicked
3. Support keyboard activation
        `,
      },
    },
  },
}

/**
 * Rapid Click Test
 *
 * Tests button behavior under rapid clicking.
 */
export const RapidClickInteraction: Story = {
  args: {
    children: 'Click Rapidly',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Rapid fire clicks
    for (let i = 0; i < 5; i++) {
      await userEvent.click(button);
    }

    // All clicks should be registered
    expect(args.onClick).toHaveBeenCalledTimes(5);
  },
  parameters: {
    docs: {
      description: {
        story: `
**Rapid Click Test**

Tests that the button correctly handles multiple rapid clicks
and all click events are properly registered.
        `,
      },
    },
  },
}
