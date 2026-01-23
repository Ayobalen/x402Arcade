import type { Meta, StoryObj } from '@storybook/react';
import {
  backgrounds,
  backgroundGradients,
  primary,
  secondary,
  surfaces,
  accents,
  semantic,
  text,
  borders,
  glows,
  gradients,
} from '../../styles/tokens/colors';

/**
 * Color swatch component for displaying individual colors
 */
interface ColorSwatchProps {
  name: string;
  value: string;
  showBorder?: boolean;
}

const ColorSwatch = ({ name, value, showBorder = false }: ColorSwatchProps) => {
  const isGradient = value.includes('gradient') || value.includes('radial');
  const isRgba = value.includes('rgba');

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`w-20 h-20 rounded-lg ${showBorder ? 'border border-white/20' : ''}`}
        style={{
          background: value,
          boxShadow: isRgba ? `0 0 20px ${value}` : undefined
        }}
        title={value}
      />
      <div className="text-center">
        <p className="text-xs font-medium text-white truncate max-w-20">{name}</p>
        <p className="text-[10px] text-gray-400 truncate max-w-20" title={value}>
          {isGradient ? 'gradient' : isRgba ? 'rgba' : value}
        </p>
      </div>
    </div>
  );
};

/**
 * Section header component
 */
const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-cyan-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
      {title}
    </h2>
    {description && <p className="text-gray-400">{description}</p>}
  </div>
);

/**
 * Color palette grid component
 */
interface ColorPaletteProps {
  colors: Record<string, string>;
  showBorder?: boolean;
}

const ColorPalette = ({ colors, showBorder = false }: ColorPaletteProps) => (
  <div className="flex flex-wrap gap-4">
    {Object.entries(colors).map(([name, value]) => (
      <ColorSwatch key={name} name={name} value={value} showBorder={showBorder} />
    ))}
  </div>
);

/**
 * Main colors documentation component
 */
