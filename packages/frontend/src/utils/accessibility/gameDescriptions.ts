/**
 * Game Descriptions for Screen Readers
 *
 * Utilities for generating accessible descriptions of game states and elements.
 * Helps screen reader users understand game mechanics and current game state.
 *
 * @module utils/accessibility/gameDescriptions
 */

/**
 * Snake game state for description generation
 */
export interface SnakeGameState {
  score: number;
  level: number;
  snakeLength: number;
  snakePosition?: { x: number; y: number };
  foodPosition?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  isPaused?: boolean;
  isGameOver?: boolean;
}

/**
 * Tetris game state for description generation
 */
export interface TetrisGameState {
  score: number;
  level: number;
  linesCleared: number;
  currentPiece?: string;
  nextPiece?: string;
  isPaused?: boolean;
  isGameOver?: boolean;
}

/**
 * Generic game board state
 */
export interface GameBoardState {
  width: number;
  height: number;
  grid?: unknown[][];
}

/**
 * Generate a comprehensive description of Snake game state
 * @param state - Current Snake game state
 * @returns Accessible description of the game state
 *
 * @example
 * ```ts
 * const description = describeSnakeGame({
 *   score: 150,
 *   level: 3,
 *   snakeLength: 12,
 *   direction: 'right'
 * });
 * // "Snake game. Score: 150. Level: 3. Snake length: 12. Moving right."
 * ```
 */
export function describeSnakeGame(state: SnakeGameState): string {
  const parts: string[] = ['Snake game'];

  // Score
  parts.push(`Score: ${state.score}`);

  // Level
  parts.push(`Level: ${state.level}`);

  // Snake length
  parts.push(`Snake length: ${state.snakeLength}`);

  // Direction
  if (state.direction) {
    parts.push(`Moving ${state.direction}`);
  }

  // Game state (check game over first as it takes precedence)
  if (state.isGameOver) {
    parts.push('Game over');
  } else if (state.isPaused) {
    parts.push('Game paused');
  }

  // Position information (if available)
  if (state.snakePosition && state.foodPosition) {
    const relativePosition = getRelativePosition(state.snakePosition, state.foodPosition);
    parts.push(`Food is ${relativePosition}`);
  }

  return parts.join('. ') + '.';
}

/**
 * Generate a comprehensive description of Tetris game state
 * @param state - Current Tetris game state
 * @returns Accessible description of the game state
 *
 * @example
 * ```ts
 * const description = describeTetrisGame({
 *   score: 2400,
 *   level: 5,
 *   linesCleared: 24,
 *   currentPiece: 'I',
 *   nextPiece: 'L'
 * });
 * // "Tetris game. Score: 2400. Level: 5. Lines cleared: 24. Current piece: I-shaped. Next piece: L-shaped."
 * ```
 */
export function describeTetrisGame(state: TetrisGameState): string {
  const parts: string[] = ['Tetris game'];

  // Score
  parts.push(`Score: ${state.score}`);

  // Level
  parts.push(`Level: ${state.level}`);

  // Lines cleared
  parts.push(`Lines cleared: ${state.linesCleared}`);

  // Current piece
  if (state.currentPiece) {
    parts.push(`Current piece: ${describeTetromino(state.currentPiece)}`);
  }

  // Next piece
  if (state.nextPiece) {
    parts.push(`Next piece: ${describeTetromino(state.nextPiece)}`);
  }

  // Game state (check game over first as it takes precedence)
  if (state.isGameOver) {
    parts.push('Game over');
  } else if (state.isPaused) {
    parts.push('Game paused');
  }

  return parts.join('. ') + '.';
}

/**
 * Describe a Tetris tetromino piece
 * @param piece - Tetromino letter (I, J, L, O, S, T, Z)
 * @returns Human-readable description
 *
 * @example
 * ```ts
 * describeTetromino('I'); // "I-shaped (straight line)"
 * describeTetromino('L'); // "L-shaped"
 * describeTetromino('O'); // "O-shaped (square)"
 * ```
 */
export function describeTetromino(piece: string): string {
  const descriptions: Record<string, string> = {
    I: 'I-shaped (straight line)',
    J: 'J-shaped',
    L: 'L-shaped',
    O: 'O-shaped (square)',
    S: 'S-shaped',
    T: 'T-shaped',
    Z: 'Z-shaped',
  };

  return descriptions[piece.toUpperCase()] || `${piece}-shaped`;
}

