import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import {
  durations,
  durationMs,
  easings,
  keyframes,
  animations,
  transitions,
} from '../../styles/tokens/animations';

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
 * Duration visualization component
 */
const DurationVisualization = () => {
  const [playing, setPlaying] = useState(false);
  const [key, setKey] = useState(0);

  const handlePlay = () => {
    setPlaying(true);
    setKey((k) => k + 1);
    setTimeout(() => setPlaying(false), 3000);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePlay}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        {playing ? 'Playing...' : 'Play Animation'}
      </button>

      <div className="space-y-3">
        {Object.entries(durations).map(([name, value]) => {
          const ms = durationMs[name as keyof typeof durationMs] || 0;

          return (
            <div
              key={name}
              className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-3 border border-white/10"
            >
              <div className="w-24 flex-shrink-0">
                <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
              </div>
              <div className="w-16 flex-shrink-0">
                <span className="text-xs text-gray-400">{value}</span>
              </div>
              <div className="flex-1 h-4 bg-[#252535] rounded-full overflow-hidden relative">
                <div
                  key={`${name}-${key}`}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-full"
                  style={{
                    width: playing ? '100%' : '0%',
                    transition: playing ? `width ${value} linear` : 'none',
                  }}
                />
              </div>
              <div className="w-12 flex-shrink-0 text-right">
                <span className="text-xs text-gray-500">{ms}ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Easing visualization component
 */
const EasingVisualization = () => {
  const [playing, setPlaying] = useState(false);
  const [key, setKey] = useState(0);

  const handlePlay = () => {
    setPlaying(true);
    setKey((k) => k + 1);
    setTimeout(() => setPlaying(false), 1500);
  };

  // Show a subset of the most commonly used easings
  const displayEasings = [
    'linear',
    'ease',
    'easeIn',
    'easeOut',
    'easeInOut',
    'cubicOut',
    'quartOut',
    'expoOut',
    'backOut',
    'spring',
    'elastic',
  ];

  return (
    <div className="space-y-4">
      <button
        onClick={handlePlay}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        {playing ? 'Playing...' : 'Compare Easings'}
      </button>

      <div className="space-y-3">
        {displayEasings.map((name) => {
          const value = easings[name as keyof typeof easings];

          return (
            <div
              key={name}
              className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-3 border border-white/10"
            >
              <div className="w-24 flex-shrink-0">
                <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
              </div>
              <div className="flex-1 h-8 bg-[#252535] rounded-lg overflow-hidden relative">
                <div
                  key={`${name}-${key}`}
                  className="absolute top-1 left-0 w-6 h-6 bg-cyan-500 rounded-full"
                  style={{
                    transform: playing ? 'translateX(calc(100vw - 200px))' : 'translateX(0)',
                    transition: playing ? `transform 1s ${value}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Keyframe animations showcase
 */
const KeyframeShowcase = () => {
  // CSS keyframes need to be injected into the page
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideInUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideInDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes ping {
        75%, 100% { transform: scale(2); opacity: 0; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-25%); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); }
        50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.6), 0 0 60px rgba(0, 255, 255, 0.3); }
      }
      @keyframes neonFlicker {
        0%, 100% { opacity: 1; }
        92% { opacity: 1; }
        93% { opacity: 0.8; }
        94% { opacity: 1; }
        96% { opacity: 0.9; }
        97% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

  const animationConfigs: Record<string, { animation: string; infinite?: boolean }> = {
    fadeIn: { animation: 'fadeIn 0.5s ease-out forwards' },
    slideInUp: { animation: 'slideInUp 0.5s ease-out forwards' },
    slideInDown: { animation: 'slideInDown 0.5s ease-out forwards' },
    scaleIn: { animation: 'scaleIn 0.5s ease-out forwards' },
    pulse: { animation: 'pulse 1s ease-in-out infinite', infinite: true },
    ping: { animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', infinite: true },
    bounce: { animation: 'bounce 1s ease-in-out infinite', infinite: true },
    shake: { animation: 'shake 0.5s ease-in-out infinite', infinite: true },
    spin: { animation: 'spin 1s linear infinite', infinite: true },
    glowPulse: { animation: 'glowPulse 2s ease-in-out infinite', infinite: true },
    neonFlicker: { animation: 'neonFlicker 2s linear infinite', infinite: true },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Object.entries(keyframes).map(([name]) => {
        const config = animationConfigs[name];
        const isActive = activeAnimation === name;

        return (
          <div
            key={name}
            className="bg-[#1a1a2e] rounded-xl p-4 border border-white/10 cursor-pointer hover:border-cyan-500/30 transition-colors"
            onMouseEnter={() => setActiveAnimation(name)}
            onMouseLeave={() => !config?.infinite && setActiveAnimation(null)}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
            </div>
            <div className="flex justify-center items-center h-20">
              {config ? (
                <div
                  className={`w-12 h-12 rounded-lg ${name.includes('glow') ? '' : 'bg-gradient-to-br from-cyan-500 to-magenta-500'}`}
                  style={{
                    animation: isActive ? config.animation : 'none',
                    backgroundColor: name.includes('glow') ? '#1a1a2e' : undefined,
                    border: name.includes('glow') ? '2px solid #00ffff' : undefined,
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#252535] flex items-center justify-center">
                  <span className="text-[10px] text-gray-500">CSS</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              {config?.infinite ? 'Hover to see (infinite)' : 'Hover to trigger'}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Pre-composed animations showcase
 */
const AnimationsShowcase = () => {
  // Inject keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-25%); }
      }
      @keyframes ping {
        75%, 100% { transform: scale(2); opacity: 0; }
      }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); }
        50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.6), 0 0 60px rgba(0, 255, 255, 0.3); }
      }
      @keyframes neonFlicker {
        0%, 100% { opacity: 1; }
        92% { opacity: 1; }
        93% { opacity: 0.8; }
        94% { opacity: 1; }
        96% { opacity: 0.9; }
        97% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(animations).map(([name, value]) => (
        <div key={name} className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
          </div>
          <div className="flex justify-center items-center h-24">
            {value === 'none' ? (
              <div className="w-16 h-16 rounded-lg bg-[#252535] flex items-center justify-center">
                <span className="text-xs text-gray-500">none</span>
              </div>
            ) : name === 'glowPulse' || name === 'neonFlicker' ? (
              <div
                className="w-16 h-16 rounded-lg border-2 border-cyan-500"
                style={{ animation: value }}
              />
            ) : name === 'spin' ? (
              <div
                className="w-16 h-16 rounded-lg border-4 border-cyan-500 border-t-transparent"
                style={{ animation: value }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500"
                style={{ animation: value }}
              />
            )}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2 font-mono truncate" title={value}>
            {value === 'none' ? 'No animation' : 'Infinite animation'}
          </p>
        </div>
      ))}
    </div>
  );
};

/**
 * Transitions showcase
 */
const TransitionsShowcase = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {Object.entries(transitions).map(([name, value]) => (
        <div
          key={name}
          className="flex items-center gap-4 bg-[#1a1a2e] rounded-lg p-4 border border-white/10"
        >
          <div className="w-28 flex-shrink-0">
            <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{name}</span>
          </div>
          <div className="flex-1">
            <div
              className="h-12 rounded-lg flex items-center justify-center cursor-pointer"
              style={{
                transition: value,
                backgroundColor: hovered === name ? '#00ffff' : '#252535',
                color: hovered === name ? '#0a0a0f' : '#fff',
                transform: hovered === name ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hovered === name ? '0 0 20px rgba(0, 255, 255, 0.4)' : 'none',
              }}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-sm font-medium">Hover me</span>
            </div>
          </div>
          <div className="w-48 flex-shrink-0">
            <code className="text-[10px] text-gray-400 break-all">{value === 'none' ? 'none' : 'transition applied'}</code>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Interactive demo with all animation types
 */
const InteractiveDemo = () => {
  const [showCard, setShowCard] = useState(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); }
        50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.6), 0 0 60px rgba(0, 255, 255, 0.3); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          onClick={() => setShowCard(false)}
          className="px-4 py-2 rounded-lg bg-[#252535] text-white text-sm hover:bg-[#2d2d45] transition-colors"
        >
          Hide Card
        </button>
        <button
          onClick={() => setShowCard(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-magenta-500 text-white text-sm hover:opacity-90 transition-opacity"
        >
          Show Card (Animated)
        </button>
      </div>

      <div className="h-64 flex items-center justify-center">
        {showCard && (
          <div
            className="w-80 bg-[#1a1a2e] rounded-2xl p-6 border border-cyan-500/30"
            style={{
              animation: 'slideInUp 0.5s ease-out forwards, glowPulse 2s ease-in-out infinite',
            }}
          >
            <h3 className="text-xl font-bold text-cyan-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Animated Card
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              This card combines slideInUp entrance animation with continuous glowPulse effect.
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors"
              >
                Primary
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#252535] text-white text-sm hover:bg-[#2d2d45] transition-colors"
              >
                Secondary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main animations documentation component
 */
const AnimationsDocumentation = () => {
  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00ffff' }}>
            Animation Tokens
          </h1>
          <p className="text-gray-400 text-lg">
            x402Arcade Design System - Durations, easings, keyframes, and transitions
          </p>
        </header>

        {/* Durations Section */}
        <section className="mb-16">
          <SectionHeader
            title="Durations"
            description="Consistent timing values from instant (0ms) to eternal (2000ms)."
          />
          <DurationVisualization />
        </section>

        {/* Easings Section */}
        <section className="mb-16">
          <SectionHeader
            title="Easing Functions"
            description="CSS timing functions for natural-feeling animations."
          />
          <EasingVisualization />
        </section>

        {/* Keyframes Section */}
        <section className="mb-16">
          <SectionHeader
            title="Keyframe Animations"
            description="Reference names for keyframe animations. Hover to preview."
          />
          <KeyframeShowcase />
        </section>

        {/* Pre-composed Animations Section */}
        <section className="mb-16">
          <SectionHeader
            title="Pre-composed Animations"
            description="Ready-to-use animation property values."
          />
          <AnimationsShowcase />
        </section>

        {/* Transitions Section */}
        <section className="mb-16">
          <SectionHeader
            title="Transition Presets"
            description="Common transition property combinations. Hover to see in action."
          />
          <TransitionsShowcase />
        </section>

        {/* Interactive Demo Section */}
        <section className="mb-16">
          <SectionHeader
            title="Interactive Demo"
            description="Combined animations in a real component."
          />
          <InteractiveDemo />
        </section>
      </div>
    </div>
  );
};

const meta = {
  title: 'Design Tokens/Animations',
  component: AnimationsDocumentation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'arcade-dark',
    },
    docs: {
      description: {
        component: `
# Animation Tokens

The x402Arcade animation system provides snappy, responsive interactions with a neon aesthetic:

- **Durations**: From instant (0ms) to eternal (2000ms), with quick (150ms) and default (200ms) being most common
- **Easings**: From linear to elastic/spring, including custom cubic-bezier curves
- **Keyframes**: Named animations for entrance, exit, attention, and arcade effects
- **Transitions**: Pre-composed transition strings for common use cases

## Usage

\`\`\`tsx
import { durations, easings, transitions, animations } from '@/styles/tokens/animations';

// Simple transition
<button style={{ transition: transitions.all }}>Hover me</button>

// Custom animation timing
<div style={{
  transition: \`transform \${durations.quick} \${easings.backOut}\`
}}>Bouncy element</div>

// Pre-composed animation
<div style={{ animation: animations.glowPulse }}>Glowing element</div>
\`\`\`

## Arcade-Specific Animations

- **glowPulse**: Pulsing neon glow effect
- **neonFlicker**: Retro sign flicker effect
- **scorePop**: Score increment animation
- **comboFlash**: Combo multiplier flash
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnimationsDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllAnimations: Story = {};

export const DurationsStory: Story = {
  name: 'Durations',
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Animation Durations" description="Click Play to see timing comparison." />
      <DurationVisualization />
    </div>
  ),
};

export const EasingsStory: Story = {
  name: 'Easings',
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Easing Functions" description="Click to compare easing curves." />
      <EasingVisualization />
    </div>
  ),
};

export const KeyframesStory: Story = {
  name: 'Keyframes',
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Keyframe Animations" description="Hover to preview animations." />
      <KeyframeShowcase />
    </div>
  ),
};

export const TransitionsStory: Story = {
  name: 'Transitions',
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Transition Presets" description="Hover to see transitions in action." />
      <TransitionsShowcase />
    </div>
  ),
};

export const Demo: Story = {
  render: () => (
    <div className="p-8 bg-[#0a0a0f]">
      <SectionHeader title="Interactive Demo" description="Combined animations example." />
      <InteractiveDemo />
    </div>
  ),
};
