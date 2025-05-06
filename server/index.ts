// server\index.ts

import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { zValidator } from '@hono/zod-validator';
import { validationSchema } from '../components/section/AddReasonForm';
import { db } from './db/client';
import { notes } from './db/schema';
import { isNull } from 'drizzle-orm';
import { z } from 'zod';

const app = new Hono()
  .post(
    '/save-note',
    validator('json', (value, c) => {
      const parsed = validationSchema.safeParse(value);
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
            x: validatedRequest.latitude,
            y: validatedRequest.longitude,
          },
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
    '/save-note',
    zValidator(
      'query',
      z.object({
        altitude: z.coerce.number(),
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
        results: z.coerce.number().positive().lt(100).optional(),
      }),
      (value, c) => {
        if (!value.success) {
          value.error.errors.map((problem) => {
            console.error(
              `[api/save-note ${c.req.method}] ${problem.path[0]} parameter failed validation: ${problem.message}`
            );
          })
          return c.json({ error: 'invalid' }, 400);
        }
      },
    ),
    async (c) => {
      const params = c.req.valid('query');
      try {
        const results = await db
          .select()
          .from(notes)
          .where(isNull(notes.deletedAt))
          .limit(params.results ?? 20);

        return c.json(results, 200);
      } catch (error) {
        console.error(
          `[api/save-note ${c.req.method}] encountered error while getting notes from database: `,
          error,
        );
        return c.json({ error: 'Could not get notes' }, 500);
      }
    },
  );

Bun.serve({
  fetch: app.fetch,
  port: 3001,
});

export default app;
export type AppType = typeof app;
