import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';
import { Scene1_Hook } from './scenes/Scene1_Hook';
import { Scene2_Problem } from './scenes/Scene2_Problem';
import { Scene3_Solution } from './scenes/Scene3_Solution';
import { Scene4_Demo } from './scenes/Scene4_Demo';
import { Scene5_Impact } from './scenes/Scene5_Impact';
import { Scene6_CTA } from './scenes/Scene6_CTA';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main Video: Complete 60-second demo */}
      <Composition
        id="Main"
        component={MainVideo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Scene 1: Hook - "$0.01" reveal (3s) */}
      <Composition
        id="Scene1-Hook"
        component={Scene1_Hook}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Scene 2: Problem - Gas fee math (7s) */}
      <Composition
        id="Scene2-Problem"
        component={Scene2_Problem}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Scene 3: Solution - x402 benefits (10s) */}
      <Composition
        id="Scene3-Solution"
        component={Scene3_Solution}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Scene 4: Demo - Live app demo (25s) */}
      <Composition
        id="Scene4-Demo"
        component={Scene4_Demo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Scene 5: Impact - Key metrics (10s) */}
      <Composition
        id="Scene5-Impact"
        component={Scene5_Impact}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Scene 6: CTA - Logo + links (5s) */}
      <Composition
        id="Scene6-CTA"
        component={Scene6_CTA}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
