/**
 * Component Test Utilities - Test Suite
 *
 * Tests demonstrating usage of the component test utilities
 * for various testing scenarios.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  renderWithWallet,
  renderWithStore,
  renderWithRouter,
  renderWithAll,
  customRender,
  MockWalletProvider,
  useMockWallet,
  defaultWalletState,
  disconnectedWalletState,
  connectingWalletState,
  defaultWalletActions,
  failingWalletActions,
  createConnectedWallet,
  createDisconnectedWallet,
  createInsufficientBalanceWallet,
  createWrongNetworkWallet,
  generateTestAddress,
  createTestQueryClient,
} from './component-utils';
import { screen, waitFor } from '@testing-library/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// Test Components
// ============================================================================

/**
 * Component that displays wallet connection state
 */
function WalletStatus() {
  const wallet = useMockWallet();

  if (wallet.isConnecting) {
    return <div data-testid="connecting">Connecting...</div>;
  }

  if (!wallet.isConnected) {
    return (
      <button onClick={wallet.connect} data-testid="connect-button">
        Connect Wallet
      </button>
    );
  }

  return (
    <div data-testid="wallet-info">
      <div data-testid="address">{wallet.address}</div>
      <div data-testid="balance">{wallet.usdcBalance} USDC</div>
      <div data-testid="chain-id">Chain: {wallet.chainId}</div>
      <button onClick={wallet.disconnect} data-testid="disconnect-button">
        Disconnect
      </button>
    </div>
  );
}

/**
 * Component that uses React Query
 */
function DataFetcher({ mockData }: { mockData?: string[] }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['test-data'],
    queryFn: async () => mockData || ['item1', 'item2', 'item3'],
  });

  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error: {(error as Error).message}</div>;

  return (
    <ul data-testid="data-list">
      {data?.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Component that uses routing
 */
function RouterComponent() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div>
      <div data-testid="current-path">{location.pathname}</div>
      <button onClick={() => navigate('/games')} data-testid="nav-button">
        Go to Games
      </button>
      <Link to="/leaderboard" data-testid="link">
        Leaderboard
      </Link>
    </div>
  );
}

/**
 * Component that combines all contexts
 */
