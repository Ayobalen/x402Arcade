import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook configuration for x402Arcade frontend.
 *
 * Addons:
 * - @storybook/addon-essentials: Actions, controls, docs, backgrounds, viewport
 * - @storybook/addon-docs: Auto-generated documentation
 * - @storybook/addon-a11y: Accessibility checks for WCAG compliance
 * - @storybook/addon-interactions: Play functions for testing interactions
 * - @storybook/addon-themes: Theme switching for dark mode testing
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {},
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  staticDirs: ['../public'],
};

export default config;
