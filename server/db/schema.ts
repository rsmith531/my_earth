// server\db\schema.ts

import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  timestamp,
  numeric,
  text,
  check,
  pgPolicy,
  geometry,
  index,
} from 'drizzle-orm/pg-core';

export const notes = pgTable(
  'notes',
  {
    location: geometry('location', { type: 'point', srid: 4326, mode: 'xy' }).notNull(),
    message: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    id: uuid().defaultRandom().primaryKey(),
  },
  (table) => [
    index('location_index').using('gist', table.location),
    check('300_char_messages', sql`length(${table.message}) <= 300`),
    pgPolicy('public_insert', {
      as: 'permissive',
      to: 'public',
      for: 'insert',
    }),
    pgPolicy('public_read', {
      as: 'permissive',
      to: 'public',
      for: 'select',
    }),
    // no policies for delete and update because I don't want that to be allowed
    // yet
  ],
);
