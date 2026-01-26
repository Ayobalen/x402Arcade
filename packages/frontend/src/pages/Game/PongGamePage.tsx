/**
 * Pong Game Page (Phaser Version)
 *
 * Demo page showing Phaser-based Pong game integrated with GameWrapper.
 * This demonstrates the library-based approach vs manual implementation.
 *
 * @module pages/Game/PongGamePage
 */

import { GameWrapper } from '../../games/components/GameWrapper';
import { PongGamePhaserAdapter } from '../../games/pong/PongGamePhaserAdapter';
import { pongPhaserMetadata } from '../../games/pong/phaserMetadata';

export function PongGamePage() {
  return (
    <GameWrapper
      metadata={pongPhaserMetadata}
      gameComponent={PongGamePhaserAdapter}
      gameProps={{ difficulty: 'normal' }}
      backLink="/play"
    />
  );
}

export default PongGamePage;
