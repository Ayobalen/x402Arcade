/**
 * ARIA Description Utilities
 *
 * Provides aria-describedby content for complex components to enhance
 * screen reader accessibility. Links components to their descriptions
 * following WCAG 2.1 SC 1.3.1 Info and Relationships.
 *
 * @example
 * // In a component:
 * const { descriptionId, description } = getWalletConnectionDescription('connecting');
 *
 * <button aria-describedby={descriptionId}>
 *   Connect Wallet
 * </button>
 * <span id={descriptionId} className="sr-only">{description}</span>
 */

/**
 * Description content for each identifier
 */
export interface AriaDescription {
  /** The unique ID for the description element */
  descriptionId: string;
  /** The description text content */
  description: string;
}

// ============================================================
// WALLET CONNECTION DESCRIPTIONS
// ============================================================

/**
 * Wallet connection states for descriptions
 */
export type WalletConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrong_network'
  | 'switching'
  | 'error'
  | 'no_wallet';

/**
 * Get description for wallet connection button based on current state
 *
 * @param state - Current wallet connection state
 * @param networkName - Optional network name for context
 * @returns AriaDescription with id and description text
 *
 * @example
 * const { descriptionId, description } = getWalletConnectionDescription('disconnected');
 * // descriptionId: "wallet-description-disconnected"
 * // description: "Click to connect your Web3 wallet..."
 */
export function getWalletConnectionDescription(
  state: WalletConnectionState,
  networkName?: string
): AriaDescription {
  const baseId = 'wallet-description';

  const descriptions: Record<WalletConnectionState, string> = {
    disconnected:
      'Click to connect your Web3 wallet. This will open a wallet selection dialog. ' +
      'Your wallet will ask you to approve the connection. ' +
      'No funds will be transferred during connection.',
    connecting:
      'Wallet connection in progress. Please check your wallet extension for a connection request. ' +
      'You may need to approve the connection in your wallet.',
    connected:
      'Wallet successfully connected. Click to view account options including disconnect. ' +
      'Your wallet address is displayed for verification.',
    wrong_network: networkName
      ? `Your wallet is connected to ${networkName}, but this application requires a different network. ` +
        'Click to switch to the correct network. Your wallet will ask you to approve the network change.'
      : 'Your wallet is connected to an unsupported network. ' +
        'Click to switch to the required network. Your wallet will ask you to approve the network change.',
    switching:
      'Network switch in progress. Please check your wallet extension to approve the network change. ' +
      'This may take a few seconds.',
    error:
      'A connection error occurred. Click to retry connecting your wallet. ' +
      'If the problem persists, try refreshing the page or checking your wallet extension.',
    no_wallet:
      'No Web3 wallet detected. Click to install MetaMask, a popular wallet extension. ' +
      'After installation, refresh this page and try again.',
  };

  return {
    descriptionId: `${baseId}-${state}`,
    description: descriptions[state],
  };
}

// ============================================================
// GAME SESSION DESCRIPTIONS
// ============================================================

/**
 * Game session states for descriptions
 */
export type GameSessionState =
  | 'ready'
  | 'paying'
  | 'payment_pending'
  | 'playing'
  | 'paused'
  | 'game_over'
  | 'submitting_score';

/**
 * Get description for game session based on current state
 *
 * @param state - Current game session state
 * @param gameName - Name of the game
 * @param cost - Optional cost in USDC
 * @returns AriaDescription with id and description text
 *
 * @example
 * const { descriptionId, description } = getGameSessionDescription('ready', 'Snake', 0.01);
 */
export function getGameSessionDescription(
  state: GameSessionState,
  gameName: string,
  cost?: number
): AriaDescription {
  const baseId = `game-description-${gameName.toLowerCase().replace(/\s+/g, '-')}`;
  const costText = cost !== undefined ? `$${cost.toFixed(2)} USDC` : 'a small USDC fee';

  const descriptions: Record<GameSessionState, string> = {
    ready:
      `${gameName} is ready to play. Click the Play button to start a new game session. ` +
      `Payment of ${costText} is required. You will be asked to sign a transaction in your wallet.`,
    paying:
      `Processing payment for ${gameName}. Please sign the transaction in your wallet. ` +
      'This authorizes the payment but does not require gas fees from you.',
    payment_pending:
      'Payment is being processed on the blockchain. This usually takes a few seconds. ' +
      'The game will start automatically once payment is confirmed.',
    playing:
      `${gameName} is now active. Use the keyboard to control the game. ` +
      'Press Escape or P to pause. Your score is displayed at the top of the screen.',
    paused:
      `${gameName} is paused. Press Escape, P, or click Resume to continue playing. ` +
      'Your current score is preserved.',
    game_over:
      `${gameName} has ended. Your final score is displayed. ` +
      'Click Play Again to start a new session, or view your ranking on the leaderboard.',
    submitting_score:
      'Your score is being submitted to the leaderboard. ' +
      'This may take a moment. Your rank will be displayed once confirmed.',
  };

  return {
    descriptionId: `${baseId}-${state}`,
    description: descriptions[state],
  };
}

