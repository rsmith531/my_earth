// TODO: write tests and docs

import { z } from 'zod';

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
