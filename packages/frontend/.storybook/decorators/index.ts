/**
 * Storybook Decorators
 *
 * Reusable decorators for consistent story rendering contexts.
 * These decorators provide common wrappers like routing, state management,
 * theming, and wallet context.
 *
 * @module decorators
 *
 * @example
 * ```typescript
 * // In a story file
 * import { withTheme, withRouter, withWallet } from '../decorators';
 *
 * export default {
 *   title: 'Components/MyComponent',
 *   decorators: [withTheme, withRouter, withWallet],
 * };
 * ```
 */

 
 

import type { Decorator } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React, { createContext, useContext, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Theme mode for the application
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Wallet connection state
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

/**
 * Wallet context value
 */
export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

// ============================================================================
// Contexts (for decorators)
// ============================================================================

// Theme Context
const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  setMode: () => {},
  toggleMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

// Wallet Context
const WalletContext = createContext<WalletContextValue>({
  isConnected: false,
  address: null,
  chainId: null,
  balance: null,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
});

export const useWalletContext = () => useContext(WalletContext);

// ============================================================================
// withTheme Decorator
// ============================================================================

/**
 * Theme wrapper component for Storybook decorators
 */
function ThemeWrapper({ children, initialMode }: { children: React.ReactNode; initialMode: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const toggleMode = () => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const themeValue: ThemeContextValue = {
    mode,
    setMode,
    toggleMode,
  };

  const themeClass = mode === 'dark' ? 'dark bg-bg-primary' : 'light bg-white';

  return React.createElement(
    ThemeContext.Provider,
    { value: themeValue },
    React.createElement(
      'div',
      { className: `${themeClass} min-h-screen p-4` },
      children
    )
  );
}

/**
 * Theme provider decorator that wraps stories with theme context.
 * Supports dark and light modes with toggle functionality.
 *
 * @example
 * ```typescript
 * export default {
 *   decorators: [withTheme],
 * };
 * ```
 */
export const withTheme: Decorator = (Story, context) => {
  const initialMode = (context.globals?.theme as ThemeMode) || 'dark';
  return React.createElement(
    ThemeWrapper,
    { initialMode },
    React.createElement(Story)
  );
};

// ============================================================================
// withRouter Decorator
// ============================================================================

/**
 * Router decorator that wraps stories with MemoryRouter.
 * Provides navigation context for components using React Router hooks.
 *
 * @param initialEntries - Initial route entries (default: ['/'])
 *
 * @example
 * ```typescript
 * export default {
 *   decorators: [withRouter],
 * };
 *
 * // With custom initial route
 * export const OnPlayPage: Story = {
 *   decorators: [
 *     (Story) => createRouterDecorator(['/play'])(Story),
 *   ],
 * };
 * ```
 */
export const withRouter: Decorator = (Story) => {
  return React.createElement(
    MemoryRouter,
    { initialEntries: ['/'] },
    React.createElement(Story)
  );
};

/**
 * Create a router decorator with custom initial entries
 */
export const createRouterDecorator = (
  initialEntries: string[] = ['/']
): Decorator => {
  return (Story) => {
    return React.createElement(
      MemoryRouter,
      { initialEntries },
      React.createElement(Story)
    );
  };
};

/**
 * Router decorator with route matching
 * Useful for testing components that depend on route parameters
 */
export const withRouteParams = (
  path: string,
  initialEntry: string
): Decorator => {
  return (Story) => {
    return React.createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      React.createElement(
        Routes,
        {},
        React.createElement(Route, { path, element: React.createElement(Story) })
      )
    );
  };
};

// ============================================================================
// withStore Decorator (React Query)
// ============================================================================

// Create a query client for stories
const createStoryQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Store/Query decorator that wraps stories with React Query provider.
 * Creates a fresh QueryClient for each story to ensure isolation.
 *
 * @example
 * ```typescript
 * export default {
 *   decorators: [withStore],
 * };
 * ```
 */
export const withStore: Decorator = (Story) => {
  const queryClient = createStoryQueryClient();

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(Story)
  );
};

/**
 * Create a store decorator with pre-seeded data
 */
export const createStoreDecorator = (
  initialData?: Record<string, unknown>
): Decorator => {
  return (Story) => {
    const queryClient = createStoryQueryClient();

    // Seed initial data if provided
    if (initialData) {
      Object.entries(initialData).forEach(([key, data]) => {
        queryClient.setQueryData([key], data);
      });
    }

    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Story)
    );
  };
};

// ============================================================================
// withWallet Decorator
// ============================================================================

/**
 * Default mock wallet state
 */
export const defaultWalletState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  balance: null,
};

/**
 * Connected wallet state for testing
 */
export const connectedWalletState: WalletState = {
  isConnected: true,
  address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  chainId: 338, // Cronos Testnet
  balance: '100.00',
};

/**
 * Wallet wrapper component for Storybook decorators
 */
function WalletWrapper({ children, initialState }: { children: React.ReactNode; initialState: WalletState }) {
  const [walletState, setWalletState] = useState<WalletState>(initialState);

  const connect = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setWalletState(connectedWalletState);
  };

  const disconnect = () => {
    setWalletState(defaultWalletState);
  };

  const switchChain = async (chainId: number) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setWalletState(prev => ({ ...prev, chainId }));
  };

  const walletValue: WalletContextValue = {
    ...walletState,
    connect,
    disconnect,
    switchChain,
  };

  return React.createElement(
    WalletContext.Provider,
    { value: walletValue },
    children
  );
}

