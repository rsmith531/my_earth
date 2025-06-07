// client\src\routes\about.tsx

import { createFileRoute } from '@tanstack/react-router'
import pageContent from '../../../content_policy.md?raw';
import { Article } from '@components/page/Article';

export const Route = createFileRoute('/content_policy')({
  component: ContentPolicyPage,
})

function ContentPolicyPage() {
  return <Article content={pageContent} />
}
