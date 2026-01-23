/**
 * E2E Test Fixtures
 *
 * Playwright fixtures for common test setup and teardown.
 * These fixtures provide isolated test contexts with pre-configured
 * states for authentication, database, API mocking, and game contexts.
 *
 * @example
 * ```typescript
 * import { test, expect } from '../fixtures';
 *
 * test('authenticated user can play games', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/lobby');
 *   // User is already authenticated with wallet
 * });
 *
 * test('can mock API responses', async ({ mockApi, page }) => {
 *   await mockApi.mockGameList([{ id: '1', name: 'Snake' }]);
 *   await page.goto('/lobby');
 * });
 * ```
 */

import { test as base, expect, Page, BrowserContext, Route } from '@playwright/test';

// ============================================================================
// Types
// ============================================================================

/**
 * Mock wallet state for testing
 */
export interface MockWalletState {
  address: string;
  chainId: number;
  balance: string;
  isConnected: boolean;
}

/**
 * Test database state
 */
export interface TestDatabaseState {
  users: Array<{ id: string; address: string; createdAt: Date }>;
  games: Array<{ id: string; name: string; category: string }>;
  sessions: Array<{ id: string; userId: string; gameId: string; score: number }>;
}

/**
 * Mock API fixture interface
 */
export interface MockApiFixture {
  /** Mock the game list endpoint */
  mockGameList: (games: Array<{ id: string; name: string; category?: string }>) => Promise<void>;
  /** Mock user profile endpoint */
  mockUserProfile: (profile: { address: string; username?: string; avatar?: string }) => Promise<void>;
  /** Mock game session endpoint */
  mockGameSession: (session: { id: string; gameId: string; score?: number }) => Promise<void>;
  /** Mock leaderboard endpoint */
  mockLeaderboard: (entries: Array<{ rank: number; address: string; score: number }>) => Promise<void>;
  /** Mock any API endpoint */
  mock: (urlPattern: string | RegExp, response: unknown, options?: { status?: number }) => Promise<void>;
  /** Clear all mocks */
  clearMocks: () => Promise<void>;
  /** Get intercepted requests */
  getRequests: () => Array<{ url: string; method: string; body?: unknown }>;
}

/**
 * Game context fixture interface
 */
export interface GameContextFixture {
  /** Currently selected game */
  currentGame: { id: string; name: string } | null;
  /** Game score */
  score: number;
  /** Game level */
  level: number;
  /** Set game state */
  setState: (state: Partial<{ score: number; level: number; lives: number }>) => void;
  /** Reset game state */
  reset: () => void;
}

/**
 * Test database fixture interface
 */
export interface TestDatabaseFixture {
  /** Seed test data */
  seed: (data: Partial<TestDatabaseState>) => Promise<void>;
  /** Clear all test data */
  clear: () => Promise<void>;
  /** Get current state */
  getState: () => TestDatabaseState;
}

/**
 * Custom fixtures type
 */
export interface TestFixtures {
  /** Page with authenticated wallet */
  authenticatedPage: Page;
  /** Mock wallet state */
  mockWallet: MockWalletState;
  /** Test database for data isolation */
  testDatabase: TestDatabaseFixture;
  /** Mock API for stubbing responses */
  mockApi: MockApiFixture;
  /** Game context for game state */
  gameContext: GameContextFixture;
  /** Slow motion mode for debugging */
  slowMotion: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default mock wallet configuration
 */
export const DEFAULT_MOCK_WALLET: MockWalletState = {
  address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  chainId: 338, // Cronos Testnet
  balance: '100.00',
  isConnected: true,
};

/**
 * Default test database state
 */
export const DEFAULT_TEST_DATABASE: TestDatabaseState = {
  users: [],
  games: [
    { id: 'snake', name: 'Snake', category: 'arcade' },
    { id: 'tetris', name: 'Tetris', category: 'puzzle' },
    { id: 'pong', name: 'Pong', category: 'arcade' },
    { id: 'breakout', name: 'Breakout', category: 'arcade' },
    { id: 'space-invaders', name: 'Space Invaders', category: 'action' },
  ],
  sessions: [],
};

// ============================================================================
// Fixture Implementations
// ============================================================================

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Mock wallet state fixture
   * Provides a default connected wallet state that can be customized
   */
  mockWallet: [
    async ({}, use) => {
      const wallet: MockWalletState = { ...DEFAULT_MOCK_WALLET };
      await use(wallet);
    },
    { scope: 'test' },
  ],

