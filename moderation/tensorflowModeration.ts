// moderation\tensorflowModeration.ts

import { ToxicityClassifier } from '@tensorflow-models/toxicity';
import { getBackend, ready } from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

// try {
//   if (typeof window !== 'undefined') {
//     console.info('initializing moderator with webgl backend.');
//     await setBackend('webgl');
//     console.info('finished moderator initialization with webgl backend.');
//   } else {
//     // TODO: figure out wasm error in web worker
//     console.info('initializing moderator with wasm backend.');
//     await setBackend('wasm');
//     console.info('finished moderator initialization with wasm backend.');
//   }
// } catch (error) {
//   console.error(
//     `[tensorflowModeration] failed to initialize a faster back end. Falling back to default: ${getBackend()}`,
//     error,
//   );
// }

const DEFAULT_THRESHOLD = 0.8;
let model: ToxicityClassifier | null;
let modelLoading: Promise<void> | null = null;

/**
 * Initializes the model so that it can be used to classify the toxicity levels
 * of a given sentence.
 *
 * Use this if you want to get the model ready for use before actually using it,
 * since it takes a few seconds to spool up.
 *
 * @param threshold the level of confidence that should be used to determine if
 * content is toxic.
 */
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
    ready()
      .then(() => newModel.load())
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
        console.info(`moderator loaded using ${getBackend()} backend.`);
      });
  });

  modelLoading = loading; // store the promise
  return loading; // return the promise so callers can await it
}

/**
 * The response from the ML model should be massaged into this format to get
 * returned to the caller so that the model can be swapped out for others
 * without having to make sure the new model's output is the same as the
 * previous one's output.
 */
type toxicityClassifications = {
  category:
    | 'identity_attack'
    | 'obscene'
    | 'severe_toxicity'
    | 'sexual_explicit'
    | 'insult'
    | 'threat'
    | 'toxicity';
  probabilities: {
    safe: number;
    toxic: number;
  };
}[];

/**
 * Determine if a sentence contains any toxic content and the kind that it
 * contains.
 *
 * It uses machine learning to do this (specifically, the
 * {@link https://www.kaggle.com/models/tensorflow/toxicity/tfJs/default/1 toxicity model}
 * from Kaggle).
 *
 * @param sentence The content to be classified.
 * @param threshold The confidence level that must be exceeded in order for the
 * content to be deemed toxic OR safe. **note**: this will be bypassed if the
 * model was previously initialized with a different threshold.
 * @returns Two arrays. The first contains the types of toxicity that it is
 * certain are in the content, and the second contains the types that it could
 * not determine DO or DON'T exist in the content.
 */
export async function classifyToxicity(
  sentence: string,
  threshold = DEFAULT_THRESHOLD,
): Promise<{
  matchedResults: toxicityClassifications;
  uncertainResults: toxicityClassifications;
}> {
  await initializeModerator(threshold);

  if (!model) {
    // should not be possible, but we'll check anyways
    throw new Error(
      '[moderation] Toxicity model is not available for classification.',
    );
  }

  const pred = await model.classify(sentence);

  return pred.reduce(
    (acc, item) => {
      const transformedItem: toxicityClassifications[number] = {
        category: item.label as toxicityClassifications[number]['category'],
        probabilities: {
          // cop out for handling undefined values: just set probability to 0.
          // Should never happen since I know the results array has a
          // probabilities array whose first element is the safe probability and
          // the second is the toxic probability
          safe: item.results[0]?.probabilities[0] ?? 0,
          toxic: item.results[0]?.probabilities[1] ?? 0,
        },
      };

      if (item.results[0]?.match === true) {
        // save the matched result
        acc.matchedResults.push(transformedItem);
      }
      // null means the model could not meet the confidence threshold for
      // determining the sentence is toxic or not
      else if (item.results[0]?.match === null) {
        // save the uncertain result
        acc.uncertainResults.push(transformedItem);
      }

      return acc;
    },
    { matchedResults: [], uncertainResults: [] } as {
      matchedResults: toxicityClassifications;
      uncertainResults: toxicityClassifications;
    },
  );
}
