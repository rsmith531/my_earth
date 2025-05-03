import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@components/page/Home';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const submissionCallback: Parameters<typeof Home>[0]['submitCallback'] =
    async (values) => {
      console.log('[index] got values', values);
    };

  return <Home submitCallback={submissionCallback} />;
}
