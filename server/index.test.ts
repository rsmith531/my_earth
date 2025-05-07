// server\index.test.ts

import { testClient } from 'hono/testing';
import {dbServer} from './index';
import { expect, test, describe, beforeAll, mock, afterAll } from 'bun:test';

describe('The notes endpoint', () => {
  const realConsole = console;
  
  beforeAll(() => {
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
    altitude: '4',
    fieldOfView: '50',
    latitude: '41.15611',
    longitude: '-81.41418',
  };

  describe('for GET requests', () => {
    test('should return notes', async () => {
      const res = await client['save-note'].$get({
        query: getParams,
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      console.log(body);
      expect(body).toBeArray();
      expect(body).not.toHaveProperty('error');
    });
    test('should respect the results param', async () => {
      const res = await client['save-note'].$get({
        query: { ...getParams, results: '1' },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      console.log(body);
      expect(body).toBeArray();
      expect(body).toHaveLength(1);
      expect(body).not.toHaveProperty('error');
    });

    describe('should return errors', () => {
      test('for missing params', async () => {
        const res = await client['save-note'].$get({
          // @ts-expect-error intentionally excluding altitude to test missing params
          query: { ...getParams, altitude: undefined },
        });

        // @ts-expect-error middleware types can't be inferred
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toHaveProperty('error');
      });
      test('for invalid params', async () => {
        const res = await client['save-note'].$get({
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
