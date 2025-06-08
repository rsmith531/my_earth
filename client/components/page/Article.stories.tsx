// client\components\page\Article.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Article } from './Article';

const meta: Meta<typeof Article> = {
  component: Article,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};

type Story = StoryObj<typeof Article>;

export const Default: Story = {
  args: { children: <div>Hello, world</div> },
};

export const LotsOfChildren: Story = {
  args: {
    children: Array.from({ length: 150 }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: don't worry about it
      <div key={i}>Child {i + 1}</div>
    )),
  },
};

export default meta;
