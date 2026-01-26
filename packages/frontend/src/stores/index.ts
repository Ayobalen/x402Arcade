/**
 * Store Exports
 *
 * Central export point for all Zustand stores.
 */

export {
  useWalletStore,
  selectAddress,
  selectIsConnected,
  selectIsConnecting,
  selectChainId,
  selectError,
  selectStatus,
  selectFormattedAddress,
  getWalletState,
  subscribeToWallet,
  type WalletState,
  type WalletConnection,
  type WalletError,
  type ChainId,
  type ConnectionStatus,
  type EthereumProvider,
} from './walletStore';

export {
  useErrorStore,
  useCurrentError,
  useVisibleErrorCount,
  useCategoryErrors,
  useHasErrors,
  type ErrorState,
  type ErrorEntry,
} from './errorStore';

export {
  useLoadingStore,
  useIsLoading,
  useIsAnyLoading,
  useIsCategoryLoading,
  useLoadingEntry,
  useLoadingOperations,
  withLoading,
  getLoadingState,
  type LoadingState,
  type LoadingEntry,
  type LoadingCategory,
  type OperationKey,
  type StandardOperationKey,
  type StartLoadingOptions,
} from './loadingStore';

export {
  useOnboardingStore,
  type OnboardingStep,
  type OnboardingTooltip,
  type GameTutorialStep,
} from './onboarding';

export {
  useThemeStore,
  useThemeVariation,
  useThemeMode,
  useActiveTheme,
  useAllThemes,
  useThemeActions,
  initializeTheme,
  selectThemeVariation,
  selectThemeMode,
  selectActiveTheme,
  selectAllThemes,
  selectGameThemes,
  type ThemeState,
  type ThemeVariation,
  type ThemeMode,
  type ThemeConfig,
  type GameTheme,
} from './themeStore';
