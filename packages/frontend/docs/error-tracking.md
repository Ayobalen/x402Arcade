# Error Tracking System

The x402 Arcade error tracking system provides comprehensive error logging, monitoring, and debugging capabilities through a unified API.

## Overview

The system consists of three main components:

1. **Error Logger** (`errorLogger.ts`) - Client-side error logging with local storage
2. **Sentry Integration** (`sentry.ts`) - Production error monitoring with Sentry
3. **React Hooks** (`useErrorTracking.ts`) - Component-level error tracking

## Quick Start

### 1. Initialize at App Startup

```tsx
// App.tsx
import { useInitializeErrorTracking } from '@/hooks';

function App() {
  // Initialize error tracking (call once at app root)
  useInitializeErrorTracking();

  return <Router>...</Router>;
}
```

### 2. Use in Components

```tsx
import { useErrorTracking } from '@/hooks';

function PayToPlay({ game }: { game: string }) {
  const { logError, trackClick, trackPayment } = useErrorTracking({ component: 'PayToPlay', game });

  const handlePlay = async () => {
    trackClick('play-button');
    try {
      await initiatePayment();
      trackPayment('completed', '0.01', true, txHash);
    } catch (error) {
      trackPayment('failed', '0.01', false);
      logError(error);
    }
  };

  return <button onClick={handlePlay}>Play</button>;
}
```

## Configuration

### Environment Variables

```env
# Sentry DSN (required for production error tracking)
VITE_SENTRY_DSN=https://your-sentry-dsn

# App version for release tracking
VITE_APP_VERSION=1.0.0

# Build metadata
VITE_BUILD_TIME=2024-01-25T12:00:00Z
VITE_COMMIT_HASH=abc123
```

### Sentry Configuration

```typescript
import { initializeSentry } from '@/utils';

await initializeSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
  release: '1.0.0',
  sampleRate: 1.0, // Capture all errors
  tracesSampleRate: 0.1, // Sample 10% of transactions
  enableInDev: false, // Don't send in development
  debug: false,
  maxBreadcrumbs: 100,
});
```

### Error Logger Configuration

```typescript
import { initializeErrorLogging } from '@/utils';

initializeErrorLogging({
  enabled: true,
  minSeverity: 'info',
  maxLogEntries: 100,
  logToConsole: import.meta.env.DEV,
  sendToRemote: import.meta.env.PROD,
  remoteEndpoint: '/api/logs',
  batchSize: 10,
  flushInterval: 30000,
});
```

## API Reference

### useErrorTracking Hook

```typescript
const {
  logError, // Log an error with context
  logMessage, // Log a message (non-error)
  addBreadcrumb, // Add a custom breadcrumb
  trackClick, // Track button/element clicks
  trackApiCall, // Track API requests
  trackGameEvent, // Track game events
  trackWalletAction, // Track wallet actions
  trackPayment, // Track payment actions
  setUser, // Set user context
  setTags, // Set scope tags
  getRecentLogs, // Get recent log entries
} = useErrorTracking({
  component: 'ComponentName',
  game: 'snake',
  sessionId: 'session-123',
});
```

### Specialized Hooks

```typescript
// For game components
const tracking = useGameErrorTracking('snake', sessionId);

// For wallet components
const tracking = useWalletErrorTracking();

// For payment components
const tracking = usePaymentErrorTracking('snake');
```

### User Context Hook

```typescript
// Automatically syncs wallet connection with error tracking
function App() {
  const { address, isConnected } = useWallet();
  useErrorTrackingUser(address, isConnected);

  return <Router>...</Router>;
}
```

## Breadcrumbs

Breadcrumbs are timestamped events that show what happened before an error. They're automatically captured and help debug issues.

### Breadcrumb Types

| Type         | Description           | Example                       |
| ------------ | --------------------- | ----------------------------- |
| `navigation` | Route changes         | Navigated from /home to /play |
| `click`      | Button/element clicks | Clicked: play-button          |
| `api`        | API requests          | GET /api/games -> 200         |
| `game`       | Game events           | [snake] game-started          |
| `wallet`     | Wallet actions        | Wallet: connected             |
| `payment`    | Payment actions       | Payment: completed            |
| `error`      | Error occurred        | Error caught in component     |
| `info`       | General info          | User preference changed       |

### Adding Custom Breadcrumbs

```typescript
// Using the hook
const { addBreadcrumb } = useErrorTracking();
addBreadcrumb('info', 'User changed settings', { theme: 'dark' });

// Using utility functions
import { trackGameEvent, trackWalletAction } from '@/utils';
trackGameEvent('level-up', 'snake', { level: 5, score: 1000 });
trackWalletAction('signing', '0x123...', true);
```

## Error Boundary Integration

The ErrorBoundary component automatically logs errors to both systems:

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom handling (optional)
    console.log('Error caught:', error);
  }}
>
  <App />
</ErrorBoundary>
```

## Best Practices

### 1. Add Context to Errors

```typescript
// Bad - no context
logError(error);

// Good - with context
logError(error, {
  game: 'snake',
  sessionId: '123',
  score: 1500,
  action: 'score-submission',
});
```

### 2. Track User Actions Before Errors

```typescript
const handlePayment = async () => {
  trackClick('pay-button');
  trackPayment('initiated', amount);

  try {
    trackPayment('signing');
    await signPayment();
    trackPayment('settling');
    await settlePayment();
    trackPayment('completed', amount, true, txHash);
  } catch (error) {
    trackPayment('failed', amount, false);
    logError(error);
  }
};
```

### 3. Use Specialized Hooks

```typescript
// In game components
const { trackGameEvent } = useGameErrorTracking('snake', sessionId);
trackGameEvent('power-up-collected', { type: 'speed' });

// In wallet components
const { trackWalletAction } = useWalletErrorTracking();
trackWalletAction('connecting');
```

### 4. Set User Context Early

```typescript
function App() {
  const { address, isConnected } = useWallet();

  // Set user context as soon as wallet connects
  useErrorTrackingUser(address, isConnected);

  return <Router>...</Router>;
}
```

## Debugging

### View Recent Logs

```typescript
const { getRecentLogs } = useErrorTracking();
console.log('Recent errors:', getRecentLogs(10));
```

### View Breadcrumbs

```typescript
import { getSentry } from '@/utils';
const breadcrumbs = getSentry().getRecentBreadcrumbs(20);
console.log('Breadcrumbs:', breadcrumbs);
```

### Test Error Tracking (Development)

```typescript
// Trigger test error
const { logError } = useErrorTracking();
logError(new Error('Test error for debugging'));

// Check console for formatted output
```

## Production Considerations

1. **Sentry DSN**: Must be set in production via `VITE_SENTRY_DSN`
2. **Sample Rates**: Adjust `tracesSampleRate` based on traffic volume
3. **PII**: Error logger automatically truncates wallet addresses
4. **Bundle Size**: Sentry SDK is dynamically imported to reduce initial bundle

## Fallback Behavior

If Sentry is not configured or fails to load:

- Errors are logged to console in development
- Local error logger continues to capture errors
- No data is lost - it's stored in memory until page unload
