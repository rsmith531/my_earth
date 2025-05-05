import type { Meta, StoryObj } from '@storybook/react';
import { Globe } from './Globe';
import { demoNotes } from '../../.storybook/demoData';

const meta: Meta<typeof Globe> = {
  component: Globe,
};

type Story = StoryObj<typeof Globe>;

export const Default: Story = { args: { interactive: false } };

export const Interactive: Story = { args: { interactive: true } };

export const WithData: Story = { args: { interactive: true, data: demoNotes } };

export default meta;
