// moderation\tensorflowModeration.ts

import { ToxicityClassifier } from '@tensorflow-models/toxicity';
import { setBackend } from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

if (typeof window !== 'undefined') {
  setBackend('webgl');
} else {
  setBackend('wasm');
}

const DEFAULT_THRESHOLD = 0.8;
let model: ToxicityClassifier | null;
let modelLoading: Promise<void> | null = null;

export async function initializeModerator(
  threshold = DEFAULT_THRESHOLD,
): Promise<void> {
  // don't reinitialize if it was already initialized
  if (model) return Promise.resolve();
  if (modelLoading) return modelLoading;

  // load the toxicity model, set a promise so everything knows it is being
  // loaded
  const loading = new Promise<void>((resolve, reject) => {
    const newModel = new ToxicityClassifier(threshold);
    newModel
      .load()
      .then(() => {
        model = newModel;
        resolve();
      })
      .catch((error) => {
        console.error('[Toxicity] Failed to load toxicity model:', error);
        model = null;
        reject(error);
      })
      .finally(() => {
        modelLoading = null;
      });
  });

  modelLoading = loading; // store the promise
  return loading; // return the promise so callers can await it
}

export async function classifyToxicity(
  sentence: string,
  threshold = DEFAULT_THRESHOLD,
): Promise<ReturnType<ToxicityClassifier['classify']>> {
  await initializeModerator();

  if (!model) {
    // should not be possible, but we'll check anyways
    throw new Error(
      '[moderation] Toxicity model is not available for classification.',
    );
  }

  const pred = await model.classify(sentence);

  // filter out non-matching sentences
  const filteredPred = pred.filter((item) =>
    item.results.some((result) => result.match),
  );
  return filteredPred;
}
