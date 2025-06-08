// client\components\ui\CodeBlock.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from './codeblock';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const meta: Meta<typeof CodeBlock> = {
  component: CodeBlock,
  parameters: { layout: 'centered' },
  args: {
    children: 'ENV_VAR=a value',
    style: atomDark,
    language: 'bash',
  },
  render: (args) => {
    return (
      <div className="w-[500px]">
        <CodeBlock {...args} />
      </div>
    );
  },
};

type Story = StoryObj<typeof CodeBlock>;

export const Default: Story = {};

export const Typescript: Story = {
  args: {
    showLineNumbers: true,
    language: 'typescript',
    children:
      'const thing: string = "Hello, world!";\n\nexport function MyFunc<T>(value: number) {\n  console.log(value);\n};',
  },
};

export const Inline: Story = {
  args: {
    language: 'shell',
    children: 'bun run dev',
  },
  render: (args) => {
    return (
      <div>
        Just run <CodeBlock {...args} inline />
      </div>
    );
  },
};

export const DisableCopy: Story = {
  args: {
    language: 'shell',
    children: 'bun run dev',
    enableCopy: false,
  },
  render: Inline.render,
};

export default meta;
