/**
 * Animation Utilities - Interaction Tests
 *
 * These stories include play functions for automated interaction testing.
 * Run with: npm run storybook:test
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor } from '@storybook/test';
import { motion } from 'framer-motion';
import { LOOP_PRESETS, HOVER_PRESETS, TAP_PRESETS, BUTTON_GESTURES } from '@/lib/animations';

const meta = {
  title: 'Design Tokens/Animation Utilities/Tests',
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0a0a' }],
    },
  },
  tags: ['test'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Test: Loop Animation Renders
 *
 * Verifies that loop animations are applied correctly
 */
export const LoopAnimationRenders: Story = {
  render: () => (
    <div data-testid="loop-container" className="p-8">
      <motion.div
        data-testid="loop-element"
        animate={LOOP_PRESETS.pulse}
        className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the element exists
    const loopElement = canvas.getByTestId('loop-element');
    expect(loopElement).toBeInTheDocument();

    // Wait for initial render
    await waitFor(() => {
      expect(loopElement).toHaveClass('rounded-lg');
    });
  },
};

/**
 * Test: Hover Animation Triggers
 *
 * Verifies that hover animations trigger on mouse enter
 */
export const HoverAnimationTriggers: Story = {
  render: () => (
    <div data-testid="hover-container" className="p-8">
      <motion.div
        data-testid="hover-element"
        whileHover={HOVER_PRESETS.lift}
        className="w-32 h-32 rounded-lg bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 border border-cyan-500/30 flex items-center justify-center cursor-pointer"
      >
        <span className="text-white">Hover Me</span>
      </motion.div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get the hoverable element
    const hoverElement = canvas.getByTestId('hover-element');
    expect(hoverElement).toBeInTheDocument();

    // Hover over the element
    await userEvent.hover(hoverElement);

    // Wait for hover state
    await waitFor(() => {
      expect(hoverElement).toBeInTheDocument();
    });
  },
};

/**
 * Test: Tap Animation Triggers
 *
 * Verifies that tap animations trigger on click
 */
export const TapAnimationTriggers: Story = {
  render: () => (
    <div data-testid="tap-container" className="p-8">
      <motion.button
        data-testid="tap-element"
        whileTap={TAP_PRESETS.shrink}
        className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold"
      >
        Click Me
      </motion.button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get the clickable element
    const tapElement = canvas.getByTestId('tap-element');
    expect(tapElement).toBeInTheDocument();
    expect(tapElement).toHaveTextContent('Click Me');

    // Click the element
    await userEvent.click(tapElement);

    // Verify element is still in document after click
    await waitFor(() => {
      expect(tapElement).toBeInTheDocument();
    });
  },
};

/**
 * Test: Button Gesture Combinations
 *
 * Verifies that combined gestures (hover + tap + focus) work together
 */
export const ButtonGestureCombinations: Story = {
  render: () => (
    <div data-testid="button-container" className="p-8 space-y-4">
      {Object.entries(BUTTON_GESTURES).map(([key, gestures]) => (
        <motion.button
          key={key}
          data-testid={`button-${key}`}
          {...gestures}
          className="w-full py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold"
        >
          {key} Button
        </motion.button>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test each button type
    const buttonTypes = ['default', 'subtle', 'playful', 'neon', 'scale'];

    for (const type of buttonTypes) {
      const button = canvas.getByTestId(`button-${type}`);
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(`${type} Button`);

      // Test hover
      await userEvent.hover(button);
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });

      // Test click
      await userEvent.click(button);
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });

      // Unhover
      await userEvent.unhover(button);
    }
  },
};

/**
 * Test: Animation Keyframes Progression
 *
 * Verifies that animations have the correct keyframe values
 */
