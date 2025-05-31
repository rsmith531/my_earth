// server\index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { validator } from 'hono/validator';
import { zValidator } from '@hono/zod-validator';
import { db } from './db/client';
import {
  flaggedNotes,
  flaggingAuthorityEnum,
  flagReasonEnum,
  notes,
} from './db/schema';
import { z } from 'zod';
import { getVisibleRadius, saveNoteValidationSchema } from './utils';
import { getMessagesWithin } from './db/queries';
import { clustersKmeans } from '@turf/clusters-kmeans';
import { featureCollection, point } from '@turf/helpers';

console.log('[server] API endpoint is activating');

const app = new Hono()
  .use('*', cors())
  .post(
    '/save-note',
    validator('json', (value, c) => {
      const parsed = saveNoteValidationSchema.safeParse(value);
      if (!parsed.success) {
        console.error(
          `[api/save-note ${c.req.method}] request failed validation: `,
          parsed.error,
        );
        return c.json({ error: 'Note submission is invalid' }, 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const validatedRequest = c.req.valid('json');
      try {
        await db.insert(notes).values({
          message: validatedRequest.message,
          location: {
            x: validatedRequest.longitude,
            y: validatedRequest.latitude,
          },
          publishedAt: new Date(),
        });
      } catch (error) {
        console.error(
          `[api/save-note ${c.req.method}] encountered error while inserting note into database: `,
          error,
        );
        return c.json({ error: 'Could not save note' }, 500);
      }
      return c.json({ message: 'Note saved' }, 201);
    },
  )
  .get(
    '/get-notes',
    zValidator(
      'query',
      z.object({
        altitude: z.coerce.number().positive(), // in meters
        fieldOfView: z.coerce.number().positive(), // in degrees
        // https://github.com/colinhacks/zod/issues/2600#issuecomment-2595407919
        latitude: z
          .string()
          .regex(
            /^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/,
          ),
        longitude: z
          .string()
          .regex(
            /^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$/,
          ),
        results: z.coerce.number().positive().lte(100).optional().default(50),
      }),
      (value, c) => {
        if (!value.success) {
          value.error.errors.map((problem) => {
            console.error(
              `[api/save-note ${c.req.method}] ${problem.path[0]} parameter failed validation: ${problem.message}`,
            );
          });
          return c.json({ error: 'invalid' }, 400);
        }
      },
    ),
    async (c) => {
      const params = c.req.valid('query');
      try {
        // the arc length calculated from 90 degrees (1/4 of earth's
        // circumference) and the radius of the earth
        const radiusFromViewpointToHorizon = 10018754;
        const radius = Number(
          await getVisibleRadius(
            String(params.altitude),
            String(params.fieldOfView),
          ),
        );

        const results = await getMessagesWithin(
          // if the camera can see beyond the horizon, just use the horizon
          radius <= radiusFromViewpointToHorizon
            ? radius
            : radiusFromViewpointToHorizon,
          {
            x: Number(params.longitude),
            y: Number(params.latitude),
          },
          // get thrice the amount of requested results so there is something to
          // cluster
          params.results * 3,
        );

        // if the amount of returned results is more than the amount asked for,
        // use K-means to select distant points by picking the centroid of each
        // cluster
        if (results.length > params.results) {
          const clusters = clustersKmeans(
            featureCollection(
              results.map((result) => {
                return point([result.location.x, result.location.y], {
                  message: result.message,
                });
              }),
            ),
            { numberOfClusters: params.results },
          );

          const representativePoints: {
            message: string;
            location: {
              x: number;
              y: number;
            };
          }[] = [];

          // track which clusters have been processed already
          const seenClusterIds = new Set<number>();

          for (const feature of clusters.features) {
            const clusterId = feature.properties.cluster;

            // do type narrowing to ensure the cluster exists
            if (clusterId === undefined) {
              console.warn(
                '[api/get] Feature found without clusterId during processing:',
                feature,
              );
              continue;
            }
            if (
              !feature.geometry.coordinates[0] ||
              !feature.geometry.coordinates[1]
            ) {
              console.warn(
                '[api/get] Feature found without coordinates during processing:',
                feature,
              );
              continue;
            }

            // add one point from each cluster to the results to return
            if (!seenClusterIds.has(clusterId)) {
              seenClusterIds.add(clusterId);
              representativePoints.push({
                message: feature.properties.message,
                location: {
                  x: feature.geometry.coordinates[0],
                  y: feature.geometry.coordinates[1],
                },
              });
            }

            // optimization: if we've found one point for each of the `params.results` clusters, we can stop
            if (representativePoints.length >= params.results) {
              break;
            }
          }

          return c.json(representativePoints, 200);
        }

        return c.json(results, 200);
      } catch (error) {
        console.error(
          `[api/save-note ${c.req.method}] encountered error while getting notes from database: `,
          error,
        );
        return c.json({ error: 'Could not get notes' }, 500);
      }
    },
  )
  .post(
    '/report-note',
    zValidator(
      'json',
      z
        .object({
          reason: z.array(z.enum(flagReasonEnum.enumValues)),
          flaggedBy: z.enum(flaggingAuthorityEnum.enumValues),
          modelOutput: z.string().optional(), // hack: JSON.stringify() the output so it can be any shape
          message: saveNoteValidationSchema.optional(),
          messageId: z.string().uuid().optional(),
        })
        .superRefine((value, context) => {
          if (value.message && value.messageId)
            context.addIssue({
              code: 'custom',
              message: 'Cannot submit both a message and a message ID',
              path: ['message', 'messageId'],
            });
          if (!value.message && !value.messageId)
            context.addIssue({
              code: 'custom',
              message: 'A message or message ID must be provided',
              path: ['message', 'messageId'],
            });
          if (
            (value.flaggedBy === 'ml_model_fail' ||
              value.flaggedBy === 'ml_model_uncertain') &&
            !value.modelOutput
          )
            context.addIssue({
              code: 'custom',
              message:
                'Must provide model output if the reporting authority is the ML moderator',
              path: ['modelOutput'],
            });
        }),
      (value, c) => {
        if (!value.success) {
          value.error.errors.map((problem) => {
            console.error(
              `[api/report-note ${c.req.method}] ${problem.path[0]} parameter failed validation: ${problem.message}`,
            );
          });
          return c.json({ error: 'invalid' }, 400);
        }
      },
    ),
    async (c) => {
      const params = c.req.valid('json');
      console.log('got params ', params);
      try {
        // if the params have a message id, use it for the fkey in the flaggedNotes table
        let messageFkey = params.messageId ?? null;

        // if the params have a new message, save it to the notes table but as
        // unpublished and remember the new id
        if (params.message) {
          messageFkey =
            (
              await db
                .insert(notes)
                .values({
                  message: params.message.message,
                  location: {
                    x: params.message.longitude,
                    y: params.message.latitude,
                  },
                  // specify null just to be certain
                  publishedAt: null,
                })
                .returning({ id: notes.id })
            )[0]?.id ?? null;
        }

        // save the data to the flaggedNotes table with the message id
        if (!messageFkey)
          throw new Error('No message ID found for the flagged message');

        await db.insert(flaggedNotes).values({
          id: messageFkey,
          reason: params.reason,
          flaggedBy: params.flaggedBy,
          mlModelOutput: params.modelOutput,
        });

        return c.json({ message: 'Recorded' }, 200);
      } catch (error) {
        console.error(
          `[api/report-note ${c.req.method}] encountered error while recording flagged message: `,
          error,
        );
        return c.json({ error: 'Could not flag note' }, 500);
      }
    },
  );

if (!process.env.API_SERVER_PORT)
  throw new Error('[api] API_SERVER_PORT is not defined');

Bun.serve({
  fetch: app.fetch,
  port: process.env.API_SERVER_PORT,
});

console.log('[server] API endpoint is ready to accept connections');

export { app as dbServer };
export type AppType = typeof app;
