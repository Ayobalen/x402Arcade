import type { Meta, StoryObj } from '@storybook/react';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,
} from '../../styles/tokens/typography';

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
 * Font family showcase component
 */
const FontFamilyShowcase = () => (
  <div className="space-y-6">
    {Object.entries(fontFamilies).map(([name, value]) => (
      <div key={name} className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
            <code className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">{value}</code>
          </div>
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">fontFamilies.{name}</span>
        </div>
        <div className="space-y-2" style={{ fontFamily: value }}>
          <p className="text-4xl text-white">The quick brown fox jumps over the lazy dog</p>
          <p className="text-2xl text-gray-300">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p className="text-xl text-gray-400">abcdefghijklmnopqrstuvwxyz 0123456789</p>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Font size scale component
 */
const FontSizeScale = () => (
  <div className="space-y-4">
    {Object.entries(fontSizes).map(([name, value]) => (
      <div key={name} className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <div className="w-24 flex-shrink-0">
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
        </div>
        <div className="w-20 flex-shrink-0">
          <span className="text-xs text-gray-400">{value}</span>
        </div>
        <p className="text-white" style={{ fontSize: value }}>
          The quick brown fox
        </p>
      </div>
    ))}
  </div>
);

/**
 * Font weight scale component
 */
const FontWeightScale = () => (
  <div className="space-y-3">
    {Object.entries(fontWeights).map(([name, value]) => (
      <div key={name} className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <div className="w-24 flex-shrink-0">
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
        </div>
        <div className="w-16 flex-shrink-0">
          <span className="text-xs text-gray-400">{value}</span>
        </div>
        <p className="text-xl text-white" style={{ fontWeight: value }}>
          The quick brown fox jumps over the lazy dog
        </p>
      </div>
    ))}
  </div>
);

/**
 * Line height showcase component
 */
const LineHeightShowcase = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Object.entries(lineHeights).map(([name, value]) => (
      <div key={name} className="bg-[#1a1a2e] rounded-xl p-4 border border-white/10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
          <span className="text-xs text-gray-400">{value}</span>
        </div>
        <p className="text-white text-sm bg-[#252535] p-3 rounded" style={{ lineHeight: value }}>
          This paragraph demonstrates the line height of {value}. Multiple lines of text help visualize
          the vertical spacing between lines. The quick brown fox jumps over the lazy dog.
        </p>
      </div>
    ))}
  </div>
);

/**
 * Letter spacing showcase component
 */
const LetterSpacingShowcase = () => (
  <div className="space-y-3">
    {Object.entries(letterSpacing).map(([name, value]) => (
      <div key={name} className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-4 border border-white/10">
        <div className="w-24 flex-shrink-0">
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
        </div>
        <div className="w-20 flex-shrink-0">
          <span className="text-xs text-gray-400">{value}</span>
        </div>
        <p className="text-xl text-white uppercase" style={{ letterSpacing: value }}>
          Letter Spacing
        </p>
      </div>
    ))}
  </div>
);

/**
 * Text styles showcase component
 */
const TextStylesShowcase = () => (
  <div className="space-y-6">
    {Object.entries(textStyles).map(([name, style]) => (
      <div key={name} className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">textStyles.{name}</span>
          <div className="text-xs text-gray-400 text-right">
            <div>Size: {style.fontSize}</div>
            <div>Weight: {style.fontWeight}</div>
            <div>Line: {style.lineHeight}</div>
          </div>
        </div>
        <p
          className="text-white"
          style={{
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
          }}
        >
          {name === 'walletAddress' ? '0x742d35Cc6634C0532925a3b844Bc9e7595f...abc' :
           name === 'gameScore' ? '1,234,567' :
           name === 'codeBlock' || name === 'codeInline' ? 'const score = await game.getScore();' :
           'The quick brown fox jumps over the lazy dog'}
        </p>
      </div>
    ))}
  </div>
);

/**
 * Main typography documentation component
 */
const TypographyDocumentation = () => {
  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00ffff' }}>
            Typography Tokens
          </h1>
          <p className="text-gray-400 text-lg">
            x402Arcade Design System - Font families, sizes, weights, and pre-composed text styles
          </p>
        </header>

        {/* Font Families Section */}
        <section className="mb-16">
          <SectionHeader
            title="Font Families"
            description="Display (Orbitron) for headings, Body (Inter) for content, Code (JetBrains Mono) for addresses."
          />
          <FontFamilyShowcase />
        </section>

        {/* Font Sizes Section */}
        <section className="mb-16">
          <SectionHeader
            title="Font Sizes"
            description="A consistent scale from xs (0.75rem) to 9xl (8rem)."
          />
          <FontSizeScale />
        </section>

        {/* Font Weights Section */}
        <section className="mb-16">
          <SectionHeader
            title="Font Weights"
            description="Standard weight values from thin (100) to black (900)."
          />
          <FontWeightScale />
        </section>

        {/* Line Heights Section */}
        <section className="mb-16">
          <SectionHeader
            title="Line Heights"
            description="Line height values from none (1) to loose (2)."
          />
          <LineHeightShowcase />
        </section>

        {/* Letter Spacing Section */}
        <section className="mb-16">
          <SectionHeader
            title="Letter Spacing"
            description="Character spacing values for fine-tuning typography."
          />
          <LetterSpacingShowcase />
        </section>

        {/* Text Styles Section */}
        <section className="mb-16">
          <SectionHeader
            title="Text Styles"
            description="Pre-composed text style objects for common use cases."
          />
          <TextStylesShowcase />
        </section>
      </div>
    </div>
  );
};

const meta = {
  title: 'Design Tokens/Typography',
  component: TypographyDocumentation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'arcade-dark',
    },
    docs: {
      description: {
        component: `
# Typography Tokens

The x402Arcade typography system features three distinct font families:

- **Orbitron**: Retro gaming aesthetic for headings and display text
- **Inter**: Clean and readable for body content and UI text
- **JetBrains Mono**: Monospace for wallet addresses and code

## Usage

\`\`\`tsx
import { fontFamilies, fontSizes, textStyles } from '@/styles/tokens/typography';

// Use individual values
<h1 style={{ fontFamily: fontFamilies.display, fontSize: fontSizes['4xl'] }}>
  Page Title
</h1>

// Use pre-composed styles
<h1 style={textStyles.pageTitle}>Page Title</h1>
<p style={textStyles.body}>Body text content...</p>
<code style={textStyles.walletAddress}>0x742d35Cc...</code>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TypographyDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTypography: Story = {};

export const FontFamilies: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Font Families" />
      <FontFamilyShowcase />
    </div>
  ),
};

export const FontSizes: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Font Sizes" />
      <FontSizeScale />
    </div>
  ),
};

export const FontWeights: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Font Weights" />
      <FontWeightScale />
    </div>
  ),
};

export const TextStyles: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Pre-composed Text Styles" />
      <TextStylesShowcase />
    </div>
  ),
};
