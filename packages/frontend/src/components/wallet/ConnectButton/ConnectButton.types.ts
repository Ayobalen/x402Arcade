/**
 * ConnectButton Component Types
 *
 * Type definitions for the wallet connect button component.
 * Handles the full wallet connection flow and status display.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Button size options (matches Button component)
 */
export type ConnectButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button variant options for visual styling
 */
export type ConnectButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

/**
 * Connection state for internal tracking
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrong_network'
  | 'switching_network'
  | 'error';

/**
 * ConnectButton Props Interface
 *
 * Extends native button attributes with wallet-specific props.
 */
export interface ConnectButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /**
   * Size of the button
   * @default 'md'
   */
  size?: ConnectButtonSize;

  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: ConnectButtonVariant;

  /**
   * Whether the button should take full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Custom label for disconnected state
   * @default 'Connect Wallet'
   */
  connectLabel?: string;

  /**
   * Custom label for connecting state
   * @default 'Connecting...'
   */
  connectingLabel?: string;

  /**
   * Custom label for wrong network state
   * @default 'Wrong Network'
   */
  wrongNetworkLabel?: string;

  /**
   * Custom label for switching network state
   * @default 'Switching...'
   */
  switchingLabel?: string;

  /**
   * Whether to show abbreviated address when connected
   * @default true
   */
  showAddress?: boolean;

  /**
   * Whether to show network indicator when connected
   * @default true
   */
  showNetwork?: boolean;

  /**
   * Whether to show wallet icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom connected content renderer
   * Receives address and chainId as arguments
   */
  connectedContent?: (address: string, chainId: number) => ReactNode;

  /**
   * Callback fired when connection attempt starts
   */
  onConnectStart?: () => void;

  /**
   * Callback fired when connection succeeds
   */
  onConnectSuccess?: (address: string, chainId: number) => void;

  /**
   * Callback fired when connection fails
   */
  onConnectError?: (error: Error) => void;

  /**
   * Callback fired when disconnect is triggered
   */
  onDisconnect?: () => void;

  /**
   * Callback fired when network switch is initiated
   */
  onNetworkSwitch?: () => void;

  /**
   * Whether to automatically prompt network switch when connected to wrong network
   * @default true
   */
  autoSwitchChain?: boolean;

  /**
   * Callback fired when automatic chain switch starts
   */
  onAutoSwitchStart?: () => void;

  /**
   * Callback fired when automatic chain switch succeeds
   */
  onAutoSwitchSuccess?: () => void;

  /**
   * Callback fired when automatic chain switch fails
   */
  onAutoSwitchError?: (error: Error) => void;

  /**
   * Additional CSS classes to apply
   */
  className?: string;
}

/**
 * Network configuration for display
 */
export interface NetworkInfo {
  chainId: number;
  name: string;
  shortName: string;
  iconColor: string;
}

/**
 * Supported networks for the application
 */
export const SUPPORTED_NETWORKS: Record<number, NetworkInfo> = {
  // Cronos Testnet
  338: {
    chainId: 338,
    name: 'Cronos Testnet',
    shortName: 'Cronos',
    iconColor: '#00D1FF',
  },
  // Cronos Mainnet
  25: {
    chainId: 25,
    name: 'Cronos',
    shortName: 'Cronos',
    iconColor: '#00D1FF',
  },
  // Base Sepolia
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    shortName: 'Base',
    iconColor: '#0052FF',
  },
  // Base Mainnet
  8453: {
    chainId: 8453,
    name: 'Base',
    shortName: 'Base',
    iconColor: '#0052FF',
  },
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    iconColor: '#627EEA',
  },
  // Polygon
  137: {
    chainId: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    iconColor: '#8247E5',
  },
};
