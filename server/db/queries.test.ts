import { notes } from './schema';
import { db } from './client';
import { expect, test, describe, beforeAll, afterAll } from 'bun:test';
import { eq } from 'drizzle-orm';
import { getMessagesWithin } from './queries';

/**
 * Mount Rainier and McClure Rock are 5,637 meters apart.
 *
 * The visitor center is 7,599 meters from Mount Rainier.
 *
 * Craters of the Moon is very far away from those.
 */
const testData: (typeof notes.$inferInsert)[] = [
  {
    message: 'Henry M Jackson Visitor Center',
    location: { x: 46.785959632325095, y: -121.73644955422306 },
  },
  {
    message: 'Mount Rainier',
    location: { x: 46.852320896423535, y: -121.76032947806137 },
  },
  {
    message: 'McClure Rock',
    location: { x: 46.808469845235116, y: -121.7231556752573 },
  },
  {
    message: 'Craters of the Moon',
    location: { x: 43.46200993178054, y: -113.56180734978187 },
  },
];

describe('the getMessagesWithin function', () => {
  beforeAll(async () => {
    try {
      console.log('[test/queries] getting set up for tests');
      await db.insert(notes).values(testData);
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
        testData.map((point) => {
          db.delete(notes).where(eq(notes.message, point.message));
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
    // @ts-expect-error it's there, I promise
    const results = await getMessagesWithin(6000, testData[0].location, 5000);

    console.log('[test/queries] results are', results);
    expect(results).toContainEqual(testData[1]);
    expect(results).toContainEqual(testData[2]);
    expect(results).not.toContainEqual(testData[3]);
  });
});
