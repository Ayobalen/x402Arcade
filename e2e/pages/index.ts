/**
 * Page Object Models Export
 *
 * Central export for all page objects used in E2E tests.
 *
 * @example
 * ```typescript
 * import { BasePage, GameLobbyPage } from '../pages';
 *
 * test('game lobby test', async ({ page }) => {
 *   const lobby = new GameLobbyPage(page);
 *   await lobby.goto();
 * });
 * ```
 */

// Base Page
export { BasePage } from './BasePage';
export type { PageConfig } from './BasePage';

// Game Lobby Page
export { GameLobbyPage } from './GameLobbyPage';
export type { GameCategory, GameInfo } from './GameLobbyPage';

// Wallet Connection Page
export { WalletConnectionPage } from './WalletConnectionPage';
export type { WalletProviderName, ConnectionStatus } from './WalletConnectionPage';

// Leaderboard Page
export { LeaderboardPage } from './LeaderboardPage';
export type { TimeRange, LeaderboardEntry } from './LeaderboardPage';
