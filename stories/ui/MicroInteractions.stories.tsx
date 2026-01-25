/**
 * Micro-Interactions Storybook Stories
 *
 * Showcases cursor trail, click ripple, and particle burst effects.
 * These subtle animations enhance user experience and add polish.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CursorTrail } from '../../packages/frontend/src/components/ui/CursorTrail';
import { ClickRipple } from '../../packages/frontend/src/components/ui/ClickRipple';
import { ParticleBurst } from '../../packages/frontend/src/components/ui/ParticleBurst';
import { Button } from '../../packages/frontend/src/components/ui/Button';
import { Card } from '../../packages/frontend/src/components/ui/Card';

const meta: Meta = {
  title: 'Micro-Interactions',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/**
 * CursorTrail - Default
 * Cyan trail following the cursor with smooth motion
 */
export const CursorTrailDefault: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <CursorTrail />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Cursor Trail Effect</h1>
        <p className="text-[#94a3b8] mb-8">
          Move your mouse around to see the cyan trail following your cursor.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Smooth Motion</h3>
            <p className="text-[#94a3b8]">
              Trail uses spring physics for natural movement
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Progressive Fade</h3>
            <p className="text-[#94a3b8]">
              Each trail element fades out progressively
            </p>
          </Card>
        </div>
      </div>
    </div>
  ),
};

/**
 * CursorTrail - Magenta Color
 * Custom color trail with retro arcade aesthetic
 */
export const CursorTrailMagenta: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <CursorTrail color="#ff00ff" />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Magenta Cursor Trail
        </h1>
        <p className="text-[#94a3b8] mb-8">
          Move your mouse to see the magenta trail effect.
        </p>
        <div className="space-y-4">
          <Card className="p-8">
            <p className="text-white text-lg">
              The trail color can be customized to match your brand or theme.
            </p>
          </Card>
        </div>
      </div>
    </div>
  ),
};

/**
 * CursorTrail - Long Trail
 * Extended trail length for more dramatic effect
 */
export const CursorTrailLong: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <CursorTrail trailLength={16} trailSize={6} delay={30} />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Long Cursor Trail</h1>
        <p className="text-[#94a3b8] mb-8">
          16 trail elements with tighter spacing for a longer effect.
        </p>
      </div>
    </div>
  ),
};

/**
 * ClickRipple - Default
 * Purple ripple effect on mouse clicks
 */
export const ClickRippleDefault: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <ClickRipple />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Click Ripple Effect</h1>
        <p className="text-[#94a3b8] mb-8">
          Click anywhere on the screen to see the ripple animation.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-6 cursor-pointer hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">Click Me</h3>
            <p className="text-[#94a3b8] text-sm">Watch the ripple</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">Or Me</h3>
            <p className="text-[#94a3b8] text-sm">Ripple from center</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">Or Here</h3>
            <p className="text-[#94a3b8] text-sm">Smooth expansion</p>
          </Card>
        </div>
      </div>
    </div>
  ),
};

/**
 * ClickRipple - Cyan Color
 * Custom color ripple with larger size
 */
export const ClickRippleCyan: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <ClickRipple color="#00ffff" size={150} />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Cyan Ripple Effect
        </h1>
        <p className="text-[#94a3b8] mb-8">
          Larger cyan ripples for a more dramatic effect.
        </p>
      </div>
    </div>
  ),
};

/**
 * ClickRipple - Fast Animation
 * Quick ripple for snappy feedback
 */
export const ClickRippleFast: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <ClickRipple duration={0.3} size={80} />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Fast Ripple</h1>
        <p className="text-[#94a3b8] mb-8">
          Quick 0.3s animation for instant feedback.
        </p>
        <Button variant="primary" size="lg">
          Click for fast ripple
        </Button>
      </div>
    </div>
  ),
};

/**
 * ParticleBurst - Interactive Demo
 * Click to trigger particle bursts at cursor position
 */
