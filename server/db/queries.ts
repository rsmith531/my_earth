// server\db\queries.ts

import { db } from './client';
import { notes } from './schema';
import { sql } from 'drizzle-orm';

export async function getMessagesWithin(
  distance: number,
  from: typeof notes.$inferSelect.location, // in meters?
  amount = 20,
) {
  return await db
    .select({ message: notes.message, location: notes.location })
    .from(notes)
    .where(
      sql`ST_DWithin(${notes.location}::geography, ST_SetSRID(ST_MakePoint(${from.x}, ${from.y}), 4326)::geography, ${distance})`,
    )
    .limit(amount);
}
