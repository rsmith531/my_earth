// client\components\ui\image.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Image } from './image';
const meta: Meta<typeof Image> = {
  component: Image,
  parameters: { layout: 'centered' },
  args: {
    src: 'https://picsum.photos/800/600',
    width: 800,
    height: 600,
    alt: 'a randomly generated photo'
  },
};

type Story = StoryObj<typeof Image>;

export const Default: Story = {};

export const Loading: Story = { args: { src: '' } };
export const Errored: Story = { args: { src: 'badsource' } };
export const SmallPhotoError: Story = { args: { 
  src: 'badsource',
  width: 200,
  height: 100, } };

export default meta;
