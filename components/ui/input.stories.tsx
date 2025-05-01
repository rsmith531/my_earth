import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  component: Input,
};

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const UserFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const testedElement = canvas.getByTestId('ui-input');
    const testInput = 'demonstration content';
    await userEvent.type(testedElement, testInput);
    await expect(testedElement).toHaveValue(testInput);
  },
};

export default meta;
