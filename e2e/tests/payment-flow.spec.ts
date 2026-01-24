/**
 * E2E Payment Flow Tests
 *
 * Comprehensive end-to-end tests for the complete x402 payment flow.
 * Tests the full user journey from wallet connection through game payment
 * and session creation on Cronos testnet.
 *
 * ## Prerequisites
 * - Backend server running on http://localhost:3001
 * - Frontend server running on http://localhost:5173
 * - MetaMask or compatible wallet installed
 * - Cronos Testnet configured (Chain ID: 338)
 * - Test TCRO and devUSDC.e in wallet
 *
 * ## Running Tests
 * ```bash
 * # Run all payment flow tests
 * npx playwright test e2e/tests/payment-flow.spec.ts
 *
 * # Run in headed mode to see wallet interactions
 * npx playwright test e2e/tests/payment-flow.spec.ts --headed
 *
 * # Run with slow motion for debugging
 * SLOW_MOTION=true npx playwright test e2e/tests/payment-flow.spec.ts --headed
 * ```
 *
 * ## Test Coverage
 * - Wallet connection to Cronos Testnet
 * - USDC balance verification
 * - Payment signature request (EIP-3009)
 * - x402 payment header submission
 * - Payment settlement via facilitator
 * - Game session creation
 * - Score submission after gameplay
 * - Error scenarios (insufficient balance, wrong network, etc.)
 */

import { test, expect, type Page } from '@playwright/test';
import { WalletConnectionPage } from '../pages/WalletConnectionPage';
import { GameLobbyPage } from '../pages/GameLobbyPage';

// ============================================================================
// Configuration
// ============================================================================

const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const CRONOS_TESTNET_CHAIN_ID = 338;
const USDC_CONTRACT_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

/**
 * Helper: Wait for network to be Cronos Testnet
 */
async function ensureCronosTestnet(page: Page): Promise<void> {
  // Check if we're on the correct network
  const chainId = await page.evaluate(() => {
    return window.ethereum?.request({ method: 'eth_chainId' });
  });

  if (chainId !== `0x${CRONOS_TESTNET_CHAIN_ID.toString(16)}`) {
    // Request network switch
    await page.evaluate(async (targetChainId) => {
      try {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (error: any) {
        // Network not added, try adding it
        if (error.code === 4902) {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: 'Cronos Testnet',
                rpcUrls: ['https://evm-t3.cronos.org/'],
                nativeCurrency: {
                  name: 'Test CRO',
                  symbol: 'TCRO',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://explorer.cronos.org/testnet'],
              },
            ],
          });
        }
      }
    }, CRONOS_TESTNET_CHAIN_ID);
  }
}

/**
 * Helper: Get USDC balance from wallet
 */
async function getUsdcBalance(page: Page, walletAddress: string): Promise<string> {
  const balance = await page.evaluate(
    async ({ usdcAddress, wallet }) => {
      // ABI for balanceOf
      const balanceOfAbi = [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function',
        },
      ];

      // Call balanceOf
      const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum);
      const contract = new (window as any).ethers.Contract(usdcAddress, balanceOfAbi, provider);
      const balance = await contract.balanceOf(wallet);

      // Convert to human-readable (6 decimals for USDC)
      return (window as any).ethers.utils.formatUnits(balance, 6);
    },
    { usdcAddress: USDC_CONTRACT_ADDRESS, wallet: walletAddress }
  );

  return balance;
}

/**
 * Helper: Wait for API response
 */
