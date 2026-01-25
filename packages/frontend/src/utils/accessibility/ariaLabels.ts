/**
 * ARIA Label Utilities
 *
 * Utility functions for generating descriptive ARIA labels for UI elements.
 * Follows WCAG 2.1 guidelines for accessible naming.
 */

/**
 * Generate aria-label for a close button
 *
 * @param context - The context or thing being closed (e.g., "modal", "dialog", "menu")
 * @returns Descriptive aria-label
 *
 * @example
 * getCloseButtonLabel("modal") // "Close modal"
 * getCloseButtonLabel("Settings dialog") // "Close Settings dialog"
 */
export function getCloseButtonLabel(context: string = 'dialog'): string {
  return `Close ${context}`;
}

/**
 * Generate aria-label for navigation buttons
 *
 * @param destination - Where the button navigates to
 * @returns Descriptive aria-label
 *
 * @example
 * getNavigationLabel("Home") // "Navigate to Home"
 * getNavigationLabel("Leaderboard page") // "Navigate to Leaderboard page"
 */
export function getNavigationLabel(destination: string): string {
  return `Navigate to ${destination}`;
}

/**
 * Generate aria-label for action buttons
 *
 * @param action - The action being performed
 * @param target - Optional target of the action
 * @returns Descriptive aria-label
 *
 * @example
 * getActionButtonLabel("Submit") // "Submit"
 * getActionButtonLabel("Delete", "account") // "Delete account"
 * getActionButtonLabel("Play", "Snake game") // "Play Snake game"
 */
export function getActionButtonLabel(action: string, target?: string): string {
  return target ? `${action} ${target}` : action;
}

/**
 * Generate aria-label for toggle buttons
 *
 * @param feature - The feature being toggled
 * @param state - Current state (true = on, false = off)
 * @returns Descriptive aria-label
 *
 * @example
 * getToggleButtonLabel("sound effects", true) // "Disable sound effects"
 * getToggleButtonLabel("dark mode", false) // "Enable dark mode"
 */
export function getToggleButtonLabel(feature: string, state: boolean): string {
  const action = state ? 'Disable' : 'Enable';
  return `${action} ${feature}`;
}

/**
 * Generate aria-label for icon-only buttons
 *
 * @param iconName - The icon being displayed
 * @param action - Optional action the button performs
 * @returns Descriptive aria-label
 *
 * @example
 * getIconButtonLabel("Menu") // "Menu"
 * getIconButtonLabel("Settings", "Open settings") // "Open settings"
 */
export function getIconButtonLabel(iconName: string, action?: string): string {
  return action || iconName;
}

/**
 * Generate aria-label for social share buttons
 *
 * @param platform - The social platform
 * @param content - Optional content being shared
 * @returns Descriptive aria-label
 *
 * @example
 * getShareButtonLabel("Twitter") // "Share on Twitter"
 * getShareButtonLabel("Facebook", "high score") // "Share high score on Facebook"
 */
export function getShareButtonLabel(platform: string, content?: string): string {
  const what = content ? `${content} ` : '';
  return `Share ${what}on ${platform}`;
}

/**
 * Generate aria-label for game control buttons
 *
 * @param control - The game control action
 * @returns Descriptive aria-label
 *
 * @example
 * getGameControlLabel("pause") // "Pause game"
 * getGameControlLabel("restart") // "Restart game"
 * getGameControlLabel("play again") // "Play again"
 */
export function getGameControlLabel(control: string): string {
  // Special case for "play again" vs "play"
  if (control.toLowerCase() === 'play again') {
    return 'Play again';
  }
  if (control.toLowerCase().includes('game')) {
    return control;
  }
  return `${control} game`;
}

/**
 * Generate aria-label for input fields
 *
 * @param fieldName - The field name or purpose
 * @param isRequired - Whether the field is required
 * @param helperText - Optional helper text
 * @returns Descriptive aria-label
 *
 * @example
 * getInputLabel("Email") // "Email"
 * getInputLabel("Email", true) // "Email (required)"
 * getInputLabel("Email", true, "Enter your email address") // "Email (required). Enter your email address"
 */
export function getInputLabel(
  fieldName: string,
  isRequired: boolean = false,
  helperText?: string
): string {
  let label = fieldName;
  if (isRequired) {
    label += ' (required)';
  }
  if (helperText) {
    label += `. ${helperText}`;
  }
  return label;
}

