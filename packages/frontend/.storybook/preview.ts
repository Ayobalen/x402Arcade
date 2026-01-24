import type { Preview, Decorator } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import '../src/index.css';

// Create a shared query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

/**
 * Global decorator that wraps all stories with required providers.
 * - React Query for data fetching
 * - Memory Router for navigation/routing hooks
 */
const withProviders: Decorator = (Story) => {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      React.createElement(Story)
    )
  );
};

/**
 * Theme decorator for testing dark/light mode variants.
 * Uses CSS class-based theming for Tailwind compatibility.
 */
const themeDecorator = withThemeByClassName({
  themes: {
    dark: 'dark',
    light: 'light',
  },
  defaultTheme: 'dark',
});

const preview: Preview = {
  decorators: [withProviders, themeDecorator],
  parameters: {
    backgrounds: {
      default: 'arcade-dark',
      values: [
        {
          name: 'arcade-dark',
          value: '#0a0a0f',
        },
        {
          name: 'arcade-surface',
          value: '#1a1a2e',
        },
        {
          name: 'arcade-card',
          value: '#16162a',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    docs: {
      toc: true,
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        mobileL: {
          name: 'Mobile Large',
          styles: { width: '425px', height: '812px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        widescreen: {
          name: 'Widescreen',
          styles: { width: '1920px', height: '1080px' },
        },
        ultrawide: {
          name: 'Ultrawide',
          styles: { width: '2560px', height: '1080px' },
        },
      },
    },
    // Accessibility addon configuration
    a11y: {
      // axe-core rule configuration
      config: {
        rules: [
          {
            // Allow arcade-specific color contrast for neon effects
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
      // Run accessibility checks automatically
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    },
    // Interactions addon configuration
    interactions: {
      // Disable interactions in docs mode for performance
      disable: false,
    },
  },
  // Global arg types for consistent controls
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
      table: {
        type: { summary: 'string' },
        category: 'Styling',
      },
    },
  },
  // Global args default values
  args: {},
};

export default preview;
