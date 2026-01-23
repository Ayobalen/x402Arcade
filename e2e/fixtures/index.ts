/**
 * E2E Test Fixtures Index
 *
 * Central export for all Playwright fixtures used in E2E tests.
 * Import the extended `test` and `expect` from this module instead of
 * directly from @playwright/test to get access to all custom fixtures.
 *
 * @example
 * ```typescript
 * import { test, expect } from '../fixtures';
 *
 * test('example with fixtures', async ({
 *   authenticatedPage,
 *   mockApi,
 *   testDatabase,
 *   gameContext
 * }) => {
 *   // Use fixtures in your test
 *   await mockApi.mockGameList([{ id: 'snake', name: 'Snake' }]);
 *   await authenticatedPage.goto('/lobby');
 *   expect(await authenticatedPage.title()).toContain('Arcade');
 * });
 * ```
 */

// Main fixtures export
export {
  test,
  expect,
  DEFAULT_MOCK_WALLET,
  DEFAULT_TEST_DATABASE,
  generateTestAddress,
  createMockSession,
  createMockLeaderboard,
} from './base.fixture';

// Type exports
export type {
  MockWalletState,
  TestDatabaseState,
  MockApiFixture,
  GameContextFixture,
  TestDatabaseFixture,
  TestFixtures,
} from './base.fixture';
