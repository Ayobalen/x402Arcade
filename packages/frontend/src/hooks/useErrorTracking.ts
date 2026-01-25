/**
 * Error Tracking Hook
 *
 * React hook for integrating error tracking in components.
 * Combines local error logging with Sentry reporting.
 *
 * @module hooks/useErrorTracking
 */

import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getErrorLogger, type ErrorLogEntry } from '../utils/errorLogger';
import { getSentry, type BreadcrumbType, type SentryTags, type SentryUser } from '../utils/sentry';
import type { ErrorSeverity } from '../types/errors';

// ============================================================================
// Types
// ============================================================================

/**
 * Error tracking options
 */
export interface ErrorTrackingOptions {
  /** Component or feature name for context */
  component?: string;
  /** Game name if in game context */
  game?: string;
  /** Session ID if in active session */
  sessionId?: string;
}

/**
 * Error tracking methods
 */
export interface ErrorTrackingMethods {
  /** Log an error */
  logError: (error: unknown, context?: Record<string, unknown>) => void;
  /** Log a message */
  logMessage: (message: string, level?: ErrorSeverity, context?: Record<string, unknown>) => void;
  /** Add a breadcrumb */
  addBreadcrumb: (type: BreadcrumbType, message: string, data?: Record<string, unknown>) => void;
  /** Track a click action */
  trackClick: (element: string, action?: string) => void;
  /** Track an API call */
  trackApiCall: (method: string, url: string, status?: number, duration?: number) => void;
  /** Track a game event */
  trackGameEvent: (event: string, data?: Record<string, unknown>) => void;
  /** Track a wallet action */
  trackWalletAction: (action: string, address?: string, success?: boolean) => void;
  /** Track a payment */
  trackPayment: (action: string, amount?: string, success?: boolean, txHash?: string) => void;
  /** Set user context */
  setUser: (user: SentryUser | null) => void;
  /** Set additional tags */
  setTags: (tags: Partial<SentryTags>) => void;
  /** Get recent log entries */
  getRecentLogs: (count?: number) => ErrorLogEntry[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for error tracking and breadcrumb management
 *
 * Provides a unified interface for error logging and Sentry integration.
 * Automatically tracks route changes and adds component context to errors.
 *
 * @param options - Configuration options
 * @returns Error tracking methods
 *
 * @example
 * ```tsx
 * function PayToPlay({ game }: { game: string }) {
 *   const { logError, trackClick, trackPayment } = useErrorTracking({
 *     component: 'PayToPlay',
 *     game,
 *   })
 *
 *   const handlePlay = async () => {
 *     trackClick('play-button', 'start-payment')
 *     try {
 *       await initiatePayment()
 *       trackPayment('initiated', '0.01')
 *     } catch (error) {
 *       logError(error, { game })
 *     }
 *   }
 *
 *   return <button onClick={handlePlay}>Play</button>
 * }
 * ```
 */
export function useErrorTracking(options: ErrorTrackingOptions = {}): ErrorTrackingMethods {
  const { component, game, sessionId } = options;
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);
  const errorLogger = getErrorLogger();
  const sentry = getSentry();

  // Track route changes
  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;

    if (prevPath !== currentPath) {
      sentry.addNavigationBreadcrumb(prevPath, currentPath);
      sentry.setTags({ route: currentPath });
      prevPathRef.current = currentPath;
    }
  }, [location.pathname, sentry]);

  // Set component-specific tags
  useEffect(() => {
    const tags: Partial<SentryTags> = {};
    if (game) tags.game = game;
    if (sessionId) tags.sessionId = sessionId;

    if (Object.keys(tags).length > 0) {
      sentry.setTags(tags);
    }
  }, [game, sessionId, sentry]);

  // Log error with component context
  const logError = useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      const enrichedContext = {
        component,
        game,
        sessionId,
        ...context,
      };

      // Log locally
      errorLogger.logError(error, 'manual', enrichedContext);

      // Send to Sentry
      sentry.captureError(error, enrichedContext);
    },
    [component, game, sessionId, errorLogger, sentry]
  );

  // Log a message
  const logMessage = useCallback(
    (message: string, level: ErrorSeverity = 'info', context?: Record<string, unknown>) => {
      sentry.captureMessage(message, level, {
        component,
        game,
        sessionId,
        ...context,
      });
    },
    [component, game, sessionId, sentry]
  );

  // Add breadcrumb
  const addBreadcrumb = useCallback(
    (type: BreadcrumbType, message: string, data?: Record<string, unknown>) => {
      sentry.addBreadcrumb(type, message, {
        component,
        ...data,
      });
    },
    [component, sentry]
  );

  // Track click
  const trackClick = useCallback(
    (element: string, action?: string) => {
      sentry.addClickBreadcrumb(component ? `${component}:${element}` : element, action);
    },
    [component, sentry]
  );

  // Track API call
  const trackApiCall = useCallback(
    (method: string, url: string, status?: number, duration?: number) => {
      sentry.addApiBreadcrumb(method, url, status, duration);
    },
    [sentry]
  );

  // Track game event
  const trackGameEvent = useCallback(
    (event: string, data?: Record<string, unknown>) => {
      const gameName = game || 'unknown';
      sentry.addGameBreadcrumb(event, gameName, {
        sessionId,
        ...data,
      });
    },
    [game, sessionId, sentry]
  );

  // Track wallet action
  const trackWalletAction = useCallback(
    (action: string, address?: string, success: boolean = true) => {
      sentry.addWalletBreadcrumb(action, address, success);
    },
    [sentry]
  );

  // Track payment
  const trackPayment = useCallback(
    (action: string, amount?: string, success: boolean = true, txHash?: string) => {
      sentry.addPaymentBreadcrumb(action, amount, success, txHash);
    },
    [sentry]
  );

  // Set user
  const setUser = useCallback(
    (user: SentryUser | null) => {
      sentry.setUser(user);
      if (user) {
        errorLogger.setUserContext({
          walletAddress: user.id,
          isConnected: true,
        });
      } else {
        errorLogger.clearUserContext();
      }
    },
    [sentry, errorLogger]
  );

  // Set tags
  const setTags = useCallback(
    (tags: Partial<SentryTags>) => {
      sentry.setTags(tags);
    },
    [sentry]
  );

  // Get recent logs
  const getRecentLogs = useCallback(
    (count?: number) => {
      return errorLogger.getRecentEntries(count);
    },
    [errorLogger]
  );

  return {
    logError,
    logMessage,
    addBreadcrumb,
    trackClick,
    trackApiCall,
    trackGameEvent,
    trackWalletAction,
    trackPayment,
    setUser,
    setTags,
    getRecentLogs,
  };
}

