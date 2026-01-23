/**
 * Wallet Connection Page Object Model
 *
 * Page object for testing wallet connection flows.
 * Provides methods for connecting, disconnecting, and verifying wallet state.
 *
 * @example
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { WalletConnectionPage } from '../pages/WalletConnectionPage';
 *
 * test('should connect wallet', async ({ page }) => {
 *   const walletPage = new WalletConnectionPage(page);
 *   await walletPage.goto();
 *   await walletPage.clickConnectWallet();
 *   await walletPage.selectWalletProvider('metamask');
 *   await walletPage.waitForConnection();
 *
 *   expect(await walletPage.isConnected()).toBe(true);
 * });
 *
 * test('should disconnect wallet', async ({ page }) => {
 *   const walletPage = new WalletConnectionPage(page);
 *   await walletPage.goto();
 *   // Assume already connected
 *   await walletPage.disconnectWallet();
 *
 *   expect(await walletPage.isConnected()).toBe(false);
 * });
 * ```
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage, PageConfig } from './BasePage';

/**
 * Supported wallet provider names
 */
export type WalletProviderName =
  | 'metamask'
  | 'walletconnect'
  | 'coinbase'
  | 'phantom'
  | 'trust'
  | 'rabby'
  | 'okx'
  | string;

/**
 * Connection status information
 */
export interface ConnectionStatus {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  chainName: string | null;
}

/**
 * Wallet connection page object for E2E testing
 */
export class WalletConnectionPage extends BasePage {
  // Wallet-specific locators

  /** Connect wallet button (primary CTA) */
  readonly connectWalletButton: Locator;

  /** Wallet modal/dialog container */
  readonly walletModal: Locator;

  /** List of wallet providers in the modal */
  readonly walletProviderList: Locator;

  /** Disconnect wallet button */
  readonly disconnectButton: Locator;

  /** Connected wallet address display */
  readonly walletAddress: Locator;

  /** Connected wallet indicator */
  readonly connectedIndicator: Locator;

  /** Wallet balance display */
  readonly walletBalance: Locator;

  /** Network/chain selector */
  readonly networkSelector: Locator;

  /** Loading/connecting state indicator */
  readonly connectingIndicator: Locator;

  /** Connection error message */
  readonly connectionError: Locator;

  /** Account menu/dropdown (when connected) */
  readonly accountMenu: Locator;

  /** Copy address button */
  readonly copyAddressButton: Locator;

