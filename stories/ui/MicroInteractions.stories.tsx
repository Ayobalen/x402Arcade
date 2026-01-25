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
import { ScorePopup } from '../../packages/frontend/src/components/ui/ScorePopup';
import { CoinCollect } from '../../packages/frontend/src/components/ui/CoinCollect';
import { LevelUpCelebration } from '../../packages/frontend/src/components/ui/LevelUpCelebration';
import { ComboFlash } from '../../packages/frontend/src/components/ui/ComboFlash';
import { PowerUpGlow } from '../../packages/frontend/src/components/ui/PowerUpGlow';
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

/**
 * ScorePopup - Interactive Demo
 * Click buttons to trigger score popups at different positions
 */
export const ScorePopupDemo: StoryObj = {
  render: () => {
    const [popups, setPopups] = useState<
      Array<{ id: string; score: number; x: number; y: number; color?: string; isCombo?: boolean }>
    >([]);

    const addPopup = (score: number, x: number, y: number, color?: string, isCombo = false) => {
      const newPopup = {
        id: `${Date.now()}-${Math.random()}`,
        score,
        x,
        y,
        color,
        isCombo,
      };

      setPopups((prev) => [...prev, newPopup]);

      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
      }, 2000);
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        {popups.map((popup) => (
          <ScorePopup
            key={popup.id}
            score={popup.score}
            x={popup.x}
            y={popup.y}
            color={popup.color}
            isCombo={popup.isCombo}
          />
        ))}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Score Popup Effect
            </h1>
            <p className="text-[#94a3b8] mb-8">
              Click the buttons to trigger score popups. Scores float upward and fade out.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Small Scores</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    addPopup(10, rect.left + rect.width / 2, rect.top);
                  }}
                >
                  +10 Points
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    addPopup(50, rect.left + rect.width / 2, rect.top);
                  }}
                >
                  +50 Points
                </Button>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Large Scores</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    addPopup(100, rect.left + rect.width / 2, rect.top, '#00ffff');
                  }}
                >
                  +100 Points (Cyan)
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    addPopup(250, rect.left + rect.width / 2, rect.top, undefined, true);
                  }}
                >
                  +250 COMBO!
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-[#1a1a2e]">
            <h3 className="text-lg font-semibold text-white mb-2">Features</h3>
            <ul className="text-[#94a3b8] space-y-1 text-sm">
              <li>• Bounce animation on appear (scale 0.5 → 1.2 → 1)</li>
              <li>• Floats upward 80px with fade out</li>
              <li>• COMBO mode with larger text and extra bounce</li>
              <li>• Customizable colors for different score types</li>
              <li>• Neon glow text shadow for arcade aesthetic</li>
            </ul>
          </Card>
        </div>
      </div>
    );
  },
};

/**
 * CoinCollect - Interactive Demo
 * Click to collect coins that fly to the counter
 */