// ============================================================================
// Simplified Hooks
// ============================================================================

/**
 * Hook for game error tracking
 *
 * Preconfigured for game context with game-specific methods.
 *
 * @param game - Game name
 * @param sessionId - Optional session ID
 * @returns Error tracking methods
 *
 * @example
 * ```tsx
 * function SnakeGame() {
 *   const { trackGameEvent, logError } = useGameErrorTracking('snake', sessionId)
 *
 *   useEffect(() => {
 *     trackGameEvent('game-started')
 *   }, [])
 *
 *   return <Canvas />
 * }
 * ```
 */
export function useGameErrorTracking(game: string, sessionId?: string): ErrorTrackingMethods {
  return useErrorTracking({ game, sessionId, component: `Game:${game}` });
}

/**
 * Hook for wallet error tracking
 *
 * Preconfigured for wallet interactions.
 *
 * @returns Error tracking methods
 *
 * @example
 * ```tsx
 * function ConnectButton() {
 *   const { trackWalletAction, logError } = useWalletErrorTracking()
 *
 *   const connect = async () => {
 *     try {
 *       trackWalletAction('connecting')
 *       await connectWallet()
 *       trackWalletAction('connected', address, true)
 *     } catch (e) {
 *       trackWalletAction('connection-failed', undefined, false)
 *       logError(e)
 *     }
 *   }
 *
 *   return <button onClick={connect}>Connect</button>
 * }
 * ```
 */
export function useWalletErrorTracking(): ErrorTrackingMethods {
  return useErrorTracking({ component: 'Wallet' });
}

/**
 * Hook for payment error tracking
 *
 * Preconfigured for x402 payment flow.
 *
 * @param game - Optional game context
 * @returns Error tracking methods
 *
 * @example
 * ```tsx
 * function PayToPlay({ game }: { game: string }) {
 *   const { trackPayment, logError } = usePaymentErrorTracking(game)
 *
 *   const pay = async () => {
 *     try {
 *       trackPayment('signing')
 *       await signPayment()
 *       trackPayment('settling')
 *       const result = await settlePayment()
 *       trackPayment('completed', '0.01', true, result.txHash)
 *     } catch (e) {
 *       trackPayment('failed', '0.01', false)
 *       logError(e)
 *     }
 *   }
 *
 *   return <button onClick={pay}>Pay to Play</button>
 * }
 * ```
 */
export function usePaymentErrorTracking(game?: string): ErrorTrackingMethods {
  return useErrorTracking({ component: 'Payment', game });
}

// ============================================================================
// User Context Hook
// ============================================================================

/**
 * Hook for managing error tracking user context
 *
 * Syncs wallet connection state with error tracking.
 *
 * @param walletAddress - Connected wallet address or null
 * @param isConnected - Whether wallet is connected
 *
 * @example
 * ```tsx
 * function App() {
 *   const { address, isConnected } = useWallet()
 *   useErrorTrackingUser(address, isConnected)
 *
 *   return <Router>...</Router>
 * }
 * ```
 */
export function useErrorTrackingUser(
  walletAddress: string | undefined,
  isConnected: boolean
): void {
  const sentry = getSentry();
  const errorLogger = getErrorLogger();

  useEffect(() => {
    if (isConnected && walletAddress) {
      sentry.setUser({ id: walletAddress });
      errorLogger.setUserContext({
        walletAddress,
        isConnected: true,
      });
      sentry.setTags({ walletConnected: 'true' });
    } else {
      sentry.setUser(null);
      errorLogger.clearUserContext();
      sentry.setTags({ walletConnected: 'false' });
    }
  }, [walletAddress, isConnected, sentry, errorLogger]);
}

// ============================================================================
// Initialization Hook
// ============================================================================

/**
 * Initialize error tracking system
 *
 * Should be called once at app startup.
 *
 * @example
 * ```tsx
 * function App() {
 *   useInitializeErrorTracking()
 *   return <Router>...</Router>
 * }
 * ```
 */
export function useInitializeErrorTracking(): void {
  useEffect(() => {
    const errorLogger = getErrorLogger();
    const sentry = getSentry();

    // Initialize both systems
    errorLogger.initialize();
    sentry.initialize();

    // Cleanup on unmount
    return () => {
      errorLogger.shutdown();
    };
  }, []);
}
