/**
 * Leaderboard Page Object Model
 *
 * Page object for testing leaderboard display and interactions.
 * Provides methods for viewing scores, filtering time ranges, and finding personal ranks.
 *
 * @example
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { LeaderboardPage } from '../pages/LeaderboardPage';
 *
 * test('should display top entries', async ({ page }) => {
 *   const leaderboard = new LeaderboardPage(page);
 *   await leaderboard.goto();
 *   await leaderboard.waitForLeaderboardLoad();
 *
 *   const entries = await leaderboard.getTopEntries(10);
 *   expect(entries.length).toBeLessThanOrEqual(10);
 * });
 *
 * test('should switch time ranges', async ({ page }) => {
 *   const leaderboard = new LeaderboardPage(page);
 *   await leaderboard.goto();
 *   await leaderboard.switchTimeRange('weekly');
 *
 *   const activeRange = await leaderboard.getActiveTimeRange();
 *   expect(activeRange).toBe('weekly');
 * });
 * ```
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage, PageConfig } from './BasePage';

/**
 * Time range filter options for leaderboard
 */
export type TimeRange = 'daily' | 'weekly' | 'all-time';

/**
 * Leaderboard entry information
 */
export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  walletAddress?: string;
  score: number;
  gameName?: string;
  timestamp?: string;
  isCurrentUser?: boolean;
}

/**
 * Leaderboard page object for E2E testing
 */
export class LeaderboardPage extends BasePage {
  // Page-specific locators

  /** Main leaderboard table container */
  readonly leaderboardTable: Locator;

  /** Leaderboard table body with entries */
  readonly tableBody: Locator;

  /** Individual leaderboard rows */
  readonly leaderboardRows: Locator;

  /** Time range filter buttons container */
  readonly timeRangeFilters: Locator;

  /** Personal rank section (shows user's own ranking) */
  readonly personalRankSection: Locator;

  /** Loading skeleton for leaderboard */
  readonly leaderboardSkeleton: Locator;

  /** Empty state when no entries */
  readonly emptyState: Locator;

  /** Pagination controls */
  readonly pagination: Locator;

  /** Search input for finding players */
  readonly playerSearch: Locator;

