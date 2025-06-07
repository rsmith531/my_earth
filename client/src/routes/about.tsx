// client\src\routes\about.tsx

import { createFileRoute } from '@tanstack/react-router'
import pageContent from '../../../README.md?raw';
import { Article } from '@components/page/Article';

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <Article content={pageContent} />
}
