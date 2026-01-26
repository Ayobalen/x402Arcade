/**
 * Pong Game Phaser Adapter
 *
 * Adapts the Phaser-based Pong game to work with the GameWrapper system.
 * This bridges the gap between Phaser's game API and our GameWrapper's InjectedGameProps.
 *
 * @module games/pong/PongGamePhaserAdapter
 */

import { useCallback } from 'react';
import { PongGamePhaser } from './PongGamePhaser';
import type { InjectedGameProps } from '../types/GameTypes';

export interface PongGamePhaserAdapterProps {
  difficulty?: 'easy' | 'normal' | 'hard' | 'expert';
}

export function PongGamePhaserAdapter({
  onGameOver,
  difficulty = 'normal',
}: PongGamePhaserAdapterProps & InjectedGameProps) {
  const handleGameOver = useCallback(
    (score: number) => {
      onGameOver(score);
    },
    [onGameOver]
  );

  return <PongGamePhaser difficulty={difficulty} onGameOver={handleGameOver} />;
}

export default PongGamePhaserAdapter;