  /** Game filter dropdown */
  readonly gameFilter: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, config);

    // Initialize page-specific locators
    this.leaderboardTable = page.getByTestId('leaderboard-table');
    this.tableBody = page.locator('tbody').first();
    this.leaderboardRows = page.getByTestId('leaderboard-row');
    this.timeRangeFilters = page.getByTestId('time-range-filters');
    this.personalRankSection = page.getByTestId('personal-rank');
    this.leaderboardSkeleton = page.getByTestId('leaderboard-skeleton');
    this.emptyState = page.getByTestId('leaderboard-empty');
    this.pagination = page.getByTestId('leaderboard-pagination');
    this.playerSearch = page.getByPlaceholder(/search.*player|find.*player/i);
    this.gameFilter = page.getByTestId('game-filter');
  }

  /**
   * Get the URL path for the leaderboard page
   */
  get url(): string {
    return '/leaderboard';
  }

  /**
   * Wait for leaderboard data to load
   */
  async waitForLeaderboardLoad(): Promise<void> {
    // Wait for skeleton/loading state to disappear
    const hasSkeletons = await this.leaderboardSkeleton.isVisible().catch(() => false);
    if (hasSkeletons) {
      await this.leaderboardSkeleton.waitFor({ state: 'hidden', timeout: this.defaultTimeout });
    }

    // Wait for general page load
    await this.waitForPageLoad();

    // Wait for either entries or empty state to appear
    await Promise.race([
      this.leaderboardRows.first().waitFor({ state: 'visible', timeout: this.defaultTimeout }),
      this.emptyState.waitFor({ state: 'visible', timeout: this.defaultTimeout }),
    ]).catch(() => {
      // Page might be legitimately empty
    });
  }

  /**
   * Get the top N entries from the leaderboard
   * @param count - Number of entries to retrieve
   */
  async getTopEntries(count: number): Promise<LeaderboardEntry[]> {
    await this.waitForLeaderboardLoad();

    const totalRows = await this.leaderboardRows.count();
    const entriesToFetch = Math.min(count, totalRows);
    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < entriesToFetch; i++) {
      const row = this.leaderboardRows.nth(i);
      const entry = await this.parseLeaderboardRow(row);
      entries.push(entry);
    }

    return entries;
  }

  /**
   * Parse a leaderboard row into an entry object
   */
  private async parseLeaderboardRow(row: Locator): Promise<LeaderboardEntry> {
    // Try to extract rank from data attribute or cell
    const rankCell = row.getByTestId('rank').or(row.locator('td').first());
    const rankText = await rankCell.textContent() ?? '0';
    const rank = parseInt(rankText.replace(/[^0-9]/g, ''), 10) || 0;

    // Extract player name
    const playerNameCell = row.getByTestId('player-name').or(row.locator('.player-name'));
    const playerName = (await playerNameCell.textContent())?.trim() ?? 'Unknown';

    // Extract wallet address if available
    const walletCell = row.getByTestId('wallet-address').or(row.locator('.wallet-address'));
    const walletAddress = await walletCell.isVisible()
      ? (await walletCell.textContent())?.trim()
      : undefined;

    // Extract score
    const scoreCell = row.getByTestId('score').or(row.locator('.score'));
    const scoreText = await scoreCell.textContent() ?? '0';
    const score = parseInt(scoreText.replace(/[^0-9]/g, ''), 10) || 0;

    // Extract game name if available
    const gameCell = row.getByTestId('game-name').or(row.locator('.game-name'));
    const gameName = await gameCell.isVisible()
      ? (await gameCell.textContent())?.trim()
      : undefined;

    // Extract timestamp if available
    const timestampCell = row.getByTestId('timestamp').or(row.locator('.timestamp, time'));
    const timestamp = await timestampCell.isVisible()
      ? (await timestampCell.textContent())?.trim()
      : undefined;

    // Check if this is the current user's row
    const isCurrentUser = await row.locator('[data-current-user="true"], .current-user').isVisible()
      .catch(() => false);

    return {
      rank,
      playerName,
      walletAddress,
      score,
      gameName,
      timestamp,
      isCurrentUser,
    };
  }

  /**
   * Switch to a different time range filter
   * @param range - Time range to switch to: 'daily', 'weekly', or 'all-time'
   */
  async switchTimeRange(range: TimeRange): Promise<void> {
    const rangeButton = this.getTimeRangeButton(range);
    await this.waitForElement(rangeButton);
    await rangeButton.click();
    await this.waitForLeaderboardLoad();
  }

  /**
   * Get the time range filter button
   */
  getTimeRangeButton(range: TimeRange): Locator {
    const rangePatterns: Record<TimeRange, RegExp> = {
      'daily': /daily|today|24h/i,
      'weekly': /weekly|week|7d/i,
      'all-time': /all.?time|all|total|lifetime/i,
    };

    return this.timeRangeFilters.getByRole('button', {
      name: rangePatterns[range],
    });
  }

  /**
   * Get the currently active time range
   */
  async getActiveTimeRange(): Promise<TimeRange | null> {
    const activeButton = this.timeRangeFilters.locator(
      '[data-active="true"], [aria-selected="true"], [aria-pressed="true"], .active'
    );

    if (await activeButton.isVisible()) {
      const text = (await activeButton.textContent())?.toLowerCase() ?? '';

      if (text.includes('daily') || text.includes('today') || text.includes('24h')) {
        return 'daily';
      }
      if (text.includes('week')) {
        return 'weekly';
      }
      if (text.includes('all') || text.includes('total') || text.includes('lifetime')) {
        return 'all-time';
      }
    }

    return null;
  }

  /**
   * Get the current user's personal rank
   * @returns The personal rank entry or null if not available
   */
  async getPersonalRank(): Promise<LeaderboardEntry | null> {
    // First check if there's a dedicated personal rank section
    if (await this.personalRankSection.isVisible()) {
      const rankText = await this.personalRankSection.getByTestId('rank').textContent();
      const scoreText = await this.personalRankSection.getByTestId('score').textContent();
      const playerName = await this.personalRankSection.getByTestId('player-name').textContent();

      return {
        rank: parseInt(rankText?.replace(/[^0-9]/g, '') ?? '0', 10) || 0,
        playerName: playerName?.trim() ?? 'You',
        score: parseInt(scoreText?.replace(/[^0-9]/g, '') ?? '0', 10) || 0,
        isCurrentUser: true,
      };
    }

    // Otherwise, look for the current user in the leaderboard rows
    const currentUserRow = this.leaderboardRows.filter({
      has: this.page.locator('[data-current-user="true"], .current-user'),
    }).first();

    if (await currentUserRow.isVisible()) {
      return this.parseLeaderboardRow(currentUserRow);
    }

    return null;
  }

  /**
   * Scroll to a specific rank in the leaderboard
   * @param rank - The rank number to scroll to
   */
  async scrollToRank(rank: number): Promise<void> {
    // Try to find the row by rank data attribute first
    let targetRow = this.leaderboardRows.filter({
      has: this.page.locator(`[data-rank="${rank}"]`),
    }).first();

    // If not found by data attribute, try to find by text content
    if (!(await targetRow.isVisible())) {
      targetRow = this.leaderboardRows.filter({
        hasText: new RegExp(`^\\s*${rank}\\s`),
      }).first();
    }

    // If still not found, we might need to use pagination
    if (!(await targetRow.isVisible())) {
      // Check if pagination exists and try to navigate
      if (await this.pagination.isVisible()) {
        await this.navigateToRankPage(rank);
      }
    }

    // Scroll to the target row
    if (await targetRow.isVisible()) {
      await targetRow.scrollIntoViewIfNeeded();
    }
  }

  /**
   * Navigate pagination to reach a specific rank
   */
  private async navigateToRankPage(rank: number): Promise<void> {
    // Try to find a "go to page" input or calculate page number
    const pageInput = this.pagination.locator('input[type="number"]');

    if (await pageInput.isVisible()) {
      // Assume ~25 entries per page (adjust based on actual implementation)
      const pageNumber = Math.ceil(rank / 25);
      await pageInput.fill(pageNumber.toString());
      await pageInput.press('Enter');
      await this.waitForLeaderboardLoad();
    } else {
      // Click next/page buttons until we find the rank or reach the end
      const nextButton = this.pagination.getByRole('button', { name: /next|→|>/i });
      const maxIterations = Math.ceil(rank / 25);

      for (let i = 0; i < maxIterations && await nextButton.isEnabled(); i++) {
        const currentEntries = await this.getTopEntries(1);
        if (currentEntries.length > 0 && currentEntries[0].rank >= rank) {
          break;
        }
        await nextButton.click();
        await this.waitForLeaderboardLoad();
      }
    }
  }

  /**
   * Get detailed information for a specific rank
   * @param rank - The rank to get details for
   */
  async getEntryDetails(rank: number): Promise<LeaderboardEntry | null> {
    await this.scrollToRank(rank);

    // Find the row for this rank
    let targetRow = this.leaderboardRows.filter({
      has: this.page.locator(`[data-rank="${rank}"]`),
    }).first();

    // If not found by data attribute, try by text
    if (!(await targetRow.isVisible())) {
      targetRow = this.leaderboardRows.filter({
        hasText: new RegExp(`^\\s*${rank}\\s`),
      }).first();
    }

    if (await targetRow.isVisible()) {
      return this.parseLeaderboardRow(targetRow);
    }

    return null;
  }

  /**
   * Get total number of entries in the leaderboard
   */
  async getTotalEntryCount(): Promise<number> {
    await this.waitForLeaderboardLoad();

    // First check if there's a total count display
    const countDisplay = this.page.getByTestId('total-entries').or(this.page.locator('.total-entries'));
    if (await countDisplay.isVisible()) {
      const text = await countDisplay.textContent();
      const match = text?.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // Otherwise return visible row count
    return this.leaderboardRows.count();
  }

  /**
   * Check if the leaderboard is empty
   */
  async isEmpty(): Promise<boolean> {
    await this.waitForLeaderboardLoad();
    return this.emptyState.isVisible();
  }

  /**
   * Get the empty state message text
   */
  async getEmptyStateMessage(): Promise<string> {
    if (await this.isEmpty()) {
      return (await this.emptyState.textContent())?.trim() ?? '';
    }
    return '';
  }

  /**
   * Search for a player by name or wallet address
   */
  async searchPlayer(query: string): Promise<void> {
    if (await this.playerSearch.isVisible()) {
      await this.playerSearch.clear();
      await this.playerSearch.fill(query);
      await this.playerSearch.press('Enter');
      await this.waitForLeaderboardLoad();
    }
  }

  /**
   * Filter leaderboard by game
   */
  async filterByGame(gameName: string): Promise<void> {
    if (await this.gameFilter.isVisible()) {
      await this.gameFilter.click();
      await this.page.getByRole('option', { name: new RegExp(gameName, 'i') }).click();
      await this.waitForLeaderboardLoad();
    }
  }

  /**
   * Click on a leaderboard entry to view details
   */
  async clickEntry(rank: number): Promise<void> {
    await this.scrollToRank(rank);

    const targetRow = this.leaderboardRows.filter({
      has: this.page.locator(`[data-rank="${rank}"]`),
    }).first().or(
      this.leaderboardRows.filter({
        hasText: new RegExp(`^\\s*${rank}\\s`),
      }).first()
    );

    if (await targetRow.isVisible()) {
      await targetRow.click();
      await this.waitForNavigation();
    }
  }

  /**
   * Assert that a specific number of entries are displayed
   */
  async assertEntryCount(expected: number): Promise<void> {
    const count = await this.leaderboardRows.count();
    expect(count).toBe(expected);
  }

  /**
   * Assert that entries are sorted by score in descending order
   */
  async assertSortedByScore(): Promise<void> {
    const entries = await this.getTopEntries(10);

    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].score).toBeGreaterThanOrEqual(entries[i].score);
    }
  }

  /**
   * Assert that ranks are sequential
   */
  async assertSequentialRanks(): Promise<void> {
    const entries = await this.getTopEntries(10);

    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].rank).toBe(entries[i - 1].rank + 1);
    }
  }

  /**
   * Assert that the personal rank section is visible
   */
  async assertPersonalRankVisible(): Promise<void> {
    await expect(this.personalRankSection).toBeVisible();
  }

  /**
   * Assert that a specific time range is active
   */
  async assertTimeRangeActive(range: TimeRange): Promise<void> {
    const button = this.getTimeRangeButton(range);
    await expect(button).toHaveAttribute('data-active', 'true')
      .or(expect(button).toHaveAttribute('aria-selected', 'true'))
      .or(expect(button).toHaveAttribute('aria-pressed', 'true'))
      .or(expect(button).toHaveClass(/active/));
  }
}

export default LeaderboardPage;
