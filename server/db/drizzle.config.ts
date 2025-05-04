// server\db\drizzle.config.ts

import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('[db/client] no database connection string was provided.');
}

export default defineConfig({
  // https://github.com/drizzle-team/drizzle-orm/issues/3226#issuecomment-2477984087
  out: './db/.drizzle',
  dialect: 'postgresql',
  schema: './db/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
