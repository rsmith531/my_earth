import type { Meta, StoryObj } from '@storybook/react';
import { Home } from './Home';
import { demoNotes } from '../../.storybook/demoData';

const meta: Meta<typeof Home> = {
  component: Home,
  tags: ['!autodocs'],
};

type Story = StoryObj<typeof Home>;

export const Default: Story = {
  args: {
    submitCallback: async (values) => {
      console.log('[stories/Home] submitCallback got values: ', values);
    },
    reportGlobeViewpoint: (values) =>
      console.log('[stories/Home] reportViewpoint got values: ', values),
    notes: demoNotes
  },
};

export default meta;
