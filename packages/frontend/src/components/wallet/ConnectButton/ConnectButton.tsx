/**
 * ConnectButton Component
 *
 * A wallet connect button component that handles the full connection flow
 * and displays connection status. Uses the WalletStore for state management.
 *
 * Features:
 * - Automatic chain switching when connecting to wrong network
 * - MetaMask detection with fallback to install page
 * - Visual feedback for all connection states
 *
 * @example
 * // Basic usage
 * <ConnectButton />
 *
 * // Custom labels
 * <ConnectButton
 *   connectLabel="Sign In"
 *   showNetwork={false}
 * />
 *
 * // With callbacks
 * <ConnectButton
 *   onConnectSuccess={(address) => console.log('Connected:', address)}
 *   onConnectError={(error) => console.error('Failed:', error)}
 * />
 *
 * // Disable automatic chain switching
 * <ConnectButton autoSwitchChain={false} />
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWalletStore, selectFormattedAddress, REQUIRED_CHAIN_ID } from '@/stores/walletStore';
import { Button } from '@/components/ui/Button';
import type {
  ConnectButtonProps,
  ConnectButtonVariant,
  ConnectionState,
  NetworkInfo,
} from './ConnectButton.types';

/**
 * MetaMask download URL
 */
const METAMASK_DOWNLOAD_URL = 'https://metamask.io/download/';

/**
 * Wallet detection info
 */
interface WalletInfo {
  hasWallet: boolean;
  isMetaMask: boolean;
  isCoinbaseWallet: boolean;
  walletName: string;
}

/**
 * Detect available wallets in window.ethereum
 */
function detectWallet(): WalletInfo {
  if (typeof window === 'undefined' || !window.ethereum) {
    return {
      hasWallet: false,
      isMetaMask: false,
      isCoinbaseWallet: false,
      walletName: '',
    };
  }

  const ethereum = window.ethereum as {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    providers?: Array<{ isMetaMask?: boolean; isCoinbaseWallet?: boolean }>;
  };

  // Handle multiple wallets (EIP-6963 or legacy providers array)
  const isMetaMask = !!ethereum.isMetaMask;
  const isCoinbaseWallet = !!ethereum.isCoinbaseWallet;

  // Determine wallet name for display
  let walletName = 'Wallet';
  if (isMetaMask) walletName = 'MetaMask';
  else if (isCoinbaseWallet) walletName = 'Coinbase Wallet';

  // Check for multiple providers (some wallets inject multiple)
  const hasMultipleProviders = Array.isArray(ethereum.providers) && ethereum.providers.length > 1;

  return {
    hasWallet: true,
    isMetaMask,
    isCoinbaseWallet,
    walletName: hasMultipleProviders ? 'Wallet' : walletName,
  };
}

// Re-export for use in component
const NETWORKS: Record<number, NetworkInfo> = {
  338: { chainId: 338, name: 'Cronos Testnet', shortName: 'Cronos', iconColor: '#00D1FF' },
  25: { chainId: 25, name: 'Cronos', shortName: 'Cronos', iconColor: '#00D1FF' },
  84532: { chainId: 84532, name: 'Base Sepolia', shortName: 'Base', iconColor: '#0052FF' },
  8453: { chainId: 8453, name: 'Base', shortName: 'Base', iconColor: '#0052FF' },
  1: { chainId: 1, name: 'Ethereum', shortName: 'ETH', iconColor: '#627EEA' },
  137: { chainId: 137, name: 'Polygon', shortName: 'MATIC', iconColor: '#8247E5' },
};

/**
 * Wallet icon component
 */
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

/**
 * Network indicator dot
 */
