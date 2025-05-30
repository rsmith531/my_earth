// components\section\Slider.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';
import { cn } from '@lib/utils';
import { useState } from 'react';

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

export const DefaultForm: Story = {render: (args) => {
  return (<form><Slider {...args} /></form>)
}};

export const DefaultControlled: Story = {render: (args) => {
  const [value, setValue] = useState<number>(50);
  return (<form><Slider {...args} value={[value]} onValueChange={(value) => {setValue(value[0])}} name='example'  /></form>)
}};

export const Vertical: Story = { args: { orientation: 'vertical' }, render: DefaultControlled.render  };

export const VerticalRight: Story = { args: { orientation: 'vertical', labelSide: 'right' }, render: DefaultControlled.render  };

export default meta;