export const CoinCollectDemo: StoryObj = {
  render: () => {
    const [coins, setCoins] = useState<Array<{ id: string; startX: number; startY: number }>>([]);
    const [balance, setBalance] = useState(0);

    const collectCoin = (x: number, y: number) => {
      const newCoin = {
        id: `${Date.now()}-${Math.random()}`,
        startX: x,
        startY: y,
      };

      setCoins((prev) => [...prev, newCoin]);

      setTimeout(() => {
        setBalance((prev) => prev + 1);
        setCoins((prev) => prev.filter((c) => c.id !== newCoin.id));
      }, 800);
    };

    const handleCardClick = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      collectCoin(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        {coins.map((coin) => (
          <CoinCollect
            key={coin.id}
            start={{ x: coin.startX, y: coin.startY }}
            end={{ x: window.innerWidth / 2, y: 100 }}
            duration={0.8}
          />
        ))}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Coin Collection Effect
            </h1>
            <p className="text-[#94a3b8] mb-4">
              Click the cards to collect coins. Watch them fly to the counter!
            </p>

            <div className="inline-block bg-[#1a1a2e] border-2 border-[#8B5CF6] rounded-lg px-8 py-4">
              <div className="text-[#94a3b8] text-sm mb-1">Coins Collected</div>
              <div className="text-5xl font-bold text-[#FFD700]">{balance}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card
              className="p-8 cursor-pointer hover:scale-105 transition-transform text-center"
              onClick={handleCardClick}
            >
              <div className="text-6xl mb-3">🪙</div>
              <h3 className="text-xl font-semibold text-white mb-2">Collect</h3>
              <p className="text-[#94a3b8] text-sm">Click to earn coin</p>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:scale-105 transition-transform text-center"
              onClick={handleCardClick}
            >
              <div className="text-6xl mb-3">💰</div>
              <h3 className="text-xl font-semibold text-white mb-2">Collect</h3>
              <p className="text-[#94a3b8] text-sm">Click to earn coin</p>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:scale-105 transition-transform text-center"
              onClick={handleCardClick}
            >
              <div className="text-6xl mb-3">✨</div>
              <h3 className="text-xl font-semibold text-white mb-2">Collect</h3>
              <p className="text-[#94a3b8] text-sm">Click to earn coin</p>
            </Card>
          </div>

          <Card className="p-6 bg-[#1a1a2e]">
            <h3 className="text-lg font-semibold text-white mb-2">Animation Features</h3>
            <ul className="text-[#94a3b8] space-y-1 text-sm">
              <li>• Bezier curve path animation (arc height 40% of distance)</li>
              <li>• Coin spins 720° during flight (2 full rotations)</li>
              <li>• 3D effect with inner circle scaling (scaleX: 1 → 0.3 → 1)</li>
              <li>• Target pulse effect on arrival</li>
              <li>• Customizable duration, size, and color</li>
            </ul>
          </Card>
        </div>
      </div>
    );
  },
};

/**
 * Celebration Effects - All celebration micro-interactions
 * Demo for LevelUpCelebration, ComboFlash, and PowerUpGlow
 */
export const CelebrationEffectsDemo: StoryObj = {
  render: () => {
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [level, setLevel] = useState(5);
    const [comboMultiplier, setComboMultiplier] = useState(1);
    const [showComboFlash, setShowComboFlash] = useState(false);
    const [powerUpActive, setPowerUpActive] = useState(false);

    const triggerLevelUp = () => {
      setLevel((prev) => prev + 1);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    };

    const increaseCombo = () => {
      setComboMultiplier((prev) => Math.min(prev + 1, 10));
      setShowComboFlash(true);
      setTimeout(() => setShowComboFlash(false), 600);
    };

    const resetCombo = () => {
      setComboMultiplier(1);
    };

    const activatePowerUp = () => {
      setPowerUpActive(true);
      setTimeout(() => setPowerUpActive(false), 3000);
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        {showLevelUp && (
          <LevelUpCelebration
            level={level}
            duration={3}
            showFlash
            particleCount={50}
          />
        )}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Celebration Effects
            </h1>
            <p className="text-[#94a3b8] mb-8">
              Trigger celebration animations for game events.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Level Up */}
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Level Up</h3>
              <div className="text-center mb-4">
                <div className="text-[#94a3b8] text-sm mb-1">Current Level</div>
                <div className="text-4xl font-bold text-[#FFD700]">{level}</div>
              </div>
              <Button variant="primary" fullWidth onClick={triggerLevelUp}>
                Level Up!
              </Button>
              <p className="text-[#94a3b8] text-xs mt-3">
                Full-screen confetti, flash, and "LEVEL UP!" text
              </p>
            </Card>

            {/* Combo Flash */}
            <Card className="p-8 relative">
              {showComboFlash && (
                <ComboFlash
                  multiplier={comboMultiplier}
                  show={showComboFlash}
                  position={{ x: 50, y: 50 }}
                />
              )}
              <h3 className="text-xl font-semibold text-white mb-4">Combo Flash</h3>
              <div className="text-center mb-4">
                <div className="text-[#94a3b8] text-sm mb-1">Multiplier</div>
                <div className="text-4xl font-bold text-white">x{comboMultiplier}</div>
              </div>
              <div className="space-y-2">
                <Button variant="primary" fullWidth onClick={increaseCombo}>
                  Increase Combo
                </Button>
                <Button variant="outline" size="sm" fullWidth onClick={resetCombo}>
                  Reset
                </Button>
              </div>
              <p className="text-[#94a3b8] text-xs mt-3">
                Flash intensity increases with combo level
              </p>
            </Card>

            {/* Power-Up Glow */}
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Power-Up Glow</h3>
              <div className="text-center mb-4">
                <PowerUpGlow
                  active={powerUpActive}
                  color="#00ffff"
                  duration={3}
                >
                  <div className="w-20 h-20 mx-auto bg-[#1a1a2e] border-2 border-[#00ffff] rounded-lg flex items-center justify-center text-4xl">
                    ⚡
                  </div>
                </PowerUpGlow>
              </div>
              <Button variant="primary" fullWidth onClick={activatePowerUp}>
                Activate Power-Up
              </Button>
              <p className="text-[#94a3b8] text-xs mt-3">
                Pulsing glow wraps around power-up icon
              </p>
            </Card>
          </div>

          <Card className="p-6 bg-[#1a1a2e]">
            <h3 className="text-lg font-semibold text-white mb-3">Effect Details</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="text-white font-semibold mb-2">LevelUpCelebration</h4>
                <ul className="text-[#94a3b8] space-y-1">
                  <li>• 50 confetti particles</li>
                  <li>• Screen flash effect</li>
                  <li>• Orbitron font</li>
                  <li>• Cyan neon glow</li>
                  <li>• 3 second duration</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">ComboFlash</h4>
                <ul className="text-[#94a3b8] space-y-1">
                  <li>• Scale pulse on change</li>
                  <li>• Color transitions</li>
                  <li>• 2x: White</li>
                  <li>• 5x+: Magenta + shake</li>
                  <li>• 10x+: Gold + shake</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">PowerUpGlow</h4>
                <ul className="text-[#94a3b8] space-y-1">
                  <li>• Pulsing box-shadow</li>
                  <li>• Customizable color</li>
                  <li>• Fade in/out</li>
                  <li>• Wraps any element</li>
                  <li>• Duration control</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  },
};

