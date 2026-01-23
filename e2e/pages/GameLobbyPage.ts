/**
 * Game Lobby Page Object Model
 *
 * Page object for testing game lobby interactions.
 * Provides methods for game selection, filtering, and searching.
 *
 * @example
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { GameLobbyPage } from '../pages/GameLobbyPage';
 *
 * test('should display available games', async ({ page }) => {
 *   const lobby = new GameLobbyPage(page);
 *   await lobby.goto();
 *   await lobby.waitForGamesToLoad();
 *
 *   const count = await lobby.getGameCount();
 *   expect(count).toBeGreaterThan(0);
 * });
 *
 * test('should filter games by category', async ({ page }) => {
 *   const lobby = new GameLobbyPage(page);
 *   await lobby.goto();
 *   await lobby.filterByCategory('arcade');
 *
 *   const games = await lobby.getVisibleGames();
 *   expect(games.every(g => g.category === 'arcade')).toBe(true);
 * });
 * ```
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage, PageConfig } from './BasePage';

/**
 * Game category types
 */
export type GameCategory = 'all' | 'arcade' | 'puzzle' | 'action' | 'strategy';

/**
 * Game card information
 */
export interface GameInfo {
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  isPlayable: boolean;
}

/**
 * Game lobby page object for E2E testing
 */
export class GameLobbyPage extends BasePage {
  // Page-specific locators

  /** Container for all game cards */
  readonly gameGrid: Locator;

  /** Individual game cards */
  readonly gameCards: Locator;

  /** Search input field */
  readonly searchInput: Locator;

  /** Search button */
  readonly searchButton: Locator;

  /** Clear search button */
  readonly clearSearchButton: Locator;

  /** Category filter buttons container */
  readonly categoryFilters: Locator;

  /** "No games found" message */
  readonly noGamesMessage: Locator;

  /** Loading skeleton for games */
  readonly gamesSkeleton: Locator;

  /** Featured games section */
  readonly featuredSection: Locator;