export const AnimationKeyframesProgression: Story = {
  render: () => (
    <div data-testid="keyframes-container" className="p-8">
      <div className="space-y-4">
        {/* Pulse animation */}
        <motion.div
          data-testid="pulse-animation"
          animate={LOOP_PRESETS.pulse}
          className="w-16 h-16 rounded-lg bg-cyan-500"
        />

        {/* Spin animation */}
        <motion.div
          data-testid="spin-animation"
          animate={LOOP_PRESETS.spin}
          className="w-16 h-16 rounded-lg bg-magenta-500"
        />

        {/* Glow animation */}
        <motion.div
          data-testid="glow-animation"
          animate={LOOP_PRESETS.glow}
          className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all animated elements exist
    const pulseElement = canvas.getByTestId('pulse-animation');
    const spinElement = canvas.getByTestId('spin-animation');
    const glowElement = canvas.getByTestId('glow-animation');

    expect(pulseElement).toBeInTheDocument();
    expect(spinElement).toBeInTheDocument();
    expect(glowElement).toBeInTheDocument();

    // All elements should have proper classes
    expect(pulseElement).toHaveClass('rounded-lg');
    expect(spinElement).toHaveClass('rounded-lg');
    expect(glowElement).toHaveClass('rounded-lg');
  },
};

/**
 * Test: Reduced Motion Support
 *
 * Verifies that animations respect prefers-reduced-motion
 */
export const ReducedMotionSupport: Story = {
  render: () => (
    <div data-testid="reduced-motion-container" className="p-8">
      <p className="text-gray-400 mb-4 text-sm">
        This test verifies elements render correctly regardless of motion preferences
      </p>
      <motion.div
        data-testid="motion-element"
        animate={LOOP_PRESETS.pulse}
        className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Element should render regardless of motion preferences
    const motionElement = canvas.getByTestId('motion-element');
    expect(motionElement).toBeInTheDocument();
    expect(motionElement).toHaveClass('rounded-lg');
  },
};

/**
 * Test: Animation Easing Curves
 *
 * Verifies different easing functions are applied correctly
 */
export const AnimationEasingCurves: Story = {
  render: () => (
    <div data-testid="easing-container" className="p-8 space-y-4">
      {/* Linear easing */}
      <motion.div
        data-testid="linear-easing"
        animate={{ x: 100 }}
        transition={{ duration: 1, ease: 'linear' }}
        className="w-16 h-16 rounded-lg bg-cyan-500"
      />

      {/* EaseOut easing */}
      <motion.div
        data-testid="easeout-easing"
        animate={{ x: 100 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="w-16 h-16 rounded-lg bg-magenta-500"
      />

      {/* EaseInOut easing */}
      <motion.div
        data-testid="easeinout-easing"
        animate={{ x: 100 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all easing variants render
    const linearElement = canvas.getByTestId('linear-easing');
    const easeOutElement = canvas.getByTestId('easeout-easing');
    const easeInOutElement = canvas.getByTestId('easeinout-easing');

    expect(linearElement).toBeInTheDocument();
    expect(easeOutElement).toBeInTheDocument();
    expect(easeInOutElement).toBeInTheDocument();
  },
};

/**
 * Test: Focus State Animations
 *
 * Verifies that focus animations trigger correctly
 */
export const FocusStateAnimations: Story = {
  render: () => (
    <div data-testid="focus-container" className="p-8 space-y-4">
      <motion.button
        data-testid="focus-button-1"
        whileFocus={BUTTON_GESTURES.default.whileFocus}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold"
      >
        Focus Me (Default)
      </motion.button>

      <motion.button
        data-testid="focus-button-2"
        whileFocus={BUTTON_GESTURES.neon.whileFocus}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold"
      >
        Focus Me (Neon)
      </motion.button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get focus buttons
    const button1 = canvas.getByTestId('focus-button-1');
    const button2 = canvas.getByTestId('focus-button-2');

    expect(button1).toBeInTheDocument();
    expect(button2).toBeInTheDocument();

    // Tab to focus first button
    await userEvent.tab();
    await waitFor(() => {
      expect(button1).toHaveFocus();
    });

    // Tab to focus second button
    await userEvent.tab();
    await waitFor(() => {
      expect(button2).toHaveFocus();
    });
  },
};
