// client\src\routes\_docsLayout\content_policy.tsx

import { createFileRoute } from '@tanstack/react-router';
import pageContent from '../../../../content_policy.md?raw';
import { MarkdownRenderer } from '@components/section/MarkdownRenderer';

export const Route = createFileRoute('/_docsLayout/content_policy')({
  component: () => {
    return <MarkdownRenderer content={pageContent} />;
  },
});
