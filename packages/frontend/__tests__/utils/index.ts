/**
 * Frontend Test Utilities - Central Export
 *
 * Import all test helpers from this file:
 * import { waitForElement, mockFetch, createTestStore } from '../utils';
 * import { renderWithProviders, screen, userEvent } from '../utils';
 * import { renderWithWallet, renderWithAll, customRender } from '../utils';
 */

// Original test helpers
export {
  waitForElement,
  waitForElementToBeRemoved,
  mockFetch,
  createTestStore,
  waitForStateUpdate,
  createDeferred,
  userEvents,
} from './test-helpers';

// React Testing Library helpers
export {
  renderWithProviders,
  renderSimple,
  renderWithRouter,
  renderWithQueryClient,
  screen,
  within,
  waitFor,
  userEvent,
  render,
  createTestQueryClient,
  waitForLoadingToComplete,
  getByTestIdWithFallback,
  createMockWalletContext,
  defaultMockWalletState,
  type MockWalletState,
} from './rtl-helpers';

// Component test utilities (with wallet/store/router context)
export {
  // Render functions
  renderWithWallet,
  renderWithStore,
  renderWithAll,
  customRender,
  // Wallet context
  MockWalletProvider,
  useMockWallet,
  defaultWalletState,
  disconnectedWalletState,
  connectingWalletState,
  defaultWalletActions,
  failingWalletActions,
  // Wallet factories
  createConnectedWallet,
  createDisconnectedWallet,
  createInsufficientBalanceWallet,
  createWrongNetworkWallet,
  generateTestAddress,
  // Assertions
  expectLoadingState,
  expectErrorState,
  expectWalletConnected,
  // Types
  type MockWalletContextValue,
  type MockWalletActions,
  type RenderWithWalletOptions,
  type RenderWithStoreOptions,
  type RenderWithAllOptions,
  type ExtendedRenderResult,
} from './component-utils';

// Hook test utilities
export {
  // Render hook functions
  renderHookWithProviders,
  renderHookWithAllProviders,
  // Async utilities
  waitForHook,
  waitForHookState,
  // Timer utilities
  actWithTimers,
  actAndRunAllTimers,
  actAndRunOnlyPendingTimers,
  // Mock dependency utilities
  createMockDependencies,
  createMockApiHook,
  // Re-exports
  act,
  renderHook,
  vi,
  // Types
  type RenderHookWithProvidersOptions,
  type ExtendedRenderHookResult,
  type MockDependencies,
} from './hook-utils';

// Zustand store test utilities
export {
  // Core store creation
  createTestStore as createZustandTestStore,
  withInitialState,
  // Selector testing
  mockSelector,
  createTrackedSelector,
  // Snapshots
  storeSnapshot,
  compareSnapshots,
  // History tracking
  createHistoryTrackedStore,
  // Cleanup
  resetAllStores,
  clearStoreRegistry,
  getRegisteredStoreCount,
  getRegisteredStoreNames,
  // Action utilities
  createActionSpy,
  waitForStoreState,
  // Example stores (for testing documentation)
  createExampleWalletStore,
  createExampleGameStore,
  // Types
  type CreateTestStoreOptions,
  type SnapshotOptions,
  type TestStore,
  type MockedSelector,
  type ExampleWalletState,
  type ExampleGameState,
} from './store-utils';

// Animation test utilities
export {
  // Types
  type AnimationState,
  type AnimationMockConfig,
  type TransitionEventData,
  type AnimationEventData,
  type AnimationRecord,
  type MockedFramerMotion,
  type RAFController,
  // Framer Motion mocking
  mockFramerMotion,
  createFramerMotionMock,
  // CSS animation event firing
  fireTransitionEnd,
  fireTransitionStart,
  fireTransitionCancel,
  fireAnimationEnd,
  fireAnimationStart,
  fireAnimationIteration,
  fireAnimationCancel,
  // Animation waiting
  waitForAnimation,
  waitForTransition,
  waitForAllAnimations,
  // Animation assertions
  assertAnimationState,
  assertHasTransition,
  assertFramerProps,
  // Animation control
  disableAnimations,
  enableAnimations,
  setTransitionMultiplier,
  getTransitionMultiplier,
  areAnimationsEnabled,
  // Animation tracking
  clearAnimationRecords,
  getAnimationRecords,
  getAnimationRecordsByType,
  trackAnimation,
  // RAF controller
  createRAFController,
  // Computed style mocking
  mockComputedStyleAnimations,
  // Setup helpers
  setupAnimationTesting,
} from './animation-utils';

// Accessibility test utilities (jest-axe integration)
export {
  // Core a11y checking
  checkA11y,
  runA11yCheck,
  checkA11yWhenReady,
  // Custom checker creation
  createA11yChecker,
  // Matchers
  toHaveNoViolations,
  // Configuration
  DEFAULT_AXE_CONFIG,
  KNOWN_ISSUES,
  // WCAG configs
  WCAG_CONFIGS,
  // Presets
  A11Y_PRESETS,
  // Report utilities
  summarizeViolations,
  createA11yReport,
  // Helper functions
  runOnlyRules,
  excludeRules,
  isTestableElement,
  // Types
  type A11yImpact,
  type A11yCheckConfig,
  type A11yCheckResult,
  type FormattedViolation,
} from './a11y-utils';

