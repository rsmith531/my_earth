import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@components/page/Home';
import type { SaveNoteRequest } from 'server';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const submissionCallback: Parameters<typeof Home>[0]['submitCallback'] =
    async (values) => {
      console.log('[index] got values', values);
      // TODO: ensure values matches SaveNoteRequest
      const response = await fetch('http://localhost:3001/save-note', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
        }),
      });
      console.log('[index] got response', response);
    };

  return <Home submitCallback={submissionCallback} />;
}
