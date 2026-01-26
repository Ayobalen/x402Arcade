import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ErrorBoundary } from '@/components/errors';
import { AudioAccessibilityProvider } from '@/contexts/AudioAccessibilityContext';
import { SoundIndicator } from '@/components/accessibility/SoundIndicator';
import { AudioSubtitles } from '@/components/accessibility/AudioSubtitles';

// Validate environment variables at startup
import { validateEnv, getEnv } from '@/lib/env';

const envResult = validateEnv();
if (!envResult.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Environment validation failed:');
  envResult.errors?.forEach((error) => {
    // eslint-disable-next-line no-console
    console.error(
      `   - ${error.field}: ${error.message}`,
      error.value !== undefined ? `(got: ${error.value})` : ''
    );
  });

  // In development, continue with defaults. In production, this would be a build-time error.
}

// Log environment info in development
if (import.meta.env.DEV) {
  const env = getEnv();
  // eslint-disable-next-line no-console
  console.log('🎮 x402Arcade Frontend Starting');
  // eslint-disable-next-line no-console
  console.log(`📡 API: ${env.VITE_API_URL}`);
  // eslint-disable-next-line no-console
  console.log(`⛓️ Chain: ${env.VITE_CHAIN_ID}`);
  if (env.VITE_DEBUG) {
    // eslint-disable-next-line no-console
    console.log('🔧 Debug mode enabled');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AudioAccessibilityProvider>
          <App />
          {/* Global accessibility components */}
          <SoundIndicator />
          <AudioSubtitles />
        </AudioAccessibilityProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
