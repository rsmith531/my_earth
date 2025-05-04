// server\db\client.ts

import { drizzle } from 'drizzle-orm/postgres-js';

if (!process.env.DATABASE_URL) {
  throw new Error('[db/client] no database url was provided.');
}

const db = drizzle({
  connection: process.env.DATABASE_URL,
  // camelCase typescript becomes snake_case postgres
  casing: 'snake_case',
});
