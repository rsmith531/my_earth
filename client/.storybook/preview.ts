// client\.storybook\preview.ts

import type { Preview } from '@storybook/react';
import '../src/styles.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      values: [
        { name: 'Space', value: '#000' },
        { name: 'Night', value: '#0f172a' },
        { name: 'Moonless Night', value: '#020617' },
      ],
      default: 'Moonless Night',
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
