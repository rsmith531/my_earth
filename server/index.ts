import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { validationSchema } from '../components/section/AddReasonForm';
const app = new Hono();

const save_note_api = app.post(
  '/save-note',
  validator('json', (value, c) => {
    console.log('got value', value)
    const parsed = validationSchema.safeParse(value);
    if (!parsed.success) {
      return c.text('Invalid!', 401);
    }
    return parsed.data;
  }),
  (c) => {
    const { message, latitude, longitude } = c.req.valid('json');
    // save the values to the database

    return c.newResponse(null, 201);
  },
);

Bun.serve({
  fetch: app.fetch,
  port: 3001,
});

export type SaveNoteRequest = typeof save_note_api;