/**
 * Generate aria-label for wallet address display
 *
 * @param address - The wallet address
 * @param isConnected - Whether the wallet is connected
 * @returns Descriptive aria-label
 *
 * @example
 * getWalletLabel("0x1234...5678", true) // "Connected wallet: 0x1234...5678"
 * getWalletLabel(undefined, false) // "Wallet not connected"
 */
export function getWalletLabel(address?: string, isConnected: boolean = false): string {
  if (!isConnected || !address) {
    return 'Wallet not connected';
  }
  return `Connected wallet: ${address}`;
}

/**
 * Generate aria-label for score display
 *
 * @param score - Current score value
 * @param prefix - Optional prefix text
 * @returns Descriptive aria-label
 *
 * @example
 * getScoreLabel(1250) // "Score: 1,250"
 * getScoreLabel(1250, "Current") // "Current Score: 1,250"
 */
export function getScoreLabel(score: number, prefix: string = ''): string {
  const formattedScore = score.toLocaleString();
  const prefixText = prefix ? `${prefix} ` : '';
  return `${prefixText}Score: ${formattedScore}`;
}

/**
 * Generate aria-label for loading states
 *
 * @param action - The action being loaded
 * @returns Descriptive aria-label
 *
 * @example
 * getLoadingLabel("Connecting") // "Connecting, please wait"
 * getLoadingLabel("Submitting score") // "Submitting score, please wait"
 */
export function getLoadingLabel(action: string): string {
  return `${action}, please wait`;
}

/**
 * Generate aria-label for error states
 *
 * @param errorType - The type of error
 * @param message - Optional error message
 * @returns Descriptive aria-label
 *
 * @example
 * getErrorLabel("Connection failed") // "Error: Connection failed"
 * getErrorLabel("Network", "Unable to connect") // "Network Error: Unable to connect"
 */
export function getErrorLabel(errorType: string, message?: string): string {
  const prefix = message ? `${errorType} Error` : 'Error';
  const text = message ? `: ${message}` : `: ${errorType}`;
  return `${prefix}${text}`;
}

/**
 * Generate aria-label for rank/leaderboard position
 *
 * @param rank - The rank position
 * @param total - Optional total number of entries
 * @returns Descriptive aria-label
 *
 * @example
 * getRankLabel(1) // "Rank 1st"
 * getRankLabel(2, 100) // "Rank 2nd out of 100"
 * getRankLabel(42, 1000) // "Rank 42nd out of 1,000"
 */
export function getRankLabel(rank: number, total?: number): string {
  const ordinal = getOrdinalSuffix(rank);
  const rankText = `Rank ${rank}${ordinal}`;
  if (total) {
    const formattedTotal = total.toLocaleString();
    return `${rankText} out of ${formattedTotal}`;
  }
  return rankText;
}

/**
 * Get ordinal suffix for a number (st, nd, rd, th)
 *
 * @param n - The number
 * @returns Ordinal suffix
 *
 * @example
 * getOrdinalSuffix(1) // "st"
 * getOrdinalSuffix(2) // "nd"
 * getOrdinalSuffix(3) // "rd"
 * getOrdinalSuffix(4) // "th"
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Generate aria-label for network/chain display
 *
 * @param networkName - The network name
 * @param isCorrect - Whether it's the correct network
 * @returns Descriptive aria-label
 *
 * @example
 * getNetworkLabel("Cronos Testnet", true) // "Connected to Cronos Testnet"
 * getNetworkLabel("Ethereum", false) // "Wrong network: Ethereum. Please switch networks."
 */
export function getNetworkLabel(networkName: string, isCorrect: boolean = true): string {
  if (isCorrect) {
    return `Connected to ${networkName}`;
  }
  return `Wrong network: ${networkName}. Please switch networks.`;
}

/**
 * Generate aria-label for transaction links
 *
 * @param txHash - Optional transaction hash
 * @returns Descriptive aria-label
 *
 * @example
 * getTransactionLabel("0xabc...123") // "View transaction 0xabc...123 on block explorer"
 * getTransactionLabel() // "View transaction on block explorer"
 */
export function getTransactionLabel(txHash?: string): string {
  const hashPart = txHash ? ` ${txHash}` : '';
  return `View transaction${hashPart} on block explorer`;
}
