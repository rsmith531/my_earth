import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@components/page/Home';
import type { SaveNoteRequest } from 'server';
import { toast } from 'sonner';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const submissionCallback: Parameters<typeof Home>[0]['submitCallback'] =
    async (values) => {
      // TODO: ensure values matches SaveNoteRequest
      const response = await fetch('http://localhost:3001/save-note', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
        }),
      });
      if (response.ok) {
        toast.success('We saved your note. Thanks for sharing!');
      } else {
        if (response.status >= 500) {
          // server error
          toast.error(
            'Whoops, something went wrong on our end! Please try again later',
            {
              closeButton: true,
              duration: Number.POSITIVE_INFINITY,
            },
          );
        } else if (response.status >= 400) {
          // client error
          toast.error(
            "Looks like there's something wrong with your connection. Please try again later",
            {
              closeButton: true,
              duration: Number.POSITIVE_INFINITY,
            },
          );
        } else {
          // unexpected error
          toast.error(
            'Looks like we encounted an unexpected error. Please try again later',
            {
              closeButton: true,
              duration: Number.POSITIVE_INFINITY,
            },
          );
        }
        let responseErrorMessage = '';
        if (!response.bodyUsed) {
          responseErrorMessage = await response.text();
        }
        throw new Error(
          `[index/submissionCallback] error received from response: ${responseErrorMessage}`,
        );
      }
    };

  return <Home submitCallback={submissionCallback} />;
}
