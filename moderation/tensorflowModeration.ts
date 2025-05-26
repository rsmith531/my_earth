// https://www.techtarget.com/searchcontentmanagement/tip/Types-of-AI-content-moderation-and-how-they-work
// https://blog.tensorflow.org/2022/08/content-moderation-using-machine-learning-a-dual-approach.html
// https://dev.to/bekahhw/youre-toxic-using-the-toxicity-model-with-tensorflowjs-5h27
// https://medium.com/codex/detecting-online-toxicity-with-tensorflow-js-77770649e5c4  <-- slop
// https://observablehq.com/@e83e200c7de9a3ab/tensorflow-js-lab01-using-the-toxicity-model/2
// https://www.tensorflow.org/js/guide/platform_environment

import { ToxicityClassifier } from '@tensorflow-models/toxicity';
import tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

if (typeof window !== 'undefined') {
  tf.setBackend('webgl');
} else {
  tf.setBackend('wasm');
}

let model: ToxicityClassifier;

export async function classifyToxicity(
  sentence: string,
  threshold = 0.8,
): Promise<ReturnType<ToxicityClassifier['classify']>> {
  if (!model) {
    model = new ToxicityClassifier(threshold);
    await model.load();
  }

  const pred = await model.classify(sentence);
  //   console.log('classification of sentence: ', JSON.stringify(pred, null, 2));

  // filter out non-matching sentences
  const filteredPred = pred.filter((item) =>
    item.results.some((result) => result.match),
  );
  return filteredPred;
}
