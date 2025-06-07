// client\components\page\Article.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Article } from './Article';
// ?raw suffix reads the file at build time and embeds the string into the bundle
import readmeContent from '../../../CONTRIBUTING.md?raw';


const meta: Meta<typeof Article> = {
  component: Article,
  tags: ['!autodocs'],
  parameters: {layout: 'fullscreen'}
};

type Story = StoryObj<typeof Article>;

export const Default: Story = {
  args: { content: readmeContent },
};

export default meta;
