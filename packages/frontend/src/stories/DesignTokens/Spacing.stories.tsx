import type { Meta, StoryObj } from '@storybook/react';
import {
  spacing,
  negativeSpacing,
  semanticSpacing,
  componentSpacing,
  layoutSpacing,
} from '../../styles/tokens/spacing';

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
 * Spacing value display component
 */
interface SpacingValueProps {
  name: string;
  value: string;
  showVisual?: boolean;
}

const SpacingValue = ({ name, value, showVisual = true }: SpacingValueProps) => {
  // Convert rem to pixels for visualization
  const numericValue = parseFloat(value.replace('rem', '').replace('px', ''));
  const isRem = value.includes('rem');
  const pixels = isRem ? numericValue * 16 : numericValue;

  return (
    <div className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-3 border border-white/10">
      <div className="w-16 flex-shrink-0">
        <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
      </div>
      <div className="w-20 flex-shrink-0">
        <span className="text-xs text-gray-400">{value}</span>
      </div>
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-xs text-gray-500">{pixels}px</span>
      </div>
      {showVisual && pixels > 0 && pixels <= 256 && (
        <div className="flex-1">
          <div
            className="h-4 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded"
            style={{ width: `${Math.min(pixels, 256)}px` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Spacing scale visualization
 */
const SpacingScaleVisualization = () => {
  // Filter to show a subset of the scale for cleaner display
  const displayValues = Object.entries(spacing).filter(([key]) => {
    return ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32'].includes(key);
  });

  return (
    <div className="space-y-2">
      {displayValues.map(([name, value]) => (
        <SpacingValue key={name} name={name} value={value} />
      ))}
    </div>
  );
};

/**
 * Full spacing scale
 */
const FullSpacingScale = () => (
  <div className="space-y-2">
    {Object.entries(spacing).map(([name, value]) => (
      <SpacingValue key={name} name={name} value={value} />
    ))}
  </div>
);

/**
 * Negative spacing scale
 */
const NegativeSpacingScale = () => (
  <div className="space-y-2">
    {Object.entries(negativeSpacing).map(([name, value]) => (
      <div key={name} className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-3 border border-white/10">
        <div className="w-20 flex-shrink-0">
          <span className="text-xs text-magenta-400 bg-magenta-400/10 px-2 py-1 rounded">{name}</span>
        </div>
        <div className="w-24 flex-shrink-0">
          <span className="text-xs text-gray-400">{value}</span>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Semantic spacing display
 */
const SemanticSpacingDisplay = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {Object.entries(semanticSpacing).map(([name, value]) => {
      const numericValue = parseFloat(value.replace('rem', '').replace('px', ''));
      const isRem = value.includes('rem');
      const pixels = isRem ? numericValue * 16 : numericValue;

      return (
        <div key={name} className="bg-[#1a1a2e] rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-cyan-400 font-semibold">{name}</span>
            <span className="text-xs text-gray-400">{value} ({pixels}px)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="bg-cyan-500/30 rounded"
              style={{ width: `${Math.min(pixels, 128)}px`, height: `${Math.min(pixels, 128)}px` }}
            />
            <div
              className="h-4 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded flex-1"
              style={{ maxWidth: `${Math.min(pixels * 2, 256)}px` }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

/**
 * Component spacing display
 */
const ComponentSpacingDisplay = () => {
  // Group component spacing by category
  const groups = {
    'Button Padding': Object.entries(componentSpacing).filter(([k]) => k.startsWith('button')),
    'Card Spacing': Object.entries(componentSpacing).filter(([k]) => k.startsWith('card')),
    'Modal Spacing': Object.entries(componentSpacing).filter(([k]) => k.startsWith('modal')),
    'Input Spacing': Object.entries(componentSpacing).filter(([k]) => k.startsWith('input') || k.startsWith('form')),
    'Layout Spacing': Object.entries(componentSpacing).filter(([k]) =>
      k.startsWith('header') || k.startsWith('footer') || k.startsWith('page') || k.startsWith('section')
    ),
    'Stack & Inline': Object.entries(componentSpacing).filter(([k]) =>
      k.startsWith('stack') || k.startsWith('inline')
    ),
  };

  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([groupName, entries]) => (
        <div key={groupName}>
          <h3 className="text-lg font-semibold text-white mb-3">{groupName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map(([name, value]) => (
              <div key={name} className="flex justify-between items-center bg-[#252535] rounded-lg p-3 border border-white/5">
                <span className="text-xs text-cyan-400 font-mono">{name}</span>
                <span className="text-xs text-gray-400">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Layout spacing display
 */
const LayoutSpacingDisplay = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white">Container Widths</h3>
    <div className="space-y-3">
      {Object.entries(layoutSpacing).filter(([k]) => k.startsWith('container')).map(([name, value]) => (
        <div key={name} className="bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-cyan-400">{name}</span>
            <span className="text-xs text-gray-400">{value}</span>
          </div>
          <div
            className="h-3 bg-gradient-to-r from-cyan-500/50 to-magenta-500/50 rounded"
            style={{ width: '100%', maxWidth: value }}
          />
        </div>
      ))}
    </div>

    <h3 className="text-lg font-semibold text-white mt-8">Sidebar & Gutters</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(layoutSpacing).filter(([k]) => !k.startsWith('container')).map(([name, value]) => (
        <div key={name} className="flex justify-between items-center bg-[#252535] rounded-lg p-3 border border-white/5">
          <span className="text-xs text-cyan-400 font-mono">{name}</span>
          <span className="text-xs text-gray-400">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Interactive spacing demo
 */
const SpacingDemo = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Visual Spacing Demo</h3>
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
          <p className="text-sm text-gray-400 mb-4">Elements with different spacing values:</p>
          <div className="flex gap-4 items-end">
            {['2', '4', '6', '8'].map((size) => (
              <div key={size} className="text-center">
                <div
                  className="bg-cyan-500/30 border-2 border-cyan-500 rounded"
                  style={{
                    width: spacing[size as keyof typeof spacing],
                    height: spacing[size as keyof typeof spacing]
                  }}
                />
                <span className="text-xs text-gray-400 mt-2 block">{size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Box with Padding Demo</h3>
        <div className="flex gap-4 flex-wrap">
          {['sm', 'md', 'lg', 'xl'].map((size) => (
            <div
              key={size}
              className="bg-[#252535] border border-cyan-500/30 rounded-lg"
              style={{ padding: semanticSpacing[size as keyof typeof semanticSpacing] }}
            >
              <div className="bg-cyan-500/20 rounded p-2">
                <span className="text-xs text-cyan-400">{size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Main spacing documentation component
 */
const SpacingDocumentation = () => {
  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00ffff' }}>
            Spacing Tokens
          </h1>
          <p className="text-gray-400 text-lg">
            x402Arcade Design System - Based on 4px (0.25rem) base unit
          </p>
        </header>

        {/* Spacing Scale Section */}
        <section className="mb-16">
          <SectionHeader
            title="Spacing Scale"
            description="Core spacing values based on a 4px base unit. Use these for margins, padding, and gaps."
          />
          <SpacingScaleVisualization />
        </section>

        {/* Semantic Spacing Section */}
        <section className="mb-16">
          <SectionHeader
            title="Semantic Spacing"
            description="Named spacing values for common use cases (xs, sm, md, lg, xl, 2xl, 3xl, 4xl)."
          />
          <SemanticSpacingDisplay />
        </section>

        {/* Component Spacing Section */}
        <section className="mb-16">
          <SectionHeader
            title="Component Spacing"
            description="Pre-defined spacing values for buttons, cards, modals, inputs, and more."
          />
          <ComponentSpacingDisplay />
        </section>

        {/* Layout Spacing Section */}
        <section className="mb-16">
          <SectionHeader
            title="Layout Spacing"
            description="Container widths, sidebar dimensions, and gutter values."
          />
          <LayoutSpacingDisplay />
        </section>

        {/* Demo Section */}
        <section className="mb-16">
          <SectionHeader
            title="Interactive Demo"
            description="Visual demonstrations of spacing in action."
          />
          <SpacingDemo />
        </section>
      </div>
    </div>
  );
};

const meta = {
  title: 'Design Tokens/Spacing',
  component: SpacingDocumentation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'arcade-dark',
    },
    docs: {
      description: {
        component: `
# Spacing Tokens

The x402Arcade spacing system is based on a **4px (0.25rem) base unit** for consistent visual rhythm.

## Scale

| Token | Value | Pixels |
|-------|-------|--------|
| 0 | 0 | 0px |
| 1 | 0.25rem | 4px |
| 2 | 0.5rem | 8px |
| 4 | 1rem | 16px |
| 8 | 2rem | 32px |

## Usage

\`\`\`tsx
import { spacing, semanticSpacing, componentSpacing } from '@/styles/tokens/spacing';

// Direct values
<div style={{ padding: spacing['4'] }}>16px padding</div>

// Semantic values
<div style={{ gap: semanticSpacing.md }}>Medium gap</div>

// Component values
<button style={{
  paddingLeft: componentSpacing.buttonPaddingX,
  paddingTop: componentSpacing.buttonPaddingY
}}>
  Button
</button>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpacingDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSpacing: Story = {};

export const SpacingScale: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Full Spacing Scale" />
      <FullSpacingScale />
    </div>
  ),
};

export const SemanticSpacingStory: Story = {
  name: 'Semantic Spacing',
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Semantic Spacing" />
      <SemanticSpacingDisplay />
    </div>
  ),
};

export const ComponentSpacingStory: Story = {
  name: 'Component Spacing',
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Component Spacing" />
      <ComponentSpacingDisplay />
    </div>
  ),
};

export const NegativeSpacingStory: Story = {
  name: 'Negative Spacing',
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Negative Spacing" description="For margin adjustments and overlapping elements." />
      <NegativeSpacingScale />
    </div>
  ),
};