function NetworkIndicator({ chainId, className }: { chainId: number | null; className?: string }) {
  const network = chainId ? NETWORKS[chainId] : null;
  const isCorrectNetwork = chainId === REQUIRED_CHAIN_ID;

  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        isCorrectNetwork ? 'bg-success' : 'bg-warning',
        'animate-pulse',
        className
      )}
      style={{
        backgroundColor: network?.iconColor || (isCorrectNetwork ? '#22C55E' : '#F59E0B'),
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Chevron down icon for dropdown indicator
 */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Warning icon for wrong network state
 */
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}

/**
 * Map wallet store status to internal connection state
 */
function getConnectionState(
  isConnected: boolean,
  isConnecting: boolean,
  chainId: number | null,
  isSwitching: boolean
): ConnectionState {
  if (isSwitching) {
    return 'switching_network';
  }
  if (isConnecting) {
    return 'connecting';
  }
  if (isConnected) {
    if (chainId !== REQUIRED_CHAIN_ID) {
      return 'wrong_network';
    }
    return 'connected';
  }
  return 'disconnected';
}

/**
 * ConnectButton Component
 */
export const ConnectButton = forwardRef<HTMLButtonElement, ConnectButtonProps>(
  (
    {
      size = 'md',
      variant = 'primary',
      fullWidth = false,
      connectLabel = 'Connect Wallet',
      connectingLabel = 'Connecting...',
      wrongNetworkLabel = 'Wrong Network',
      switchingLabel = 'Switching...',
      showAddress = true,
      showNetwork = true,
      showIcon = true,
      autoSwitchChain = true,
      connectedContent,
      onConnectStart,
      onConnectSuccess,
      onConnectError,
      onDisconnect,
      onNetworkSwitch,
      onAutoSwitchStart,
      onAutoSwitchSuccess,
      onAutoSwitchError,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Local state for network switching
    const [isSwitching, setIsSwitching] = useState(false);

    // Wallet detection state
    const [walletInfo, setWalletInfo] = useState<WalletInfo>(() => detectWallet());

    // Track if we've already attempted auto-switch for this connection
    const autoSwitchAttemptedRef = useRef(false);

    // Get wallet state from store (must be before useEffects that use them)
    const address = useWalletStore((state) => state.address);
    const chainId = useWalletStore((state) => state.chainId);
    const isConnected = useWalletStore((state) => state.isConnected);
    const isConnecting = useWalletStore((state) => state.isConnecting);
    const error = useWalletStore((state) => state.error);
    const connectWallet = useWalletStore((state) => state.connectWallet);
    const disconnect = useWalletStore((state) => state.disconnect);
    const switchChain = useWalletStore((state) => state.switchChain);

    // Get formatted address
    const formattedAddress = useWalletStore(selectFormattedAddress);

    // Re-check wallet detection on mount (for SSR/hydration)
    useEffect(() => {
      setWalletInfo(detectWallet());

      // Also listen for wallet injection (some wallets inject async)
      const checkWallet = () => setWalletInfo(detectWallet());
      window.addEventListener('ethereum#initialized', checkWallet);

      return () => {
        window.removeEventListener('ethereum#initialized', checkWallet);
      };
    }, []);

    // Reset auto-switch tracking when disconnected
    useEffect(() => {
      if (!isConnected) {
        autoSwitchAttemptedRef.current = false;
      }
    }, [isConnected]);

    // Automatic chain switching when connected to wrong network
    useEffect(() => {
      // Only run if auto-switch is enabled
      if (!autoSwitchChain) return;

      // Only run if connected but on wrong network
      if (!isConnected || chainId === REQUIRED_CHAIN_ID) return;

      // Only attempt once per connection session
      if (autoSwitchAttemptedRef.current) return;

      // Don't run if already switching
      if (isSwitching) return;

      // Mark that we've attempted auto-switch
      autoSwitchAttemptedRef.current = true;

      // Trigger automatic chain switch
      const performAutoSwitch = async () => {
        setIsSwitching(true);
        onAutoSwitchStart?.();

        try {
          const success = await switchChain(REQUIRED_CHAIN_ID);
          if (success) {
            onAutoSwitchSuccess?.();
          } else {
            onAutoSwitchError?.(new Error('Chain switch was not completed'));
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Auto chain switch failed:', err);
          onAutoSwitchError?.(err instanceof Error ? err : new Error('Chain switch failed'));
        } finally {
          setIsSwitching(false);
        }
      };

      // Small delay to ensure connection UI updates first
      const timeoutId = setTimeout(performAutoSwitch, 100);
      return () => clearTimeout(timeoutId);
    }, [
      autoSwitchChain,
      isConnected,
      chainId,
      isSwitching,
      switchChain,
      onAutoSwitchStart,
      onAutoSwitchSuccess,
      onAutoSwitchError,
    ]);

    // Calculate connection state
    const connectionState = useMemo(
      () => getConnectionState(isConnected, isConnecting, chainId, isSwitching),
      [isConnected, isConnecting, chainId, isSwitching]
    );

    // Handle connect button click
    const handleConnect = useCallback(async () => {
      onConnectStart?.();

      try {
        const result = await connectWallet();
        if (result) {
          onConnectSuccess?.(result.address, result.chainId);
        }
      } catch (err) {
        onConnectError?.(err instanceof Error ? err : new Error('Connection failed'));
      }
    }, [connectWallet, onConnectStart, onConnectSuccess, onConnectError]);

    // Handle disconnect
    const handleDisconnect = useCallback(() => {
      disconnect();
      onDisconnect?.();
    }, [disconnect, onDisconnect]);

    // Handle network switch
    const handleSwitchNetwork = useCallback(async () => {
      setIsSwitching(true);
      onNetworkSwitch?.();

      try {
        await switchChain(REQUIRED_CHAIN_ID);
      } catch (err) {
        // Error already handled in store
        // eslint-disable-next-line no-console
        console.error('Network switch failed:', err);
      } finally {
        setIsSwitching(false);
      }
    }, [switchChain, onNetworkSwitch]);

    // Handle click based on state
    const handleClick = useCallback(async () => {
      // If no wallet installed, redirect to MetaMask download
      if (!walletInfo.hasWallet) {
        window.open(METAMASK_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
        return;
      }

      switch (connectionState) {
        case 'disconnected':
        case 'error':
          await handleConnect();
          break;
        case 'wrong_network':
          await handleSwitchNetwork();
          break;
        case 'connected':
          handleDisconnect();
          break;
        default:
          // Do nothing during connecting/switching states
          break;
      }
    }, [
      walletInfo.hasWallet,
      connectionState,
      handleConnect,
      handleSwitchNetwork,
      handleDisconnect,
    ]);

    // Get button content based on state
    const buttonContent = useMemo(() => {
      // No wallet installed - show install prompt
      if (!walletInfo.hasWallet) {
        return (
          <>
            {showIcon && <WalletIcon className="h-4 w-4" />}
            <span>Install MetaMask</span>
          </>
        );
      }

      switch (connectionState) {
        case 'disconnected':
        case 'error':
          return (
            <>
              {showIcon && <WalletIcon className="h-4 w-4" />}
              <span>{connectLabel}</span>
            </>
          );

        case 'connecting':
          return (
            <>
              {showIcon && <WalletIcon className="h-4 w-4 animate-pulse" />}
              <span>{connectingLabel}</span>
            </>
          );

        case 'wrong_network':
          return (
            <>
              <WarningIcon className="h-4 w-4 text-warning" />
              <span>{wrongNetworkLabel}</span>
            </>
          );

        case 'switching_network':
          return (
            <>
              {showIcon && <WalletIcon className="h-4 w-4 animate-spin" />}
              <span>{switchingLabel}</span>
            </>
          );

        case 'connected':
          // Use custom renderer if provided
          if (connectedContent && address && chainId) {
            return connectedContent(address, chainId);
          }

          return (
            <>
              {showNetwork && <NetworkIndicator chainId={chainId} />}
              {showAddress && formattedAddress && (
                <span className="font-mono text-sm">{formattedAddress}</span>
              )}
              <ChevronDownIcon className="h-3 w-3 opacity-60" />
            </>
          );

        default:
          return <span>{connectLabel}</span>;
      }
    }, [
      walletInfo.hasWallet,
      connectionState,
      showIcon,
      showNetwork,
      showAddress,
      connectLabel,
      connectingLabel,
      wrongNetworkLabel,
      switchingLabel,
      connectedContent,
      address,
      chainId,
      formattedAddress,
    ]);

    // Determine if button should be disabled
    const isDisabled =
      disabled || connectionState === 'connecting' || connectionState === 'switching_network';

    // Determine button variant based on state
    const buttonVariant = useMemo((): ConnectButtonVariant => {
      if (connectionState === 'wrong_network') {
        return 'outline'; // Warning state - use outline to stand out
      }
      if (connectionState === 'connected') {
        return 'ghost'; // Connected - subtle appearance
      }
      return variant;
    }, [connectionState, variant]);

    // Get aria label based on state
    const ariaLabel = useMemo(() => {
      // No wallet installed
      if (!walletInfo.hasWallet) {
        return 'No wallet detected. Click to install MetaMask.';
      }

      switch (connectionState) {
        case 'disconnected':
          return 'Connect your wallet';
        case 'connecting':
          return 'Connecting to wallet';
        case 'connected':
          return `Connected as ${formattedAddress}. Click to disconnect.`;
        case 'wrong_network':
          return 'Wrong network. Click to switch to the correct network.';
        case 'switching_network':
          return 'Switching network';
        case 'error':
          return `Connection error: ${error?.message}. Click to retry.`;
        default:
          return 'Connect wallet';
      }
    }, [walletInfo.hasWallet, connectionState, formattedAddress, error]);

    return (
      <Button
        ref={ref}
        variant={buttonVariant}
        size={size}
        fullWidth={fullWidth}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          // Base styles
          'gap-2',
          // Connected state styling
          connectionState === 'connected' && [
            'bg-surface-primary/50',
            'border border-border',
            'hover:bg-surface-primary',
            'hover:border-primary/50',
          ],
          // Wrong network state styling
          connectionState === 'wrong_network' && [
            'border-warning',
            'text-warning',
            'hover:bg-warning/10',
          ],
          // Error state styling
          connectionState === 'error' && ['border-error', 'text-error'],
          className
        )}
        aria-label={ariaLabel}
        aria-busy={connectionState === 'connecting' || connectionState === 'switching_network'}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }
);

ConnectButton.displayName = 'ConnectButton';

export default ConnectButton;
