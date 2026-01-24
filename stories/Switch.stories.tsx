import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Switch } from '../packages/frontend/src/components/ui/Switch';

/**
 * Switch - Arcade-themed toggle switch component
 *
 * A customizable toggle switch with retro arcade/neon styling.
 *
 * ## Features
 * - Keyboard navigation (Space/Enter)
 * - Accessible (ARIA labels, screen reader support)
 * - 3 sizes (sm, md, lg)
 * - 4 color variants (cyan, magenta, green, yellow)
 * - Optional label and description
 * - Disabled state
 * - Form integration support
 */

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Arcade-themed toggle switch with neon glow effects and full accessibility support.',
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the switch is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    variant: {
      control: 'select',
      options: ['cyan', 'magenta', 'green', 'yellow'],
      description: 'Color theme',
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default switch (medium size, cyan variant)
 */
export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="p-8 bg-[#0a0a0a]">
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          label="Enable Feature"
          description="Toggle this feature on or off"
        />
      </div>
    );
  },
};

/**
 * All sizes
 */
export const Sizes: Story = {
  render: () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [checked3, setChecked3] = useState(false);

    return (
      <div className="p-8 bg-[#0a0a0a] space-y-6">
        <Switch
          checked={checked1}
          onCheckedChange={setChecked1}
          label="Small Switch"
          description="Compact size"
          size="sm"
        />
        <Switch
          checked={checked2}
          onCheckedChange={setChecked2}
          label="Medium Switch"
          description="Default size"
          size="md"
        />
        <Switch
          checked={checked3}
          onCheckedChange={setChecked3}
          label="Large Switch"
          description="Prominent size"
          size="lg"
        />
      </div>
    );
  },
};

/**
 * Color variants (retro arcade theme)
 */
export const Variants: Story = {
  render: () => {
    const [checked1, setChecked1] = useState(true);
    const [checked2, setChecked2] = useState(true);
    const [checked3, setChecked3] = useState(true);
    const [checked4, setChecked4] = useState(true);

    return (
      <div className="p-8 bg-[#0a0a0a] space-y-6">
        <Switch
          checked={checked1}
          onCheckedChange={setChecked1}
          label="Cyan (Primary)"
          description="Default arcade neon"
          variant="cyan"
        />
        <Switch
          checked={checked2}
          onCheckedChange={setChecked2}
          label="Magenta (Accent)"
          description="Secondary arcade color"
          variant="magenta"
        />
        <Switch
          checked={checked3}
          onCheckedChange={setChecked3}
          label="Green (Success)"
          description="Positive actions"
          variant="green"
        />
        <Switch
          checked={checked4}
          onCheckedChange={setChecked4}
          label="Yellow (Warning)"
          description="Caution or emphasis"
          variant="yellow"
        />
      </div>
    );
  },
};

/**
 * Without label (standalone)
 */
export const WithoutLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="p-8 bg-[#0a0a0a]">
        <Switch checked={checked} onCheckedChange={setChecked} />
      </div>
    );
  },
};

/**
 * With label only (no description)
 */
export const LabelOnly: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="p-8 bg-[#0a0a0a]">
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          label="Enable Notifications"
        />
      </div>
    );
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0a] space-y-6">
      <Switch
        checked={false}
        onCheckedChange={() => {}}
        label="Disabled Off"
        description="Cannot be toggled"
        disabled
      />
      <Switch
        checked={true}
        onCheckedChange={() => {}}
        label="Disabled On"
        description="Cannot be toggled"
        disabled
      />
    </div>
  ),
};

/**
 * Form integration example
 */
export const FormIntegration: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      alert(`Notifications: ${formData.get('notifications') ? 'Enabled' : 'Disabled'}`);
    };

    return (
      <div className="p-8 bg-[#0a0a0a]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Switch
            checked={checked}
            onCheckedChange={setChecked}
            name="notifications"
            label="Enable Notifications"
            description="Receive game updates and alerts"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#00ffff] text-[#0a0a0a] font-medium rounded-lg hover:bg-[#00ffff]/90 transition-colors"
          >
            Submit Form
          </button>
        </form>
      </div>
    );
  },
};

/**
 * Multiple switches (settings panel example)
 */
export const SettingsPanel: Story = {
  render: () => {
    const [audio, setAudio] = useState(true);
    const [music, setMusic] = useState(true);
    const [effects, setEffects] = useState(false);
    const [vibration, setVibration] = useState(true);

    return (
      <div className="p-8 bg-[#0a0a0a]">
        <div className="bg-[#16162a] border border-[#2d2d4a] rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-bold text-white/90 mb-4">Game Settings</h3>
          <div className="space-y-4">
            <Switch
              checked={audio}
              onCheckedChange={setAudio}
              label="Audio"
              description="Enable all game sounds"
              variant="cyan"
            />
            <Switch
              checked={music}
              onCheckedChange={setMusic}
              label="Background Music"
              description="Play arcade background music"
              variant="magenta"
              disabled={!audio}
            />
            <Switch
              checked={effects}
              onCheckedChange={setEffects}
              label="Visual Effects"
              description="Enable bloom, particles, and post-processing"
              variant="green"
            />
            <Switch
              checked={vibration}
              onCheckedChange={setVibration}
              label="Controller Vibration"
              description="Haptic feedback on compatible devices"
              variant="yellow"
            />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    checked: false,
    label: 'Enable Feature',
    description: 'Toggle this feature on or off',
    size: 'md',
    variant: 'cyan',
    disabled: false,
  },
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return (
      <div className="p-8 bg-[#0a0a0a]">
        <Switch
          {...args}
          checked={checked}
          onCheckedChange={setChecked}
        />
      </div>
    );
  },
};
