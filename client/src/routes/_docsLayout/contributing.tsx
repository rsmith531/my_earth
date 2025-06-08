// client\src\routes\_docsLayout\contributing.tsx

import { createFileRoute } from '@tanstack/react-router'
import pageContent from '@root/CONTRIBUTING.md?raw';
import { MarkdownRenderer } from '@components/section/MarkdownRenderer';

export const Route = createFileRoute('/_docsLayout/contributing')({
  component: () => {
    return <MarkdownRenderer content={pageContent} />;
  },
})
