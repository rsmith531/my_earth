// client\src\routes\_docsLayout\about.tsx

import { createFileRoute } from '@tanstack/react-router';
import pageContent from '../../../../README.md?raw';
import { MarkdownRenderer } from '@components/section/MarkdownRenderer';

export const Route = createFileRoute('/_docsLayout/about')({
  component: () => {
    return <MarkdownRenderer content={pageContent} />;
  },
});
