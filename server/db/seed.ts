// server\db\seed.ts

import { db } from './client';
import { reset, seed } from 'drizzle-seed';
import { notes } from './schema';

async function main() {
  // reset the table when the reset flag is set
  if (process.argv.includes('--reset')) {
    console.log('[db/seed] resetting the notes table');
    await reset(db, { notes });
  }

  // Find the index of the --rows flag
  const rowsFlagIndex = process.argv.indexOf('--rows');
  let numberOfRowsToSeed = 10;

  // Check if the --rows flag exists and has a value after it
  if (
    rowsFlagIndex > -1 &&
    process.argv.length > rowsFlagIndex + 1 &&
    typeof process.argv[rowsFlagIndex + 1] === 'string'
  ) {
    // biome-ignore lint/style/noNonNullAssertion: I already checked to make sure it's a string
    const rowsValue = Number.parseInt(process.argv[rowsFlagIndex + 1]!);
    if (!Number.isNaN(rowsValue) && rowsValue > 0) {
      numberOfRowsToSeed = rowsValue;
    } else {
      console.warn(
        `[db/seed] Invalid value for --rows flag: "${process.argv[rowsFlagIndex + 1]}". Using default of ${numberOfRowsToSeed} rows.`,
      );
    }
  } else if (rowsFlagIndex > -1) {
    console.warn(
      `[db/seed] --rows flag requires a number value. Using default of ${numberOfRowsToSeed} rows.`,
    );
  }

  await seed(
    db,
    { notes },
    { count: numberOfRowsToSeed, seed: Math.floor(Math.random() * 99999) },
  ).refine((f) => ({
    notes: {
      columns: {
        // TODO: use weighted random to make most of the lat longs happen in U.S.A. and Europe
        // https://orm.drizzle.team/docs/seed-overview#weighted-random
        latitude: f.number({
          minValue: -90,
          maxValue: 90,
          precision: 100000,
        }),
        longitude: f.number({
          minValue: -180,
          maxValue: 180,
          precision: 100000,
        }),
        message: f.loremIpsum(),
        updated_at: f.default({ defaultValue: null }),
        deleted_at: f.default({ defaultValue: null }),
      },
    },
  }));

  console.log(`[db/seed] added ${numberOfRowsToSeed} rows to the notes table`);
  process.exit(0);
}

main();
