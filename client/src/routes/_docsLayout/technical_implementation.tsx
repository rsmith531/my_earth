// client\src\routes\_docsLayout\technical_implementation.tsx

import { createFileRoute } from '@tanstack/react-router'
import pageContent from '../../../../technical_implementation.md?raw';
import { MarkdownRenderer } from '@components/section/MarkdownRenderer';

export const Route = createFileRoute('/_docsLayout/technical_implementation')({
  component: () => {
    return <MarkdownRenderer content={pageContent} />;
  },
})
