// src\routes\index.tsx

import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@components/page/Home';
import { toast } from 'sonner';
import { honoClient } from '@lib/utils';
import { notesQuery, notesQueryOptions } from '@/useNotes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useThrottler, useDebouncedValue } from '@tanstack/react-pacer';
import { classifyToxicity } from 'moderation';
import { initializeModerator } from 'moderation/tensorflowModeration';

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
  const { data: fetchedNotes, error } = notesQuery({
    ...queryViewpoint,
    resultsToGet: debouncedResultsCount,
  });
  const notesToDisplay = fetchedNotes ?? initialNotesData;

  /**
   * listen for errors from the notesQuery react query and put them in a toast
   */
  useEffect(() => {
    if (error) {
      console.error('[index] error fetching notes: ', error);
      toast.error(
        'There was a problem while getting the notes. Please try again later.',
        {
          closeButton: true,
          duration: Number.POSITIVE_INFINITY,
        },
      );
    }
  }, [error]);

  /**
   * initialize the tensorflow model when the page loads so that it's ready by
   * the time the user submits their message (which uses the model)
   */
  useEffect(() => {
    initializeModerator();
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

const submissionCallback: Parameters<typeof Home>[0]['submitCallback'] = async (
  values,
) => {
  const moderationResults = await classifyToxicity(values.message);
  let failedModeration = false;

  // if they submit something that fails moderation, let them know, but also
  // save the message to use as training data
  if (moderationResults.matchedResults.length > 0) {
    failedModeration = true;
    toast.error('We do not allow this type of content on our platform.', {
      closeButton: true,
      duration: Number.POSITIVE_INFINITY,
    });

    await honoClient()['report-note'].$post(
      {
        json: {
          reason: moderationResults.matchedResults.map((result) => {
            return result.category;
          }),
          flaggedBy: 'ml_model_fail',
          message: { ...values },
          modelOutput: JSON.stringify(moderationResults),
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    // no error checking on the API response because I don't want to advise the
    // user I am saving their bad content to use as training data on the
    // moderator model, so I'll just lose it instead
  }

  // if they submit something that moderation is uncertain about, let them know
  // their message needs to be reviewed before being published
  if (moderationResults.uncertainResults.length > 0) {
    if (!failedModeration) {
      // only send this message if they haven't been previously notified of a moderation fail
      toast.warning(
        'We think your note might contain content we do not allow. It has been flagged for review and will be published if it passes.',
        {
          closeButton: true,
          duration: Number.POSITIVE_INFINITY,
        },
      );
    }
    failedModeration = true;

    await honoClient()['report-note'].$post(
      {
        json: {
          reason: moderationResults.uncertainResults.map((result) => {
            return result.category;
          }),
          flaggedBy: 'ml_model_uncertain',
          message: { ...values },
          modelOutput: JSON.stringify(moderationResults),
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  // return early if the new note failed moderation
  if (failedModeration) return;

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
