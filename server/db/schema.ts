// server\db\schema.ts

import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  timestamp,
  text,
  jsonb,
  check,
  pgPolicy,
  geometry,
  index,
  pgRole,
  pgEnum,
} from 'drizzle-orm/pg-core';

const testRole = pgRole('test_role');

export const notes = pgTable(
  'notes',
  {
    location: geometry('location', {
      type: 'point',
      srid: 4326,
      mode: 'xy',
    }).notNull(),
    message: text().notNull(),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'date',
    }),
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
    check(
      'published_or_deleted_exclusive',
      sql`NOT (published_at IS NOT NULL AND deleted_at IS NOT NULL)`,
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
    pgPolicy('tester_all', {
      as: 'permissive',
      to: testRole,
      for: 'all',
    }),
    // no policies for delete and update because I don't want that to be allowed
    // yet
  ],
);

const moderationStatusEnum = pgEnum('moderation_status', [
  'pending', // has been flagged as needing review
  'resolved', // underwent human review and determined unfit for training data
  'labelled', // underwent human review and labelled for ML training
  'trained', // has been used to train the moderation model
]);

export const flaggingAuthorityEnum = pgEnum('flagging_authority', [
  'ml_model_fail',
  'ml_model_uncertain',
  'user_reported',
]);

// source of values: https://github.com/tensorflow/tfjs-models/tree/master/toxicity
export const flagReasonEnum = pgEnum('flag_reason', [
  'identity_attack',
  'insult',
  'obscene',
  'severe_toxicity',
  'sexual_explicit',
  'threat',
  'toxicity',
]);

export const flaggedNotes = pgTable(
  'flagged_notes',
  {
    id: uuid()
      .references(() => notes.id, { onDelete: 'cascade' })
      .primaryKey(),
    reason: flagReasonEnum().array().notNull(),
    flaggedBy: flaggingAuthorityEnum('flagged_by').notNull(),
    status: moderationStatusEnum().default('pending').notNull(),
    mlModelOutput: jsonb('ml_model_output'),
    flaggedAt: timestamp('flagged_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' }),
  },
  () => [
    check(
      'ml_output_required',
      sql`flagged_by NOT IN ('ml_model_fail', 'ml_model_uncertain') OR ml_model_output IS NOT NULL`,
    ),
  ],
);
