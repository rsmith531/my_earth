// src\routes\index.tsx

import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@components/page/Home';
import { toast } from 'sonner';
import { honoClient } from '@lib/utils';
import { notesQuery, notesQueryOptions } from '@/useNotes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useThrottler, useDebouncedValue } from '@tanstack/react-pacer';

const initialViewpoint = {
  fov: 50,
  // matches the initial altitude of the camera in react-globe.gl
  altitude: 22316121,
  latitude: 0,
  longitude: 0,
};

const initialResults = 20;

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(
      notesQueryOptions({ ...initialViewpoint, resultsToGet: initialResults }),
    );
  },
});

function HomePage() {
  const [queryViewpoint, setQueryViewpoint] = useState(initialViewpoint);
  const lastTriggeredViewpointRef = useRef(initialViewpoint);

  /**
   * Compare the position of the viewpoint against the last position that was
   * used to fetch notes. If the new position is more than 10 degrees distant
   * from the last one, or if the altitude changed by more than 2%, set the
   * query viewpoint to this new one.
   */
  const checkAndUpdateViewPoint: Parameters<
    typeof Home
  >[0]['reportGlobeViewpoint'] = useCallback((currentView) => {
    // get the last viewpoint that triggered a fetch
    const lastView = lastTriggeredViewpointRef.current;

    const latDiff = Math.abs(currentView.latitude - lastView.latitude);
    const lngDiff = Math.abs(currentView.longitude - lastView.longitude);
    const altitudeDiff = Math.abs(currentView.altitude - lastView.altitude);
    // console.log(
    //   `[index/checkAndUpdateViewPoint] diffs: lat: ${latDiff}, lon: ${lngDiff}, alt: ${altitudeDiff}`,
    // );

    const latLngThresholdExceeded = latDiff > 10 || lngDiff > 10;
    const altitudeThresholdExceeded =
      lastView.altitude !== 0 && (altitudeDiff / lastView.altitude) * 100 >= 2;

    if (latLngThresholdExceeded || altitudeThresholdExceeded) {
      setQueryViewpoint(currentView);
      lastTriggeredViewpointRef.current = currentView;
    }
  }, []);

  /**
   * control the number of results returned via the slider in the Home
   * component. The value is debounced before being passed to the notesQuery
   * where it is used to do the get request.
   */
  const [resultsCount, setResultsCount] = useState<number>(initialResults);
  const [debouncedResultsCount] = useDebouncedValue(resultsCount, {
    wait: 500,
    trailing: true,
  });

  /**
   * put the viewpoint updater in a throttler to make sure it doesn't trigger
   * for every minute change in viewpoint.
   */
  const handleCameraReport = useThrottler(checkAndUpdateViewPoint, {
    wait: 500,
    trailing: false,
  });

  const initialNotesData = Route.useLoaderData();
  const { data: fetchedNotes, error: fetchedNotesError } = notesQuery({
    ...queryViewpoint,
    resultsToGet: debouncedResultsCount,
  });
  const notesToDisplay = fetchedNotes ?? initialNotesData;

  /**
   * listen for errors from the notesQuery react query and put them in a toast
   */
  useEffect(() => {
    if (fetchedNotesError) {
      console.error('[index] error fetching notes: ', fetchedNotesError);
      toast.error(
        'There was a problem while getting the notes. Please try again later.',
        {
          closeButton: true,
          duration: Number.POSITIVE_INFINITY,
        },
      );
    }
  }, [fetchedNotesError]);

  const submissionCallback: Parameters<typeof Home>[0]['submitCallback'] =
    useCallback(async (values) => {
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
          let errorMessage =
            "Looks like there's something wrong with your connection. Please try again later";
          if ('error' in body) errorMessage = body.error;
          toast.error(errorMessage, {
            closeButton: true,
            duration: Number.POSITIVE_INFINITY,
          });
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
    }, []);

  return (
    <Home
      submitCallback={submissionCallback}
      notes={notesToDisplay}
      reportGlobeViewpoint={handleCameraReport.maybeExecute}
      resultsCount={resultsCount}
      setResultsCount={setResultsCount}
    />
  );
}
