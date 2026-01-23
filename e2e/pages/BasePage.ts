/**
 * Base Page Object Model
 *
 * Abstract base class for all page objects in the E2E test suite.
 * Provides common functionality and enforces consistent patterns.
 *
 * @example
 * ```typescript
 * import { BasePage } from './BasePage';
 *
 * export class HomePage extends BasePage {
 *   readonly heroSection: Locator;
 *
 *   constructor(page: Page) {
 *     super(page);
 *     this.heroSection = page.getByTestId('hero-section');
 *   }
 *
 *   get url() {
 *     return '/';
 *   }
 * }
 * ```
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Base configuration for page objects
 */
export interface PageConfig {
  /** Default timeout for page operations in milliseconds */
  defaultTimeout?: number;
  /** Base URL for the application */
  baseUrl?: string;
}

/**
 * Abstract base class for page objects
 */
export abstract class BasePage {
  /** Playwright Page instance */
  readonly page: Page;

  /** Default timeout for operations */
  protected readonly defaultTimeout: number;

  /** Base URL for navigation */
  protected readonly baseUrl: string;

  // Common locators available on all pages
  /** Main navigation header */
  readonly header: Locator;

  /** Footer element */
  readonly footer: Locator;

  /** Loading spinner/indicator */
  readonly loadingIndicator: Locator;

  /** Error message container */
  readonly errorMessage: Locator;

  /** Toast/notification container */
  readonly toast: Locator;

  constructor(page: Page, config: PageConfig = {}) {
    this.page = page;
    this.defaultTimeout = config.defaultTimeout ?? 30000;
    this.baseUrl = config.baseUrl ?? '';

    // Initialize common locators
    this.header = page.locator('header').first();
    this.footer = page.locator('footer').first();
    this.loadingIndicator = page.getByTestId('loading-indicator');
    this.errorMessage = page.getByRole('alert');
    this.toast = page.getByTestId('toast');
  }

  /**
   * Get the URL path for this page
   * Override in subclasses to specify the page URL
   */
  abstract get url(): string;

  /**
   * Navigate to this page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a specific path
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to finish loading
   * Override in subclasses for page-specific load conditions
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout: this.defaultTimeout });

    // Wait for any loading indicators to disappear
    const hasLoadingIndicator = await this.loadingIndicator.isVisible().catch(() => false);
    if (hasLoadingIndicator) {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: this.defaultTimeout });
    }
  }

  /**
   * Wait for loading indicator to appear and then disappear
   */
  async waitForLoading(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: this.defaultTimeout });
  }

  /**
   * Check if the page is currently displayed
   */
  async isDisplayed(): Promise<boolean> {
    const currentUrl = this.page.url();
    return currentUrl.includes(this.url);
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({
      state: 'visible',
      timeout: timeout ?? this.defaultTimeout,
    });
  }

  /**
   * Wait for an element to be hidden
   */
  async waitForElementHidden(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({
      state: 'hidden',
      timeout: timeout ?? this.defaultTimeout,
    });
  }

  /**
   * Check if an element is visible
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  /**
   * Click an element with retry logic
   */
  async clickWithRetry(locator: Locator, retries: number = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await locator.click({ timeout: this.defaultTimeout });
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Fill an input field and verify the value
   */
  async fillAndVerify(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }

  /**
   * Take a screenshot of the current page
   */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Scroll to an element
   */
  async scrollTo(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert that the page URL matches expected
   */
  async assertUrl(expectedUrl: string | RegExp): Promise<void> {
    if (typeof expectedUrl === 'string') {
      await expect(this.page).toHaveURL(expectedUrl);
    } else {
      await expect(this.page).toHaveURL(expectedUrl);
    }
  }

  /**
   * Assert that the page title matches expected
   */
  async assertTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Wait for a specific text to appear on the page
   */
  async waitForText(text: string, timeout?: number): Promise<void> {
    await this.page.getByText(text).waitFor({
      state: 'visible',
      timeout: timeout ?? this.defaultTimeout,
    });
  }

  /**
   * Check if an error message is displayed
   */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return this.errorMessage.textContent() ?? '';
    }
    return '';
  }

  /**
   * Check if a toast notification is displayed
   */
  async hasToast(): Promise<boolean> {
    return this.toast.isVisible();
  }

  /**
   * Get the toast message text
   */
  async getToastMessage(): Promise<string> {
    if (await this.hasToast()) {
      return this.toast.textContent() ?? '';
    }
    return '';
  }

  /**
   * Dismiss any visible toast
   */
  async dismissToast(): Promise<void> {
    if (await this.hasToast()) {
      const closeButton = this.toast.getByRole('button', { name: /close|dismiss/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  }
}

export default BasePage;