  /** View on explorer link */
  readonly viewExplorerLink: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, config);

    // Initialize wallet-specific locators
    // Try multiple selectors to handle different UI implementations
    this.connectWalletButton = page.locator([
      '[data-testid="connect-wallet-button"]',
      '[data-testid="connect-wallet"]',
      'button:has-text("Connect Wallet")',
      'button:has-text("Connect")',
      '[aria-label*="Connect wallet" i]',
    ].join(', ')).first();

    this.walletModal = page.locator([
      '[data-testid="wallet-modal"]',
      '[data-testid="wallet-dialog"]',
      '[role="dialog"]:has-text("Connect")',
      '.wallet-modal',
    ].join(', ')).first();

    this.walletProviderList = page.locator([
      '[data-testid="wallet-provider-list"]',
      '[data-testid="wallet-options"]',
      '.wallet-adapter-modal-list',
      '.wallet-providers',
    ].join(', ')).first();

    this.disconnectButton = page.locator([
      '[data-testid="disconnect-button"]',
      '[data-testid="disconnect-wallet"]',
      'button:has-text("Disconnect")',
      '[aria-label*="Disconnect" i]',
    ].join(', ')).first();

    this.walletAddress = page.locator([
      '[data-testid="wallet-address"]',
      '[data-testid="connected-address"]',
      '.wallet-address',
      '[aria-label*="wallet address" i]',
    ].join(', ')).first();

    this.connectedIndicator = page.locator([
      '[data-testid="wallet-connected"]',
      '[data-testid="connection-status"][data-connected="true"]',
      '.wallet-connected',
      '[aria-label*="connected" i]',
    ].join(', ')).first();

    this.walletBalance = page.locator([
      '[data-testid="wallet-balance"]',
      '[data-testid="balance"]',
      '.wallet-balance',
    ].join(', ')).first();

    this.networkSelector = page.locator([
      '[data-testid="network-selector"]',
      '[data-testid="chain-selector"]',
      '.network-selector',
      'button:has-text("Network")',
    ].join(', ')).first();

    this.connectingIndicator = page.locator([
      '[data-testid="connecting-indicator"]',
      '[data-testid="wallet-connecting"]',
      ':text("Connecting...")',
      '.connecting-spinner',
    ].join(', ')).first();

    this.connectionError = page.locator([
      '[data-testid="connection-error"]',
      '[data-testid="wallet-error"]',
      '[role="alert"]:has-text("error")',
      '.wallet-error',
    ].join(', ')).first();

    this.accountMenu = page.locator([
      '[data-testid="account-menu"]',
      '[data-testid="wallet-menu"]',
      '.account-menu',
    ].join(', ')).first();

    this.copyAddressButton = page.locator([
      '[data-testid="copy-address"]',
      'button[aria-label*="Copy" i]',
      'button:has-text("Copy")',
    ].join(', ')).first();

    this.viewExplorerLink = page.locator([
      '[data-testid="view-explorer"]',
      'a:has-text("Explorer")',
      'a:has-text("View on")',
    ].join(', ')).first();
  }

  /**
   * Get the URL path for wallet connection testing
   * Override this in tests if wallet connection happens on a specific page
   */
  get url(): string {
    return '/';
  }

  /**
   * Click the connect wallet button to initiate connection flow
   */
  async clickConnectWallet(): Promise<void> {
    await this.waitForElement(this.connectWalletButton);
    await this.connectWalletButton.click();
    // Wait for modal to appear
    await this.walletModal.waitFor({ state: 'visible', timeout: this.defaultTimeout }).catch(() => {
      // Modal may not always appear (e.g., auto-connect scenarios)
    });
  }

  /**
   * Select a wallet provider from the connection modal
   * @param providerName - Name of the wallet provider to select (case-insensitive)
   */
  async selectWalletProvider(providerName: WalletProviderName): Promise<void> {
    // Wait for the provider list to be visible
    await this.walletProviderList.waitFor({ state: 'visible', timeout: this.defaultTimeout }).catch(() => {
      // Provider list might be within the modal
    });

    // Find and click the provider button
    const providerButton = this.page.locator([
      `[data-testid="wallet-provider-${providerName.toLowerCase()}"]`,
      `[data-testid="${providerName.toLowerCase()}-button"]`,
      `button:has-text("${providerName}")`,
      `[aria-label*="${providerName}" i]`,
      `.wallet-adapter-button:has-text("${providerName}")`,
    ].join(', ')).first();

    await this.waitForElement(providerButton);
    await providerButton.click();
  }

  /**
   * Wait for wallet connection to complete
   * @param timeout - Optional custom timeout in milliseconds
   */
  async waitForConnection(timeout?: number): Promise<void> {
    const waitTimeout = timeout ?? this.defaultTimeout;

    // First, wait for any connecting state to appear and disappear
    const hasConnecting = await this.connectingIndicator.isVisible().catch(() => false);
    if (hasConnecting) {
      await this.connectingIndicator.waitFor({ state: 'hidden', timeout: waitTimeout });
    }

    // Then wait for connection indicator or wallet address to appear
    await Promise.race([
      this.connectedIndicator.waitFor({ state: 'visible', timeout: waitTimeout }),
      this.walletAddress.waitFor({ state: 'visible', timeout: waitTimeout }),
    ]);

    // Wait for modal to close if it was open
    const isModalVisible = await this.walletModal.isVisible().catch(() => false);
    if (isModalVisible) {
      await this.walletModal.waitFor({ state: 'hidden', timeout: waitTimeout });
    }
  }

  /**
   * Disconnect the currently connected wallet
   */
  async disconnectWallet(): Promise<void> {
    // First check if account menu needs to be opened
    const isAccountMenuVisible = await this.accountMenu.isVisible().catch(() => false);
    const isDisconnectVisible = await this.disconnectButton.isVisible().catch(() => false);

    if (isAccountMenuVisible && !isDisconnectVisible) {
      // Click account menu to reveal disconnect button
      await this.accountMenu.click();
      await this.page.waitForTimeout(300); // Wait for menu animation
    }

    // Click disconnect button
    await this.waitForElement(this.disconnectButton);
    await this.disconnectButton.click();

    // Wait for disconnection (connect button should reappear)
    await this.connectWalletButton.waitFor({ state: 'visible', timeout: this.defaultTimeout });
  }

  /**
   * Check if a wallet is currently connected
   * @returns True if wallet is connected, false otherwise
   */
  async isConnected(): Promise<boolean> {
    // Check multiple indicators for connection
    const hasConnectedIndicator = await this.connectedIndicator.isVisible().catch(() => false);
    const hasWalletAddress = await this.walletAddress.isVisible().catch(() => false);
    const hasDisconnectButton = await this.disconnectButton.isVisible().catch(() => false);
    const hasAccountMenu = await this.accountMenu.isVisible().catch(() => false);

    // Connected if any connection indicator is visible
    return hasConnectedIndicator || hasWalletAddress || hasDisconnectButton || hasAccountMenu;
  }

  /**
   * Get the connected wallet address
   * @returns The wallet address or null if not connected
   */
  async getWalletAddress(): Promise<string | null> {
    if (!(await this.isConnected())) {
      return null;
    }

    const addressText = await this.walletAddress.textContent();
    return addressText?.trim() ?? null;
  }

  /**
   * Get the current connection status
   */
  async getConnectionStatus(): Promise<ConnectionStatus> {
    const isConnected = await this.isConnected();

    if (!isConnected) {
      return {
        isConnected: false,
        address: null,
        chainId: null,
        chainName: null,
      };
    }

    const address = await this.getWalletAddress();

    // Try to get chain info from network selector or page state
    let chainId: number | null = null;
    let chainName: string | null = null;

    const networkText = await this.networkSelector.textContent().catch(() => null);
    if (networkText) {
      chainName = networkText.trim();
      // Extract chain ID if present in the text or data attributes
      const chainIdAttr = await this.networkSelector.getAttribute('data-chain-id').catch(() => null);
      if (chainIdAttr) {
        chainId = parseInt(chainIdAttr, 10);
      }
    }

    return {
      isConnected,
      address,
      chainId,
      chainName,
    };
  }

  /**
   * Get wallet balance
   * @returns Balance string or null if not available
   */
  async getBalance(): Promise<string | null> {
    const hasBalance = await this.walletBalance.isVisible().catch(() => false);
    if (!hasBalance) {
      return null;
    }
    const balanceText = await this.walletBalance.textContent();
    return balanceText?.trim() ?? null;
  }

  /**
   * Check if the wallet modal is currently open
   */
  async isModalOpen(): Promise<boolean> {
    return this.walletModal.isVisible();
  }

  /**
   * Close the wallet modal if it's open
   */
  async closeModal(): Promise<void> {
    if (await this.isModalOpen()) {
      // Try clicking outside the modal or finding a close button
      const closeButton = this.walletModal.locator('[aria-label*="close" i], button:has-text("Close"), .close-button').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Press Escape to close
        await this.page.keyboard.press('Escape');
      }
      await this.walletModal.waitFor({ state: 'hidden', timeout: this.defaultTimeout });
    }
  }

  /**
   * Check if there's a connection error
   */
  async hasConnectionError(): Promise<boolean> {
    return this.connectionError.isVisible();
  }

  /**
   * Get the connection error message
   */
  async getConnectionErrorMessage(): Promise<string | null> {
    if (!(await this.hasConnectionError())) {
      return null;
    }
    const errorText = await this.connectionError.textContent();
    return errorText?.trim() ?? null;
  }

  /**
   * Wait for connection error to appear
   */
  async waitForConnectionError(timeout?: number): Promise<void> {
    await this.connectionError.waitFor({
      state: 'visible',
      timeout: timeout ?? this.defaultTimeout,
    });
  }

  /**
   * Copy wallet address to clipboard
   */
  async copyAddress(): Promise<void> {
    // May need to open account menu first
    const isAccountMenuVisible = await this.accountMenu.isVisible().catch(() => false);
    const isCopyVisible = await this.copyAddressButton.isVisible().catch(() => false);

    if (isAccountMenuVisible && !isCopyVisible) {
      await this.accountMenu.click();
      await this.page.waitForTimeout(300);
    }

    await this.waitForElement(this.copyAddressButton);
    await this.copyAddressButton.click();
  }

  /**
   * Get a wallet provider button by name
   */
  getWalletProviderButton(providerName: WalletProviderName): Locator {
    return this.page.locator([
      `[data-testid="wallet-provider-${providerName.toLowerCase()}"]`,
      `[data-testid="${providerName.toLowerCase()}-button"]`,
      `button:has-text("${providerName}")`,
    ].join(', ')).first();
  }

  /**
   * Check if a specific wallet provider is available
   */
  async isWalletProviderAvailable(providerName: WalletProviderName): Promise<boolean> {
    const providerButton = this.getWalletProviderButton(providerName);
    return providerButton.isVisible();
  }

  /**
   * Get all available wallet providers
   */
  async getAvailableWalletProviders(): Promise<string[]> {
    await this.walletProviderList.waitFor({ state: 'visible', timeout: this.defaultTimeout }).catch(() => {});

    const buttons = this.walletProviderList.locator('button, [role="button"]');
    const count = await buttons.count();
    const providers: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text) {
        providers.push(text.trim());
      }
    }

    return providers;
  }

  // ============================================================================
  // Assertion Helpers
  // ============================================================================

  /**
   * Assert that wallet is connected
   */
  async assertConnected(): Promise<void> {
    const isConnected = await this.isConnected();
    expect(isConnected).toBe(true);
  }

  /**
   * Assert that wallet is disconnected
   */
  async assertDisconnected(): Promise<void> {
    const isConnected = await this.isConnected();
    expect(isConnected).toBe(false);
  }

  /**
   * Assert that the connect button is visible
   */
  async assertConnectButtonVisible(): Promise<void> {
    await expect(this.connectWalletButton).toBeVisible();
  }

  /**
   * Assert wallet address matches expected
   */
  async assertAddress(expectedAddress: string | RegExp): Promise<void> {
    const address = await this.getWalletAddress();
    if (typeof expectedAddress === 'string') {
      expect(address?.toLowerCase()).toBe(expectedAddress.toLowerCase());
    } else {
      expect(address).toMatch(expectedAddress);
    }
  }

  /**
   * Assert that a specific wallet provider is available
   */
  async assertWalletProviderAvailable(providerName: WalletProviderName): Promise<void> {
    const providerButton = this.getWalletProviderButton(providerName);
    await expect(providerButton).toBeVisible();
  }
}

export default WalletConnectionPage;
