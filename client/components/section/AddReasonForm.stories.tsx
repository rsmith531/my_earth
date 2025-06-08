// client\components\section\AddReasonForm.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { AddReasonForm } from './AddReasonForm';

const meta: Meta<typeof AddReasonForm> = {
  component: AddReasonForm,
};

type Story = StoryObj<typeof AddReasonForm>;

export const Default: Story = {
  args: {
    submitCallback: async (values) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('[stories/AddReasonForm] got form values: ', values);
          resolve();
        }, 2000);
      });
    },
  },
};

export default meta;