  /**
   * Authenticated page fixture
   * Provides a page with wallet already connected via localStorage/cookie injection
   */
  authenticatedPage: [
    async ({ page, mockWallet }, use) => {
      // Inject wallet state into localStorage before navigation
      await page.addInitScript((walletState) => {
        // Store wallet connection state
        localStorage.setItem('wallet-connected', 'true');
        localStorage.setItem('wallet-address', walletState.address);
        localStorage.setItem('wallet-chain-id', walletState.chainId.toString());

        // Mock window.ethereum for wallet interactions
        (window as unknown as { ethereum: unknown }).ethereum = {
          isMetaMask: true,
          selectedAddress: walletState.address,
          chainId: `0x${walletState.chainId.toString(16)}`,
          request: async ({ method }: { method: string }) => {
            switch (method) {
              case 'eth_accounts':
              case 'eth_requestAccounts':
                return [walletState.address];
              case 'eth_chainId':
                return `0x${walletState.chainId.toString(16)}`;
              case 'eth_getBalance':
                return '0x' + (parseFloat(walletState.balance) * 1e18).toString(16);
              default:
                return null;
            }
          },
          on: () => {},
          removeListener: () => {},
        };
      }, mockWallet);

      await use(page);
    },
    { scope: 'test' },
  ],

  /**
   * Test database fixture for data isolation
   * Provides seeding and clearing of test data
   */
  testDatabase: [
    async ({}, use) => {
      let state: TestDatabaseState = { ...DEFAULT_TEST_DATABASE };

      const fixture: TestDatabaseFixture = {
        seed: async (data) => {
          state = {
            users: [...state.users, ...(data.users || [])],
            games: data.games ? data.games : state.games,
            sessions: [...state.sessions, ...(data.sessions || [])],
          };
        },
        clear: async () => {
          state = { users: [], games: [], sessions: [] };
        },
        getState: () => ({ ...state }),
      };

      await use(fixture);

      // Cleanup after test
      await fixture.clear();
    },
    { scope: 'test' },
  ],

  /**
   * Mock API fixture for stubbing API responses
   * Intercepts network requests and returns mock data
   */
  mockApi: [
    async ({ page }, use) => {
      const interceptedRequests: Array<{ url: string; method: string; body?: unknown }> = [];
      const routes: Route[] = [];

      // Helper to create route handler
      const createHandler = (response: unknown, status: number = 200) => {
        return (route: Route) => {
          routes.push(route);
          route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(response),
          });
        };
      };

      // Intercept all API requests
      await page.route('**/api/**', (route) => {
        const request = route.request();
        interceptedRequests.push({
          url: request.url(),
          method: request.method(),
          body: request.postDataJSON(),
        });
        route.continue();
      });

      const fixture: MockApiFixture = {
        mockGameList: async (games) => {
          await page.route('**/api/games**', createHandler({ games, total: games.length }));
        },

        mockUserProfile: async (profile) => {
          await page.route('**/api/user/profile**', createHandler({ profile }));
        },

        mockGameSession: async (session) => {
          await page.route('**/api/game/session**', createHandler({ session }));
        },

        mockLeaderboard: async (entries) => {
          await page.route('**/api/leaderboard**', createHandler({ entries }));
        },

        mock: async (urlPattern, response, options = {}) => {
          await page.route(urlPattern, createHandler(response, options.status));
        },

        clearMocks: async () => {
          await page.unrouteAll();
        },

        getRequests: () => [...interceptedRequests],
      };

      await use(fixture);

      // Cleanup
      await fixture.clearMocks();
    },
    { scope: 'test' },
  ],

  /**
   * Game context fixture for game state management
   * Provides isolated game state for each test
   */
  gameContext: [
    async ({}, use) => {
      let state = {
        currentGame: null as { id: string; name: string } | null,
        score: 0,
        level: 1,
        lives: 3,
      };

      const fixture: GameContextFixture = {
        get currentGame() {
          return state.currentGame;
        },
        get score() {
          return state.score;
        },
        get level() {
          return state.level;
        },
        setState: (newState) => {
          state = { ...state, ...newState };
        },
        reset: () => {
          state = { currentGame: null, score: 0, level: 1, lives: 3 };
        },
      };

      await use(fixture);

      // Reset after test
      fixture.reset();
    },
    { scope: 'test' },
  ],

  /**
   * Slow motion fixture for debugging
   * When enabled, adds delays between actions for visibility
   */
  slowMotion: [
    async ({ page }, use) => {
      const isSlowMotion = process.env.SLOW_MOTION === 'true';

      if (isSlowMotion) {
        // Add slow motion via context options
        await page.context().setDefaultTimeout(60000);
      }

      await use(isSlowMotion);
    },
    { scope: 'test' },
  ],
});

// ============================================================================
// Re-exports
// ============================================================================

export { expect };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a test wallet address
 */
export function generateTestAddress(index: number = 0): string {
  return `0x${(index + 1).toString().padStart(40, '0')}`;
}

/**
 * Create a mock game session
 */
export function createMockSession(gameId: string, score: number = 0) {
  return {
    id: `session-${Date.now()}`,
    gameId,
    score,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create mock leaderboard entries
 */
export function createMockLeaderboard(count: number = 10) {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    address: generateTestAddress(i),
    score: 10000 - i * 500,
    username: `Player ${i + 1}`,
  }));
}
