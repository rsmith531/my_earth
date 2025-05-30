// server\index.test.ts

import { testClient } from 'hono/testing';
import {dbServer} from './index';
import { expect, test, describe, beforeAll, mock, afterAll } from 'bun:test';
import { db } from './db/client';
import { notes } from './db/schema';
import { testData } from './db/queries.test';

describe('The notes endpoint', () => {
  const realConsole = console;
  
  beforeAll(async () => {
      try {
        console.log('[test/index] getting set up for tests');
        await db.insert(notes).values(Object.values(testData));
      } catch (e) {
        console.error(
          '[test/index] error inserting test data into database: ',
          e,
        );
      }
    global.console = {
      ...console,
      log: mock(),
    };
  });

  afterAll(() => {
    global.console = realConsole;
  });
  const client = testClient(dbServer);

  const getParams = {
    altitude: '200000',
    fieldOfView: '50',
    latitude: testData.cratersOfTheMoon.location.y.toFixed(5).toString(),
    longitude: testData.cratersOfTheMoon.location.x.toFixed(5).toString(),
  };

  describe('for GET requests', () => {
    test('should return notes', async () => {
      const res = await client['get-notes'].$get({
        query: getParams,
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toBeArray();
      expect(body).not.toHaveProperty('error');
    });
    test('should respect the results param', async () => {
      const res = await client['get-notes'].$get({
        query: { ...getParams, results: '1' },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toBeArray();
      expect(body).toHaveLength(1);
      expect(body).not.toHaveProperty('error');
    });

    describe('should return errors', () => {
      test('for missing params', async () => {
        const res = await client['get-notes'].$get({
          // @ts-expect-error intentionally excluding altitude to test missing params
          query: { ...getParams, altitude: undefined },
        });

        // @ts-expect-error middleware types can't be inferred
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toHaveProperty('error');
      });
      test('for invalid params', async () => {
        const res = await client['get-notes'].$get({
          query: {
            ...getParams,
            altitude: 'not a number',
          },
        });

        // @ts-expect-error middleware types can't be inferred
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toHaveProperty('error');
      });
    });
  });
});
