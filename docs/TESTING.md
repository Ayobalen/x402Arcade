# Testing Guide

This document covers the test infrastructure for x402Arcade, including configuration, watch mode usage, and keyboard shortcuts.

## Test Framework Overview

| Package | Framework | Command |
|---------|-----------|---------|
| Frontend | Vitest | `pnpm test:frontend` |
| Backend | Jest | `pnpm test:backend` |

## Running Tests

### Basic Commands

```bash
# Run all tests once
pnpm test:all

# Run frontend tests only
pnpm test:frontend

# Run backend tests only
pnpm test:backend

# Run with coverage
pnpm test:coverage
```

### Watch Mode

Watch mode enables rapid TDD cycles by automatically re-running tests when files change.

#### Frontend (Vitest)

```bash
# Start watch mode
pnpm --dir packages/frontend test:watch

# Run only tests related to changed files (since last commit)
pnpm --dir packages/frontend test:changed
```

**Vitest Watch Mode Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| `a` | Run all tests |
| `f` | Re-run only failed tests |
| `u` | Update snapshots |
| `p` | Filter by filename regex |
| `t` | Filter by test name regex |
| `q` | Quit watch mode |
| `h` | Show help |
| `Enter` | Trigger test re-run |

#### Backend (Jest)

```bash
# Start watch mode
pnpm --dir packages/backend test:watch

# Run only tests related to changed files
pnpm --dir packages/backend test:changed
```

**Jest Watch Mode Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| `a` | Run all tests |
| `f` | Run only failed tests |
| `o` | Run only tests related to changed files |
| `p` | Filter by filename pattern (typeahead enabled) |
| `t` | Filter by test name pattern (typeahead enabled) |
| `u` | Update failing snapshots |
| `i` | Update failing snapshots interactively |
| `q` | Quit watch mode |
| `Enter` | Trigger test re-run |
| `w` | Show more watch mode options |

## Coverage Reports

### Generating Coverage

```bash
# Generate coverage for all packages
pnpm test:coverage

# Generate coverage badges
pnpm coverage:badges
```

### Coverage Thresholds

Both frontend and backend enforce **80% minimum coverage** across:
- Statements
- Branches
- Functions
- Lines

### Report Locations

| Package | Report Type | Location |
|---------|-------------|----------|
| Frontend | HTML | `packages/frontend/coverage/index.html` |
| Frontend | JSON | `packages/frontend/test-reports/json/results.json` |
| Backend | HTML | `packages/backend/coverage/index.html` |
| Backend | JUnit XML | `packages/backend/test-reports/junit.xml` |

## Test Directory Structure

### Frontend

```
packages/frontend/
├── __tests__/
│   ├── components/    # Component unit tests
│   ├── hooks/         # Custom hook tests
│   ├── pages/         # Page integration tests
│   ├── utils/         # Utility function tests
│   └── setup.ts       # Global test setup
└── src/test/
    └── setup.ts       # Vitest configuration setup
```

### Backend

```
packages/backend/
├── __tests__/
│   ├── unit/          # Unit tests
│   ├── integration/   # API integration tests
│   ├── fixtures/      # Test data factories
│   ├── mocks/         # Mock implementations
│   └── setup.ts       # Global test setup
```

## Best Practices

### 1. Test-Driven Development (TDD)

1. Write a failing test first
2. Write minimal code to pass the test
3. Refactor while keeping tests green

### 2. Watch Mode Workflow

1. Start watch mode: `pnpm test:watch`
2. Write a failing test
3. Press `Enter` to re-run
4. Write code to pass
5. Press `Enter` to verify
6. Repeat

### 3. File Naming

- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- Test utilities: Place in `__tests__/fixtures/` or `__tests__/mocks/`

### 4. Coverage Strategy

- Aim for meaningful coverage, not just high numbers
- Focus on business logic and edge cases
- Use coverage reports to find untested paths
- Don't test implementation details

## CI/CD Integration

Test reports are generated in formats compatible with popular CI systems:

- **GitHub Actions**: Uses default console output
- **Jenkins**: Uses JUnit XML from `test-reports/junit.xml`
- **SonarQube**: Uses coverage JSON from `coverage/coverage-final.json`

## Troubleshooting

### Tests Not Watching Files

Check that files aren't in ignore patterns:
- `node_modules/`
- `dist/`
- `coverage/`
- `test-reports/`

### ESM Import Errors (Backend)

Ensure `NODE_OPTIONS='--experimental-vm-modules'` is set. This is automatic when using the npm scripts.

### Coverage Not Showing

Run with coverage flag:
```bash
pnpm test:coverage
```
