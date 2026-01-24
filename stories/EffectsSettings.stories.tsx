import type { Meta, StoryObj } from '@storybook/react';
import { EffectsSettings } from '../packages/frontend/src/components/settings/EffectsSettings';

/**
 * EffectsSettings - Visual effects quality control panel
 *
 * A comprehensive settings panel for managing visual effects quality and performance.
 * Integrates with useGracefulDegradation for automatic quality management.
 *
 * ## Features
 * - Quality preset dropdown (low, medium, high, ultra)
 * - Auto-degradation toggle
 * - FPS counter display
 * - Individual effect toggles
 * - Reset to auto-detected settings
 * - localStorage persistence (via hook)
 * - Retro arcade/neon styling
 */

const meta = {
  title: 'Settings/EffectsSettings',
  component: EffectsSettings,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Settings panel for controlling visual effects quality, with quality presets, auto-degradation, and FPS monitoring.',
      },
    },
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0a0a' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showFpsCounter: {
      control: 'boolean',
      description: 'Whether to show FPS counter',
    },
    showAdvanced: {
      control: 'boolean',
      description: 'Whether to show individual effect toggles',
    },
  },
} satisfies Meta<typeof EffectsSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default settings panel
 */
export const Default: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a] min-h-screen">
      <div className="max-w-md mx-auto">
        <EffectsSettings />
      </div>
    </div>
  ),
};

/**
 * With FPS counter enabled
 */
export const WithFpsCounter: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a] min-h-screen">
      <div className="max-w-md mx-auto">
        <EffectsSettings showFpsCounter={true} />
      </div>
    </div>
  ),
};

/**
 * Without advanced settings
 */
export const SimpleMode: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a] min-h-screen">
      <div className="max-w-md mx-auto">
        <EffectsSettings showAdvanced={false} />
      </div>
    </div>
  ),
};

/**
 * Full settings with FPS and advanced options
 */
export const FullSettings: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a] min-h-screen">
      <div className="max-w-md mx-auto">
        <EffectsSettings showFpsCounter={true} showAdvanced={true} />
      </div>
    </div>
  ),
};

/**
 * With settings change callback
 */
export const WithCallback: Story = {
  render: () => {
    const handleSettingsChange = (settings: any) => {
      console.log('Settings changed:', settings);
    };

    return (
      <div className="p-8 bg-[#0a0a0a] min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="mb-6 p-4 bg-[#16162a] border border-[#2d2d4a] rounded-lg">
            <p className="text-sm text-white/60">
              Open browser console to see settings changes
            </p>
          </div>
          <EffectsSettings
            showFpsCounter={true}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>
    );
  },
};

/**
 * In a modal dialog
 */
export const InModal: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a] min-h-screen flex items-center justify-center">
      {/* Mock modal backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="relative z-10 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl shadow-2xl max-w-lg w-full mx-4">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2d2d4a]">
          <h2 className="text-xl font-bold text-white/90">Settings</h2>
          <button
            className="text-white/60 hover:text-white/90 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings panel */}
        <div className="p-6">
          <EffectsSettings showFpsCounter={true} showAdvanced={true} />
        </div>

        {/* Modal footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#2d2d4a]">
          <button className="px-4 py-2 text-white/60 hover:text-white/90 font-medium transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2 bg-[#00ffff] text-[#0a0a0a] font-medium rounded-lg hover:bg-[#00ffff]/90 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  ),
};

/**
 * Side panel layout
 */
export const SidePanel: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a] min-h-screen flex">
      {/* Main content area */}
      <div className="flex-1 p-8">
        <div className="bg-[#16162a] border border-[#2d2d4a] rounded-lg p-8 h-96">
          <h1 className="text-2xl font-bold text-white/90 mb-4">Game Content</h1>
          <p className="text-white/60">
            Main game content would appear here. Settings panel is on the right.
          </p>
        </div>
      </div>

      {/* Settings side panel */}
      <div className="w-96 p-8 border-l border-[#2d2d4a] bg-[#0a0a0a]/50">
        <EffectsSettings showFpsCounter={true} showAdvanced={true} />
      </div>
    </div>
  ),
};

/**
 * Compact layout
 */
export const Compact: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a]">
      <div className="max-w-xs">
        <EffectsSettings showAdvanced={false} />
      </div>
    </div>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    showFpsCounter: false,
    showAdvanced: true,
  },
  render: (args) => (
    <div className="p-8 bg-[#0a0a0a] min-h-screen">
      <div className="max-w-md mx-auto">
        <EffectsSettings {...args} />
      </div>
    </div>
  ),
};

/**
 * All quality levels comparison
 */
export const QualityComparison: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a]">
      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div>
          <h3 className="text-white/90 font-bold mb-3 text-center">Quality Presets</h3>
          <div className="space-y-3">
            <div className="bg-[#16162a] border border-[#2d2d4a] rounded-lg p-4">
              <div className="text-sm font-medium text-white/90 mb-1">Low</div>
              <div className="text-xs text-white/60">Best performance, minimal effects</div>
            </div>
            <div className="bg-[#16162a] border border-[#2d2d4a] rounded-lg p-4">
              <div className="text-sm font-medium text-white/90 mb-1">Medium</div>
              <div className="text-xs text-white/60">Balanced quality and performance</div>
            </div>
            <div className="bg-[#16162a] border border-[#2d2d4a] rounded-lg p-4">
              <div className="text-sm font-medium text-white/90 mb-1">High</div>
              <div className="text-xs text-white/60">Best quality, good performance</div>
            </div>
            <div className="bg-[#16162a] border border-[#2d2d4a] rounded-lg p-4">
              <div className="text-sm font-medium text-white/90 mb-1">Ultra</div>
              <div className="text-xs text-white/60">Maximum quality, high-end GPUs</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-white/90 font-bold mb-3 text-center">Settings Panel</h3>
          <EffectsSettings showAdvanced={false} />
        </div>
      </div>
    </div>
  ),
};
