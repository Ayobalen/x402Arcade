/**
 * ConnectButton Component Unit Tests
 *
 * Tests for the wallet connect button component including
 * automatic chain switching behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ConnectButton } from './ConnectButton';
import { useWalletStore, REQUIRED_CHAIN_ID } from '@/stores/walletStore';

// Mock the walletStore
vi.mock('@/stores/walletStore', async () => {
  const actual =
    await vi.importActual<typeof import('@/stores/walletStore')>('@/stores/walletStore');
  return {
    ...actual,
    useWalletStore: vi.fn(),
    selectFormattedAddress: vi.fn(),
    REQUIRED_CHAIN_ID: 338, // Cronos Testnet
  };
});

// Mock ethereum provider
const mockProvider = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

// Type for wallet state in tests
interface MockWalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: { code: string; message: string } | null;
  connectWallet: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  switchChain: ReturnType<typeof vi.fn>;
}

describe('ConnectButton', () => {
  // Default mock state
  const defaultState: MockWalletState = {
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    connectWallet: vi.fn(),
    disconnect: vi.fn(),
    switchChain: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Default wallet store mock
    (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: MockWalletState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(defaultState);
        }
        return defaultState;
      }
    );

    // Set up window.ethereum mock
    (window as Window & { ethereum?: typeof mockProvider }).ethereum = mockProvider;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as Window & { ethereum?: typeof mockProvider }).ethereum;
  });

  describe('rendering', () => {
    it('renders connect button when disconnected', () => {
      render(<ConnectButton />);
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
    });

    it('renders with custom connect label', () => {
      render(<ConnectButton connectLabel="Sign In" />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('renders wrong network button when connected to wrong chain', () => {
      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Ethereum mainnet, not Cronos
            isConnected: true,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton />);
      expect(screen.getByText('Wrong Network')).toBeInTheDocument();
    });
  });

  describe('connection flow', () => {
    it('calls connectWallet when clicking connect', async () => {
      const mockConnectWallet = vi.fn().mockResolvedValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: REQUIRED_CHAIN_ID,
      });

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            connectWallet: mockConnectWallet,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton />);
      const button = screen.getByRole('button');

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockConnectWallet).toHaveBeenCalled();
    });

    it('calls onConnectSuccess callback on successful connection', async () => {
      const onConnectSuccess = vi.fn();
      const mockConnectWallet = vi.fn().mockResolvedValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: REQUIRED_CHAIN_ID,
      });

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            connectWallet: mockConnectWallet,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton onConnectSuccess={onConnectSuccess} />);
      const button = screen.getByRole('button');

      await act(async () => {
        fireEvent.click(button);
      });

      expect(onConnectSuccess).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678',
        REQUIRED_CHAIN_ID
      );
    });
  });

  describe('automatic chain switching', () => {
    it('automatically triggers switchChain when connected to wrong network', async () => {
      const mockSwitchChain = vi.fn().mockResolvedValue(true);

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Wrong chain (Ethereum mainnet)
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton />);

      // Wait for the auto-switch timeout (100ms)
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockSwitchChain).toHaveBeenCalledWith(REQUIRED_CHAIN_ID);
      });
    });

    it('does not auto-switch when already on correct chain', async () => {
      const mockSwitchChain = vi.fn().mockResolvedValue(true);

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: REQUIRED_CHAIN_ID, // Correct chain
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton />);

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it('does not auto-switch when autoSwitchChain is disabled', async () => {
      const mockSwitchChain = vi.fn().mockResolvedValue(true);

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Wrong chain
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton autoSwitchChain={false} />);

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it('calls onAutoSwitchStart callback when auto-switch starts', async () => {
      const onAutoSwitchStart = vi.fn();
      const mockSwitchChain = vi.fn().mockResolvedValue(true);

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Wrong chain
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton onAutoSwitchStart={onAutoSwitchStart} />);

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(onAutoSwitchStart).toHaveBeenCalled();
      });
    });

    it('calls onAutoSwitchSuccess callback when auto-switch succeeds', async () => {
      const onAutoSwitchSuccess = vi.fn();
      const mockSwitchChain = vi.fn().mockResolvedValue(true);

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Wrong chain
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton onAutoSwitchSuccess={onAutoSwitchSuccess} />);

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(onAutoSwitchSuccess).toHaveBeenCalled();
      });
    });

    it('calls onAutoSwitchError callback when auto-switch fails', async () => {
      const onAutoSwitchError = vi.fn();
      const mockSwitchChain = vi.fn().mockRejectedValue(new Error('User rejected'));

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Wrong chain
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton onAutoSwitchError={onAutoSwitchError} />);

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(onAutoSwitchError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('only attempts auto-switch once per connection session', async () => {
      const mockSwitchChain = vi.fn().mockResolvedValue(false); // First attempt fails

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Wrong chain
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      const { rerender } = render(<ConnectButton />);

      // Wait for first auto-switch attempt
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockSwitchChain).toHaveBeenCalledTimes(1);
      });

      // Rerender (simulating state update)
      rerender(<ConnectButton />);

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      // Should still only have been called once
      expect(mockSwitchChain).toHaveBeenCalledTimes(1);
    });
  });

  describe('manual network switch', () => {
    it('triggers switchChain when clicking wrong network button', async () => {
      const mockSwitchChain = vi.fn().mockResolvedValue(true);

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 1, // Wrong chain
            isConnected: true,
            switchChain: mockSwitchChain,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton autoSwitchChain={false} />); // Disable auto-switch
      const button = screen.getByRole('button');

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockSwitchChain).toHaveBeenCalledWith(REQUIRED_CHAIN_ID);
    });
  });

  describe('wallet detection', () => {
    it('shows install MetaMask when no wallet detected', () => {
      delete (window as Window & { ethereum?: typeof mockProvider }).ethereum;

      render(<ConnectButton />);
      expect(screen.getByText('Install MetaMask')).toBeInTheDocument();
    });

    it('opens MetaMask download page when clicking install button', async () => {
      delete (window as Window & { ethereum?: typeof mockProvider }).ethereum;

      const mockOpen = vi.fn();
      vi.spyOn(window, 'open').mockImplementation(mockOpen);

      render(<ConnectButton />);
      const button = screen.getByRole('button');

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockOpen).toHaveBeenCalledWith(
        'https://metamask.io/download/',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('disconnect', () => {
    it('calls disconnect when clicking connected button', async () => {
      const mockDisconnect = vi.fn();

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: MockWalletState) => unknown) => {
          const state: MockWalletState = {
            ...defaultState,
            address: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: REQUIRED_CHAIN_ID,
            isConnected: true,
            disconnect: mockDisconnect,
          };
          if (typeof selector === 'function') {
            return selector(state);
          }
          return state;
        }
      );

      render(<ConnectButton autoSwitchChain={false} />);
      const button = screen.getByRole('button');

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