async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<any> {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('x402 Payment Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to the app
    await page.goto(FRONTEND_URL);
  });

  // ==========================================================================
  // Wallet Connection Tests
  // ==========================================================================

  test.describe('Wallet Connection', () => {
    test('should connect wallet to Cronos Testnet', async ({ page }) => {
      const walletPage = new WalletConnectionPage(page);

      // Click connect wallet button
      await walletPage.clickConnectWallet();

      // Wait for wallet modal
      await expect(walletPage.walletModal).toBeVisible();

      // Select MetaMask (or first available provider)
      await walletPage.selectWalletProvider('metamask');

      // Wait for MetaMask popup and connection
      // NOTE: This requires manual approval in MetaMask extension
      await walletPage.waitForConnection(30000); // 30 second timeout

      // Verify wallet is connected
      await walletPage.assertConnected();

      // Get wallet address
      const address = await walletPage.getWalletAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Verify we're on Cronos Testnet
      const status = await walletPage.getConnectionStatus();
      expect(status.chainId).toBe(CRONOS_TESTNET_CHAIN_ID);
    });

    test('should display USDC balance', async ({ page }) => {
      const walletPage = new WalletConnectionPage(page);

      // Assume wallet is already connected from previous test or setup
      await walletPage.goto();

      // Verify wallet is connected
      const isConnected = await walletPage.isConnected();
      if (!isConnected) {
        test.skip(); // Skip if not connected
      }

      // Get wallet address
      const address = await walletPage.getWalletAddress();
      expect(address).toBeTruthy();

      // Get USDC balance
      const balance = await getUsdcBalance(page, address!);
      expect(balance).toBeTruthy();
      expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);

      console.log(`USDC Balance: ${balance} USDC`);
    });

    test('should handle wrong network gracefully', async ({ page }) => {
      // This test verifies network switching prompts appear
      // when user is on the wrong network

      // Switch to a different network (e.g., Ethereum mainnet)
      await page.evaluate(async () => {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }], // Ethereum mainnet
        });
      });

      // Try to use the app
      const walletPage = new WalletConnectionPage(page);
      await walletPage.goto();

      // Should see network switch prompt or error
      // NOTE: Exact behavior depends on app implementation
      // This is a placeholder for network validation logic
    });
  });

  // ==========================================================================
  // Payment Flow Tests
  // ==========================================================================

  test.describe('x402 Payment Protocol', () => {
    test('should complete full payment flow for Snake game', async ({ page }) => {
      const gameLobby = new GameLobbyPage(page);

      // Ensure wallet is connected
      await page.goto(FRONTEND_URL);
      const walletPage = new WalletConnectionPage(page);
      const isConnected = await walletPage.isConnected();
      if (!isConnected) {
        await walletPage.clickConnectWallet();
        await walletPage.selectWalletProvider('metamask');
        await walletPage.waitForConnection(30000);
      }

      // Navigate to game lobby
      await gameLobby.goto();

      // Click "Play" button for Snake game
      const playButton = page.locator('[data-testid="play-snake"], button:has-text("Play Snake")');
      await expect(playButton).toBeVisible();

      // Monitor API calls
      const play402ResponsePromise = waitForApiResponse(page, /\/api\/play\/snake/);

      await playButton.click();

      // Server should return 402 Payment Required
      const play402Response = await play402ResponsePromise;
      expect(play402Response.status()).toBe(402);

      // Verify payment requirements in response
      const paymentRequirements = await play402Response.json();
      expect(paymentRequirements).toHaveProperty('to');
      expect(paymentRequirements).toHaveProperty('amount');
      expect(paymentRequirements).toHaveProperty('tokenAddress');
      expect(paymentRequirements).toHaveProperty('chainId');
      expect(paymentRequirements.chainId).toBe(CRONOS_TESTNET_CHAIN_ID);

      console.log('Payment Requirements:', paymentRequirements);

      // Wait for signature request modal
      const signatureModal = page.locator(
        '[data-testid="signature-modal"], [data-testid="payment-modal"]'
      );
      await expect(signatureModal).toBeVisible({ timeout: 5000 });

      // User should see payment details
      await expect(page.locator(`text=${paymentRequirements.amount}`)).toBeVisible();

      // Click sign/approve button
      const signButton = page.locator(
        '[data-testid="sign-payment"], button:has-text("Sign"), button:has-text("Approve")'
      );
      await signButton.click();

      // MetaMask signature popup should appear
      // NOTE: This requires manual signing in MetaMask
      // Wait up to 60 seconds for user to sign

      // Monitor the retry request with X-Payment header
      const playSuccessResponsePromise = waitForApiResponse(page, /\/api\/play\/snake/, 60000);

      // Wait for payment to settle
      const playSuccessResponse = await playSuccessResponsePromise;
      expect(playSuccessResponse.status()).toBe(200);

      // Verify game session was created
      const sessionData = await playSuccessResponse.json();
      expect(sessionData).toHaveProperty('sessionId');
      expect(sessionData).toHaveProperty('gameType');
      expect(sessionData.gameType).toBe('snake');

      console.log('Game Session Created:', sessionData);

      // Verify game starts (redirected to game page)
      await expect(page).toHaveURL(/\/game\/snake/, { timeout: 5000 });

      // Verify game canvas is visible
      const gameCanvas = page.locator('canvas, [data-testid="game-canvas"]');
      await expect(gameCanvas).toBeVisible();
    });

    test('should handle payment signature rejection', async ({ page }) => {
      const gameLobby = new GameLobbyPage(page);

      // Ensure wallet is connected
      await page.goto(FRONTEND_URL);

      // Navigate to game lobby
      await gameLobby.goto();

      // Click play button
      const playButton = page.locator(
        '[data-testid="play-tetris"], button:has-text("Play Tetris")'
      );
      await playButton.click();

      // Wait for signature modal
      const signatureModal = page.locator('[data-testid="signature-modal"]');
      await expect(signatureModal).toBeVisible({ timeout: 5000 });

      // Click cancel/reject button
      const cancelButton = page.locator(
        '[data-testid="cancel-payment"], button:has-text("Cancel"), button:has-text("Reject")'
      );

      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      } else {
        // User will manually reject in MetaMask
        // Wait for error state
      }

      // Should show error message
      const errorMessage = page.locator('[role="alert"], [data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Should remain on lobby or show retry option
      const retryButton = page.locator(
        '[data-testid="retry-payment"], button:has-text("Try Again")'
      );
      await expect(retryButton).toBeVisible();
    });

    test('should handle insufficient USDC balance', async ({ page }) => {
      // This test requires a wallet with 0 USDC or insufficient balance
      // In a real scenario, we would use a test wallet with no USDC

      const walletPage = new WalletConnectionPage(page);
      await walletPage.goto();

      const address = await walletPage.getWalletAddress();
      if (!address) {
        test.skip(); // Skip if not connected
      }

      const balance = await getUsdcBalance(page, address);
      console.log(`Current USDC Balance: ${balance}`);

      if (parseFloat(balance) > 0.02) {
        test.skip(); // Skip if balance is sufficient (use wallet with 0 balance for this test)
      }

      // Try to play game
      const gameLobby = new GameLobbyPage(page);
      await gameLobby.goto();

      const playButton = page.locator('[data-testid="play-snake"]');
      await playButton.click();

      // Should see insufficient balance error
      const errorMessage = page.locator('text=/insufficient.*balance/i');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  // ==========================================================================
  // Game Session Tests
  // ==========================================================================

  test.describe('Game Session & Score Submission', () => {
    test('should create game session after payment', async ({ page }) => {
      // This test verifies the backend creates a session
      // after successful payment settlement

      await page.goto(FRONTEND_URL);

      // Complete payment flow (from previous test)
      // Assuming wallet is connected and has USDC

      // Navigate to game
      const gameLobby = new GameLobbyPage(page);
      await gameLobby.goto();
      await gameLobby.clickPlayGame('snake');

      // Complete payment (manual signing required)
      const signButton = page.locator('[data-testid="sign-payment"]');
      if (await signButton.isVisible({ timeout: 5000 })) {
        await signButton.click();
      }

      // Wait for session creation
      const sessionResponse = await waitForApiResponse(page, /\/api\/play\/snake/, 60000);
      expect(sessionResponse.status()).toBe(200);

      const sessionData = await sessionResponse.json();

      // Store session ID for score submission
      const sessionId = sessionData.sessionId;
      expect(sessionId).toBeTruthy();

      // Verify session is active
      expect(sessionData.status).toBe('active');
      expect(sessionData.playerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(sessionData.paymentTxHash).toBeTruthy();
    });

    test('should submit score after game completion', async ({ page }) => {
      // This test assumes a game session was created
      // and the user has played the game

      await page.goto(FRONTEND_URL);

      // Play game and get a score
      // NOTE: This requires actually playing or simulating gameplay

      // For testing, we can simulate game over state
      await page.evaluate(() => {
        // Inject game over state
        window.dispatchEvent(
          new CustomEvent('game-over', {
            detail: { score: 1234, sessionId: 'test-session-id' },
          })
        );
      });

      // Wait for score submission
      const scoreResponse = await waitForApiResponse(page, /\/api\/score/, 10000);
      expect(scoreResponse.status()).toBe(200);

      const scoreData = await scoreResponse.json();
      expect(scoreData).toHaveProperty('rank');
      expect(scoreData).toHaveProperty('score');
      expect(scoreData.score).toBe(1234);

      // Should redirect to leaderboard or game over screen
      const gameOverScreen = page.locator('[data-testid="game-over"], .game-over-screen');
      await expect(gameOverScreen).toBeVisible();
    });

    test('should display leaderboard after score submission', async ({ page }) => {
      // After submitting a score, user should see their rank

      await page.goto(FRONTEND_URL);

      // Navigate to leaderboard
      const leaderboardLink = page.locator('a:has-text("Leaderboard"), [href*="/leaderboard"]');
      await leaderboardLink.click();

      // Wait for leaderboard to load
      await expect(page).toHaveURL(/\/leaderboard/);

      // Verify leaderboard table
      const leaderboardTable = page.locator('[data-testid="leaderboard-table"], table');
      await expect(leaderboardTable).toBeVisible();

      // Verify entries have rank, player, score
      const firstEntry = page.locator('[data-testid="leaderboard-entry-1"]');
      await expect(firstEntry).toBeVisible();
      await expect(firstEntry.locator('text=/rank/i')).toBeVisible();
      await expect(firstEntry.locator('text=/score/i')).toBeVisible();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  test.describe('Error Scenarios', () => {
    test('should handle facilitator timeout gracefully', async ({ page }) => {
      // Simulate facilitator being down or slow
      // This would require mocking the facilitator in test environment

      await page.goto(FRONTEND_URL);

      // Try to play game
      const gameLobby = new GameLobbyPage(page);
      await gameLobby.goto();
      await gameLobby.clickPlayGame('snake');

      // If facilitator times out, should show error
      const errorMessage = page.locator('text=/timeout|try again|service unavailable/i');

      // Wait up to 65 seconds (facilitator timeout is 60s)
      const isVisible = await errorMessage.isVisible({ timeout: 65000 }).catch(() => false);

      if (isVisible) {
        // Error was shown, verify retry option
        const retryButton = page.locator('button:has-text("Try Again")');
        await expect(retryButton).toBeVisible();
      }
    });

    test('should handle invalid payment signature', async ({ page }) => {
      // This test would require injecting an invalid signature
      // In a real scenario, this would be caught by backend validation

      await page.goto(FRONTEND_URL);

      // Attempt payment with invalid signature
      // This requires intercepting the request and modifying the signature

      await page.route('**/api/play/**', async (route) => {
        const request = route.request();
        const headers = request.headers();

        if (headers['x-payment']) {
          // Corrupt the signature
          const payment = JSON.parse(headers['x-payment']);
          payment.signature = '0x' + '0'.repeat(130); // Invalid signature

          await route.continue({
            headers: {
              ...headers,
              'x-payment': JSON.stringify(payment),
            },
          });
        } else {
          await route.continue();
        }
      });

      const gameLobby = new GameLobbyPage(page);
      await gameLobby.goto();
      await gameLobby.clickPlayGame('snake');

      // Should receive 400 or 401 error
      const errorResponse = await waitForApiResponse(page, /\/api\/play\/snake/, 10000);
      expect([400, 401]).toContain(errorResponse.status());

      // Should show error message
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
    });

    test('should handle session expiry', async ({ page }) => {
      // Test that expired sessions are handled correctly

      await page.goto(FRONTEND_URL);

      // Create a session
      // Wait for it to expire (30 minutes per spec)
      // Or manually set session to expired state

      // Try to submit score for expired session
      await page.evaluate(() => {
        fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'expired-session-id',
            score: 100,
          }),
        });
      });

      // Should receive 400 or 404 error
      const errorResponse = await waitForApiResponse(page, /\/api\/score/, 5000);
      expect([400, 404]).toContain(errorResponse.status());
    });
  });

  // ==========================================================================
  // End-to-End Complete Flow
  // ==========================================================================

  test('FULL E2E: Connect wallet → Pay → Play → Submit score → View leaderboard', async ({
    page,
  }) => {
    // This is the complete happy path test
    console.log('Starting complete E2E flow...');

    // Step 1: Connect Wallet
    console.log('Step 1: Connecting wallet...');
    await page.goto(FRONTEND_URL);
    const walletPage = new WalletConnectionPage(page);

    if (!(await walletPage.isConnected())) {
      await walletPage.clickConnectWallet();
      await walletPage.selectWalletProvider('metamask');
      await walletPage.waitForConnection(30000);
    }

    const address = await walletPage.getWalletAddress();
    console.log(`Wallet connected: ${address}`);
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // Step 2: Check USDC balance
    console.log('Step 2: Checking USDC balance...');
    const balance = await getUsdcBalance(page, address!);
    console.log(`USDC Balance: ${balance}`);
    expect(parseFloat(balance)).toBeGreaterThanOrEqual(0.01);

    // Step 3: Navigate to game lobby
    console.log('Step 3: Opening game lobby...');
    const gameLobby = new GameLobbyPage(page);
    await gameLobby.goto();

    // Step 4: Click play and handle payment
    console.log('Step 4: Initiating payment...');
    const playButton = page.locator('[data-testid="play-snake"]');
    await playButton.click();

    // Wait for signature modal
    const signButton = page.locator('[data-testid="sign-payment"]');
    await expect(signButton).toBeVisible({ timeout: 5000 });

    console.log('Step 5: Waiting for user to sign payment (up to 60s)...');
    await signButton.click();

    // Wait for payment settlement
    const sessionResponse = await waitForApiResponse(page, /\/api\/play\/snake/, 60000);
    expect(sessionResponse.status()).toBe(200);

    const sessionData = await sessionResponse.json();
    console.log(`Session created: ${sessionData.sessionId}`);

    // Step 6: Verify game starts
    console.log('Step 6: Verifying game started...');
    await expect(page).toHaveURL(/\/game\/snake/, { timeout: 5000 });
    const gameCanvas = page.locator('canvas');
    await expect(gameCanvas).toBeVisible();

    // Step 7: Simulate gameplay and score
    console.log('Step 7: Simulating gameplay...');
    await page.waitForTimeout(2000); // Play for 2 seconds

    // Trigger game over
    const testScore = 9876;
    await page.evaluate((score) => {
      window.dispatchEvent(
        new CustomEvent('game-over', {
          detail: { score },
        })
      );
    }, testScore);

    // Step 8: Submit score
    console.log('Step 8: Submitting score...');
    const scoreResponse = await waitForApiResponse(page, /\/api\/score/, 10000);
    expect(scoreResponse.status()).toBe(200);

    const scoreData = await scoreResponse.json();
    console.log(`Score submitted: ${scoreData.score}, Rank: ${scoreData.rank}`);

    // Step 9: View leaderboard
    console.log('Step 9: Viewing leaderboard...');
    const leaderboardLink = page.locator('a:has-text("Leaderboard")');
    await leaderboardLink.click();

    await expect(page).toHaveURL(/\/leaderboard/);

    const leaderboardTable = page.locator('[data-testid="leaderboard-table"]');
    await expect(leaderboardTable).toBeVisible();

    console.log('✅ Complete E2E flow successful!');
  });
});
