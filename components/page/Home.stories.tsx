import type { Meta, StoryObj } from '@storybook/react';
import { Home } from './Home';

const meta: Meta<typeof Home> = {
  component: Home,
};

type Story = StoryObj<typeof Home>;

export const Default: Story = {};

export default meta;
