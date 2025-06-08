// components\section\Globe.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Globe } from './Globe';
import { demoNotes } from '../../.storybook/demoData';

const meta: Meta<typeof Globe> = {
  component: Globe,
  args: {
    reportViewpoint: (values) => {
      console.info('[stories/Globe] reportViewpoint got values: ', values);
    },
  },
  render: (args) => {
    return (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Globe {...args} />
      </div>
    );
  },
};

type Story = StoryObj<typeof Globe>;

export const Default: Story = { args: { interactive: false } };

export const Interactive: Story = { args: { interactive: true } };

export const WithData: Story = { args: { interactive: true, data: demoNotes } };

export const UserLocation: Story = {
  args: {
    interactive: true,
    markerCoordinates: { lat: 41.13916, lng: -81.57464 },
  },
};

export const FreezeRender: Story = {
  args: { interactive: false, freezeRender: true },
};

export default meta;
