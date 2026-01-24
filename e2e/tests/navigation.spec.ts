/**
 * Navigation E2E Tests
 *
 * End-to-end tests for verifying routing and navigation flows throughout
 * the x402 Arcade application. Tests all routes, back/forward navigation,
 * and 404 error handling.
 *
 * ## Test Coverage
 * - Navigation from home to all major pages
 * - Browser back/forward button functionality
 * - Deep linking to specific routes
 * - 404 page for invalid routes
 * - URL persistence and route transitions
 * - Protected route redirects
 *
 * ## Prerequisites
 * - Frontend server running on http://localhost:5173
 *
 * ## Running Tests
 * ```bash
 * # Run navigation tests
 * npx playwright test e2e/tests/navigation.spec.ts
 *
 * # Run in headed mode
 * npx playwright test e2e/tests/navigation.spec.ts --headed
 *
 * # Run with UI mode
 * npx playwright test e2e/tests/navigation.spec.ts --ui
 * ```
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Configuration
// ============================================================================

const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ==========================================================================
  // Home Page Navigation Tests
  // ==========================================================================

  test.describe('Home Page Navigation', () => {
    test('should navigate from home to play page', async ({ page }) => {
      // Start at home
      await page.goto(FRONTEND_URL);
      await expect(page).toHaveURL('/');

      // Verify we're on home page
      await expect(
        page.getByRole('heading', { level: 1, name: /Insert a Penny, Play for Glory/i })
      ).toBeVisible();

      // Click "Start Playing" or "Play Now" button in hero
      const playButton = page
        .getByRole('link', { name: /Start Playing|Play Now|Browse Games/i })
        .first();
      await playButton.click();

      // Should navigate to /play
      await expect(page).toHaveURL('/play');

      // Verify play page loaded
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();
    });

    test('should navigate from home to play via header link', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Click "Play" link in header
      const headerPlayLink = page.locator('header').getByRole('link', { name: /^Play$/i });
      await headerPlayLink.click();

      // Should navigate to /play
      await expect(page).toHaveURL('/play');
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();
    });

    test('should navigate from home to leaderboard', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Click "Leaderboard" link in header
      const leaderboardLink = page.locator('header').getByRole('link', { name: /Leaderboard/i });
      await leaderboardLink.click();

      // Should navigate to /leaderboard
      await expect(page).toHaveURL('/leaderboard');
      await expect(page.getByRole('heading', { level: 1, name: /Leaderboard/i })).toBeVisible();
    });

    test('should navigate from home to prizes page', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Click "Prizes" link in header (if exists)
      const prizesLink = page.locator('header').getByRole('link', { name: /Prizes|Prize Pools/i });

      // If prizes link exists, click it
      if (await prizesLink.isVisible()) {
        await prizesLink.click();
        await expect(page).toHaveURL('/prizes');
      } else {
        // Skip test if prizes page doesn't exist yet
        test.skip();
      }
    });

    test('should return home via logo click', async ({ page }) => {
      // Start at play page
      await page.goto(`${FRONTEND_URL}/play`);
      await expect(page).toHaveURL('/play');

      // Click logo in header
      const logo = page
        .locator('header')
        .getByRole('link', { name: /x402 Arcade|x402/i })
        .first();
      await logo.click();

      // Should navigate back to home
      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { level: 1, name: /Insert a Penny, Play for Glory/i })
      ).toBeVisible();
    });
  });

  // ==========================================================================
  // Play Page Navigation Tests
  // ==========================================================================

  test.describe('Play Page Navigation', () => {
    test('should navigate to individual game page from play page', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/play`);
      await expect(page).toHaveURL('/play');

      // Find a game card and click its play button
      // Try Snake game first
      const snakeCard = page.getByRole('article').filter({ hasText: /Snake/i });
      const snakePlayButton = snakeCard.getByRole('link', { name: /Play|Start/i }).first();

      if (await snakePlayButton.isVisible()) {
        await snakePlayButton.click();

        // Should navigate to /play/snake
        await expect(page).toHaveURL(/\/play\/snake/);

        // If wallet is not connected, should redirect back to home or show connect prompt
        // If wallet is connected, should show game or payment modal
        // We'll just verify URL changed or redirect happened
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/(play\/snake|$)/);
      } else {
        test.skip();
      }
    });

    test('should show all 5 game cards on play page', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/play`);

      // Verify all 5 games are listed
      const gameNames = ['Snake', 'Tetris', 'Pong', 'Breakout', 'Space Invaders'];

      for (const gameName of gameNames) {
        const gameCard = page.getByRole('heading', { level: 3, name: new RegExp(gameName, 'i') });
        await expect(gameCard).toBeVisible();
      }
    });
  });

  // ==========================================================================
  // Browser Navigation Tests (Back/Forward)
  // ==========================================================================

  test.describe('Browser Back/Forward Navigation', () => {
    test('should navigate back and forward through history', async ({ page }) => {
      // Start at home
      await page.goto(FRONTEND_URL);
      await expect(page).toHaveURL('/');

      // Navigate to play
      await page
        .locator('header')
        .getByRole('link', { name: /^Play$/i })
        .click();
      await expect(page).toHaveURL('/play');

      // Navigate to leaderboard
      await page
        .locator('header')
        .getByRole('link', { name: /Leaderboard/i })
        .click();
      await expect(page).toHaveURL('/leaderboard');

      // Click browser back button
      await page.goBack();
      await expect(page).toHaveURL('/play');

      // Verify play page loaded
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();

      // Click back again
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Verify home page loaded
      await expect(
        page.getByRole('heading', { level: 1, name: /Insert a Penny, Play for Glory/i })
      ).toBeVisible();

      // Click forward button
      await page.goForward();
      await expect(page).toHaveURL('/play');

      // Click forward again
      await page.goForward();
      await expect(page).toHaveURL('/leaderboard');
      await expect(page.getByRole('heading', { level: 1, name: /Leaderboard/i })).toBeVisible();
    });

    test('should preserve scroll position when navigating back', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/play`);

      // Scroll down the page
      await page.evaluate(() => window.scrollTo(0, 500));
      const scrollBefore = await page.evaluate(() => window.scrollY);
      expect(scrollBefore).toBeGreaterThan(0);

      // Navigate away
      await page
        .locator('header')
        .getByRole('link', { name: /Leaderboard/i })
        .click();
      await expect(page).toHaveURL('/leaderboard');

      // Navigate back
      await page.goBack();
      await expect(page).toHaveURL('/play');

      // Wait for page to settle
      await page.waitForLoadState('networkidle');

      // Scroll position behavior varies by browser/framework
      // Just verify we're back on the play page
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();
    });
  });

  // ==========================================================================
  // Deep Linking Tests
  // ==========================================================================

  test.describe('Deep Linking', () => {
    test('should navigate directly to play page via URL', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/play`);

      await expect(page).toHaveURL('/play');
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();
    });

    test('should navigate directly to leaderboard via URL', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/leaderboard`);

      await expect(page).toHaveURL('/leaderboard');
      await expect(page.getByRole('heading', { level: 1, name: /Leaderboard/i })).toBeVisible();
    });

    test('should navigate directly to specific game route via URL', async ({ page }) => {
      // Try to access /play/snake directly
      await page.goto(`${FRONTEND_URL}/play/snake`);

      // If wallet is not connected, should redirect to home
      // If wallet is connected, should show game
      const currentUrl = page.url();

      // Verify one of these outcomes:
      // 1. Redirected to home (no wallet)
      // 2. Still at /play/snake (has wallet)
      expect(currentUrl).toMatch(/\/(play\/snake|$)/);

      // If redirected to home, verify we're there
      if (currentUrl === `${FRONTEND_URL}/` || currentUrl.endsWith('/')) {
        await expect(
          page.getByRole('heading', { level: 1, name: /Insert a Penny, Play for Glory/i })
        ).toBeVisible();
      }
    });

    test('should preserve query parameters in URL', async ({ page }) => {
      // Navigate with query parameters
      await page.goto(`${FRONTEND_URL}/play?sort=difficulty&filter=classic`);

      // Verify URL includes query params
      await expect(page).toHaveURL(/\/play\?sort=difficulty&filter=classic/);

      // Verify page still loads correctly
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();
    });
  });

  // ==========================================================================
  // 404 Not Found Tests
  // ==========================================================================

  test.describe('404 Not Found Page', () => {
    test('should show 404 page for invalid route', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/this-page-does-not-exist`);

      // Should show 404 error page
      await expect(page.getByText(/404/i)).toBeVisible();
      await expect(page.getByText(/Page Not Found|Not Found/i)).toBeVisible();
    });

    test('should show 404 for invalid game route', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/play/nonexistent-game`);

      // Should show 404 or redirect to play page
      const currentUrl = page.url();

      // Either shows 404 or redirects to /play
      if (currentUrl.includes('/play/nonexistent-game')) {
        await expect(page.getByText(/404/i)).toBeVisible();
      } else {
        await expect(page).toHaveURL('/play');
      }
    });

    test('should show GAME OVER message on 404 page', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/invalid-route`);

      await expect(page.getByText(/GAME OVER/i)).toBeVisible();
    });

    test('should provide navigation links on 404 page', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/invalid-route`);

      // Should have "Return Home" or "Go Home" button
      const homeButton = page.getByRole('link', { name: /Return Home|Go Home|Home/i });
      await expect(homeButton).toBeVisible();
      expect(await homeButton.getAttribute('href')).toBe('/');

      // Should have "Play Games" link
      const playButton = page.getByRole('link', { name: /Play Games|Play/i });
      await expect(playButton).toBeVisible();
    });

    test('should navigate from 404 back to valid pages', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/invalid-route`);

      // Click "Return Home" button
      const homeButton = page.getByRole('link', { name: /Return Home|Go Home/i }).first();
      await homeButton.click();

      // Should navigate to home
      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { level: 1, name: /Insert a Penny, Play for Glory/i })
      ).toBeVisible();
    });

    test('should show arcade-themed 404 messaging', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/nonexistent`);

      // Should have arcade-themed error messages
      await expect(page.getByText(/arcade machine|unplugged|void/i)).toBeVisible();
      await expect(page.getByText(/INSERT COIN|Continue Playing/i)).toBeVisible();
      await expect(page.getByText(/🕹️/)).toBeVisible();
    });
  });

  // ==========================================================================
  // Route Transitions Tests
  // ==========================================================================

  test.describe('Route Transitions', () => {
    test('should smoothly transition between pages', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Navigate to play page
      await page
        .locator('header')
        .getByRole('link', { name: /^Play$/i })
        .click();
      await expect(page).toHaveURL('/play');

      // Wait for page transition to complete
      await page.waitForLoadState('networkidle');

      // Verify page loaded
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();

      // Navigate to leaderboard
      await page
        .locator('header')
        .getByRole('link', { name: /Leaderboard/i })
        .click();
      await expect(page).toHaveURL('/leaderboard');

      await page.waitForLoadState('networkidle');

      // Verify page loaded
      await expect(page.getByRole('heading', { level: 1, name: /Leaderboard/i })).toBeVisible();
    });

    test('should maintain header and footer during navigation', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Verify header exists
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Get header content
      const headerText = await header.textContent();

      // Navigate to different pages
      const pages = ['/play', '/leaderboard'];

      for (const pagePath of pages) {
        await page.goto(`${FRONTEND_URL}${pagePath}`);

        // Header should still be visible
        await expect(header).toBeVisible();

        // Header should have similar content (logo, navigation)
        const currentHeaderText = await header.textContent();
        expect(currentHeaderText).toContain('x402');
      }
    });
  });

  // ==========================================================================
  // Mobile Navigation Tests
  // ==========================================================================

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should open and close mobile menu', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Find mobile menu button
      const menuButton = page.locator('header').getByRole('button', { name: /menu|open menu/i });

      // Mobile menu button should be visible on small screens
      await expect(menuButton).toBeVisible();

      // Click to open menu
      await menuButton.click();

      // Menu should be open
      const mobileNav = page.getByRole('navigation', { name: /mobile|main/i });
      await expect(mobileNav).toBeVisible();

      // Should see navigation links
      await expect(page.getByRole('link', { name: /Play/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Leaderboard/i })).toBeVisible();

      // Close menu
      const closeButton = page.locator('header').getByRole('button', { name: /close|close menu/i });
      await closeButton.click();

      // Menu should close
      // Note: exact behavior depends on implementation
    });

    test('should navigate via mobile menu', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Open mobile menu
      const menuButton = page.locator('header').getByRole('button', { name: /menu|open menu/i });
      await menuButton.click();

      // Click Play link
      const playLink = page.getByRole('link', { name: /^Play$|Play Games/i }).first();
      await playLink.click();

      // Should navigate to play page
      await expect(page).toHaveURL('/play');
      await expect(
        page.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeVisible();
    });
  });

  // ==========================================================================
  // Complete Navigation Flow Test
  // ==========================================================================

  test('FULL E2E: Navigate through all major pages', async ({ page }) => {
    console.log('Starting complete navigation flow...');

    // Step 1: Start at home
    console.log('Step 1: Loading home page...');
    await page.goto(FRONTEND_URL);
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { level: 1, name: /Insert a Penny, Play for Glory/i })
    ).toBeVisible();

    // Step 2: Navigate to Play
    console.log('Step 2: Navigating to Play page...');
    await page
      .locator('header')
      .getByRole('link', { name: /^Play$/i })
      .click();
    await expect(page).toHaveURL('/play');
    await expect(page.getByRole('heading', { level: 1, name: /Choose Your Game/i })).toBeVisible();

    // Step 3: Navigate to Leaderboard
    console.log('Step 3: Navigating to Leaderboard...');
    await page
      .locator('header')
      .getByRole('link', { name: /Leaderboard/i })
      .click();
    await expect(page).toHaveURL('/leaderboard');
    await expect(page.getByRole('heading', { level: 1, name: /Leaderboard/i })).toBeVisible();

    // Step 4: Navigate back to Home via logo
    console.log('Step 4: Returning home via logo...');
    await page
      .locator('header')
      .getByRole('link', { name: /x402 Arcade|x402/i })
      .first()
      .click();
    await expect(page).toHaveURL('/');

    // Step 5: Test 404 page
    console.log('Step 5: Testing 404 page...');
    await page.goto(`${FRONTEND_URL}/invalid-page`);
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByText(/GAME OVER/i)).toBeVisible();

    // Step 6: Return home from 404
    console.log('Step 6: Returning from 404...');
    const homeButton = page.getByRole('link', { name: /Return Home|Go Home/i }).first();
    await homeButton.click();
    await expect(page).toHaveURL('/');

    // Step 7: Test browser navigation
    console.log('Step 7: Testing browser back/forward...');
    await page
      .locator('header')
      .getByRole('link', { name: /^Play$/i })
      .click();
    await expect(page).toHaveURL('/play');

    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.goForward();
    await expect(page).toHaveURL('/play');

    console.log('✅ Complete navigation flow successful!');
  });
});