/**
 * Get relative position description (for Snake food location)
 * @param from - Starting position
 * @param to - Target position
 * @returns Relative direction description
 *
 * @example
 * ```ts
 * getRelativePosition({ x: 5, y: 5 }, { x: 8, y: 3 });
 * // "to the right and above"
 * ```
 */
export function getRelativePosition(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const horizontal = dx > 0 ? 'right' : dx < 0 ? 'left' : '';
  const vertical = dy > 0 ? 'below' : dy < 0 ? 'above' : '';

  if (horizontal && vertical) {
    return `to the ${horizontal} and ${vertical}`;
  } else if (horizontal) {
    return `to the ${horizontal}`;
  } else if (vertical) {
    return vertical;
  } else {
    return 'at the same position';
  }
}

/**
 * Generate description for a game canvas element
 * @param gameName - Name of the game
 * @param state - Optional game state description
 * @returns ARIA label for the canvas
 *
 * @example
 * ```ts
 * describeGameCanvas('Snake', 'Score: 100, Level: 2');
 * // "Snake game canvas. Score: 100, Level: 2"
 * ```
 */
export function describeGameCanvas(gameName: string, state?: string): string {
  const base = `${gameName} game canvas`;
  return state ? `${base}. ${state}` : base;
}

/**
 * Generate a summary of game controls for screen readers
 * @param gameName - Name of the game
 * @returns Description of keyboard controls
 *
 * @example
 * ```ts
 * describeGameControls('Snake');
 * // "Use arrow keys or WASD to move. Press Space or Escape to pause. Press Enter to restart."
 * ```
 */
export function describeGameControls(gameName: string): string {
  const controls: Record<string, string> = {
    Snake:
      'Use arrow keys or WASD to move. Press Space or Escape to pause. Press Enter to restart.',
    Tetris:
      'Use left and right arrows to move. Use up arrow or X to rotate clockwise. Use Z to rotate counterclockwise. Press down arrow to soft drop. Press Space for hard drop. Press P or Escape to pause.',
  };

  return controls[gameName] || 'Use keyboard to control the game.';
}

/**
 * Format a score for announcement
 * @param score - The score value
 * @param maxScore - Optional maximum score for context
 * @returns Formatted score description
 *
 * @example
 * ```ts
 * formatScore(1500); // "1,500"
 * formatScore(1500, 5000); // "1,500 out of 5,000"
 * ```
 */
export function formatScore(score: number, maxScore?: number): string {
  const formattedScore = score.toLocaleString();

  if (maxScore !== undefined) {
    return `${formattedScore} out of ${maxScore.toLocaleString()}`;
  }

  return formattedScore;
}

/**
 * Describe a player's rank on the leaderboard
 * @param rank - Player's rank (1-based)
 * @param totalPlayers - Total number of players
 * @returns Rank description
 *
 * @example
 * ```ts
 * describeRank(1, 100); // "1st place out of 100 players"
 * describeRank(42, 100); // "42nd place out of 100 players"
 * ```
 */
export function describeRank(rank: number, totalPlayers?: number): string {
  const suffix = getOrdinalSuffix(rank);
  const base = `${rank}${suffix} place`;

  if (totalPlayers !== undefined) {
    return `${base} out of ${totalPlayers} players`;
  }

  return base;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 * @param n - The number
 * @returns Ordinal suffix
 *
 * @example
 * ```ts
 * getOrdinalSuffix(1); // "st"
 * getOrdinalSuffix(2); // "nd"
 * getOrdinalSuffix(3); // "rd"
 * getOrdinalSuffix(4); // "th"
 * ```
 */
export function getOrdinalSuffix(n: number): string {
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;

  // Special cases: 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }

  // 1st, 2nd, 3rd
  switch (lastDigit) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Generate a complete game state summary for on-demand screen reader access
 * @param gameName - Name of the game
 * @param state - Game state (Snake or Tetris)
 * @returns Complete game state description
 *
 * @example
 * ```ts
 * const summary = generateGameStateSummary('Snake', {
 *   score: 150,
 *   level: 3,
 *   snakeLength: 12
 * });
 * ```
 */
export function generateGameStateSummary(
  gameName: string,
  state: SnakeGameState | TetrisGameState
): string {
  if (gameName === 'Snake') {
    return describeSnakeGame(state as SnakeGameState);
  } else if (gameName === 'Tetris') {
    return describeTetrisGame(state as TetrisGameState);
  }

  return `${gameName} game. Score: ${state.score}. Level: ${state.level}.`;
}
