// components\section\Slider.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';
import { demoNotes } from '../../.storybook/demoData';
import { cn } from '@lib/utils';

const meta: Meta<typeof Slider> = {
  component: Slider,
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    className: cn('w-60'),
  },
  parameters: {
    layout: 'centered',
  },
};

type Story = StoryObj<typeof Slider>;

export const Default: Story = {};

export const Vertical: Story = { args: { ver: true } };

export default meta;
