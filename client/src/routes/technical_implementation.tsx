// client\src\routes\about.tsx

import { createFileRoute } from '@tanstack/react-router'
import pageContent from '../../../technical_implementation.md?raw';
import { Article } from '@components/page/Article';

export const Route = createFileRoute('/technical_implementation')({
  component: ContentPolicyPage,
})

function ContentPolicyPage() {
  return <Article content={pageContent} />
}