/**
 * Game Interaction Flow
 * Complete demo showing all micro-interactions in a game-like scenario
 */
export const GameInteractionFlow: StoryObj = {
  render: () => {
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [level, setLevel] = useState(1);
    const [combo, setCombo] = useState(1);
    const [scorePopups, setScorePopups] = useState<
      Array<{ id: string; score: number; x: number; y: number; isCombo?: boolean }>
    >([]);
    const [coinAnimations, setCoinAnimations] = useState<
      Array<{ id: string; startX: number; startY: number }>
    >([]);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [showComboFlash, setShowComboFlash] = useState(false);
    const [powerUpActive, setPowerUpActive] = useState(false);

    const addScorePopup = (points: number, x: number, y: number) => {
      const isCombo = combo > 1;
      const totalPoints = points * combo;

      const popup = {
        id: `${Date.now()}-${Math.random()}`,
        score: totalPoints,
        x,
        y,
        isCombo,
      };

      setScorePopups((prev) => [...prev, popup]);
      setScore((prev) => prev + totalPoints);

      setTimeout(() => {
        setScorePopups((prev) => prev.filter((p) => p.id !== popup.id));
      }, 2000);

      // Increase combo
      setCombo((prev) => Math.min(prev + 1, 10));
      setShowComboFlash(true);
      setTimeout(() => setShowComboFlash(false), 600);

      // Check for level up
      if ((score + totalPoints) % 500 === 0 || (score + totalPoints) >= level * 500) {
        setLevel((prev) => prev + 1);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
    };

    const collectCoin = (x: number, y: number) => {
      const coin = {
        id: `${Date.now()}-${Math.random()}`,
        startX: x,
        startY: y,
      };

      setCoinAnimations((prev) => [...prev, coin]);

      setTimeout(() => {
        setCoins((prev) => prev + 1);
        setCoinAnimations((prev) => prev.filter((c) => c.id !== coin.id));
      }, 800);
    };

    const handleActionClick = (e: React.MouseEvent, points: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      addScorePopup(points, x, y);
      collectCoin(x, y + 50);
    };

    const activatePowerUp = () => {
      setPowerUpActive(true);
      setCombo((prev) => Math.min(prev * 2, 10));
      setTimeout(() => setPowerUpActive(false), 3000);
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <CursorTrail color="#00ffff" trailLength={8} />
        <ClickRipple color="#8B5CF6" />

        {scorePopups.map((popup) => (
          <ScorePopup
            key={popup.id}
            score={popup.score}
            x={popup.x}
            y={popup.y}
            isCombo={popup.isCombo}
          />
        ))}

        {coinAnimations.map((coin) => (
          <CoinCollect
            key={coin.id}
            start={{ x: coin.startX, y: coin.startY }}
            end={{ x: window.innerWidth - 250, y: 150 }}
            duration={0.8}
          />
        ))}

        {showLevelUp && (
          <LevelUpCelebration
            level={level}
            duration={3}
            showFlash
            particleCount={60}
          />
        )}

        <div className="max-w-6xl mx-auto">
          {/* Header Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <div className="text-[#94a3b8] text-sm mb-1">Score</div>
              <div className="text-3xl font-bold text-white">{score}</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-[#94a3b8] text-sm mb-1">Coins</div>
              <div className="text-3xl font-bold text-[#FFD700]">{coins}</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-[#94a3b8] text-sm mb-1">Level</div>
              <div className="text-3xl font-bold text-[#00ffff]">{level}</div>
            </Card>
            <Card className="p-4 text-center relative">
              {showComboFlash && (
                <ComboFlash
                  multiplier={combo}
                  show={showComboFlash}
                  position={{ x: 50, y: 30 }}
                />
              )}
              <div className="text-[#94a3b8] text-sm mb-1">Combo</div>
              <div className="text-3xl font-bold text-[#ff00ff]">x{combo}</div>
            </Card>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Complete Game Interaction Demo
            </h1>
            <p className="text-[#94a3b8]">
              Click the action buttons to see all micro-interactions work together!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={(e) => handleActionClick(e, 10)}
                >
                  Small Hit (+10)
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={(e) => handleActionClick(e, 50)}
                >
                  Medium Hit (+50)
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={(e) => handleActionClick(e, 100)}
                >
                  Critical Hit (+100)
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Power-Up</h3>
              <PowerUpGlow active={powerUpActive} color="#FFD700" duration={3}>
                <div className="w-24 h-24 mx-auto mb-4 bg-[#1a1a2e] border-2 border-[#FFD700] rounded-lg flex items-center justify-center text-5xl">
                  ⚡
                </div>
              </PowerUpGlow>
              <Button
                variant="primary"
                fullWidth
                onClick={activatePowerUp}
                isDisabled={powerUpActive}
              >
                {powerUpActive ? 'Active...' : 'Activate (2x Combo)'}
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setCombo(1)}
                >
                  Reset Combo
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setScore(0);
                    setCoins(0);
                    setLevel(1);
                    setCombo(1);
                  }}
                >
                  Reset All
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-[#1a1a2e]">
            <h3 className="text-lg font-semibold text-white mb-3">Active Effects</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-[#94a3b8]">
              <div>
                <strong className="text-white">Cursor Trail:</strong> Cyan trail follows mouse
              </div>
              <div>
                <strong className="text-white">Click Ripple:</strong> Purple ripple on all clicks
              </div>
              <div>
                <strong className="text-white">Score Popups:</strong> Float up with combo multiplier
              </div>
              <div>
                <strong className="text-white">Coin Collection:</strong> Fly to coin counter
              </div>
              <div>
                <strong className="text-white">Combo Flash:</strong> Flashes when combo increases
              </div>
              <div>
                <strong className="text-white">Level Up:</strong> Confetti at every 500 points
              </div>
              <div>
                <strong className="text-white">Power-Up Glow:</strong> Pulsing glow when active
              </div>
              <div>
                <strong className="text-white">Combo Multiplier:</strong> Increases with each hit
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  },
};
