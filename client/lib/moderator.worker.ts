// client\lib\moderator.worker.ts

// let typescript know what self is
declare const self: Worker;

import { classifyToxicity, initializeModerator } from 'moderation';

export type moderatorWorkerMessage = {
  type: 'INIT_MODEL' | 'CLASSIFY_TEXT';
  payload?: { threshold?: number; text?: string };
};

export type classificationResults = Awaited<
  ReturnType<typeof classifyToxicity>
>;

// discriminated union so that different types have different object shapes
export type moderatorWorkerResponse =
  | { type: 'MODEL_INITIALIZED' }
  | {
      type: 'MODEL_INIT_ERROR' | 'USAGE_ERROR' | 'CLASSIFICATION_ERROR';
      error: any;
    }
  | {
      type: 'CLASSIFICATION_RESULTS';
      results: classificationResults;
    };

// register an event listener that waits for the main thread to tell it what to do
self.onmessage = async (event: MessageEvent<moderatorWorkerMessage>) => {
  const { type: messageType, payload: messagePayload } = event.data;
  let response: moderatorWorkerResponse;

  switch (messageType) {
    case 'INIT_MODEL':
      try {
        await initializeModerator(messagePayload?.threshold);
        response = { type: 'MODEL_INITIALIZED' };
      } catch (error) {
        response = { type: 'MODEL_INIT_ERROR', error: error };
      }
      break;
    case 'CLASSIFY_TEXT':
      try {
        if (!messagePayload?.text) {
          response = {
            type: 'USAGE_ERROR',
            error:
              'payload must contain a text property when type is CLASSIFY_TEXT',
          };
          break;
        }
        const results = await classifyToxicity(
          messagePayload.text,
          messagePayload.threshold,
        );
        response = { type: 'CLASSIFICATION_RESULTS', results };
      } catch (error) {
        response = {
          type: 'CLASSIFICATION_ERROR',
          error: error,
        };
      }
      break;
    default:
      response = {
        type: 'USAGE_ERROR',
        error: `Type ${messageType} is not supported`,
      };
      break;
  }
  self.postMessage(response);
};
