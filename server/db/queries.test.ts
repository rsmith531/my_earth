// server\db\queries.test.ts

import { notes } from './schema';
import { db } from './client';
import { expect, test, describe, beforeAll, afterAll } from 'bun:test';
import { eq, sql } from 'drizzle-orm';
import { getMessagesWithin } from './queries';
import { testData } from '../utils';

describe('the getMessagesWithin function', () => {
  beforeAll(async () => {
    try {
      console.log('[test/queries] getting set up for tests');
      await db.insert(notes).values(Object.values(testData));
    } catch (e) {
      console.error(
        '[test/queries] error inserting test data into database: ',
        e,
      );
    }
  });
  afterAll(async () => {
    try {
      console.log('[test/queries] cleaning up after tests');

      await Promise.all(
        Object.values(testData).map((point) => {
          // TODO: figure out why using return deletes the rows but hangs the
          // script, and not using return does not delete the rows but does not
          // hang the script
          db.delete(notes)
            .where(eq(notes.message, point.message))
            .returning({ message: notes.message });
        }),
      );
    } catch (e) {
      console.error(
        '[test/queries] error deleting test data from database: ',
        e,
      );
    }
  });
  test('should retrieve locations within a given distance', async () => {
    // find the distance in meters between the start point and the furthest expected point
    const distance = await db.execute(
      sql`SELECT ST_Distance(ST_SetSRID(ST_MakePoint(${testData.visitorCenter.location.x}, ${testData.visitorCenter.location.y}), 4326)::geography, ST_SetSRID(ST_MakePoint(${testData.mountRainier.location.x}, ${testData.mountRainier.location.y}), 4326)::geography)`,
    );

    const results = await getMessagesWithin(
      typeof distance[0]?.st_distance === 'number'
        ? distance[0]?.st_distance + 1
        : 0,
      testData.visitorCenter.location,
      5000,
    );

    expect(results).toContainEqual(testData.mountRainier);
    expect(results).toContainEqual(testData.mcclureRock);
    expect(results).not.toContainEqual(testData.cratersOfTheMoon);
  });
});
