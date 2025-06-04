// client\components\page\Home.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Home } from './Home';
import { demoNotes } from '../../.storybook/demoData';
import { useState } from 'react';

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
  render: (args) => {
    const [results, setResults] = useState<number>(43)
    return <Home {...args} resultsCount={results} setResultsCount={setResults} />
  }
};

export default meta;