const ColorsDocumentation = () => {
  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00ffff' }}>
            Color Tokens
          </h1>
          <p className="text-gray-400 text-lg">
            x402Arcade Design System - Retro Arcade / Neon Theme
          </p>
        </header>

        {/* Backgrounds Section */}
        <section className="mb-12">
          <SectionHeader
            title="Backgrounds"
            description="Dark purple backgrounds that create the deep space/arcade atmosphere."
          />
          <ColorPalette colors={backgrounds} showBorder />
        </section>

        {/* Background Gradients Section */}
        <section className="mb-12">
          <SectionHeader
            title="Background Gradients"
            description="Pre-defined gradients for depth effects and visual interest."
          />
          <div className="flex flex-wrap gap-4">
            {Object.entries(backgroundGradients).map(([name, value]) => (
              <div key={name} className="flex flex-col gap-2">
                <div
                  className="w-32 h-20 rounded-lg border border-white/20"
                  style={{ background: value }}
                  title={value}
                />
                <p className="text-xs font-medium text-white">{name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Primary Colors Section */}
        <section className="mb-12">
          <SectionHeader
            title="Primary (Cyan)"
            description="The signature arcade cyan color with full shade scale."
          />
          <ColorPalette colors={primary} />
        </section>

        {/* Secondary Colors Section */}
        <section className="mb-12">
          <SectionHeader
            title="Secondary (Magenta)"
            description="Complementary magenta color with full shade scale."
          />
          <ColorPalette colors={secondary} />
        </section>

        {/* Surfaces Section */}
        <section className="mb-12">
          <SectionHeader
            title="Surfaces"
            description="Colors for elevated UI elements like cards, modals, and dropdowns."
          />
          <ColorPalette colors={surfaces} showBorder />
        </section>

        {/* Accents Section */}
        <section className="mb-12">
          <SectionHeader
            title="Accents"
            description="Primary and secondary accent colors for interactive elements."
          />
          <ColorPalette colors={accents} />
        </section>

        {/* Semantic Colors Section */}
        <section className="mb-12">
          <SectionHeader
            title="Semantic Colors"
            description="Colors that convey meaning: success, warning, error, and info states."
          />
          <ColorPalette colors={semantic} />
        </section>

        {/* Text Colors Section */}
        <section className="mb-12">
          <SectionHeader
            title="Text Colors"
            description="Typography colors for headings, body text, and muted elements."
          />
          <div className="flex flex-wrap gap-4">
            {Object.entries(text).map(([name, value]) => (
              <div key={name} className="flex flex-col gap-2">
                <div
                  className="w-20 h-20 rounded-lg border border-white/20 flex items-center justify-center"
                  style={{ backgroundColor: value === '#0a0a0f' ? '#fff' : '#1a1a2e' }}
                >
                  <span style={{ color: value, fontSize: '24px', fontWeight: 'bold' }}>Aa</span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-white">{name}</p>
                  <p className="text-[10px] text-gray-400">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Borders Section */}
        <section className="mb-12">
          <SectionHeader
            title="Border Colors"
            description="Used for card borders, dividers, and separators."
          />
          <ColorPalette colors={borders} showBorder />
        </section>

        {/* Glows Section */}
        <section className="mb-12">
          <SectionHeader
            title="Glow Colors"
            description="Semi-transparent versions of accent colors for neon glow effects."
          />
          <div className="flex flex-wrap gap-4">
            {Object.entries(glows).map(([name, value]) => (
              <div key={name} className="flex flex-col gap-2">
                <div
                  className="w-20 h-20 rounded-lg bg-[#1a1a2e] flex items-center justify-center"
                  style={{ boxShadow: `0 0 30px ${value}, 0 0 60px ${value}` }}
                >
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: value }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-white truncate max-w-20">{name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gradients Section */}
        <section className="mb-12">
          <SectionHeader
            title="Gradients"
            description="Pre-defined gradients for buttons, backgrounds, and decorative elements."
          />
          <div className="flex flex-wrap gap-4">
            {Object.entries(gradients).map(([name, value]) => (
              <div key={name} className="flex flex-col gap-2">
                <div
                  className="w-32 h-20 rounded-lg border border-white/20"
                  style={{ background: value }}
                  title={value}
                />
                <p className="text-xs font-medium text-white">{name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const meta = {
  title: 'Design Tokens/Colors',
  component: ColorsDocumentation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'arcade-dark',
    },
    docs: {
      description: {
        component: `
# Color Tokens

The x402Arcade color system is built on a **Retro Arcade / Neon** theme, featuring:

- **Primary Cyan (#00ffff)**: The signature neon cyan for primary actions and highlights
- **Secondary Magenta (#ff00ff)**: Complementary magenta for secondary elements
- **Dark Backgrounds**: Deep purple-tinted blacks that create the arcade atmosphere
- **Neon Glows**: Semi-transparent colors for authentic glow effects

## Usage

\`\`\`tsx
import { colors, primary, backgrounds } from '@/styles/tokens/colors';

// Use individual exports
const bgColor = backgrounds.primary; // #0a0a0f
const accentColor = primary.DEFAULT; // #00ffff

// Or use the combined colors object
const color = colors.semantic.success; // #00ff88
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ColorsDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {};

export const BackgroundColors: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Background Colors" description="Dark purple backgrounds for the arcade atmosphere." />
      <ColorPalette colors={backgrounds} showBorder />
    </div>
  ),
};

export const PrimaryPalette: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Primary (Cyan)" description="Neon cyan with full shade scale." />
      <ColorPalette colors={primary} />
    </div>
  ),
};

export const SecondaryPalette: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Secondary (Magenta)" description="Neon magenta with full shade scale." />
      <ColorPalette colors={secondary} />
    </div>
  ),
};

export const SemanticColors: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Semantic Colors" description="Success, warning, error, and info states." />
      <ColorPalette colors={semantic} />
    </div>
  ),
};

export const GlowEffects: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Glow Effects" description="Neon glow effects for the arcade aesthetic." />
      <div className="flex flex-wrap gap-6">
        {Object.entries(glows).slice(0, 6).map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-xl bg-[#1a1a2e] flex items-center justify-center transition-all duration-300"
              style={{ boxShadow: `0 0 30px ${value}, 0 0 60px ${value}` }}
            >
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: value }} />
            </div>
            <p className="text-sm font-medium text-white">{name}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};
