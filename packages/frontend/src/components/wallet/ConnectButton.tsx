/**
 * Connect Button Component
 *
 * Button for wallet connection with status display.
 * Follows the dark/purple design system.
 *
 * @module components/wallet/ConnectButton
 */

import { useWallet, formatAddress } from '../../hooks/useWallet';

export interface ConnectButtonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * ConnectButton Component
 *
 * Displays wallet connection status and provides connect/disconnect functionality.
 *
 * @example
 * ```tsx
 * <ConnectButton />
 * ```
 */
export function ConnectButton({ className = '' }: ConnectButtonProps) {
  const { status, address, connect, disconnect, switchChain, isReady } = useWallet();

  const handleClick = async () => {
    if (status === 'disconnected') {
      await connect();
    } else if (status === 'wrong_chain') {
      await switchChain();
    } else {
      disconnect();
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'wrong_chain':
        return 'Switch to Cronos Testnet';
      case 'connected':
        return address ? formatAddress(address) : 'Connected';
      default:
        return 'Connect Wallet';
    }
  };

  const getButtonStyles = () => {
    const base = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 ';

    if (status === 'wrong_chain') {
      return base + 'bg-yellow-600 hover:bg-yellow-700 text-white';
    }

    if (isReady) {
      return base + 'bg-[#1A1A2E] hover:bg-[#252540] text-[#F8FAFC] border-2 border-[#8B5CF6]';
    }

    return base + 'bg-[#8B5CF6] hover:bg-[#A78BFA] text-white';
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === 'connecting'}
      className={`${getButtonStyles()} ${className}`}
    >
      {getButtonText()}
    </button>
  );
}