// ============================================================
// PAYMENT FLOW DESCRIPTIONS
// ============================================================

/**
 * Payment flow states
 */
export type PaymentFlowState =
  | 'idle'
  | 'initiating'
  | 'signing'
  | 'processing'
  | 'success'
  | 'failed';

/**
 * Get description for payment flow components
 *
 * @param state - Current payment flow state
 * @param amount - Payment amount in USDC
 * @returns AriaDescription with id and description text
 */
export function getPaymentFlowDescription(
  state: PaymentFlowState,
  amount?: number
): AriaDescription {
  const baseId = 'payment-description';
  const amountText = amount !== undefined ? `$${amount.toFixed(2)} USDC` : 'the required amount';

  const descriptions: Record<PaymentFlowState, string> = {
    idle:
      `This action requires a payment of ${amountText}. ` +
      'The x402 protocol enables gasless micropayments. ' +
      'You only pay the game fee, not blockchain gas costs.',
    initiating:
      'Payment is being initialized. Please wait while we prepare the transaction details. ' +
      'Your wallet will prompt you to sign shortly.',
    signing:
      'Please sign the payment authorization in your wallet. ' +
      'This is a signature, not a transaction, so it requires no gas fees. ' +
      'Review the amount before signing.',
    processing:
      'Payment is being processed. The x402 facilitator is settling the transaction on-chain. ' +
      'This typically takes 2-5 seconds.',
    success:
      `Payment of ${amountText} completed successfully. ` +
      'Your transaction has been confirmed on the blockchain. ' +
      'You can view the transaction details on the block explorer.',
    failed:
      'Payment failed. This could be due to insufficient balance, rejected signature, or network issues. ' +
      'Please check your wallet balance and try again.',
  };

  return {
    descriptionId: `${baseId}-${state}`,
    description: descriptions[state],
  };
}

// ============================================================
// LEADERBOARD DESCRIPTIONS
// ============================================================

/**
 * Leaderboard view types
 */
export type LeaderboardView = 'daily' | 'weekly' | 'alltime';

/**
 * Get description for leaderboard components
 *
 * @param view - Current leaderboard view (daily, weekly, alltime)
 * @param gameName - Name of the game
 * @param playerRank - Optional player's current rank
 * @returns AriaDescription with id and description text
 */
export function getLeaderboardDescription(
  view: LeaderboardView,
  gameName: string,
  playerRank?: number
): AriaDescription {
  const baseId = `leaderboard-description-${gameName.toLowerCase().replace(/\s+/g, '-')}`;

  const viewDescriptions: Record<LeaderboardView, string> = {
    daily:
      "Showing today's top scores. The leaderboard resets daily at midnight UTC. " +
      'The highest scorer wins 70% of the daily prize pool.',
    weekly:
      "Showing this week's top scores. The leaderboard resets every Monday at midnight UTC. " +
      'Compete for the weekly championship.',
    alltime:
      "Showing all-time top scores. These are the best performances in the game's history. " +
      'Aim for eternal glory on the all-time leaderboard.',
  };

  let description = `${gameName} leaderboard. ${viewDescriptions[view]}`;

  if (playerRank !== undefined) {
    description +=
      playerRank <= 10
        ? ` Congratulations! You are currently ranked ${getOrdinal(playerRank)}.`
        : ` Your current rank is ${getOrdinal(playerRank)}.`;
  }

  description += ' Use the tabs to switch between daily, weekly, and all-time views.';

  return {
    descriptionId: `${baseId}-${view}`,
    description,
  };
}

// ============================================================
// PRIZE POOL DESCRIPTIONS
// ============================================================

/**
 * Get description for prize pool display
 *
 * @param totalAmount - Total prize pool amount in USDC
 * @param timeRemaining - Time remaining until distribution (e.g., "4 hours")
 * @returns AriaDescription with id and description text
 */
export function getPrizePoolDescription(
  totalAmount: number,
  timeRemaining?: string
): AriaDescription {
  let description =
    `Current prize pool is $${totalAmount.toFixed(2)} USDC. ` +
    '70% of all game payments go directly into the prize pool. ';

  if (timeRemaining) {
    description += `The prize pool will be distributed to the top scorer in ${timeRemaining}. `;
  }

  description +=
    'Play more games to grow the pool and climb the leaderboard for your chance to win.';

  return {
    descriptionId: 'prize-pool-description',
    description,
  };
}

// ============================================================
// SETTINGS DESCRIPTIONS
// ============================================================

/**
 * Get description for effects settings toggle
 *
 * @param effectName - Name of the effect
 * @param isEnabled - Whether the effect is currently enabled
 * @returns AriaDescription with id and description text
 */