/**
 * Wallet decorator that wraps stories with mock wallet context.
 * Provides connect/disconnect functionality for testing wallet interactions.
 *
 * @example
 * ```typescript
 * export default {
 *   decorators: [withWallet],
 * };
 *
 * // Story with connected wallet
 * export const Connected: Story = {
 *   decorators: [createWalletDecorator(connectedWalletState)],
 * };
 * ```
 */
export const withWallet: Decorator = (Story) => {
  return React.createElement(
    WalletWrapper,
    { initialState: defaultWalletState },
    React.createElement(Story)
  );
};

/**
 * Create a wallet decorator with custom initial state
 */
/**
 * Custom wallet wrapper for decorator with initial state
 */
function CustomWalletWrapper({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState: Partial<WalletState>;
}) {
  const [walletState, setWalletState] = useState<WalletState>({
    ...defaultWalletState,
    ...initialState,
  });

  const connect = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setWalletState({
      ...connectedWalletState,
      ...initialState,
    });
  };

  const disconnect = () => {
    setWalletState({ ...defaultWalletState, ...initialState });
  };

  const switchChain = async (chainId: number) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setWalletState((prev) => ({ ...prev, chainId }));
  };

  const walletValue: WalletContextValue = {
    ...walletState,
    connect,
    disconnect,
    switchChain,
  };

  return React.createElement(
    WalletContext.Provider,
    { value: walletValue },
    children
  );
}

export const createWalletDecorator = (
  initialState: Partial<WalletState> = {}
): Decorator => {
  return (Story) => {
    return React.createElement(
      CustomWalletWrapper,
      { initialState },
      React.createElement(Story)
    );
  };
};

// ============================================================================
// withCentered Decorator
// ============================================================================

/**
 * Centers the story content both horizontally and vertically.
 * Useful for presenting components in isolation.
 */
export const withCentered: Decorator = (Story) => {
  return React.createElement(
    'div',
    {
      className: 'flex items-center justify-center min-h-screen p-8',
    },
    React.createElement(Story)
  );
};

// ============================================================================
// withPadding Decorator
// ============================================================================

/**
 * Adds consistent padding around story content.
 */
export const withPadding: Decorator = (Story) => {
  return React.createElement(
    'div',
    { className: 'p-4' },
    React.createElement(Story)
  );
};

/**
 * Create a padding decorator with custom size
 */
export const createPaddingDecorator = (size: number = 4): Decorator => {
  return (Story) => {
    return React.createElement(
      'div',
      { className: `p-${size}` },
      React.createElement(Story)
    );
  };
};

// ============================================================================
// withMaxWidth Decorator
// ============================================================================

/**
 * Constrains story content to a maximum width.
 * Useful for testing responsive behavior.
 */
export const withMaxWidth: Decorator = (Story) => {
  return React.createElement(
    'div',
    { className: 'max-w-md mx-auto' },
    React.createElement(Story)
  );
};

/**
 * Create a max-width decorator with custom width
 */
export const createMaxWidthDecorator = (
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = 'md'
): Decorator => {
  return (Story) => {
    return React.createElement(
      'div',
      { className: `max-w-${maxWidth} mx-auto` },
      React.createElement(Story)
    );
  };
};

// ============================================================================
// Composite Decorators
// ============================================================================

/**
 * All providers wrapper component for Storybook decorators
 */
function AllProvidersWrapper({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [walletState, setWalletState] = useState<WalletState>(defaultWalletState);
  const queryClient = createStoryQueryClient();

  const themeValue: ThemeContextValue = {
    mode,
    setMode,
    toggleMode: () => setMode(prev => (prev === 'dark' ? 'light' : 'dark')),
  };

  const walletValue: WalletContextValue = {
    ...walletState,
    connect: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setWalletState(connectedWalletState);
    },
    disconnect: () => setWalletState(defaultWalletState),
    switchChain: async (chainId) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setWalletState(prev => ({ ...prev, chainId }));
    },
  };

  return React.createElement(
    ThemeContext.Provider,
    { value: themeValue },
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        WalletContext.Provider,
        { value: walletValue },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(
            'div',
            { className: mode === 'dark' ? 'dark' : 'light' },
            children
          )
        )
      )
    )
  );
}

/**
 * All providers decorator - combines theme, router, store, and wallet.
 * Use this for full integration stories.
 */
export const withAllProviders: Decorator = (Story) => {
  return React.createElement(
    AllProvidersWrapper,
    {},
    React.createElement(Story)
  );
};

// ============================================================================
// Decorator Utilities
// ============================================================================

/**
 * Compose multiple decorators into one
 */
export const composeDecorators = (...decorators: Decorator[]): Decorator => {
  return (Story, context) => {
    return decorators.reduceRight((acc, decorator) => {
      return () => decorator(() => acc(), context);
    }, () => React.createElement(Story))();
  };
};

/**
 * Create a decorator that adds a wrapper element with custom props
 */
export const createWrapperDecorator = (
  className: string,
  style?: React.CSSProperties
): Decorator => {
  return (Story) => {
    return React.createElement(
      'div',
      { className, style },
      React.createElement(Story)
    );
  };
};
