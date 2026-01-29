import React from 'react';
import { Series } from 'remotion';
import { Scene1_Hook } from './scenes/Scene1_Hook';
import { Scene2_Problem } from './scenes/Scene2_Problem';
import { Scene3_Solution } from './scenes/Scene3_Solution';
import { Scene4_Demo } from './scenes/Scene4_Demo';
import { Scene6_CTA } from './scenes/Scene6_CTA';
import { AudioManager } from './components/AudioManager';

/**
 * Main Video: Complete 60-second demo
 * Streamlined for hackathon judges - punchy and fast
 *
 * Timeline:
 * - Scene 1: Hook "$0.01" (2s)
 * - Scene 2: Problem - gas fees (3s)
 * - Scene 3: Solution - x402 + Cronos (5s) - staggered animations
 * - Scene 4: Live Demo (47s)
 * - Scene 6: CTA + Logo (3s)
 *
 * Total: 60 seconds (1800 frames @ 30fps)
 *
 * Story flow:
 * 1. "$0.01 to play" - hook them
 * 2. "$0.01 + $2.00 gas = $2.01" - show the problem
 * 3. "Not anymore." x402 + Cronos = $0.00 gas - introduce solution
 * 4. Live demo - prove it works
 * 5. CTA - where to find us
 */
export const MainVideo: React.FC = () => {
  return (
    <>
      {/* Audio Layer */}
      <AudioManager />

      {/* Video Scenes */}
      <Series>
        {/* Scene 1: Hook - "$0.01" punch (2s) */}
        <Series.Sequence durationInFrames={60}>
          <Scene1_Hook />
        </Series.Sequence>

        {/* Scene 2: Problem - Gas fee math (3s) */}
        <Series.Sequence durationInFrames={90}>
          <Scene2_Problem />
        </Series.Sequence>

        {/* Scene 3: Solution - x402 + Cronos (5s) */}
        <Series.Sequence durationInFrames={150}>
          <Scene3_Solution />
        </Series.Sequence>

        {/* Scene 4: Demo - Live app recording (47s) */}
        <Series.Sequence durationInFrames={1410}>
          <Scene4_Demo />
        </Series.Sequence>

        {/* Scene 6: CTA - Logo + links (3s) */}
        <Series.Sequence durationInFrames={90}>
          <Scene6_CTA />
        </Series.Sequence>
      </Series>
    </>
  );
};
