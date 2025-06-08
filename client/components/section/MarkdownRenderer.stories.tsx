// client\components\section\MarkdownRenderer.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownRenderer } from './MarkdownRenderer';
// ?raw suffix reads the file at build time and embeds the string into the bundle
import readmeContent from '../../../CONTRIBUTING.md?raw';


const meta: Meta<typeof MarkdownRenderer> = {
  component: MarkdownRenderer,
  parameters: {layout: 'fullscreen'}
};

type Story = StoryObj<typeof MarkdownRenderer>;

export const Default: Story = {
  args: { content: readmeContent },
};

export default meta;
