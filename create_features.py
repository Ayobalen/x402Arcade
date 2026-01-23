#!/usr/bin/env python3
"""
Script to create Phase 0 (TDD Infrastructure) and Phase 1 (Project Setup) features
for the x402Arcade project.

Run with: python create_features.py
"""

import sys
sys.path.insert(0, '/Users/mujeeb/autocoder')

from pathlib import Path
from api.database import Feature, create_database

PROJECT_DIR = Path('/Users/mujeeb/Projects/x402Arcade')

# Initialize database
engine, SessionLocal = create_database(PROJECT_DIR)
session = SessionLocal()

# Define all features for Phase 0 and Phase 1
features_data = [
    # ============================================================================
    # Phase 0: TDD Infrastructure - Testing Framework Setup (1-10)
    # ============================================================================
    {
        "priority": 1,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Install and configure Vitest for frontend",
        "description": "Set up Vitest as the primary testing framework for the React frontend. Vitest is chosen for its native ESM support, Vite integration, and fast execution speed.",
        "steps": [
            "Install vitest and related dependencies: pnpm add -D vitest @vitest/ui @vitest/coverage-v8",
            "Create vitest.config.ts in packages/frontend with test configuration",
            "Configure globals: true for describe/it/expect availability",
            "Set up environment: 'jsdom' for browser API mocking",
            "Configure coverage thresholds (80% minimum)",
            "Add test scripts to package.json: test, test:watch, test:coverage",
            "Verify vitest runs with a simple placeholder test"
        ]
    },
    {
        "priority": 2,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Install and configure Jest for backend",
        "description": "Set up Jest as the testing framework for the Express.js backend. Jest provides robust mocking capabilities and is well-suited for Node.js testing.",
        "steps": [
            "Install jest and related dependencies: pnpm add -D jest @types/jest ts-jest",
            "Create jest.config.js in packages/backend with TypeScript preset",
            "Configure moduleNameMapper for path aliases",
            "Set up testEnvironment: 'node'",
            "Configure coverage collection and thresholds (80% minimum)",
            "Add test scripts to package.json: test, test:watch, test:coverage",
            "Verify jest runs with a simple placeholder test"
        ]
    },
    {
        "priority": 3,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up test directory structure for frontend",
        "description": "Create organized test directory structure following testing best practices with co-located and separate test files.",
        "steps": [
            "Create packages/frontend/__tests__/ directory for integration tests",
            "Create packages/frontend/__tests__/components/ for component tests",
            "Create packages/frontend/__tests__/hooks/ for hook tests",
            "Create packages/frontend/__tests__/pages/ for page tests",
            "Create packages/frontend/__tests__/utils/ for utility tests",
            "Create packages/frontend/__tests__/setup.ts for global test setup",
            "Add .gitkeep files to maintain directory structure"
        ]
    },
    {
        "priority": 4,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up test directory structure for backend",
        "description": "Create organized test directory structure for backend following Jest conventions with unit and integration test separation.",
        "steps": [
            "Create packages/backend/__tests__/ directory as test root",
            "Create packages/backend/__tests__/unit/ for unit tests",
            "Create packages/backend/__tests__/integration/ for API integration tests",
            "Create packages/backend/__tests__/fixtures/ for test data factories",
            "Create packages/backend/__tests__/mocks/ for mock implementations",
            "Create packages/backend/__tests__/setup.ts for global test setup",
            "Add .gitkeep files to maintain directory structure"
        ]
    },
    {
        "priority": 5,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Configure test coverage thresholds (80%+)",
        "description": "Set up code coverage reporting with minimum thresholds to ensure adequate test coverage across the codebase.",
        "steps": [
            "Configure Vitest coverage with v8 provider in vitest.config.ts",
            "Set coverage thresholds: branches: 80, functions: 80, lines: 80, statements: 80",
            "Configure Jest coverage thresholds in jest.config.js",
            "Exclude test files, mocks, and config files from coverage",
            "Add coverage directories to .gitignore",
            "Create coverage badge generation script for README",
            "Verify coverage reports generate correctly"
        ]
    },
    {
        "priority": 6,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up test reporters (HTML, JSON)",
        "description": "Configure test reporters for CI/CD integration and local development with multiple output formats.",
        "steps": [
            "Configure Vitest reporters: ['default', 'html', 'json']",
            "Set up HTML report output to coverage/html directory",
            "Configure JSON report output for CI parsing",
            "Set up Jest reporters with similar configuration",
            "Configure JUnit XML output for CI systems",
            "Add report directories to .gitignore",
            "Test reporter output generation"
        ]
    },
    {
        "priority": 7,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Configure test watch mode",
        "description": "Set up watch mode for rapid TDD cycles with intelligent file filtering and re-run capabilities.",
        "steps": [
            "Configure Vitest watch mode with file pattern matching",
            "Set up --changed flag for running tests only on changed files",
            "Configure Jest watch plugins for interactive filtering",
            "Add keyboard shortcuts documentation for watch mode",
            "Configure file ignore patterns for watch mode",
            "Test watch mode with file changes",
            "Document watch mode usage in developer README"
        ]
    },
    {
        "priority": 8,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up CI test scripts",
        "description": "Create npm scripts optimized for CI/CD environments with proper exit codes and parallel execution.",
        "steps": [
            "Add 'test:ci' script for frontend with coverage and no-watch",
            "Add 'test:ci' script for backend with coverage and no-watch",
            "Create root-level 'test:ci:all' script to run all tests",
            "Configure --bail flag for fast failure in CI",
            "Add --max-workers flag for CI parallelization",
            "Create GitHub Actions workflow step for tests",
            "Verify CI scripts work in isolated environment"
        ]
    },
    {
        "priority": 9,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create test utility helpers",
        "description": "Build reusable test utility functions for common testing patterns and assertions.",
        "steps": [
            "Create packages/frontend/__tests__/utils/test-helpers.ts",
            "Add waitForElement() helper for async DOM assertions",
            "Add mockFetch() helper for API call mocking",
            "Add createTestStore() helper for Zustand state testing",
            "Create packages/backend/__tests__/utils/test-helpers.ts",
            "Add createMockRequest() and createMockResponse() for Express",
            "Export all helpers from central index file"
        ]
    },
    {
        "priority": 10,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create mock factories",
        "description": "Build factory functions for generating test data with sensible defaults and override capabilities.",
        "steps": [
            "Create packages/shared/test-utils/factories/ directory",
            "Create createMockUser() factory with wallet address generation",
            "Create createMockGameSession() factory",
            "Create createMockTransaction() factory",
            "Create createMockLeaderboardEntry() factory",
            "Add faker.js or similar for realistic test data",
            "Export all factories from central index"
        ]
    },

    # ============================================================================
    # Phase 0: TDD Infrastructure - Backend Test Infrastructure (11-25)
    # ============================================================================
    {
        "priority": 11,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create database test utilities (in-memory SQLite)",
        "description": "Set up in-memory SQLite database for fast, isolated database testing without file I/O overhead.",
        "steps": [
            "Create packages/backend/__tests__/utils/db-test-utils.ts",
            "Implement createTestDatabase() returning in-memory SQLite connection",
            "Add seedTestData() function for common test scenarios",
            "Implement clearTestDatabase() for test isolation",
            "Add closeTestDatabase() for proper cleanup",
            "Create withTestDatabase() wrapper for automatic setup/teardown",
            "Write tests verifying database isolation between test runs"
        ]
    },
    {
        "priority": 12,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create API test client wrapper",
        "description": "Build a typed API test client that wraps supertest for consistent API testing patterns.",
        "steps": [
            "Create packages/backend/__tests__/utils/api-client.ts",
            "Implement TestApiClient class wrapping supertest",
            "Add typed methods: get<T>(), post<T>(), put<T>(), delete<T>()",
            "Include automatic JSON parsing and type inference",
            "Add authentication header injection support",
            "Implement response assertion helpers",
            "Write tests for the test client itself"
        ]
    },
    {
        "priority": 13,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create authentication test helpers",
        "description": "Build helpers for testing authenticated endpoints with various wallet states and permissions.",
        "steps": [
            "Create packages/backend/__tests__/utils/auth-helpers.ts",
            "Implement createAuthenticatedRequest() with mock wallet signature",
            "Add generateTestWalletAddress() for unique test wallets",
            "Create mockJwtToken() for session token generation",
            "Implement asAdmin(), asUser(), asGuest() context helpers",
            "Add verifyAuthRequired() assertion helper",
            "Write tests demonstrating auth helper usage"
        ]
    },
    {
        "priority": 14,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create x402 payment mock utilities",
        "description": "Build comprehensive mocks for x402 HTTP 402 payment protocol testing without real transactions.",
        "steps": [
            "Create packages/backend/__tests__/mocks/x402-mock.ts",
            "Implement MockX402Server class for payment simulation",
            "Add mockPaymentRequired() to return 402 responses",
            "Create mockPaymentVerified() for successful payment scenarios",
            "Add mockPaymentFailed() for error testing",
            "Implement payment header validation helpers",
            "Write comprehensive tests for x402 mock behavior"
        ]
    },
    {
        "priority": 15,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create blockchain mock utilities",
        "description": "Build mock implementations for Cronos blockchain interactions for deterministic testing.",
        "steps": [
            "Create packages/backend/__tests__/mocks/blockchain-mock.ts",
            "Implement MockWeb3Provider with controlled responses",
            "Add mockTransactionReceipt() for transaction simulation",
            "Create mockContractCall() for smart contract testing",
            "Implement mockBlockNumber() and mockGasPrice()",
            "Add transaction failure simulation capabilities",
            "Write tests verifying mock blockchain behavior"
        ]
    },
    {
        "priority": 16,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create facilitator mock server",
        "description": "Build a mock server simulating the x402 facilitator for end-to-end payment flow testing.",
        "steps": [
            "Create packages/backend/__tests__/mocks/facilitator-mock.ts",
            "Implement MockFacilitatorServer using msw or nock",
            "Add endpoint mocks: /verify, /settle, /refund",
            "Create response generators for various scenarios",
            "Implement latency simulation for timeout testing",
            "Add request logging for test debugging",
            "Write integration tests using mock facilitator"
        ]
    },
    {
        "priority": 17,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up supertest for API testing",
        "description": "Configure supertest for HTTP assertion testing with Express app integration.",
        "steps": [
            "Install supertest: pnpm add -D supertest @types/supertest",
            "Create packages/backend/__tests__/setup/supertest-setup.ts",
            "Implement getTestApp() returning configured Express instance",
            "Add request/response logging for debugging",
            "Configure JSON body parsing for test requests",
            "Set up proper error handling in test mode",
            "Write example API test using supertest"
        ]
    },
    {
        "priority": 18,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create fixture factories for game sessions",
        "description": "Build factory functions for generating game session test data with various states.",
        "steps": [
            "Create packages/backend/__tests__/fixtures/game-session.factory.ts",
            "Implement createGameSession() with default values",
            "Add createActiveSession() for in-progress games",
            "Add createCompletedSession() with score and duration",
            "Create createAbandonedSession() for timeout scenarios",
            "Implement createSessionWithPayment() linking to transactions",
            "Write factory validation tests"
        ]
    },
    {
        "priority": 19,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create fixture factories for leaderboard entries",
        "description": "Build factories for leaderboard test data with ranking and time-based scenarios.",
        "steps": [
            "Create packages/backend/__tests__/fixtures/leaderboard.factory.ts",
            "Implement createLeaderboardEntry() with default values",
            "Add createDailyLeaderboard() generating sorted entries",
            "Add createWeeklyLeaderboard() with date ranges",
            "Create createAllTimeLeaderboard() for persistent rankings",
            "Implement createTiedEntries() for tie-breaking tests",
            "Write factory validation tests"
        ]
    },
    {
        "priority": 20,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create fixture factories for prize pools",
        "description": "Build factories for prize pool configurations and payout scenarios.",
        "steps": [
            "Create packages/backend/__tests__/fixtures/prize-pool.factory.ts",
            "Implement createPrizePool() with default distribution",
            "Add createActivePrizePool() with accumulated fees",
            "Add createDistributedPrizePool() for post-payout state",
            "Create createCustomDistribution() for varied prize splits",
            "Implement createEmptyPrizePool() for edge case testing",
            "Write factory validation tests"
        ]
    },
    {
        "priority": 21,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create fixture factories for payments",
        "description": "Build factories for x402 payment transactions with various states and amounts.",
        "steps": [
            "Create packages/backend/__tests__/fixtures/payment.factory.ts",
            "Implement createPayment() with default CRO amount",
            "Add createPendingPayment() for unverified transactions",
            "Add createVerifiedPayment() for completed transactions",
            "Create createFailedPayment() for error scenarios",
            "Implement createRefundedPayment() for refund testing",
            "Write factory validation tests"
        ]
    },
    {
        "priority": 22,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up test database seeding",
        "description": "Create seeding utilities for populating test databases with realistic data scenarios.",
        "steps": [
            "Create packages/backend/__tests__/utils/seed-helpers.ts",
            "Implement seedMinimalData() for basic test scenarios",
            "Add seedFullLeaderboard() with ranked entries",
            "Create seedActiveGames() with in-progress sessions",
            "Add seedPaymentHistory() with transaction records",
            "Implement seedForScenario(name) for named scenarios",
            "Write tests verifying seed data integrity"
        ]
    },
    {
        "priority": 23,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create test cleanup utilities",
        "description": "Build utilities for proper test cleanup ensuring complete isolation between tests.",
        "steps": [
            "Create packages/backend/__tests__/utils/cleanup-helpers.ts",
            "Implement clearAllTables() for database reset",
            "Add clearMockServers() for HTTP mock cleanup",
            "Create resetEnvironment() for env var restoration",
            "Add cleanupTimers() for setTimeout/setInterval cleanup",
            "Implement globalTeardown() for Jest afterAll hook",
            "Write tests verifying complete cleanup"
        ]
    },
    {
        "priority": 24,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Configure test environment variables",
        "description": "Set up test-specific environment configuration with secure defaults.",
        "steps": [
            "Create packages/backend/.env.test with test configuration",
            "Set DATABASE_URL to :memory: for in-memory SQLite",
            "Configure test JWT_SECRET with static value for determinism",
            "Set FACILITATOR_URL to mock server address",
            "Add NODE_ENV=test for conditional logic",
            "Create loadTestEnv() helper for env loading",
            "Document required test environment variables"
        ]
    },
    {
        "priority": 25,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create integration test harness",
        "description": "Build a comprehensive test harness for full-stack integration testing.",
        "steps": [
            "Create packages/backend/__tests__/integration/harness.ts",
            "Implement IntegrationTestHarness class",
            "Add setup(): Promise<void> starting all services",
            "Add teardown(): Promise<void> for cleanup",
            "Include database, mock servers, and app initialization",
            "Add getClient() returning configured API client",
            "Write example integration test using harness"
        ]
    },

    # ============================================================================
    # Phase 0: TDD Infrastructure - Frontend Test Infrastructure (26-45)
    # ============================================================================
    {
        "priority": 26,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up React Testing Library",
        "description": "Configure React Testing Library for component testing with user-centric queries.",
        "steps": [
            "Install dependencies: pnpm add -D @testing-library/react @testing-library/jest-dom",
            "Create packages/frontend/__tests__/setup.ts with RTL configuration",
            "Import and extend jest-dom matchers globally",
            "Configure cleanup after each test",
            "Set up custom render function with providers",
            "Add screen and within exports",
            "Write example component test"
        ]
    },
    {
        "priority": 27,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Configure jsdom environment",
        "description": "Set up jsdom for browser API simulation in Node.js test environment.",
        "steps": [
            "Configure vitest.config.ts with environment: 'jsdom'",
            "Add jsdom-specific setup in test setup file",
            "Mock window.matchMedia for responsive tests",
            "Mock IntersectionObserver for visibility testing",
            "Mock ResizeObserver for resize event testing",
            "Add localStorage and sessionStorage mocks",
            "Verify DOM APIs work in tests"
        ]
    },
    {
        "priority": 28,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create component test utilities",
        "description": "Build reusable utilities for testing React components with common patterns.",
        "steps": [
            "Create packages/frontend/__tests__/utils/component-utils.ts",
            "Implement customRender() with all providers wrapped",
            "Add renderWithRouter() for routing context",
            "Create renderWithStore() for state management context",
            "Add renderWithWallet() for Web3 provider context",
            "Implement renderWithAll() combining all contexts",
            "Write tests demonstrating utility usage"
        ]
    },
    {
        "priority": 29,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create hook test utilities",
        "description": "Set up utilities for testing custom React hooks in isolation.",
        "steps": [
            "Install @testing-library/react-hooks if not using React 18",
            "Create packages/frontend/__tests__/utils/hook-utils.ts",
            "Implement renderHookWithProviders() with context wrapping",
            "Add waitForHook() for async hook assertions",
            "Create mockHookDependencies() for injection testing",
            "Add actWithTimers() for timer-based hooks",
            "Write example hook test"
        ]
    },
    {
        "priority": 30,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create store test utilities",
        "description": "Build utilities for testing Zustand stores with controlled initial state.",
        "steps": [
            "Create packages/frontend/__tests__/utils/store-utils.ts",
            "Implement createTestStore() returning fresh store instance",
            "Add withInitialState() for controlled state setup",
            "Create mockSelector() for isolated selector testing",
            "Implement storeSnapshot() for state assertions",
            "Add resetAllStores() for cleanup between tests",
            "Write store testing examples"
        ]
    },
    {
        "priority": 31,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create wallet mock utilities",
        "description": "Build comprehensive mocks for wallet connection and transaction testing.",
        "steps": [
            "Create packages/frontend/__tests__/mocks/wallet-mock.ts",
            "Implement MockWalletProvider simulating wallet connection",
            "Add mockConnectedWallet() for authenticated state",
            "Create mockDisconnectedWallet() for unauthenticated state",
            "Add mockWalletError() for connection failure testing",
            "Implement mockSignMessage() for signature testing",
            "Write tests verifying mock behavior"
        ]
    },
    {
        "priority": 32,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create Web3 provider mocks",
        "description": "Build mock implementations for Web3 provider interactions.",
        "steps": [
            "Create packages/frontend/__tests__/mocks/web3-provider-mock.ts",
            "Implement MockEthereumProvider for window.ethereum",
            "Add request() method handling common RPC calls",
            "Mock eth_accounts, eth_chainId, eth_requestAccounts",
            "Add event emission for accountsChanged, chainChanged",
            "Implement network switching simulation",
            "Write provider mock tests"
        ]
    },
    {
        "priority": 33,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create canvas/WebGL test mocks",
        "description": "Set up mocks for HTML5 Canvas and WebGL APIs for game rendering tests.",
        "steps": [
            "Create packages/frontend/__tests__/mocks/canvas-mock.ts",
            "Implement createMockCanvas() with getContext() support",
            "Add 2D context mock with drawing method stubs",
            "Create WebGL context mock for Three.js compatibility",
            "Mock requestAnimationFrame and cancelAnimationFrame",
            "Add performance.now() mock for timing tests",
            "Write canvas mock verification tests"
        ]
    },
    {
        "priority": 34,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create animation test utilities",
        "description": "Build utilities for testing Framer Motion and CSS animations.",
        "steps": [
            "Create packages/frontend/__tests__/utils/animation-utils.ts",
            "Implement mockFramerMotion() to skip animations in tests",
            "Add waitForAnimation() for animation completion testing",
            "Create assertAnimationState() for animation assertions",
            "Mock CSS transition events: transitionend, animationend",
            "Add disableAnimations() for faster test runs",
            "Write animation testing examples"
        ]
    },
    {
        "priority": 35,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create 3D renderer test mocks",
        "description": "Set up mocks for Three.js and React Three Fiber rendering.",
        "steps": [
            "Create packages/frontend/__tests__/mocks/three-mock.ts",
            "Mock THREE namespace with essential classes",
            "Implement MockWebGLRenderer with render() stub",
            "Mock Scene, Camera, and Light classes",
            "Add geometry and material class mocks",
            "Create Canvas mock for @react-three/fiber",
            "Write 3D component test example"
        ]
    },
    {
        "priority": 36,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up MSW for API mocking",
        "description": "Configure Mock Service Worker for API mocking at the network level.",
        "steps": [
            "Install msw: pnpm add -D msw",
            "Create packages/frontend/__tests__/mocks/server.ts",
            "Initialize MSW with setupServer()",
            "Configure server.listen() in test setup",
            "Add server.close() in test teardown",
            "Add server.resetHandlers() between tests",
            "Write example test using MSW"
        ]
    },
    {
        "priority": 37,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create API mock handlers",
        "description": "Build MSW request handlers for all backend API endpoints.",
        "steps": [
            "Create packages/frontend/__tests__/mocks/handlers/index.ts",
            "Implement auth handlers: login, logout, verify",
            "Add game handlers: start, action, complete",
            "Create leaderboard handlers: list, personal, submit",
            "Add payment handlers: initiate, verify, history",
            "Implement error handlers for failure testing",
            "Export combined handlers array"
        ]
    },
    {
        "priority": 38,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create user event helpers",
        "description": "Set up @testing-library/user-event for realistic user interaction testing.",
        "steps": [
            "Install @testing-library/user-event: pnpm add -D @testing-library/user-event",
            "Create packages/frontend/__tests__/utils/user-event-utils.ts",
            "Configure userEvent.setup() with default options",
            "Export typed user event instance",
            "Add helpers for common interactions: type, click, select",
            "Create keyboard shortcut simulation helpers",
            "Write user interaction test examples"
        ]
    },
    {
        "priority": 39,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create accessibility testing setup (jest-axe)",
        "description": "Configure automated accessibility testing with jest-axe.",
        "steps": [
            "Install jest-axe: pnpm add -D jest-axe @types/jest-axe",
            "Create packages/frontend/__tests__/utils/a11y-utils.ts",
            "Configure axe-core with relevant rules",
            "Add toHaveNoViolations matcher",
            "Create checkA11y() helper for common assertions",
            "Configure rule exceptions for known issues",
            "Write accessibility test examples"
        ]
    },
    {
        "priority": 40,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create visual regression setup",
        "description": "Set up visual regression testing for UI consistency verification.",
        "steps": [
            "Install @storybook/test-runner or similar tool",
            "Create packages/frontend/__tests__/visual/ directory",
            "Configure snapshot comparison settings",
            "Set up baseline image directory",
            "Add diff threshold configuration",
            "Create runVisualTests() helper script",
            "Document visual regression workflow"
        ]
    },
    {
        "priority": 41,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create snapshot testing utilities",
        "description": "Build utilities for component snapshot testing with serializers.",
        "steps": [
            "Create packages/frontend/__tests__/utils/snapshot-utils.ts",
            "Configure custom snapshot serializers for styled components",
            "Add snapshotWithProviders() for context-wrapped snapshots",
            "Create updateSnapshots() helper for CI",
            "Configure snapshot file naming conventions",
            "Add snapshot comparison options",
            "Write snapshot testing examples"
        ]
    },
    {
        "priority": 42,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up Storybook for component development",
        "description": "Configure Storybook for isolated component development and documentation.",
        "steps": [
            "Install Storybook: npx storybook@latest init",
            "Configure for Vite in packages/frontend/.storybook/main.ts",
            "Set up TypeScript support with ts-loader",
            "Configure Tailwind CSS in preview",
            "Add global decorators for providers",
            "Create .storybook/preview.ts with theme configuration",
            "Write first component story"
        ]
    },
    {
        "priority": 43,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Configure Storybook addons",
        "description": "Set up essential Storybook addons for enhanced development experience.",
        "steps": [
            "Install @storybook/addon-essentials (actions, controls, docs)",
            "Add @storybook/addon-a11y for accessibility checks",
            "Install @storybook/addon-interactions for play functions",
            "Configure @storybook/addon-viewport for responsive testing",
            "Add @storybook/addon-themes for dark mode testing",
            "Configure addon settings in main.ts",
            "Verify all addons load correctly"
        ]
    },
    {
        "priority": 44,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create Storybook decorators",
        "description": "Build reusable decorators for consistent story rendering contexts.",
        "steps": [
            "Create packages/frontend/.storybook/decorators/index.ts",
            "Implement withTheme decorator for dark theme",
            "Add withRouter decorator for navigation context",
            "Create withStore decorator for state management",
            "Add withWallet decorator for Web3 context",
            "Implement withI18n decorator if using translations",
            "Apply decorators in preview.ts"
        ]
    },
    {
        "priority": 45,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create interaction testing setup",
        "description": "Set up Storybook interaction testing for component behavior verification.",
        "steps": [
            "Install @storybook/test for interaction testing",
            "Create interaction test template file",
            "Configure test-runner in package.json",
            "Add play() function examples to stories",
            "Set up assertions with expect()",
            "Configure CI integration for interaction tests",
            "Write comprehensive interaction test example"
        ]
    },

    # ============================================================================
    # Phase 0: TDD Infrastructure - E2E Testing Setup (46-55)
    # ============================================================================
    {
        "priority": 46,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Install and configure Playwright",
        "description": "Set up Playwright for cross-browser end-to-end testing with TypeScript support.",
        "steps": [
            "Install Playwright: pnpm add -D @playwright/test",
            "Run npx playwright install to download browsers",
            "Create playwright.config.ts in repository root",
            "Configure projects for chromium, firefox, webkit",
            "Set base URL for local development server",
            "Configure screenshot and trace settings",
            "Add test scripts to root package.json"
        ]
    },
    {
        "priority": 47,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up E2E test directory structure",
        "description": "Create organized directory structure for E2E tests following Playwright conventions.",
        "steps": [
            "Create e2e/ directory in repository root",
            "Create e2e/tests/ for test specifications",
            "Create e2e/fixtures/ for test fixtures",
            "Create e2e/pages/ for page object models",
            "Create e2e/utils/ for helper functions",
            "Create e2e/data/ for test data",
            "Add .gitkeep files to maintain structure"
        ]
    },
    {
        "priority": 48,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create page object models base class",
        "description": "Build base class for page object models with common functionality.",
        "steps": [
            "Create e2e/pages/BasePage.ts",
            "Implement constructor accepting Page instance",
            "Add navigate(path) method for URL navigation",
            "Add waitForLoad() method for page load waiting",
            "Implement getByTestId() helper for data-testid queries",
            "Add screenshot() method for debugging",
            "Create type definitions for common elements"
        ]
    },
    {
        "priority": 49,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create wallet connection page object",
        "description": "Build page object for testing wallet connection flows.",
        "steps": [
            "Create e2e/pages/WalletConnectionPage.ts extending BasePage",
            "Add connectWalletButton locator",
            "Implement clickConnectWallet() method",
            "Add selectWalletProvider(name) method",
            "Create waitForConnection() assertion",
            "Add disconnectWallet() method",
            "Implement isConnected() check"
        ]
    },
    {
        "priority": 50,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create game lobby page object",
        "description": "Build page object for testing game lobby interactions.",
        "steps": [
            "Create e2e/pages/GameLobbyPage.ts extending BasePage",
            "Add game card locators",
            "Implement selectGame(name) method",
            "Add waitForGamesToLoad() method",
            "Create getGameCount() method",
            "Implement searchGames(query) method",
            "Add filterByCategory(category) method"
        ]
    },
    {
        "priority": 51,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create game play page object",
        "description": "Build page object for testing in-game interactions and controls.",
        "steps": [
            "Create e2e/pages/GamePlayPage.ts extending BasePage",
            "Add game canvas locator",
            "Implement startGame() method",
            "Add pauseGame() and resumeGame() methods",
            "Create submitScore() method",
            "Implement getScore() method",
            "Add quitGame() method"
        ]
    },
    {
        "priority": 52,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create leaderboard page object",
        "description": "Build page object for testing leaderboard display and interactions.",
        "steps": [
            "Create e2e/pages/LeaderboardPage.ts extending BasePage",
            "Add leaderboard table locator",
            "Implement getTopEntries(count) method",
            "Add switchTimeRange(range) method for daily/weekly/all-time",
            "Create getPersonalRank() method",
            "Implement scrollToRank(rank) method",
            "Add getEntryDetails(rank) method"
        ]
    },
    {
        "priority": 53,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Configure E2E test fixtures",
        "description": "Set up Playwright fixtures for common test setup and teardown.",
        "steps": [
            "Create e2e/fixtures/base.fixture.ts",
            "Implement authenticatedPage fixture with wallet mock",
            "Add testDatabase fixture for data isolation",
            "Create mockApi fixture for API stubbing",
            "Implement gameContext fixture for game state",
            "Add slowMotion fixture for debugging",
            "Export combined fixtures"
        ]
    },
    {
        "priority": 54,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Set up E2E test database",
        "description": "Configure isolated test database for E2E tests with seeding capabilities.",
        "steps": [
            "Create e2e/utils/test-database.ts",
            "Implement seedTestDatabase() function",
            "Add clearTestDatabase() for cleanup",
            "Create predefined test scenarios: emptyState, withLeaderboard, withActiveGame",
            "Implement resetToScenario(name) helper",
            "Add database state verification helpers",
            "Configure database URL for E2E environment"
        ]
    },
    {
        "priority": 55,
        "category": "Phase 0: TDD Infrastructure",
        "name": "Create E2E visual comparison utilities",
        "description": "Build utilities for visual snapshot comparison in E2E tests.",
        "steps": [
            "Create e2e/utils/visual-utils.ts",
            "Configure Playwright screenshot settings",
            "Implement compareScreenshot(name) helper",
            "Add updateBaseline(name) for baseline refresh",
            "Create mask() helper for dynamic content",
            "Configure diff threshold and directory",
            "Write visual comparison test example"
        ]
    },

    # ============================================================================
    # Phase 1: Project Setup - Monorepo Setup (56-65)
    # ============================================================================
    {
        "priority": 56,
        "category": "Phase 1: Project Setup",
        "name": "Initialize root package.json with workspaces",
        "description": "Create root package.json configured for pnpm workspaces monorepo structure.",
        "steps": [
            "Create package.json in repository root",
            "Set name to '@x402arcade/monorepo' and private: true",
            "Configure workspaces array: ['packages/*', 'e2e']",
            "Add packageManager field specifying pnpm version",
            "Add root-level scripts: build, test, lint, dev",
            "Configure engines with node and pnpm version requirements",
            "Run pnpm install to verify workspace setup"
        ]
    },
    {
        "priority": 57,
        "category": "Phase 1: Project Setup",
        "name": "Configure pnpm workspaces",
        "description": "Set up pnpm-workspace.yaml for workspace package discovery and configuration.",
        "steps": [
            "Create pnpm-workspace.yaml in repository root",
            "Configure packages: ['packages/*', 'e2e']",
            "Create packages/ directory",
            "Create packages/frontend/ directory",
            "Create packages/backend/ directory",
            "Create packages/shared/ directory for common code",
            "Verify workspace detection with pnpm list"
        ]
    },
    {
        "priority": 58,
        "category": "Phase 1: Project Setup",
        "name": "Set up shared TypeScript config",
        "description": "Create base TypeScript configuration for consistent compiler settings across packages.",
        "steps": [
            "Create tsconfig.base.json in repository root",
            "Configure compilerOptions: strict: true, esModuleInterop: true",
            "Set target: 'ES2022' and module: 'NodeNext'",
            "Enable declaration and declarationMap for type exports",
            "Configure paths for @x402arcade/* imports",
            "Add skipLibCheck: true for faster compilation",
            "Document configuration choices in comments"
        ]
    },
    {
        "priority": 59,
        "category": "Phase 1: Project Setup",
        "name": "Set up shared ESLint config",
        "description": "Create shared ESLint configuration for consistent code style across all packages.",
        "steps": [
            "Install ESLint: pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin",
            "Create .eslintrc.js in repository root",
            "Configure TypeScript parser and plugin",
            "Add rules for code quality: no-unused-vars, no-console warn",
            "Configure import ordering rules",
            "Add ignorePatterns for dist, node_modules",
            "Add lint script to root package.json"
        ]
    },
    {
        "priority": 60,
        "category": "Phase 1: Project Setup",
        "name": "Set up shared Prettier config",
        "description": "Configure Prettier for consistent code formatting across the monorepo.",
        "steps": [
            "Install Prettier: pnpm add -D prettier",
            "Create .prettierrc in repository root",
            "Configure: semi: true, singleQuote: true, tabWidth: 2",
            "Add trailingComma: 'es5' for cleaner diffs",
            "Create .prettierignore for build outputs",
            "Add format script to root package.json",
            "Verify Prettier works with ESLint"
        ]
    },
    {
        "priority": 61,
        "category": "Phase 1: Project Setup",
        "name": "Configure Husky pre-commit hooks",
        "description": "Set up Husky for Git hooks to enforce code quality on commits.",
        "steps": [
            "Install Husky: pnpm add -D husky",
            "Run npx husky install to initialize",
            "Add prepare script: 'husky install' to package.json",
            "Create .husky/pre-commit hook file",
            "Add lint-staged execution to pre-commit hook",
            "Ensure hooks are executable (chmod +x)",
            "Test hook triggers on commit"
        ]
    },
    {
        "priority": 62,
        "category": "Phase 1: Project Setup",
        "name": "Configure lint-staged",
        "description": "Set up lint-staged for running linters only on staged files.",
        "steps": [
            "Install lint-staged: pnpm add -D lint-staged",
            "Create .lintstagedrc in repository root",
            "Configure *.ts,*.tsx: ['eslint --fix', 'prettier --write']",
            "Add *.json: 'prettier --write'",
            "Add *.md: 'prettier --write'",
            "Configure to run type checking on staged files",
            "Test lint-staged with a staged file"
        ]
    },
    {
        "priority": 63,
        "category": "Phase 1: Project Setup",
        "name": "Set up commitlint for conventional commits",
        "description": "Configure commitlint to enforce conventional commit message format.",
        "steps": [
            "Install commitlint: pnpm add -D @commitlint/cli @commitlint/config-conventional",
            "Create commitlint.config.js extending conventional config",
            "Create .husky/commit-msg hook",
            "Add commitlint execution to commit-msg hook",
            "Configure allowed scopes: frontend, backend, shared, e2e",
            "Document commit message format in CONTRIBUTING.md",
            "Test commit validation"
        ]
    },
    {
        "priority": 64,
        "category": "Phase 1: Project Setup",
        "name": "Create shared constants package",
        "description": "Create a shared package for constants used across frontend and backend.",
        "steps": [
            "Create packages/shared/package.json with name @x402arcade/shared",
            "Create packages/shared/src/constants/index.ts",
            "Add game configuration constants: MAX_SCORE, GAME_DURATION",
            "Add payment constants: MIN_PAYMENT, MAX_PAYMENT, PAYMENT_TOKEN",
            "Add API constants: API_VERSION, ERROR_CODES",
            "Create packages/shared/tsconfig.json extending base",
            "Export all constants from package index"
        ]
    },
    {
        "priority": 65,
        "category": "Phase 1: Project Setup",
        "name": "Create shared types package",
        "description": "Create a shared package for TypeScript types used across packages.",
        "steps": [
            "Create packages/shared/src/types/index.ts",
            "Define User interface with wallet address and profile",
            "Define GameSession interface with state and score",
            "Define LeaderboardEntry interface",
            "Define PaymentTransaction interface",
            "Define API response wrapper types",
            "Export all types from package index"
        ]
    },

    # ============================================================================
    # Phase 1: Project Setup - Backend Project Setup (66-80)
    # ============================================================================
    {
        "priority": 66,
        "category": "Phase 1: Project Setup",
        "name": "Initialize backend package.json",
        "description": "Create package.json for the backend Express.js application.",
        "steps": [
            "Create packages/backend/package.json",
            "Set name to '@x402arcade/backend'",
            "Add dependencies: express, cors, helmet, dotenv",
            "Add devDependencies: typescript, ts-node, nodemon, @types/express",
            "Configure scripts: dev, build, start, test",
            "Set main entry point to dist/index.js",
            "Add @x402arcade/shared as workspace dependency"
        ]
    },
    {
        "priority": 67,
        "category": "Phase 1: Project Setup",
        "name": "Configure backend TypeScript (strict mode)",
        "description": "Set up TypeScript configuration for backend with strict type checking.",
        "steps": [
            "Create packages/backend/tsconfig.json extending base config",
            "Set compilerOptions: outDir: 'dist', rootDir: 'src'",
            "Enable strictNullChecks and noImplicitAny",
            "Configure module: 'NodeNext' for ESM",
            "Set target: 'ES2022' for modern Node.js",
            "Add include: ['src/**/*'] and exclude: ['node_modules', 'dist']",
            "Verify compilation with pnpm build"
        ]
    },
    {
        "priority": 68,
        "category": "Phase 1: Project Setup",
        "name": "Set up backend ESLint with Express rules",
        "description": "Configure ESLint for backend with Express.js specific rules.",
        "steps": [
            "Create packages/backend/.eslintrc.js extending root config",
            "Add Node.js environment configuration",
            "Configure rules for async error handling",
            "Add security rules: no-eval, no-implied-eval",
            "Configure import rules for CommonJS/ESM",
            "Add Express-specific plugins if available",
            "Verify lint passes on empty src directory"
        ]
    },
    {
        "priority": 69,
        "category": "Phase 1: Project Setup",
        "name": "Configure backend path aliases",
        "description": "Set up path aliases for cleaner imports in backend code.",
        "steps": [
            "Update packages/backend/tsconfig.json with paths",
            "Add '@/*': ['./src/*'] mapping",
            "Add '@config/*': ['./src/config/*'] mapping",
            "Add '@routes/*': ['./src/routes/*'] mapping",
            "Install tsconfig-paths for runtime resolution",
            "Update package.json start script with tsconfig-paths",
            "Verify path aliases work in test file"
        ]
    },
    {
        "priority": 70,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (config/)",
        "description": "Create configuration directory with environment and app config files.",
        "steps": [
            "Create packages/backend/src/config/ directory",
            "Create packages/backend/src/config/index.ts exporting all configs",
            "Create packages/backend/src/config/env.ts for environment loading",
            "Create packages/backend/src/config/database.ts for DB config",
            "Create packages/backend/src/config/cors.ts for CORS settings",
            "Create packages/backend/src/config/x402.ts for payment config",
            "Add type-safe environment variable access"
        ]
    },
    {
        "priority": 71,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (db/)",
        "description": "Create database directory for SQLite connection and migrations.",
        "steps": [
            "Create packages/backend/src/db/ directory",
            "Create packages/backend/src/db/index.ts for connection export",
            "Create packages/backend/src/db/connection.ts for SQLite setup",
            "Create packages/backend/src/db/migrations/ directory",
            "Create packages/backend/src/db/seeds/ directory",
            "Add better-sqlite3 or sql.js dependency",
            "Implement getDatabase() singleton pattern"
        ]
    },
    {
        "priority": 72,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (middleware/)",
        "description": "Create middleware directory for Express middleware functions.",
        "steps": [
            "Create packages/backend/src/middleware/ directory",
            "Create packages/backend/src/middleware/index.ts exporting all middleware",
            "Create packages/backend/src/middleware/auth.ts for authentication",
            "Create packages/backend/src/middleware/x402.ts for payment middleware",
            "Create packages/backend/src/middleware/error.ts for error handling",
            "Create packages/backend/src/middleware/logging.ts for request logging",
            "Add placeholder implementations"
        ]
    },
    {
        "priority": 73,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (routes/)",
        "description": "Create routes directory for Express route handlers.",
        "steps": [
            "Create packages/backend/src/routes/ directory",
            "Create packages/backend/src/routes/index.ts combining all routes",
            "Create packages/backend/src/routes/auth.ts for authentication routes",
            "Create packages/backend/src/routes/games.ts for game routes",
            "Create packages/backend/src/routes/leaderboard.ts for leaderboard routes",
            "Create packages/backend/src/routes/payments.ts for payment routes",
            "Add route file templates with TODOs"
        ]
    },
    {
        "priority": 74,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (services/)",
        "description": "Create services directory for business logic layer.",
        "steps": [
            "Create packages/backend/src/services/ directory",
            "Create packages/backend/src/services/index.ts exporting all services",
            "Create packages/backend/src/services/auth.service.ts",
            "Create packages/backend/src/services/game.service.ts",
            "Create packages/backend/src/services/leaderboard.service.ts",
            "Create packages/backend/src/services/payment.service.ts",
            "Add service class templates"
        ]
    },
    {
        "priority": 75,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (types/)",
        "description": "Create types directory for backend-specific TypeScript types.",
        "steps": [
            "Create packages/backend/src/types/ directory",
            "Create packages/backend/src/types/index.ts exporting all types",
            "Create packages/backend/src/types/express.d.ts for Express augmentation",
            "Create packages/backend/src/types/database.ts for DB schema types",
            "Create packages/backend/src/types/x402.ts for payment types",
            "Create packages/backend/src/types/api.ts for request/response types",
            "Re-export @x402arcade/shared types"
        ]
    },
    {
        "priority": 76,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (utils/)",
        "description": "Create utilities directory for helper functions.",
        "steps": [
            "Create packages/backend/src/utils/ directory",
            "Create packages/backend/src/utils/index.ts exporting all utilities",
            "Create packages/backend/src/utils/crypto.ts for signing/verification",
            "Create packages/backend/src/utils/validation.ts for input validation",
            "Create packages/backend/src/utils/response.ts for response helpers",
            "Create packages/backend/src/utils/logger.ts for logging utility",
            "Add placeholder implementations"
        ]
    },
    {
        "priority": 77,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (validators/)",
        "description": "Create validators directory for request validation schemas.",
        "steps": [
            "Create packages/backend/src/validators/ directory",
            "Install zod for schema validation: pnpm add zod",
            "Create packages/backend/src/validators/index.ts",
            "Create packages/backend/src/validators/auth.validator.ts",
            "Create packages/backend/src/validators/game.validator.ts",
            "Create packages/backend/src/validators/payment.validator.ts",
            "Add Zod schema templates"
        ]
    },
    {
        "priority": 78,
        "category": "Phase 1: Project Setup",
        "name": "Create backend directory structure (__tests__/)",
        "description": "Create test directory following Jest conventions.",
        "steps": [
            "Create packages/backend/__tests__/ directory",
            "Create packages/backend/__tests__/unit/ for unit tests",
            "Create packages/backend/__tests__/integration/ for API tests",
            "Create packages/backend/__tests__/fixtures/ for test data",
            "Create packages/backend/__tests__/mocks/ for mock implementations",
            "Create packages/backend/__tests__/setup.ts for Jest setup",
            "Add placeholder test file"
        ]
    },
    {
        "priority": 79,
        "category": "Phase 1: Project Setup",
        "name": "Set up nodemon/tsx watch mode",
        "description": "Configure hot reload for backend development.",
        "steps": [
            "Install tsx for TypeScript execution: pnpm add -D tsx",
            "Create nodemon.json in packages/backend",
            "Configure watch: ['src'] and ext: 'ts,json'",
            "Set exec: 'tsx src/index.ts'",
            "Add delay for debouncing file changes",
            "Update dev script in package.json to use nodemon",
            "Verify watch mode restarts on file changes"
        ]
    },
    {
        "priority": 80,
        "category": "Phase 1: Project Setup",
        "name": "Create backend build scripts",
        "description": "Set up build scripts for production deployment.",
        "steps": [
            "Configure tsc build in package.json",
            "Add build:clean script to remove dist directory",
            "Create build:types script for declaration files",
            "Add prebuild hook for cleaning",
            "Configure postbuild for copying non-TS files",
            "Add start:prod script for production execution",
            "Verify production build and execution"
        ]
    },

    # ============================================================================
    # Phase 1: Project Setup - Frontend Project Setup (81-95)
    # ============================================================================
    {
        "priority": 81,
        "category": "Phase 1: Project Setup",
        "name": "Initialize Vite + React + TypeScript project",
        "description": "Create frontend package with Vite, React 18, and TypeScript.",
        "steps": [
            "Run pnpm create vite@latest in packages/frontend",
            "Select React and TypeScript template",
            "Update package.json name to '@x402arcade/frontend'",
            "Add @x402arcade/shared as workspace dependency",
            "Install additional dependencies: react-router-dom, zustand",
            "Clean up default Vite template files",
            "Verify dev server starts successfully"
        ]
    },
    {
        "priority": 82,
        "category": "Phase 1: Project Setup",
        "name": "Configure frontend TypeScript (strict mode)",
        "description": "Set up TypeScript configuration for frontend with strict type checking.",
        "steps": [
            "Update packages/frontend/tsconfig.json extending base config",
            "Enable strict: true and strictNullChecks",
            "Configure jsx: 'react-jsx' for React 18",
            "Set moduleResolution: 'bundler' for Vite",
            "Add DOM and DOM.Iterable to lib array",
            "Configure paths for @ alias",
            "Verify type checking with pnpm tsc --noEmit"
        ]
    },
    {
        "priority": 83,
        "category": "Phase 1: Project Setup",
        "name": "Set up frontend ESLint with React rules",
        "description": "Configure ESLint for React with hooks rules and accessibility.",
        "steps": [
            "Install React ESLint plugins: eslint-plugin-react, eslint-plugin-react-hooks",
            "Install accessibility plugin: eslint-plugin-jsx-a11y",
            "Create packages/frontend/.eslintrc.js extending root config",
            "Configure React version detection",
            "Enable exhaustive-deps rule for hooks",
            "Add accessibility rules",
            "Verify lint passes on template files"
        ]
    },
    {
        "priority": 84,
        "category": "Phase 1: Project Setup",
        "name": "Configure Tailwind CSS",
        "description": "Set up Tailwind CSS with custom theme for crypto/gaming aesthetic.",
        "steps": [
            "Install Tailwind CSS: pnpm add -D tailwindcss postcss autoprefixer",
            "Run npx tailwindcss init -p to generate configs",
            "Configure content paths in tailwind.config.js",
            "Add custom colors for crypto dark theme",
            "Configure custom fonts: Inter, JetBrains Mono",
            "Add custom animations for gaming effects",
            "Update index.css with Tailwind directives"
        ]
    },
    {
        "priority": 85,
        "category": "Phase 1: Project Setup",
        "name": "Configure PostCSS with autoprefixer",
        "description": "Set up PostCSS with necessary plugins for production CSS.",
        "steps": [
            "Update postcss.config.js with Tailwind and autoprefixer",
            "Add cssnano for production minification",
            "Configure browser support in package.json browserslist",
            "Add postcss-import for CSS imports",
            "Configure CSS source maps for development",
            "Verify PostCSS processing works",
            "Document PostCSS plugin purposes"
        ]
    },
    {
        "priority": 86,
        "category": "Phase 1: Project Setup",
        "name": "Set up CSS custom properties for theming",
        "description": "Create CSS custom properties system for consistent theming.",
        "steps": [
            "Create packages/frontend/src/styles/variables.css",
            "Define color tokens: --color-bg-main: #0F0F1A",
            "Add accent colors: --color-primary: #8B5CF6",
            "Define spacing scale: --space-1 through --space-12",
            "Add typography tokens: --font-sans, --font-mono",
            "Create animation duration tokens",
            "Import variables in index.css"
        ]
    },
    {
        "priority": 87,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (components/)",
        "description": "Create organized component directory with atomic design structure.",
        "steps": [
            "Create packages/frontend/src/components/ directory",
            "Create packages/frontend/src/components/ui/ for primitive components",
            "Create packages/frontend/src/components/layout/ for layout components",
            "Create packages/frontend/src/components/game/ for game-specific components",
            "Create packages/frontend/src/components/wallet/ for Web3 components",
            "Add index.ts barrel exports in each directory",
            "Add .gitkeep files to maintain structure"
        ]
    },
    {
        "priority": 88,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (hooks/)",
        "description": "Create hooks directory for custom React hooks.",
        "steps": [
            "Create packages/frontend/src/hooks/ directory",
            "Create packages/frontend/src/hooks/index.ts for exports",
            "Create packages/frontend/src/hooks/useWallet.ts placeholder",
            "Create packages/frontend/src/hooks/useGame.ts placeholder",
            "Create packages/frontend/src/hooks/useLeaderboard.ts placeholder",
            "Create packages/frontend/src/hooks/usePayment.ts placeholder",
            "Add hook file templates with TODOs"
        ]
    },
    {
        "priority": 89,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (store/)",
        "description": "Create store directory for Zustand state management.",
        "steps": [
            "Create packages/frontend/src/store/ directory",
            "Create packages/frontend/src/store/index.ts for store exports",
            "Create packages/frontend/src/store/walletStore.ts",
            "Create packages/frontend/src/store/gameStore.ts",
            "Create packages/frontend/src/store/uiStore.ts for UI state",
            "Add Zustand store templates with types",
            "Document store organization pattern"
        ]
    },
    {
        "priority": 90,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (pages/)",
        "description": "Create pages directory for route-level components.",
        "steps": [
            "Create packages/frontend/src/pages/ directory",
            "Create packages/frontend/src/pages/Home/ directory",
            "Create packages/frontend/src/pages/Game/ directory",
            "Create packages/frontend/src/pages/Leaderboard/ directory",
            "Create packages/frontend/src/pages/Profile/ directory",
            "Add index.tsx in each page directory",
            "Create page component templates"
        ]
    },
    {
        "priority": 91,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (games/)",
        "description": "Create games directory for individual game implementations.",
        "steps": [
            "Create packages/frontend/src/games/ directory",
            "Create packages/frontend/src/games/common/ for shared game logic",
            "Create packages/frontend/src/games/snake/ placeholder",
            "Create packages/frontend/src/games/tetris/ placeholder",
            "Create packages/frontend/src/games/types.ts for game interfaces",
            "Create packages/frontend/src/games/registry.ts for game registration",
            "Add game template structure documentation"
        ]
    },
    {
        "priority": 92,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (lib/)",
        "description": "Create lib directory for utility libraries and API clients.",
        "steps": [
            "Create packages/frontend/src/lib/ directory",
            "Create packages/frontend/src/lib/api.ts for API client",
            "Create packages/frontend/src/lib/web3.ts for blockchain utilities",
            "Create packages/frontend/src/lib/x402.ts for payment utilities",
            "Create packages/frontend/src/lib/storage.ts for local storage",
            "Create packages/frontend/src/lib/analytics.ts placeholder",
            "Add library templates with types"
        ]
    },
    {
        "priority": 93,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (assets/)",
        "description": "Create assets directory for static files and game assets.",
        "steps": [
            "Create packages/frontend/src/assets/ directory",
            "Create packages/frontend/src/assets/images/ for static images",
            "Create packages/frontend/src/assets/fonts/ for custom fonts",
            "Create packages/frontend/src/assets/sounds/ for game audio",
            "Create packages/frontend/src/assets/sprites/ for game graphics",
            "Add README documenting asset organization",
            "Configure Vite asset handling"
        ]
    },
    {
        "priority": 94,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend directory structure (__tests__/)",
        "description": "Create test directory following Vitest conventions.",
        "steps": [
            "Create packages/frontend/__tests__/ directory",
            "Create packages/frontend/__tests__/components/ for component tests",
            "Create packages/frontend/__tests__/hooks/ for hook tests",
            "Create packages/frontend/__tests__/pages/ for page tests",
            "Create packages/frontend/__tests__/utils/ for test utilities",
            "Create packages/frontend/__tests__/setup.ts for Vitest setup",
            "Add placeholder test file"
        ]
    },
    {
        "priority": 95,
        "category": "Phase 1: Project Setup",
        "name": "Configure Vite path aliases",
        "description": "Set up Vite path aliases matching TypeScript paths.",
        "steps": [
            "Update vite.config.ts with resolve.alias",
            "Add '@' alias pointing to './src'",
            "Add '@components' alias pointing to './src/components'",
            "Add '@hooks' alias pointing to './src/hooks'",
            "Add '@store' alias pointing to './src/store'",
            "Verify aliases work in imports",
            "Document alias usage in README"
        ]
    },

    # ============================================================================
    # Phase 1: Project Setup - Environment Configuration (96-100)
    # ============================================================================
    {
        "priority": 96,
        "category": "Phase 1: Project Setup",
        "name": "Create backend .env.example with all variables",
        "description": "Document all required backend environment variables with examples.",
        "steps": [
            "Create packages/backend/.env.example",
            "Add NODE_ENV=development",
            "Add PORT=3001",
            "Add DATABASE_URL=./data/x402arcade.db",
            "Add JWT_SECRET=your-secure-secret-here",
            "Add FACILITATOR_URL=https://facilitator.example.com",
            "Add CRONOS_RPC_URL=https://evm.cronos.org",
            "Document each variable with comments"
        ]
    },
    {
        "priority": 97,
        "category": "Phase 1: Project Setup",
        "name": "Create frontend .env.example with all variables",
        "description": "Document all required frontend environment variables with examples.",
        "steps": [
            "Create packages/frontend/.env.example",
            "Add VITE_API_URL=http://localhost:3001",
            "Add VITE_WS_URL=ws://localhost:3001",
            "Add VITE_CHAIN_ID=25 (Cronos mainnet)",
            "Add VITE_WALLETCONNECT_PROJECT_ID=your-project-id",
            "Add VITE_FACILITATOR_URL=https://facilitator.example.com",
            "Document each variable with comments"
        ]
    },
    {
        "priority": 98,
        "category": "Phase 1: Project Setup",
        "name": "Create environment validation schema (backend)",
        "description": "Implement runtime environment validation using Zod.",
        "steps": [
            "Update packages/backend/src/config/env.ts",
            "Import zod and define envSchema",
            "Add required fields: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET",
            "Add optional fields with defaults",
            "Implement validateEnv() function",
            "Export validated env object with types",
            "Add startup validation in index.ts"
        ]
    },
    {
        "priority": 99,
        "category": "Phase 1: Project Setup",
        "name": "Create environment validation schema (frontend)",
        "description": "Implement Vite environment variable validation.",
        "steps": [
            "Create packages/frontend/src/lib/env.ts",
            "Import zod and define clientEnvSchema",
            "Add required fields: VITE_API_URL, VITE_CHAIN_ID",
            "Add optional fields with defaults",
            "Implement getEnv() function with validation",
            "Export typed env object",
            "Add validation call in main.tsx"
        ]
    },
    {
        "priority": 100,
        "category": "Phase 1: Project Setup",
        "name": "Document environment setup in README",
        "description": "Create comprehensive environment setup documentation.",
        "steps": [
            "Create or update README.md in repository root",
            "Add 'Getting Started' section with prerequisites",
            "Document pnpm installation and workspace setup",
            "Add 'Environment Setup' section",
            "Document how to copy .env.example files",
            "Explain each environment variable purpose",
            "Add troubleshooting section for common issues"
        ]
    }
]

# Insert all features
created_count = 0
for feature_data in features_data:
    db_feature = Feature(
        priority=feature_data["priority"],
        category=feature_data["category"],
        name=feature_data["name"],
        description=feature_data["description"],
        steps=feature_data["steps"],
        passes=False,
        in_progress=False
    )
    session.add(db_feature)
    created_count += 1

session.commit()
session.close()

print(f"Successfully created {created_count} features in the database.")

# Verify
engine, SessionLocal = create_database(PROJECT_DIR)
session = SessionLocal()
total = session.query(Feature).count()
print(f"Total features in database: {total}")

# Show breakdown by category
from sqlalchemy import func
categories = session.query(Feature.category, func.count(Feature.id)).group_by(Feature.category).all()
print("\nFeatures by category:")
for cat, count in categories:
    print(f"  {cat}: {count}")

session.close()
