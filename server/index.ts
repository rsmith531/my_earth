import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { validationSchema } from '../components/section/AddReasonForm';
import { db } from './db/client';
import { notes } from './db/schema';
import { eq, isNull } from 'drizzle-orm';

const app = new Hono();

const save_note_api = app
  .post(
    '/save-note',
    validator('json', (value, c) => {
      const parsed = validationSchema.safeParse(value);
      if (!parsed.success) {
        console.error(
          `[api/save-note ${c.req.method}] request failed validation: `,
          parsed.error,
        );
        return c.text('Note submission is invalid', 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const validatedRequest = c.req.valid('json');
      try {
        await db.insert(notes).values({
          ...validatedRequest,
        });
      } catch (error) {
        console.error(
          `[api/save-note ${c.req.method}] encountered error while inserting note into database: `,
          error,
        );
        return c.newResponse('Could not save note', 500);
      }
      return c.newResponse('Note saved', 201);
    },
  )
  .get('/save-note', async (c) => {
    try {
      const results = await db
        .select()
        .from(notes)
        .where(isNull(notes.deletedAt));

      return c.json(results, 200);
    } catch (error) {
      console.error(
        `[api/save-note ${c.req.method}] encountered error while getting notes from database: `,
        error,
      );
      return c.newResponse('Could not get notes', 500);
    }
  });

Bun.serve({
  fetch: app.fetch,
  port: 3001,
});

export type SaveNoteRequest = typeof save_note_api;
