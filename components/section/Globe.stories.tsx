import type { Meta, StoryObj } from '@storybook/react';
import { Globe } from './Globe';

const meta: Meta<typeof Globe> = {
  component: Globe,
};

type Story = StoryObj<typeof Globe>;

export const Default: Story = { args: { position: 100 } };

export const Elevated: Story = { args: { position: 0 } };

export default meta;
