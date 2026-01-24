/**
 * Interaction Test Template
 *
 * This file serves as a template for creating Storybook interaction tests.
 * Copy this file to your component's stories directory and modify as needed.
 *
 * @see https://storybook.js.org/docs/writing-tests/interaction-testing
 */

import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, fn, waitFor } from '@storybook/test';

// =============================================================================
// TEMPLATE - Replace with your component
// =============================================================================

// 1. Import your component
// import { YourComponent } from './YourComponent';

// Example component for template purposes
function ExampleButton({
  onClick,
  disabled = false,
  loading = false,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

// =============================================================================
// META - Component configuration
// =============================================================================

const meta: Meta<typeof ExampleButton> = {
  title: 'Templates/Interaction Test',
  component: ExampleButton,
  tags: ['autodocs'],
  parameters: {
    // Layout for centered display
    layout: 'centered',
    // Documentation description
    docs: {
      description: {
        component: 'Template component for interaction test examples.',
      },
    },
  },
  // Default args for all stories
  args: {
    children: 'Click Me',
    disabled: false,
    loading: false,
  },
  // ArgTypes for controls
  argTypes: {
    onClick: { action: 'clicked' },
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ExampleButton>;

// =============================================================================
// BASIC INTERACTION TEST
// =============================================================================

/**
 * Basic click interaction test.
 *
 * This story demonstrates:
 * - Finding elements by role
 * - Simulating user clicks
 * - Asserting callback was called
 */
export const BasicClick: Story = {
  args: {
    onClick: fn(),
    children: 'Click Me',
  },
  play: async ({ canvasElement, args }) => {
    // Step 1: Get the canvas (scoped query container)
    const canvas = within(canvasElement);

    // Step 2: Find the button by its accessible role
    const button = canvas.getByRole('button', { name: /click me/i });

    // Step 3: Verify initial state
    expect(button).toBeVisible();
    expect(button).toBeEnabled();

    // Step 4: Simulate user click
    await userEvent.click(button);

    // Step 5: Assert the callback was called
    expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

// =============================================================================
// MULTIPLE CLICKS TEST
// =============================================================================

/**
 * Multiple click interaction test.
 *
 * This story demonstrates:
 * - Multiple sequential interactions
 * - Counting callback invocations
 */
export const MultipleClicks: Story = {
  args: {
    onClick: fn(),
    children: 'Click Multiple Times',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Click 3 times
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // Verify click count
    expect(args.onClick).toHaveBeenCalledTimes(3);
  },
};

// =============================================================================
// DISABLED STATE TEST
// =============================================================================

/**
 * Disabled button interaction test.
 *
 * This story demonstrates:
 * - Testing disabled state
 * - Verifying clicks are blocked
 */
export const DisabledButton: Story = {
  args: {
    onClick: fn(),
    disabled: true,
    children: 'Disabled Button',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify button is disabled
    expect(button).toBeDisabled();

    // Attempt to click (should not trigger callback)
    await userEvent.click(button);

    // Verify callback was NOT called
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

// =============================================================================
// LOADING STATE TEST
// =============================================================================

/**
 * Loading state interaction test.
 *
 * This story demonstrates:
 * - Testing loading states
 * - Checking aria-busy attribute
 * - Verifying text content changes
 */
export const LoadingState: Story = {
  args: {
    onClick: fn(),
    loading: true,
    children: 'Submit',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify button shows loading state
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Loading...');

    // Click should not work
    await userEvent.click(button);
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

// =============================================================================
// KEYBOARD INTERACTION TEST
// =============================================================================

/**
 * Keyboard interaction test.
 *
 * This story demonstrates:
 * - Simulating keyboard navigation
 * - Testing Enter key activation
 * - Testing Space key activation
 */
export const KeyboardInteraction: Story = {
  args: {
    onClick: fn(),
    children: 'Press Enter or Space',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Tab to the button
    await userEvent.tab();
    expect(button).toHaveFocus();

    // Press Enter
    await userEvent.keyboard('{Enter}');
    expect(args.onClick).toHaveBeenCalledTimes(1);

    // Press Space
    await userEvent.keyboard(' ');
    expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

// =============================================================================
// HOVER INTERACTION TEST
// =============================================================================

/**
 * Hover interaction test.
 *
 * This story demonstrates:
 * - Simulating mouse hover
 * - Testing hover states
 */
export const HoverInteraction: Story = {
  args: {
    children: 'Hover Over Me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Hover over button
    await userEvent.hover(button);

    // Verify hover state (you would check CSS classes or styles)
    expect(button).toBeVisible();

    // Unhover
    await userEvent.unhover(button);

    // Button should still be visible
    expect(button).toBeVisible();
  },
};

// =============================================================================
// ASYNC INTERACTION TEST
// =============================================================================

/**
 * Async interaction test with waitFor.
 *
 * This story demonstrates:
 * - Waiting for async state changes
 * - Using waitFor for assertions
 */
export const AsyncInteraction: Story = {
  args: {
    children: 'Trigger Async Action',
  },
  render: (args) => {
    const [clicked, setClicked] = React.useState(false);
    const [processing, setProcessing] = React.useState(false);

    const handleClick = () => {
      setProcessing(true);
      setTimeout(() => {
        setClicked(true);
        setProcessing(false);
      }, 500);
    };

    return (
      <div>
        <ExampleButton
          {...args}
          onClick={handleClick}
          loading={processing}
        />
        {clicked && <p data-testid="result">Action completed!</p>}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Initial state - no result
    expect(canvas.queryByTestId('result')).not.toBeInTheDocument();

    // Click button
    await userEvent.click(button);

    // Wait for result to appear
    await waitFor(
      () => {
        const result = canvas.getByTestId('result');
        expect(result).toBeVisible();
        expect(result).toHaveTextContent('Action completed!');
      },
      { timeout: 2000 }
    );
  },
};

// Need to import React for the render function
import React from 'react';

// =============================================================================
// FORM INTERACTION TEST
// =============================================================================

/**
 * Form interaction test example.
 *
 * This story demonstrates:
 * - Form input interactions
 * - Typing text
 * - Form submission
 */
export const FormInteraction: Story = {
  render: () => {
    const [submitted, setSubmitted] = React.useState(false);
    const [name, setName] = React.useState('');

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <ExampleButton>Submit</ExampleButton>
        {submitted && <p data-testid="submitted">Submitted: {name}</p>}
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Type in the input
    const input = canvas.getByLabelText(/name/i);
    await userEvent.type(input, 'John Doe');

    // Verify input value
    expect(input).toHaveValue('John Doe');

    // Submit form
    const submitButton = canvas.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    // Verify submission
    await waitFor(() => {
      const result = canvas.getByTestId('submitted');
      expect(result).toHaveTextContent('Submitted: John Doe');
    });
  },
};
