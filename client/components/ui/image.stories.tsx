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
    alt: 'a randomly generated photo',
  },
};

type Story = StoryObj<typeof Image>;

export const Default: Story = {};

export const Loading: Story = { args: { src: '' } };

export const Errored: Story = { args: { src: 'badsource' } };

export const SmallPhotoError: Story = {
  args: {
    src: 'badsource',
    width: 200,
    height: 100,
  },
};

export const UnknownHeightError: Story = {
  args: {
    src: 'badsource',
    width: 200,
    height: undefined,
  },
};

export const UnknownWidthError: Story = {
  args: {
    src: 'badsource',
    height: 200,
    width: undefined,
  },
};

export const UnknownWidth: Story = {
  args: {
    src: 'https://picsum.photos/200/600',
    width: undefined,
  },
  render: (args) => {return (<div className='w-dvw'><Image {...args} /></div>)}
};

export const UnknownHeight: Story = {
  args: {
    src: 'https://picsum.photos/800/200',
    height: undefined,
  },
  render: (args) => {return (<div className='w-dvw'><Image {...args} /></div>)}
};

export default meta;