export const ParticleBurstInteractive: StoryObj = {
  render: () => {
    const [bursts, setBursts] = useState<Array<{ id: string; x: number; y: number }>>([]);

    const handleClick = (e: React.MouseEvent) => {
      const newBurst = {
        id: `${Date.now()}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY,
      };

      setBursts((prev) => [...prev, newBurst]);

      // Remove burst after animation completes
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== newBurst.id));
      }, 800);
    };

    return (
      <div
        className="min-h-screen bg-[#0a0a0a] p-8 cursor-pointer"
        onClick={handleClick}
      >
        {bursts.map((burst) => (
          <ParticleBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            color="#00ffff"
          />
        ))}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Particle Burst Effect
          </h1>
          <p className="text-[#94a3b8] mb-8">
            Click anywhere to trigger a particle burst at that location.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                12 Particles
              </h3>
              <p className="text-[#94a3b8]">
                Particles radiate outward in a circle
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Smooth Fade
              </h3>
              <p className="text-[#94a3b8]">
                Particles fade and shrink as they travel
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ParticleBurst - Magenta Burst
 * Large magenta particle burst
 */
export const ParticleBurstMagenta: StoryObj = {
  render: () => {
    const [bursts, setBursts] = useState<Array<{ id: string; x: number; y: number }>>([]);

    const handleClick = (e: React.MouseEvent) => {
      const newBurst = {
        id: `${Date.now()}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY,
      };

      setBursts((prev) => [...prev, newBurst]);

      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== newBurst.id));
      }, 1000);
    };

    return (
      <div
        className="min-h-screen bg-[#0a0a0a] p-8 cursor-pointer"
        onClick={handleClick}
      >
        {bursts.map((burst) => (
          <ParticleBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            color="#ff00ff"
            particleCount={20}
            distance={80}
            particleSize={6}
            duration={1.0}
          />
        ))}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Magenta Particle Burst
          </h1>
          <p className="text-[#94a3b8] mb-8">
            Click for a larger burst with 20 particles.
          </p>
        </div>
      </div>
    );
  },
};

/**
 * All Effects Combined
 * Showcase all three micro-interactions together
 */
export const AllEffectsCombined: StoryObj = {
  render: () => {
    const [bursts, setBursts] = useState<Array<{ id: string; x: number; y: number }>>([]);

    const handleCardClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newBurst = {
        id: `${Date.now()}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY,
      };

      setBursts((prev) => [...prev, newBurst]);

      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== newBurst.id));
      }, 800);
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <CursorTrail color="#00ffff" trailLength={10} />
        <ClickRipple color="#8B5CF6" />
        {bursts.map((burst) => (
          <ParticleBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            color="#ff00ff"
            particleCount={16}
          />
        ))}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              All Micro-Interactions
            </h1>
            <p className="text-[#94a3b8] mb-2">
              Experience all three effects working together:
            </p>
            <p className="text-[#94a3b8]">
              • Cyan cursor trail follows your mouse<br />
              • Purple ripple appears on any click<br />
              • Magenta particle burst on card clicks
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card
              className="p-8 cursor-pointer hover:scale-105 transition-transform"
              onClick={handleCardClick}
            >
              <h3 className="text-2xl font-semibold text-white mb-3">
                Click Me
              </h3>
              <p className="text-[#94a3b8]">
                Triggers particle burst + ripple effect
              </p>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:scale-105 transition-transform"
              onClick={handleCardClick}
            >
              <h3 className="text-2xl font-semibold text-white mb-3">
                Or Here
              </h3>
              <p className="text-[#94a3b8]">
                See all effects combine for rich feedback
              </p>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:scale-105 transition-transform"
              onClick={handleCardClick}
            >
              <h3 className="text-2xl font-semibold text-white mb-3">
                Subtle Polish
              </h3>
              <p className="text-[#94a3b8]">
                Micro-interactions enhance user experience
              </p>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:scale-105 transition-transform"
              onClick={handleCardClick}
            >
              <h3 className="text-2xl font-semibold text-white mb-3">
                Retro Aesthetic
              </h3>
              <p className="text-[#94a3b8]">
                Neon colors match arcade theme perfectly
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  },
};
