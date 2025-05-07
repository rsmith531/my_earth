import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@components/page/Home';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Globe } from '@components/section/Globe';
import { honoClient } from '@lib/utils';

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: () =>
    fetchNotes({ fov: 50, altitude: 160000, latitude: 0, longitude: 0 }),
});

const fetchNotes = async (params: {
  fov: number;
  altitude: number;
  latitude: number;
  longitude: number;
}): Promise<Parameters<typeof Home>[0]['notes']> => {
  const response = await (
    await honoClient()['save-note'].$get({
      query: {
        altitude: params.altitude.toString(),
        fieldOfView: params.fov.toString(),
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
      },
    })
  ).json();

  if (Array.isArray(response)) {
    return response.map((result) => {
      return {
        message: result.message,
        latitude: result.location.y,
        longitude: result.location.x,
      };
    });
  }
  throw new Error(response.error);
};

function HomePage() {
  const submissionCallback: Parameters<typeof Home>[0]['submitCallback'] =
    async (values) => {
      const response = await honoClient()['save-note'].$post(
        { json: { ...values } },
        { headers: { 'Content-Type': 'application/json' } },
      );
      const body = await response.json();

      console.log(
        `[index/submissionCallback] post request returned ${response.status} with body "${JSON.stringify(body)}"`,
      );
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
        throw new Error(
          `[index/submissionCallback] error received from response: ${JSON.stringify(body)}`,
        );
      }
    };

  const [cameraView, setCameraView] =
    useState<Parameters<Parameters<typeof Globe>[0]['reportViewpoint']>[0]>();

  const handleCameraReport: Parameters<typeof Globe>[0]['reportViewpoint'] = (
    values,
  ) => {
    // debounce the processing by about .5-1 second
    // check if lat/lng changed by +/- 2 degrees,
    // check if altitude changed by +/- 10000 meters
    // if either of those things happened, call fetchNotes()
  };

  return (
    <Home
      submitCallback={submissionCallback}
      notes={Route.useLoaderData()}
      reportGlobeViewpoint={handleCameraReport}
    />
  );
}
