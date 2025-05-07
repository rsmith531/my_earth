import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@components/page/Home';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Globe } from '@components/section/Globe';

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: () =>
    fetchNotes({ fov: 50, altitude: 160000, latitude: 0, longitude: 0 }),
});

// TODO: use hc or trpc to get api types
const fetchNotes = async (params: {
  fov: number;
  altitude: number;
  latitude: number;
  longitude: number;
}): Promise<Parameters<typeof Home>[0]['notes']> => {
  const url = new URL('http://localhost:3001/save-note');
  const queryParams = new URLSearchParams();

  queryParams.append('latitude', params.latitude.toString());
  queryParams.append('longitude', params.longitude.toString());
  queryParams.append('altitude', params.altitude.toString());
  queryParams.append('fieldOfView', params.fov.toString());

  url.search = queryParams.toString();

  const response = await fetch(url.toString(), {
    method: 'get',
  });
  let responseBody = [];
  if (!response.bodyUsed) {
    responseBody = await response.json();
  }

  const results: Parameters<typeof Home>[0]['notes'] = responseBody.map((result) => {
    return {message: result.message, latitude: result.location.y, longitude: result.location.x}
  }) 
  
  return results;
};

function HomePage() {
  const submissionCallback: Parameters<typeof Home>[0]['submitCallback'] =
    async (values) => {
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

  const [cameraView, setCameraView] =
    useState<Parameters<Parameters<typeof Globe>[0]['reportViewpoint']>[0]>();

  const handleCameraReport: Parameters<typeof Globe>[0]['reportViewpoint'] = (
    values,
  ) => {
    // setCameraView((prevState) => ({ ...prevState, ...values }));
  };

  return (
    <Home
      submitCallback={submissionCallback}
      notes={Route.useLoaderData()}
      reportGlobeViewpoint={handleCameraReport}
    />
  );
}