// User Event test utilities
export {
  // Factory functions
  createUser,
  createFastUser,
  createRealisticUser,
  defaultUser,
  // Configuration options
  DEFAULT_USER_EVENT_OPTIONS,
  FAST_USER_EVENT_OPTIONS,
  REALISTIC_USER_EVENT_OPTIONS,
  // Key constants
  KEYS,
  SHORTCUTS,
  // Click helpers
  click,
  doubleClick,
  rightClick,
  tripleClick,
  clickWithModifiers,
  // Type/input helpers
  typeInInput,
  appendToInput,
  clearInput,
  replaceInputText,
  paste,
  copy,
  cut,
  // Selection helpers
  selectOption,
  deselectOption,
  // Keyboard helpers
  pressKey,
  pressEnter,
  pressEscape,
  pressTab,
  pressShiftTab,
  pressSpace,
  pressBackspace,
  pressDelete,
  pressShortcut,
  pressCtrl,
  pressAlt,
  pressShift,
  pressCommonShortcut,
  // Arrow key helpers
  pressArrowKey,
  pressArrowKeys,
  pressUp,
  pressDown,
  pressLeft,
  pressRight,
  // WASD helpers (game controls)
  pressWASD,
  pressWASDKeys,
  pressW,
  pressA,
  pressS,
  pressD,
  // Hover/Focus helpers
  hover,
  unhover,
  tabToElement,
  // Drag and drop
  dragAndDrop,
  // Form helpers
  fillForm,
  submitForm,
  // Upload helpers
  uploadFile,
  createMockFile,
  createMockImageFile,
  // Pointer helpers
  movePointerTo,
  pointerDown,
  pointerUp,
  // Types
  type UserEventSetupOptions,
  type ModifierKeys,
  type KeyboardShortcut,
  type ArrowDirection,
  type WASDDirection,
  type PointerState,
} from './user-event-utils';

// Snapshot testing utilities
export {
  // Types
  type SnapshotProviderOptions,
  type SnapshotOptions,
  type SerializerConfig,
  type SnapshotResult,
  type ComparisonOptions,
  // Constants
  DEFAULT_DYNAMIC_ATTRIBUTES,
  CSS_CLASS_PATTERNS_TO_CLEAN,
  SNAPSHOT_EXTENSION,
  // Serializers
  styledComponentsSerializer,
  framerMotionSerializer,
  htmlElementSerializer,
  serializers,
  // Helper functions
  cleanClassName,
  stripDynamicAttributes,
  serializeHTMLElement,
  formatHTML,
  // Provider wrappers
  createProviderWrapper,
  // Snapshot functions
  createComponentSnapshot,
  snapshotWithProviders,
  snapshotVariations,
  assertVariationSnapshots,
  // CI helpers
  isCI,
  getSnapshotUpdateBehavior,
  updateSnapshots,
  // Comparison helpers
  normalizeHTML,
  compareSnapshots as compareSnapshotStrings,
  getSnapshotDiff,
  // File naming
  getSnapshotPath,
  generateSnapshotName,
  // Configuration
  configureSnapshots,
  defaultSnapshotConfig,
} from './snapshot-utils';

// Visual regression testing utilities
export {
  // Config values
  DEFAULT_CONFIG as VISUAL_DEFAULT_CONFIG,
  DEFAULT_THRESHOLD as VISUAL_DEFAULT_THRESHOLD,
  STRICT_THRESHOLD as VISUAL_STRICT_THRESHOLD,
  RELAXED_THRESHOLD as VISUAL_RELAXED_THRESHOLD,
  STANDARD_VIEWPORTS,
  // Config functions
  getViewport,
  getThreshold as getVisualThreshold,
  getSnapshotFilename,
  mergeConfig as mergeVisualConfig,
  parseEnvConfig as parseVisualEnvConfig,
  // State management
  initVisualTesting,
  getConfig as getVisualConfig,
  setConfig as setVisualConfig,
  resetConfig as resetVisualConfig,
  // Registration
  registerComponent,
  registerComponents,
  getRegisteredComponents,
  clearRegistry,
  // Comparison
  compareImages,
  compareSnapshots as compareVisualSnapshots,
  // Screenshot capture
  captureScreenshot,
  captureElement,
  // Test runners
  runVisualTests,
  runComponentTests,
  runViewportTests,
  // Component tester factory
  createComponentTester,
  // Formatting
  formatComparisonResult,
  formatTestSummary,
  generateHtmlReport,
  // Types
  type VisualRegressionConfig,
  type ViewportConfig,
  type DiffThresholdConfig,
  type ComparisonResult,
  type RunVisualTestsOptions,
  type VisualTestSummary,
  type ComponentTestResult,
  type CaptureOptions,
} from '../visual';
