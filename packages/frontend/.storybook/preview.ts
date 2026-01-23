import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
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
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
