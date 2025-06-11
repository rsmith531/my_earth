// server\utils.ts

// TODO: write tests and docs

import { z } from 'zod';
import type { notes } from './db/schema';

export async function getVisibleRadius(
  altitude: string,
  fov: string,
): Promise<string> {
  const pythonProcess = Bun.spawn({
    cmd: ['python', 'getVisibleSurfaceRadius.py'],
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  // Send data to the Python script's stdin as JSON
  const inputData = { altitude, fov };
  pythonProcess.stdin.write(`${JSON.stringify(inputData)}`);
  pythonProcess.stdin.end();

  // check the scripts stderr to see if it threw any errors
  let error = '';
  const errorReader = pythonProcess.stderr.getReader();
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await errorReader.read();
    done = doneReading;
    if (value) {
      error += new TextDecoder().decode(value);
    }
  }

  if (error) {
    throw new Error(`Python script error: ${error}`);
  }

  // check the scripts output for the results of the calculation
  let result = '';
  const resultReader = pythonProcess.stdout.getReader();
  done = false;
  while (!done) {
    const { value, done: doneReading } = await resultReader.read();
    done = doneReading;
    if (value) {
      result += new TextDecoder().decode(value);
    }
  }

  try {
    const resultJson = JSON.parse(result);
    if (resultJson.error) {
      throw new Error(`Python script returned an error: ${resultJson.error}`);
    }
    return resultJson.visible_radius;
  } catch (parseError) {
    throw new Error(
      `Error parsing Python output: ${parseError}.  Raw output: ${result}`,
    );
  }
}

export const saveNoteValidationSchema = z.object({
  message: z.string().min(1).max(300).trim(),
  latitude: z
    .number({
      required_error:
        'Please wait to send your message until we can attach it to your location.',
    })
    .refine((val) => val !== 0, {
      message:
        'Please wait to send your message until we can attach it to your location.',
    }),
  longitude: z
    .number({
      required_error:
        'Please wait to send your message until we can attach it to your location.',
    })
    .refine((val) => val !== 0, {
      message:
        'Please wait to send your message until we can attach it to your location.',
    }),
});



const aConvenientlyInstantiatedDate = new Date();

/**
 * Mount Rainier and McClure Rock are 5,637 meters apart.
 *
 * The visitor center is 7,599 meters from Mount Rainier.
 *
 * Craters of the Moon is very far away from those.
 */
export const testData = {
  visitorCenter: {
    message: 'TEST Henry M Jackson Visitor Center',
    location: { y: 46.785959632325095, x: -121.73644955422306 },
    publishedAt: aConvenientlyInstantiatedDate,
  },
  mountRainier: {
    message: 'TEST Mount Rainier',
    location: { y: 46.852320896423535, x: -121.76032947806137 },
    publishedAt: aConvenientlyInstantiatedDate,
  },
  mcclureRock: {
    message: 'TEST McClure Rock',
    location: { y: 46.808469845235116, x: -121.7231556752573 },
    publishedAt: aConvenientlyInstantiatedDate,
  },
  // it's in Idaho
  cratersOfTheMoon: {
    message: 'TEST Craters of the Moon',
    location: { y: 43.46200993178054, x: -113.56180734978187 },
    publishedAt: aConvenientlyInstantiatedDate,
  },
} satisfies Record<string, typeof notes.$inferInsert>;
