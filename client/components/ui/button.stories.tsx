import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Send } from 'lucide-react';
const meta: Meta<typeof Button> = {
  component: Button,
};

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'test label',
  },
};

export const Icon: Story = {
    args: {
      children: <Send />,
    },
};

export default meta;
