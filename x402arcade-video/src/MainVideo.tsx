import React from 'react';
import { Series } from 'remotion';
import { Scene1_Hook } from './scenes/Scene1_Hook';
import { Scene2_Problem } from './scenes/Scene2_Problem';
import { Scene3_Solution } from './scenes/Scene3_Solution';
import { Scene4_Demo } from './scenes/Scene4_Demo';
import { Scene5_Impact } from './scenes/Scene5_Impact';
import { Scene6_CTA } from './scenes/Scene6_CTA';

/**
 * Main Video: Complete 60-second demo
 * Combines all 6 scenes in sequence
 */
export const MainVideo: React.FC = () => {
  return (
    <Series>
      {/* Scene 1: Hook - "$0.01" reveal (3s) */}
      <Series.Sequence durationInFrames={90}>
        <Scene1_Hook />
      </Series.Sequence>

      {/* Scene 2: Problem - Gas fee math (7s) */}
      <Series.Sequence durationInFrames={210}>
        <Scene2_Problem />
      </Series.Sequence>

      {/* Scene 3: Solution - x402 benefits (10s) */}
      <Series.Sequence durationInFrames={300}>
        <Scene3_Solution />
      </Series.Sequence>

      {/* Scene 4: Demo - Live app demo (25s) */}
      <Series.Sequence durationInFrames={750}>
        <Scene4_Demo />
      </Series.Sequence>

      {/* Scene 5: Impact - Key metrics (10s) */}
      <Series.Sequence durationInFrames={300}>
        <Scene5_Impact />
      </Series.Sequence>

      {/* Scene 6: CTA - Logo + links (5s) */}
      <Series.Sequence durationInFrames={150}>
        <Scene6_CTA />
      </Series.Sequence>
    </Series>
  );
};