function FullAppComponent() {
  const wallet = useMockWallet();
  const location = useLocation();
  const { data } = useQuery({
    queryKey: ['combined'],
    queryFn: async () => 'Combined data loaded',
  });

  return (
    <div data-testid="full-app">
      <div data-testid="wallet-status">
        {wallet.isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="route">{location.pathname}</div>
      <div data-testid="data">{data || 'Loading...'}</div>
    </div>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('Component Test Utilities', () => {
  describe('renderWithWallet', () => {
    it('renders with default connected wallet state', () => {
      renderWithWallet(<WalletStatus />);

      expect(screen.getByTestId('wallet-info')).toBeInTheDocument();
      expect(screen.getByTestId('address')).toHaveTextContent(defaultWalletState.address);
      expect(screen.getByTestId('balance')).toHaveTextContent('100.00 USDC');
      expect(screen.getByTestId('chain-id')).toHaveTextContent('Chain: 338');
    });

    it('renders with disconnected wallet state', () => {
      renderWithWallet(<WalletStatus />, {
        walletState: { isConnected: false },
      });

      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
      expect(screen.queryByTestId('wallet-info')).not.toBeInTheDocument();
    });

    it('renders with connecting state', () => {
      renderWithWallet(<WalletStatus />, {
        walletState: connectingWalletState,
      });

      expect(screen.getByTestId('connecting')).toHaveTextContent('Connecting...');
    });

    it('renders with custom balance', () => {
      renderWithWallet(<WalletStatus />, {
        walletState: { usdcBalance: '50.00' },
      });

      expect(screen.getByTestId('balance')).toHaveTextContent('50.00 USDC');
    });

    it('calls connect action on button click', async () => {
      const mockConnect = vi.fn();
      const { user } = renderWithWallet(<WalletStatus />, {
        walletState: { isConnected: false },
        walletActions: { connect: mockConnect },
      });

      await user.click(screen.getByTestId('connect-button'));
      expect(mockConnect).toHaveBeenCalled();
    });

    it('calls disconnect action on button click', async () => {
      const mockDisconnect = vi.fn();
      const { user } = renderWithWallet(<WalletStatus />, {
        walletActions: { disconnect: mockDisconnect },
      });

      await user.click(screen.getByTestId('disconnect-button'));
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('returns user event instance for interactions', async () => {
      const { user } = renderWithWallet(<WalletStatus />, {
        walletState: { isConnected: false },
      });

      expect(user).toBeDefined();
      expect(typeof user.click).toBe('function');
    });

    it('returns wallet state for assertions', () => {
      const { walletState } = renderWithWallet(<WalletStatus />, {
        walletState: { chainId: 1 },
      });

      expect(walletState.chainId).toBe(1);
      expect(walletState.isConnected).toBe(true);
    });
  });

  describe('renderWithStore', () => {
    it('renders with default query client', async () => {
      renderWithStore(<DataFetcher />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('data-list')).toBeInTheDocument();
      });

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('returns queryClient for manual cache operations', () => {
      const { queryClient } = renderWithStore(<DataFetcher />);

      expect(queryClient).toBeDefined();
      expect(queryClient.getQueryCache()).toBeDefined();
    });

    it('allows pre-populating query cache', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(['test-data'], ['pre-cached']);

      renderWithStore(<DataFetcher />, { queryClient });

      // Should show cached data immediately
      expect(screen.getByTestId('data-list')).toBeInTheDocument();
      expect(screen.getByText('pre-cached')).toBeInTheDocument();
    });

    it('returns user event instance', () => {
      const { user } = renderWithStore(<DataFetcher />);
      expect(user).toBeDefined();
    });
  });

  describe('renderWithRouter', () => {
    it('renders with default route /', () => {
      renderWithRouter(<RouterComponent />);

      expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    });

    it('renders with custom initial route', () => {
      renderWithRouter(<RouterComponent />, { route: '/games' });

      expect(screen.getByTestId('current-path')).toHaveTextContent('/games');
    });

    it('supports navigation actions', async () => {
      const { user } = renderWithRouter(<RouterComponent />);

      await user.click(screen.getByTestId('nav-button'));

      expect(screen.getByTestId('current-path')).toHaveTextContent('/games');
    });

    it('supports link navigation', async () => {
      const { user } = renderWithRouter(<RouterComponent />);

      await user.click(screen.getByTestId('link'));

      expect(screen.getByTestId('current-path')).toHaveTextContent('/leaderboard');
    });

    it('supports multiple initial entries for history', async () => {
      const { user } = renderWithRouter(<RouterComponent />, {
        initialEntries: ['/home', '/games'],
      });

      // Should render at /games (last entry)
      expect(screen.getByTestId('current-path')).toHaveTextContent('/games');
    });
  });

  describe('renderWithAll', () => {
    it('combines all contexts', async () => {
      renderWithAll(<FullAppComponent />, {
        route: '/play',
        walletState: { isConnected: true },
      });

      expect(screen.getByTestId('wallet-status')).toHaveTextContent('Connected');
      expect(screen.getByTestId('route')).toHaveTextContent('/play');

      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('Combined data loaded');
      });
    });

    it('returns all context accessors', () => {
      const { user, queryClient, walletState } = renderWithAll(<FullAppComponent />);

      expect(user).toBeDefined();
      expect(queryClient).toBeDefined();
      expect(walletState).toBeDefined();
      expect(walletState.isConnected).toBe(true);
    });

    it('customRender is an alias for renderWithAll', () => {
      expect(customRender).toBe(renderWithAll);
    });
  });

  describe('Wallet State Factories', () => {
    it('createConnectedWallet returns connected state', () => {
      const wallet = createConnectedWallet({ usdcBalance: '500.00' });

      expect(wallet.isConnected).toBe(true);
      expect(wallet.usdcBalance).toBe('500.00');
    });

    it('createDisconnectedWallet returns disconnected state', () => {
      const wallet = createDisconnectedWallet();

      expect(wallet.isConnected).toBe(false);
      expect(wallet.address).toBe('0x0000000000000000000000000000000000000000');
    });

    it('createInsufficientBalanceWallet returns wallet with low balance', () => {
      const wallet = createInsufficientBalanceWallet(10.0);

      expect(parseFloat(wallet.usdcBalance)).toBeLessThan(10.0);
    });

    it('createWrongNetworkWallet returns wallet on different chain', () => {
      const wallet = createWrongNetworkWallet(1); // Mainnet

      expect(wallet.chainId).toBe(1);
      expect(wallet.chainId).not.toBe(338);
    });

    it('generateTestAddress creates valid addresses', () => {
      const addr1 = generateTestAddress('1');
      const addr2 = generateTestAddress('abcdef');

      expect(addr1).toMatch(/^0x[0-9a-f]{40}$/);
      expect(addr2).toMatch(/^0x[0-9a-f]{40}$/);
      expect(addr1).not.toBe(addr2);
    });
  });

  describe('Wallet Actions', () => {
    it('defaultWalletActions has all required methods', () => {
      expect(typeof defaultWalletActions.connect).toBe('function');
      expect(typeof defaultWalletActions.disconnect).toBe('function');
      expect(typeof defaultWalletActions.signMessage).toBe('function');
      expect(typeof defaultWalletActions.signTypedData).toBe('function');
      expect(typeof defaultWalletActions.sendTransaction).toBe('function');
    });

    it('defaultWalletActions methods resolve successfully', async () => {
      await expect(defaultWalletActions.connect()).resolves.not.toThrow();
      await expect(defaultWalletActions.signMessage('test')).resolves.toMatch(/^0x/);
      await expect(defaultWalletActions.signTypedData({})).resolves.toMatch(/^0x/);
      await expect(defaultWalletActions.sendTransaction({})).resolves.toMatch(/^0x/);
    });

    it('failingWalletActions methods reject with errors', async () => {
      await expect(failingWalletActions.connect()).rejects.toThrow('Connection rejected');
      await expect(failingWalletActions.signMessage('test')).rejects.toThrow('Signature rejected');
      await expect(failingWalletActions.sendTransaction({})).rejects.toThrow('Transaction rejected');
    });
  });

  describe('MockWalletProvider', () => {
    it('provides default wallet context', () => {
      renderWithWallet(<WalletStatus />);

      expect(screen.getByTestId('wallet-info')).toBeInTheDocument();
    });

    it('useMockWallet throws outside provider', () => {
      // Component that uses wallet hook without provider
      function NakedComponent() {
        const wallet = useMockWallet();
        return <div>{wallet.address}</div>;
      }

      expect(() => {
        // Render without provider should throw
        const { render: plainRender } = require('@testing-library/react');
        plainRender(<NakedComponent />);
      }).toThrow('useMockWallet must be used within MockWalletProvider');
    });
  });

  describe('createTestQueryClient', () => {
    it('creates a QueryClient with test-friendly defaults', () => {
      const client = createTestQueryClient();

      expect(client).toBeDefined();

      const defaults = client.getDefaultOptions();
      expect(defaults.queries?.retry).toBe(false);
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    });

    it('each call creates a new instance', () => {
      const client1 = createTestQueryClient();
      const client2 = createTestQueryClient();

      expect(client1).not.toBe(client2);
    });
  });
});

describe('Integration Examples', () => {
  it('testing a payment flow component', async () => {
    // Example of testing a component that needs wallet, router, and queries
    function PayButton() {
      const wallet = useMockWallet();
      const location = useLocation();

      const handlePay = async () => {
        await wallet.signTypedData({ type: 'payment' });
      };

      if (!wallet.isConnected) {
        return <button onClick={wallet.connect}>Connect to Pay</button>;
      }

      return (
        <div>
          <div data-testid="route">{location.pathname}</div>
          <div data-testid="balance">{wallet.usdcBalance}</div>
          <button onClick={handlePay} data-testid="pay-button">
            Pay $0.01
          </button>
        </div>
      );
    }

    const mockSignTypedData = vi.fn().mockResolvedValue('0xsignature');

    const { user, walletState } = renderWithAll(<PayButton />, {
      route: '/play/snake',
      walletState: { usdcBalance: '50.00' },
      walletActions: { signTypedData: mockSignTypedData },
    });

    // Verify initial state
    expect(screen.getByTestId('route')).toHaveTextContent('/play/snake');
    expect(screen.getByTestId('balance')).toHaveTextContent('50.00');
    expect(walletState.usdcBalance).toBe('50.00');

    // Simulate payment
    await user.click(screen.getByTestId('pay-button'));
    expect(mockSignTypedData).toHaveBeenCalledWith({ type: 'payment' });
  });

  it('testing with pre-populated API data', async () => {
    function LeaderboardPreview() {
      const { data } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => [
          { name: 'Player1', score: 1000 },
          { name: 'Player2', score: 800 },
        ],
      });

      if (!data) return <div>Loading...</div>;

      return (
        <ul data-testid="leaderboard">
          {data.map((entry, i) => (
            <li key={i} data-testid={`entry-${i}`}>
              {entry.name}: {entry.score}
            </li>
          ))}
        </ul>
      );
    }

    // Pre-populate cache
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['leaderboard'], [
      { name: 'TestPlayer', score: 999 },
    ]);

    renderWithStore(<LeaderboardPreview />, { queryClient });

    // Data should be immediately available
    expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
    expect(screen.getByText('TestPlayer: 999')).toBeInTheDocument();
  });
});
