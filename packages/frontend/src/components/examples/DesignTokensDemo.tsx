/**
 * Design Tokens Demo Component
 *
 * This component demonstrates the usage of the new design tokens:
 * - Container widths
 * - Aspect ratios
 * - Opacity scale
 *
 * This is for documentation/testing purposes only.
 */

import React from 'react';

export const DesignTokensDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-primary p-8 space-y-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-5xl font-bold text-primary mb-8">Design Tokens Demo</h1>

        {/* Container Widths */}
        <section className="mb-12">
          <h2 className="font-display text-3xl font-bold text-text-primary mb-6">
            Container Widths
          </h2>
          <div className="space-y-4">
            {[
              { size: 'xs', label: '20rem (320px)' },
              { size: 'sm', label: '24rem (384px)' },
              { size: 'md', label: '28rem (448px)' },
              { size: 'lg', label: '32rem (512px)' },
              { size: 'xl', label: '36rem (576px)' },
              { size: '2xl', label: '42rem (672px)' },
              { size: '3xl', label: '48rem (768px)' },
              { size: '5xl', label: '64rem (1024px)' },
            ].map(({ size, label }) => (
              <div
                key={size}
                className={`max-w-${size} bg-surface-primary border border-border rounded-lg p-4`}
              >
                <code className="font-mono text-sm text-primary">max-w-{size}</code>
                <span className="text-text-muted ml-2">({label})</span>
              </div>
            ))}
          </div>
        </section>

        {/* Aspect Ratios */}
        <section className="mb-12">
          <h2 className="font-display text-3xl font-bold text-text-primary mb-6">Aspect Ratios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { ratio: 'square', label: '1:1' },
              { ratio: 'landscape', label: '4:3' },
              { ratio: 'video', label: '16:9' },
              { ratio: 'wide', label: '2:1' },
              { ratio: 'golden', label: '1.618:1' },
              { ratio: 'portrait', label: '3:4' },
            ].map(({ ratio, label }) => (
              <div key={ratio} className="space-y-2">
                <div
                  className={`aspect-${ratio} bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center`}
                >
                  <div className="text-center">
                    <code className="font-mono text-sm text-white">aspect-{ratio}</code>
                    <div className="text-white/80 text-xs mt-1">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Opacity Scale */}
        <section className="mb-12">
          <h2 className="font-display text-3xl font-bold text-text-primary mb-6">Opacity Scale</h2>

          {/* Numeric opacity */}
          <h3 className="font-display text-xl font-semibold text-text-secondary mb-4">
            Numeric (0-100)
          </h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-8">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((level) => (
              <div key={level} className="text-center">
                <div className={`h-16 bg-primary rounded-lg opacity-${level} mb-2`} />
                <code className="font-mono text-xs text-text-muted">{level}</code>
              </div>
            ))}
          </div>

          {/* Semantic opacity */}
          <h3 className="font-display text-xl font-semibold text-text-secondary mb-4">
            Semantic Opacity
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { name: 'ghost', value: '5%' },
              { name: 'faint', value: '20%' },
              { name: 'disabled', value: '40%' },
              { name: 'muted', value: '50%' },
              { name: 'dimmed', value: '60%' },
              { name: 'visible', value: '80%' },
              { name: 'active', value: '90%' },
              { name: 'solid', value: '100%' },
            ].map(({ name, value }) => (
              <div key={name} className="bg-surface-primary border border-border rounded-lg p-4">
                <div className={`h-12 bg-secondary rounded mb-2 opacity-${name}`} />
                <code className="font-mono text-xs text-primary block">opacity-{name}</code>
                <span className="text-text-muted text-xs">{value}</span>
              </div>
            ))}
          </div>

          {/* Overlay opacity */}
          <h3 className="font-display text-xl font-semibold text-text-secondary mb-4">
            Overlay Opacity
          </h3>
          <div className="relative h-64 bg-surface-primary rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop"
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-6">
              {['subtle', 'light', 'medium', 'dark', 'heavy', 'solid'].map((level) => (
                <div
                  key={level}
                  className={`bg-black opacity-overlay-${level} flex items-center justify-center`}
                >
                  <code className="font-mono text-xs text-white transform rotate-90">{level}</code>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Min Heights */}
        <section className="mb-12">
          <h2 className="font-display text-3xl font-bold text-text-primary mb-6">
            Min Heights (Viewport Units)
          </h2>
          <div className="space-y-4">
            {[
              { size: 'screen-quarter', label: '25vh' },
              { size: 'screen-third', label: '33.333vh' },
              { size: 'screen-half', label: '50vh' },
            ].map(({ size, label }) => (
              <div
                key={size}
                className={`min-h-${size} bg-surface-primary border border-border rounded-lg p-4 flex items-center justify-center`}
              >
                <div className="text-center">
                  <code className="font-mono text-sm text-primary">min-h-{size}</code>
                  <div className="text-text-muted text-sm">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Example */}
        <section className="mb-12">
          <h2 className="font-display text-3xl font-bold text-text-primary mb-6">
            Real-World Example
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="aspect-video bg-surface-primary border border-primary/20 rounded-xl overflow-hidden shadow-glow-cyan">
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-surface-primary">
                <div className="text-center space-y-4 p-8">
                  <h3 className="font-display text-4xl font-bold text-primary opacity-active">
                    Insert Coin
                  </h3>
                  <p className="font-body text-lg text-text-secondary opacity-dimmed max-w-prose">
                    Combining aspect-video (16:9), max-w-prose (readable width), opacity-active
                    (90%), and opacity-dimmed (60%) for perfect composition.
                  </p>
                  <button className="px-6 py-3 bg-primary text-white rounded-lg shadow-button-hover hover:shadow-glow-cyan-intense transition-all duration-moderate">
                    Play Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignTokensDemo;
