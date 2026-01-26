/**
 * Snake Game Page (New Implementation)
 *
 * Uses the new GameWrapper system with SnakeGameAdapter.
 * This is a test implementation to verify the game template
 * architecture works correctly with the existing Snake game.
 *
 * @module pages/Game/SnakeGamePage
 */

import { GameWrapper } from '@/games/components';
import { SnakeGameAdapter } from '@/games/snake/SnakeGameAdapter';
import { snakeMetadata } from '@/games/snake/metadata';

/**
 * Snake Game Page Component
 *
 * Demonstrates the new game template pattern:
 * 1. Define metadata (snakeMetadata)
 * 2. Create game component/adapter (SnakeGameAdapter)
 * 3. Wrap with GameWrapper
 *
 * The GameWrapper handles:
 * - Payment flow
 * - Session management
 * - Payment gate UI
 * - Score submission callback
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/games/snake-new" element={<SnakeGamePage />} />
 * ```
 */
export function SnakeGamePage() {
  return (
    <GameWrapper
      metadata={snakeMetadata}
      gameComponent={SnakeGameAdapter}
      gameProps={{ difficulty: 'normal' }}
      backLink="/play"
    />
  );
}

SnakeGamePage.displayName = 'SnakeGamePage';

export default SnakeGamePage;
