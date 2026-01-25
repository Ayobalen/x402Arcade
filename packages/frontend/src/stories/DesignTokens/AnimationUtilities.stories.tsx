import type { Meta, StoryObj } from '@storybook/react';
import { motion, useAnimation } from 'framer-motion';
import { useState } from 'react';
import {
  LOOP_PRESETS,
  createLoop,
  HOVER_PRESETS,
  TAP_PRESETS,
  BUTTON_GESTURES,
  STAGGER_PRESETS,
  sequence,
  SEQUENCE_PRESETS,
  type LoopPreset,
  type HoverPreset,
  type TapPreset,
} from '@/lib/animations';

const meta = {
  title: 'Design Tokens/Animation Utilities',
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0a0a' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Section header component
 */
const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h2
      className="text-2xl font-bold text-cyan-400 mb-2"
      style={{ fontFamily: 'Orbitron, sans-serif' }}
    >
      {title}
    </h2>
    {description && <p className="text-gray-400">{description}</p>}
  </div>
);

/**
 * Loop Animation Presets Demo
 */
const LoopPresetsDemo = () => {
  const [selectedPreset, setSelectedPreset] = useState<LoopPreset>('pulse');
  const presetKeys = Object.keys(LOOP_PRESETS) as LoopPreset[];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Loop Animation Presets"
        description="Infinite or counted repeating animations for continuous effects"
      />

      {/* Preset Selector */}
      <div className="flex flex-wrap gap-2">
        {presetKeys.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedPreset(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedPreset === key
                ? 'bg-gradient-to-r from-cyan-500 to-magenta-500 text-white'
                : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Animated Element */}
      <div className="flex items-center justify-center h-64 bg-[#1a1a2e] rounded-lg border border-white/10">
        <motion.div
          key={selectedPreset} // Re-mount on preset change
          animate={LOOP_PRESETS[selectedPreset]}
          className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500"
        />
      </div>

      {/* Description */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-cyan-400">{selectedPreset}:</strong>{' '}
          {selectedPreset === 'pulse' && 'Subtle scale pulse (1 → 1.05 → 1) for breathing effects'}
          {selectedPreset === 'pulseFast' && 'Fast pulse (1s duration) for active states'}
          {selectedPreset === 'pulseSlow' && 'Slow pulse (3s duration) for ambient UI'}
          {selectedPreset === 'bounce' && 'Vertical bounce (y: 0 → -10 → 0) for call-to-actions'}
          {selectedPreset === 'float' && 'Gentle float animation for ghost-like movement'}
          {selectedPreset === 'spin' && 'Continuous 360° rotation (2s duration)'}
          {selectedPreset === 'spinSlow' && 'Slow rotation (4s duration) for decorative elements'}
          {selectedPreset === 'wiggle' && 'Quick oscillation (2 repeats) for attention'}
          {selectedPreset === 'glow' && 'Opacity pulse (0.7 → 1 → 0.7) for neon effects'}
          {selectedPreset === 'blink' && 'On/off blink for cursor effects'}
          {selectedPreset === 'shimmer' && 'Horizontal gradient shift for loading states'}
          {selectedPreset === 'shake' && 'Horizontal shake (1 repeat) for error feedback'}
        </p>
      </div>
    </div>
  );
};

/**
 * Hover Presets Demo
 */
const HoverPresetsDemo = () => {
  const hoverKeys = Object.keys(HOVER_PRESETS) as HoverPreset[];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Hover Animation Presets"
        description="Smooth feedback animations when user hovers over interactive elements"
      />

      <div className="grid grid-cols-3 gap-4">
        {hoverKeys.map((key) => (
          <motion.div
            key={key}
            whileHover={HOVER_PRESETS[key]}
            className="h-32 rounded-lg bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 border border-cyan-500/30 flex items-center justify-center cursor-pointer"
          >
            <span className="text-sm font-medium text-white">{key}</span>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-cyan-400">Hover over any card</strong> to see the animation
          effect. Each preset provides different visual feedback for interactive elements.
        </p>
      </div>
    </div>
  );
};

/**
 * Tap Presets Demo
 */
const TapPresetsDemo = () => {
  const tapKeys = Object.keys(TAP_PRESETS) as TapPreset[];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tap Animation Presets"
        description="Quick tactile feedback when user clicks or taps interactive elements"
      />

      <div className="grid grid-cols-3 gap-4">
        {tapKeys.map((key) => (
          <motion.button
            key={key}
            whileTap={TAP_PRESETS[key]}
            className="h-24 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold text-sm"
          >
            {key}
          </motion.button>
        ))}
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-cyan-400">Click any button</strong> to see the tap animation
          effect. Tap animations provide immediate feedback for user interactions.
        </p>
      </div>
    </div>
  );
};

/**
 * Button Gesture Combos Demo
 */
const ButtonGesturesDemo = () => {
  const buttonKeys = Object.keys(BUTTON_GESTURES) as Array<keyof typeof BUTTON_GESTURES>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Button Gesture Combinations"
        description="Pre-configured combinations of hover, tap, and focus animations for buttons"
      />

      <div className="grid grid-cols-2 gap-6">
        {buttonKeys.map((key) => {
          const gestures = BUTTON_GESTURES[key];
          return (
            <div key={key} className="space-y-3">
              <h3 className="text-lg font-semibold text-white capitalize">{key}</h3>
              <motion.button
                {...gestures}
                className="w-full py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold"
              >
                {key} Button
              </motion.button>
              <p className="text-xs text-gray-500">
                {key === 'default' && 'Lift on hover, shrink on tap, glow on focus'}
                {key === 'subtle' && 'Minimal scale on hover, press down on tap'}
                {key === 'playful' && 'Float on hover, bounce on tap, scale + glow on focus'}
                {key === 'neon' && 'Glow + scale on hover, shrink on tap, arcade-style'}
                {key === 'scale' && 'Scale only animations, no movement'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Stagger Animation Demo
 */
const StaggerDemo = () => {
  const [key, setKey] = useState(0);
  const items = Array.from({ length: 6 }, (_, i) => `Item ${i + 1}`);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stagger Animations"
        description="Animate lists and groups of elements with sequential delays"
      />

      <button
        onClick={() => setKey((k) => k + 1)}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold text-sm"
      >
        Replay Animation
      </button>

      <motion.div
        key={key}
        variants={STAGGER_PRESETS.normal.container}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={STAGGER_PRESETS.normal.child}
            className="h-16 rounded-lg bg-gradient-to-r from-cyan-500/20 to-magenta-500/20 border border-cyan-500/30 flex items-center justify-center"
          >
            <span className="text-white font-medium">{item}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-cyan-400">Stagger animations</strong> create sequential reveals
          for lists. Each item animates with a slight delay after the previous one.
        </p>
      </div>
    </div>
  );
};

/**
 * Sequence Animation Demo
 */
const SequenceDemo = () => {
  const controls = useAnimation();
  const [playing, setPlaying] = useState(false);

  const playSequence = async () => {
    setPlaying(true);
    await sequence(controls, SEQUENCE_PRESETS.success);
    setPlaying(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sequence Animations"
        description="Chain multiple animation steps together for complex effects"
      />

      <button
        onClick={playSequence}
        disabled={playing}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold text-sm disabled:opacity-50"
      >
        {playing ? 'Playing...' : 'Play Success Sequence'}
      </button>

      <div className="flex items-center justify-center h-64 bg-[#1a1a2e] rounded-lg border border-white/10">
        <motion.div
          animate={controls}
          className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500"
        />
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-cyan-400">Sequence animations</strong> allow you to chain multiple
          animation steps. The "success" sequence: scales up → glows green → fades glow.
        </p>
      </div>
    </div>
  );
};

/**
 * Custom Loop Demo
 */
const CustomLoopDemo = () => {
  const [duration, setDuration] = useState(1);
  const [repeat, setRepeat] = useState<number | 'Infinity'>(Infinity);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Custom Loop Animations"
        description="Create custom looping animations with full control over timing and behavior"
      />

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Duration: <span className="text-white">{duration}s</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Repeat: <span className="text-white">{repeat === Infinity ? '∞' : repeat}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={repeat === Infinity ? 11 : repeat}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setRepeat(val > 10 ? Infinity : val);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Animated Element */}
      <div className="flex items-center justify-center h-64 bg-[#1a1a2e] rounded-lg border border-white/10">
        <motion.div
          key={`${duration}-${repeat}`}
          animate={createLoop({
            keyframes: {
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            },
            duration,
            repeat: repeat === Infinity ? Infinity : repeat,
          })}
          className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500"
        />
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-cyan-400">Adjust the controls</strong> to customize the loop
          animation. This example combines scale and rotation with configurable timing.
        </p>
      </div>
    </div>
  );
};

/**
 * Loop Presets Story
 */
export const LoopPresets: Story = {
  render: () => <LoopPresetsDemo />,
};

/**
 * Hover Presets Story
 */
export const HoverPresets: Story = {
  render: () => <HoverPresetsDemo />,
};

/**
 * Tap Presets Story
 */
export const TapPresets: Story = {
  render: () => <TapPresetsDemo />,
};

/**
 * Button Gestures Story
 */
export const ButtonGestures: Story = {
  render: () => <ButtonGesturesDemo />,
};

/**
 * Stagger Animation Story
 */
export const StaggerAnimation: Story = {
  render: () => <StaggerDemo />,
};

/**
 * Sequence Animation Story
 */
export const SequenceAnimation: Story = {
  render: () => <SequenceDemo />,
};

/**
 * Custom Loop Story
 */
export const CustomLoop: Story = {
  render: () => <CustomLoopDemo />,
};

/**
 * All Presets Overview
 */
export const AllPresetsOverview: Story = {
  render: () => (
    <div className="space-y-12">
      <LoopPresetsDemo />
      <div className="border-t border-white/10 pt-12" />
      <HoverPresetsDemo />
      <div className="border-t border-white/10 pt-12" />
      <TapPresetsDemo />
      <div className="border-t border-white/10 pt-12" />
      <ButtonGesturesDemo />
      <div className="border-t border-white/10 pt-12" />
      <StaggerDemo />
      <div className="border-t border-white/10 pt-12" />
      <SequenceDemo />
      <div className="border-t border-white/10 pt-12" />
      <CustomLoopDemo />
    </div>
  ),
};