  /** Recently played section */
  readonly recentlyPlayedSection: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, config);

    // Initialize page-specific locators
    this.gameGrid = page.getByTestId('game-grid');
    this.gameCards = page.getByTestId('game-card');
    this.searchInput = page.getByPlaceholder(/search.*game/i);
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.clearSearchButton = page.getByRole('button', { name: /clear/i });
    this.categoryFilters = page.getByTestId('category-filters');
    this.noGamesMessage = page.getByTestId('no-games-message');
    this.gamesSkeleton = page.getByTestId('games-skeleton');
    this.featuredSection = page.getByTestId('featured-games');
    this.recentlyPlayedSection = page.getByTestId('recently-played');
  }

  /**
   * Get the URL path for the game lobby page
   */
  get url(): string {
    return '/lobby';
  }

  /**
   * Wait for games to finish loading
   */
  async waitForGamesToLoad(): Promise<void> {
    // Wait for skeleton/loading state to disappear
    const hasSkeletons = await this.gamesSkeleton.isVisible().catch(() => false);
    if (hasSkeletons) {
      await this.gamesSkeleton.waitFor({ state: 'hidden', timeout: this.defaultTimeout });
    }

    // Wait for loading indicator to disappear
    await this.waitForPageLoad();

    // Wait for either game cards or "no games" message to appear
    await Promise.race([
      this.gameCards.first().waitFor({ state: 'visible', timeout: this.defaultTimeout }),
      this.noGamesMessage.waitFor({ state: 'visible', timeout: this.defaultTimeout }),
    ]).catch(() => {
      // If neither appears, the page might be empty
    });
  }

  /**
   * Get the number of visible game cards
   */
  async getGameCount(): Promise<number> {
    await this.waitForGamesToLoad();
    return this.gameCards.count();
  }

  /**
   * Get game card by name
   */
  getGameCard(name: string): Locator {
    return this.gameCards.filter({ hasText: name }).first();
  }

  /**
   * Get game card by index
   */
  getGameCardByIndex(index: number): Locator {
    return this.gameCards.nth(index);
  }

  /**
   * Select a game by name (click on it)
   */
  async selectGame(name: string): Promise<void> {
    const gameCard = this.getGameCard(name);
    await this.waitForElement(gameCard);
    await gameCard.click();
    await this.waitForNavigation();
  }

  /**
   * Select a game by index
   */
  async selectGameByIndex(index: number): Promise<void> {
    const gameCard = this.getGameCardByIndex(index);
    await this.waitForElement(gameCard);
    await gameCard.click();
    await this.waitForNavigation();
  }

  /**
   * Search for games by query
   */
  async searchGames(query: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(query);

    // If there's a search button, click it; otherwise, press Enter
    if (await this.searchButton.isVisible()) {
      await this.searchButton.click();
    } else {
      await this.searchInput.press('Enter');
    }

    // Wait for results to update
    await this.waitForGamesToLoad();
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    if (await this.clearSearchButton.isVisible()) {
      await this.clearSearchButton.click();
    } else {
      await this.searchInput.clear();
    }
    await this.waitForGamesToLoad();
  }

  /**
   * Get the current search query
   */
  async getSearchQuery(): Promise<string> {
    return this.searchInput.inputValue();
  }

  /**
   * Filter games by category
   */
  async filterByCategory(category: GameCategory): Promise<void> {
    const categoryButton = this.getCategoryButton(category);
    await this.waitForElement(categoryButton);
    await categoryButton.click();
    await this.waitForGamesToLoad();
  }

  /**
   * Get category filter button
   */
  getCategoryButton(category: GameCategory): Locator {
    return this.categoryFilters.getByRole('button', {
      name: new RegExp(category, 'i'),
    });
  }

  /**
   * Get the active/selected category
   */
  async getActiveCategory(): Promise<string> {
    const activeButton = this.categoryFilters.locator('[data-active="true"], [aria-selected="true"], .active');
    if (await activeButton.isVisible()) {
      return (await activeButton.textContent()) ?? 'all';
    }
    return 'all';
  }

  /**
   * Check if a specific category filter is available
   */
  async isCategoryAvailable(category: GameCategory): Promise<boolean> {
    const categoryButton = this.getCategoryButton(category);
    return categoryButton.isVisible();
  }

  /**
   * Get all available category options
   */
  async getAvailableCategories(): Promise<string[]> {
    const buttons = this.categoryFilters.getByRole('button');
    const count = await buttons.count();
    const categories: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text) {
        categories.push(text.toLowerCase().trim());
      }
    }

    return categories;
  }

  /**
   * Get information about visible games
   */
  async getVisibleGames(): Promise<GameInfo[]> {
    const count = await this.gameCards.count();
    const games: GameInfo[] = [];

    for (let i = 0; i < count; i++) {
      const card = this.gameCards.nth(i);
      const info = await this.getGameInfo(card);
      games.push(info);
    }

    return games;
  }

  /**
   * Get information from a game card
   */
  async getGameInfo(card: Locator): Promise<GameInfo> {
    const name = await card.getByTestId('game-name').textContent() ??
                 await card.locator('h3, h4, .game-title').first().textContent() ??
                 'Unknown';

    const category = await card.getByTestId('game-category').textContent() ??
                     await card.locator('.game-category').textContent() ??
                     'uncategorized';

    const description = await card.getByTestId('game-description').textContent() ??
                        await card.locator('.game-description, p').first().textContent() ??
                        undefined;

    const imageElement = card.locator('img').first();
    const imageUrl = await imageElement.isVisible()
      ? await imageElement.getAttribute('src') ?? undefined
      : undefined;

    const playButton = card.getByRole('button', { name: /play/i });
    const isPlayable = await playButton.isVisible() && await playButton.isEnabled();

    return {
      name: name.trim(),
      category: category.trim().toLowerCase(),
      description: description?.trim(),
      imageUrl,
      isPlayable,
    };
  }

  /**
   * Check if a specific game is visible in the lobby
   */
  async isGameVisible(name: string): Promise<boolean> {
    const gameCard = this.getGameCard(name);
    return gameCard.isVisible();
  }

  /**
   * Get all game names currently visible
   */
  async getGameNames(): Promise<string[]> {
    const games = await this.getVisibleGames();
    return games.map(g => g.name);
  }

  /**
   * Check if no games are found (empty state)
   */
  async hasNoGames(): Promise<boolean> {
    return this.noGamesMessage.isVisible();
  }

  /**
   * Get the "no games found" message text
   */
  async getNoGamesMessageText(): Promise<string> {
    if (await this.hasNoGames()) {
      return this.noGamesMessage.textContent() ?? '';
    }
    return '';
  }

  /**
   * Check if featured section is visible
   */
  async hasFeaturedSection(): Promise<boolean> {
    return this.featuredSection.isVisible();
  }

  /**
   * Get featured games
   */
  async getFeaturedGames(): Promise<GameInfo[]> {
    const cards = this.featuredSection.locator('[data-testid="game-card"]');
    const count = await cards.count();
    const games: GameInfo[] = [];

    for (let i = 0; i < count; i++) {
      const info = await this.getGameInfo(cards.nth(i));
      games.push(info);
    }

    return games;
  }

  /**
   * Check if recently played section is visible
   */
  async hasRecentlyPlayedSection(): Promise<boolean> {
    return this.recentlyPlayedSection.isVisible();
  }

  /**
   * Hover over a game card
   */
  async hoverGame(name: string): Promise<void> {
    const gameCard = this.getGameCard(name);
    await gameCard.hover();
  }

  /**
   * Click the play button on a game card (without navigating)
   */
  async clickPlayButton(name: string): Promise<void> {
    const gameCard = this.getGameCard(name);
    const playButton = gameCard.getByRole('button', { name: /play/i });
    await playButton.click();
  }

  /**
   * Assert that a specific number of games are displayed
   */
  async assertGameCount(expected: number): Promise<void> {
    const count = await this.getGameCount();
    expect(count).toBe(expected);
  }

  /**
   * Assert that a game is visible
   */
  async assertGameVisible(name: string): Promise<void> {
    const gameCard = this.getGameCard(name);
    await expect(gameCard).toBeVisible();
  }

  /**
   * Assert that games are filtered by category
   */
  async assertFilteredByCategory(category: GameCategory): Promise<void> {
    const games = await this.getVisibleGames();
    expect(games.every(g => g.category === category)).toBeTruthy();
  }
}

export default GameLobbyPage;