export function getEffectsSettingDescription(
  effectName: string,
  isEnabled: boolean
): AriaDescription {
  const effectDescriptions: Record<string, { enabled: string; disabled: string }> = {
    particles: {
      enabled:
        'Particle effects are on. Animated particles appear during gameplay for visual feedback. ' +
        'Disable to improve performance on slower devices.',
      disabled:
        'Particle effects are off. Enable for enhanced visual feedback during gameplay. ' +
        'May impact performance on slower devices.',
    },
    scanlines: {
      enabled:
        'CRT scanlines effect is on, adding a retro arcade monitor look. ' +
        'Disable for a cleaner display.',
      disabled: 'CRT scanlines effect is off. Enable for an authentic retro arcade appearance.',
    },
    glow: {
      enabled:
        'Neon glow effects are on, enhancing the arcade aesthetic. ' +
        'Disable to reduce visual intensity.',
      disabled: 'Neon glow effects are off. Enable for vibrant neon-style visuals.',
    },
    animations: {
      enabled:
        'UI animations are on. Smooth transitions enhance the user experience. ' +
        'Disable if you prefer instant state changes or experience motion sensitivity.',
      disabled:
        'UI animations are off. Enable for smooth, animated transitions. ' +
        'Keep disabled if you experience motion sensitivity.',
    },
    sound: {
      enabled:
        'Sound effects are on. Game sounds provide audio feedback for actions. ' +
        'Disable for silent gameplay.',
      disabled: 'Sound effects are off. Enable for audio feedback during gameplay.',
    },
    music: {
      enabled:
        'Background music is on. Atmospheric music plays during gameplay. ' +
        'Disable for silent gameplay or to use your own music.',
      disabled: 'Background music is off. Enable for an immersive audio experience.',
    },
  };

  const key = effectName.toLowerCase();
  const descriptions = effectDescriptions[key];

  if (!descriptions) {
    return {
      descriptionId: `effect-description-${key}`,
      description: isEnabled
        ? `${effectName} is currently enabled. Toggle to disable.`
        : `${effectName} is currently disabled. Toggle to enable.`,
    };
  }

  return {
    descriptionId: `effect-description-${key}`,
    description: isEnabled ? descriptions.enabled : descriptions.disabled,
  };
}

// ============================================================
// FORM INPUT DESCRIPTIONS
// ============================================================

/**
 * Get description for form input fields
 *
 * @param fieldName - Name of the field
 * @param constraints - Optional validation constraints
 * @returns AriaDescription with id and description text
 */
export function getInputDescription(
  fieldName: string,
  constraints?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
  }
): AriaDescription {
  const fieldId = fieldName.toLowerCase().replace(/\s+/g, '-');
  let description = '';

  if (constraints?.required) {
    description += 'This field is required. ';
  }

  if (constraints?.minLength !== undefined && constraints?.maxLength !== undefined) {
    description += `Enter between ${constraints.minLength} and ${constraints.maxLength} characters. `;
  } else if (constraints?.minLength !== undefined) {
    description += `Enter at least ${constraints.minLength} characters. `;
  } else if (constraints?.maxLength !== undefined) {
    description += `Maximum ${constraints.maxLength} characters allowed. `;
  }

  if (constraints?.pattern) {
    // Add pattern-specific hints based on common patterns
    if (constraints.pattern.includes('@')) {
      description += 'Enter a valid email address. ';
    } else if (constraints.pattern.includes('0x')) {
      description += 'Enter a valid Ethereum address starting with 0x. ';
    }
  }

  return {
    descriptionId: `input-description-${fieldId}`,
    description: description.trim() || `Enter your ${fieldName}.`,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 *
 * @param n - The number
 * @returns Number with ordinal suffix
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Generate a unique description ID
 *
 * @param prefix - Prefix for the ID
 * @param suffix - Optional suffix
 * @returns Unique ID string
 */
export function generateDescriptionId(prefix: string, suffix?: string): string {
  const sanitizedPrefix = prefix.toLowerCase().replace(/\s+/g, '-');
  if (suffix) {
    const sanitizedSuffix = suffix.toLowerCase().replace(/\s+/g, '-');
    return `${sanitizedPrefix}-description-${sanitizedSuffix}`;
  }
  return `${sanitizedPrefix}-description`;
}

// ============================================================
// DESCRIPTION RENDERER COMPONENT HELPER
// ============================================================

/**
 * Create props for a hidden description element
 * Use with a span element that has className="sr-only"
 *
 * @param id - The description ID
 * @param description - The description text
 * @returns Object with id and children props
 *
 * @example
 * const descriptionProps = createDescriptionProps(descriptionId, description);
 * <span className="sr-only" {...descriptionProps} />
 */
export function createDescriptionProps(id: string, description: string) {
  return {
    id,
    children: description,
  };
}
