// src\useNotes.tsx

import { queryOptions, useQuery } from '@tanstack/react-query';
import { honoClient } from '@lib/utils';
import type { Home } from '@components/page/Home';

export const notesQueryOptions = (keys: {
  fov: number;
  altitude: number;
  latitude: number;
  longitude: number;
}) =>
  queryOptions({
    queryKey: ['notes', { ...keys }],
    queryFn: async (): Promise<Parameters<typeof Home>[0]['notes']> => {
      const response = await (
        await honoClient()['save-note'].$get({
          query: {
            altitude: keys.altitude.toString(),
            fieldOfView: keys.fov.toString(),
            latitude: keys.latitude.toString(),
            longitude: keys.longitude.toString(),
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
    },
    placeholderData: (prev) => prev,
  });

export const notesQuery = (keys: Parameters<typeof notesQueryOptions>[0]) =>
  useQuery(notesQueryOptions(keys));
