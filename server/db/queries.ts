// server\db\queries.ts

import { db } from './client';
import { notes } from './schema';
import { sql, and, isNotNull } from 'drizzle-orm';

/**
 * @param distance the distance **in meters** from the point.
 * @param from the provided point. **Note:** *x* is longitude, *y* is latitude
 * @param amount how many results to get.
 * @returns the specified amount of results within the range of the provided point.
 */
export async function getMessagesWithin(
  distance: number,
  from: typeof notes.$inferSelect.location, // in meters
  amount = 20,
) {
  return await db
    .select({ message: notes.message, location: notes.location })
    .from(notes)
    .where(
      and(
        isNotNull(notes.publishedAt),
        sql`ST_DWithin(${notes.location}::geography, ST_Point( ${from.x}, ${from.y}, 4326)::geography, ${distance})`,
      ),
    )
    .limit(amount);
}
