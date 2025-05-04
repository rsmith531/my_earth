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
} from 'drizzle-orm/pg-core';

export const notes = pgTable(
  'notes',
  {
    latitude: numeric({ precision: 7, scale: 5 }).notNull(),
    longitude: numeric({ precision: 7, scale: 5 }).notNull(),
    message: text().notNull(),
    created_at: timestamp().defaultNow().notNull(),
    updated_at: timestamp(),
    deleted_at: timestamp(),
    id: uuid().defaultRandom().primaryKey(),
  },
  (table) => [
    check('300_char_messages', sql`length(${table.message}) <= 300`),
    check(
      'valid_latitude',
      sql`${table.latitude} >= -90 AND ${table.latitude} <= 90`,
    ),
    check(
      'valid_longitude',
      sql`${table.longitude} >= -180 AND ${table.longitude} <= 180`,
    ),
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
