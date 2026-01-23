import type { Meta, StoryObj } from '@storybook/react';
import {
  elevationShadows,
  glowShadows,
  textShadows,
  combinedShadows,
  insetShadows,
} from '../../styles/tokens/shadows';

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
 * Shadow card component for displaying individual shadows
 */
interface ShadowCardProps {
  name: string;
  value: string;
  isInset?: boolean;
}

const ShadowCard = ({ name, value, isInset = false }: ShadowCardProps) => (
  <div className="flex flex-col gap-3">
    <div
      className="w-28 h-28 rounded-xl flex items-center justify-center"
      style={{
        backgroundColor: isInset ? '#1a1a2e' : '#252535',
        boxShadow: value === 'none' ? undefined : value,
      }}
    >
      {value === 'none' ? (
        <span className="text-gray-500 text-sm">none</span>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-[#1a1a2e]" />
      )}
    </div>
    <div className="text-center">
      <p className="text-xs font-medium text-white truncate max-w-28">{name}</p>
      <p className="text-[10px] text-gray-400 truncate max-w-28" title={value}>
        {value.length > 20 ? 'complex' : value}
      </p>
    </div>
  </div>
);

/**
 * Elevation shadows showcase
 */
const ElevationShowcase = () => (
  <div className="flex flex-wrap gap-6">
    {Object.entries(elevationShadows).map(([name, value]) => (
      <ShadowCard key={name} name={name} value={value} isInset={name === 'inner'} />
    ))}
  </div>
);

/**
 * Glow shadows showcase with neon effect
 */
const GlowShowcase = () => (
  <div className="flex flex-wrap gap-6">
    {Object.entries(glowShadows).map(([name, value]) => {
      // Determine the color for the inner element
      const isRainbow = name === 'rainbow';
      const isCyan = name.includes('cyan');
      const isMagenta = name.includes('magenta');
      const isGreen = name.includes('green');
      const isOrange = name.includes('orange');
      const isRed = name.includes('red');
      const isWhite = name.includes('white');

      const bgColor = isRainbow
        ? 'linear-gradient(135deg, #00ffff, #ff00ff)'
        : isCyan
        ? '#00ffff'
        : isMagenta
        ? '#ff00ff'
        : isGreen
        ? '#00ff88'
        : isOrange
        ? '#ffaa00'
        : isRed
        ? '#ff3366'
        : isWhite
        ? '#ffffff'
        : '#00ffff';

      return (
        <div key={name} className="flex flex-col gap-3">
          <div
            className="w-28 h-28 rounded-xl flex items-center justify-center bg-[#0a0a0f]"
            style={{ boxShadow: value }}
          >
            <div
              className="w-8 h-8 rounded-full"
              style={{ background: bgColor }}
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-white truncate max-w-28">{name}</p>
          </div>
        </div>
      );
    })}
  </div>
);

/**
 * Text shadows showcase
 */
const TextShadowShowcase = () => (
  <div className="space-y-4">
    {Object.entries(textShadows).map(([name, value]) => {
      const isGlow = name.includes('glow');
      const isCyan = name.toLowerCase().includes('cyan');
      const isMagenta = name.toLowerCase().includes('magenta');
      const isGreen = name.toLowerCase().includes('green');
      const textColor = isCyan ? '#00ffff' : isMagenta ? '#ff00ff' : isGreen ? '#00ff88' : '#ffffff';

      return (
        <div
          key={name}
          className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-4 border border-white/10"
        >
          <div className="w-32 flex-shrink-0">
            <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
          </div>
          <p
            className="text-2xl font-bold"
            style={{
              color: textColor,
              textShadow: value === 'none' ? undefined : value,
            }}
          >
            {isGlow ? 'NEON TEXT' : 'Shadow Text'}
          </p>
        </div>
      );
    })}
  </div>
);

/**
 * Combined shadows showcase
 */
const CombinedShowcase = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Object.entries(combinedShadows).map(([name, value]) => {
      const isCard = name.includes('card');
      const isButton = name.includes('button');
      const isModal = name.includes('modal');
      const isFocus = name.includes('focus');
      const isCrt = name.includes('crt');
      const isNeon = name.includes('neon');
      const isDropdown = name.includes('dropdown');

      return (
        <div key={name} className="bg-[#1a1a2e] rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
          </div>
          <div className="flex justify-center">
            {isButton ? (
              <button
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold"
                style={{ boxShadow: value }}
              >
                Button
              </button>
            ) : isCard ? (
              <div
                className="w-full h-24 rounded-xl bg-[#252535]"
                style={{ boxShadow: value }}
              />
            ) : isModal ? (
              <div
                className="w-full h-32 rounded-xl bg-[#252535] border border-white/10"
                style={{ boxShadow: value }}
              />
            ) : isFocus ? (
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-[#252535] border border-cyan-500/50 text-white"
                style={{ boxShadow: value }}
                placeholder="Focus ring"
                readOnly
              />
            ) : isCrt ? (
              <div
                className="w-full h-24 rounded-xl bg-[#0a0a0f]"
                style={{ boxShadow: value }}
              />
            ) : isNeon ? (
              <div
                className="w-full h-16 rounded-lg border-2 border-cyan-500"
                style={{ boxShadow: value }}
              />
            ) : isDropdown ? (
              <div
                className="w-full rounded-lg bg-[#252535] p-3"
                style={{ boxShadow: value }}
              >
                <div className="h-6 bg-[#2d2d45] rounded mb-2" />
                <div className="h-6 bg-[#2d2d45] rounded mb-2" />
                <div className="h-6 bg-[#2d2d45] rounded" />
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-xl bg-[#252535]"
                style={{ boxShadow: value }}
              />
            )}
          </div>
        </div>
      );
    })}
  </div>
);

/**
 * Inset shadows showcase
 */
const InsetShowcase = () => (
  <div className="flex flex-wrap gap-6">
    {Object.entries(insetShadows).map(([name, value]) => (
      <div key={name} className="flex flex-col gap-3">
        <div
          className="w-28 h-28 rounded-xl flex items-center justify-center bg-[#1a1a2e]"
          style={{ boxShadow: value === 'none' ? undefined : value }}
        >
          {name === 'screen' ? (
            <div className="text-xs text-cyan-400/50">CRT</div>
          ) : name === 'glow' ? (
            <div className="w-12 h-12 rounded-full bg-cyan-500/10" />
          ) : (
            <div className="w-16 h-8 rounded bg-[#252535]" />
          )}
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-white truncate max-w-28">{name}</p>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Interactive shadow comparison
 */
const ShadowComparison = () => (
  <div className="space-y-8">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Elevation vs Glow</h3>
      <div className="flex flex-wrap gap-8 items-center">
        <div className="text-center">
          <div
            className="w-24 h-24 rounded-xl bg-[#252535] mb-2"
            style={{ boxShadow: elevationShadows.lg }}
          />
          <span className="text-xs text-gray-400">Elevation (lg)</span>
        </div>
        <div className="text-center">
          <div
            className="w-24 h-24 rounded-xl bg-[#252535] mb-2"
            style={{ boxShadow: glowShadows.cyanLg }}
          />
          <span className="text-xs text-gray-400">Glow (cyanLg)</span>
        </div>
        <div className="text-center">
          <div
            className="w-24 h-24 rounded-xl bg-[#252535] mb-2"
            style={{ boxShadow: `${elevationShadows.md}, ${glowShadows.cyan}` }}
          />
          <span className="text-xs text-gray-400">Combined</span>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Glow Intensity Scale</h3>
      <div className="flex flex-wrap gap-4 items-center">
        {['cyan', 'cyanMd', 'cyanLg', 'cyanIntense'].map((name) => (
          <div key={name} className="text-center">
            <div
              className="w-20 h-20 rounded-xl bg-[#0a0a0f] flex items-center justify-center mb-2"
              style={{ boxShadow: glowShadows[name as keyof typeof glowShadows] }}
            >
              <div className="w-6 h-6 rounded-full bg-cyan-500" />
            </div>
            <span className="text-xs text-gray-400">{name}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Main shadows documentation component
 */
const ShadowsDocumentation = () => {
  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00ffff' }}>
            Shadow Tokens
          </h1>
          <p className="text-gray-400 text-lg">
            x402Arcade Design System - Elevation shadows and neon glow effects
          </p>
        </header>

        {/* Elevation Shadows Section */}
        <section className="mb-16">
          <SectionHeader
            title="Elevation Shadows"
            description="Standard box-shadows for creating depth and elevation, from subtle to dramatic."
          />
          <ElevationShowcase />
        </section>

        {/* Glow Shadows Section */}
        <section className="mb-16">
          <SectionHeader
            title="Neon Glow Shadows"
            description="Signature neon glow effects for the retro arcade aesthetic."
          />
          <GlowShowcase />
        </section>

        {/* Text Shadows Section */}
        <section className="mb-16">
          <SectionHeader
            title="Text Shadows"
            description="Text glow effects for headings and neon text displays."
          />
          <TextShadowShowcase />
        </section>

        {/* Combined Shadows Section */}
        <section className="mb-16">
          <SectionHeader
            title="Combined Shadows"
            description="Pre-composed shadow combinations for common UI patterns."
          />
          <CombinedShowcase />
        </section>

        {/* Inset Shadows Section */}
        <section className="mb-16">
          <SectionHeader
            title="Inset Shadows"
            description="Inner shadows for pressed states and depth effects."
          />
          <InsetShowcase />
        </section>

        {/* Shadow Comparison Section */}
        <section className="mb-16">
          <SectionHeader
            title="Shadow Comparison"
            description="Visual comparison between elevation and glow shadows."
          />
          <ShadowComparison />
        </section>
      </div>
    </div>
  );
};

const meta = {
  title: 'Design Tokens/Shadows',
  component: ShadowsDocumentation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'arcade-dark',
    },
    docs: {
      description: {
        component: `
# Shadow Tokens

The x402Arcade shadow system combines traditional elevation shadows with signature neon glow effects:

- **Elevation Shadows**: Standard dark shadows for depth (xs, sm, md, lg, xl, 2xl)
- **Glow Shadows**: Neon glow effects in cyan, magenta, green, orange, red, and white
- **Text Shadows**: Glow effects specifically for text
- **Combined Shadows**: Pre-composed patterns for cards, buttons, modals, etc.
- **Inset Shadows**: Inner shadows for pressed states and CRT effects

## Usage

\`\`\`tsx
import { shadows, elevationShadows, glowShadows } from '@/styles/tokens/shadows';

// Elevation shadow
<div style={{ boxShadow: elevationShadows.lg }}>Card</div>

// Neon glow
<button style={{ boxShadow: glowShadows.cyanIntense }}>Glowing Button</button>

// Combined effect
<div style={{ boxShadow: shadows.combined.cardHover }}>Hover Card</div>

// Text glow
<h1 style={{ textShadow: shadows.text.glowCyan }}>ARCADE</h1>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ShadowsDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllShadows: Story = {};

export const ElevationShadows: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Elevation Shadows" description="Standard elevation shadows for depth." />
      <ElevationShowcase />
    </div>
  ),
};

export const GlowShadows: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Neon Glow Shadows" description="Signature arcade neon glow effects." />
      <GlowShowcase />
    </div>
  ),
};

export const TextGlowEffects: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Text Shadows" description="Glow effects for neon text." />
      <TextShadowShowcase />
    </div>
  ),
};

export const CombinedPatterns: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Combined Shadows" description="Pre-composed UI patterns." />
      <CombinedShowcase />
    </div>
  ),
};

export const InteractiveComparison: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Shadow Comparison" />
      <ShadowComparison />
    </div>
  ),
};
