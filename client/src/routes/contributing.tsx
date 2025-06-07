// client\src\routes\about.tsx

import { createFileRoute } from '@tanstack/react-router'
import pageContent from '../../../CONTRIBUTING.md?raw';
import { Article } from '@components/page/Article';

export const Route = createFileRoute('/contributing')({
  component: AboutPage,
})

function AboutPage() {
  return <Article content={pageContent} />
}
