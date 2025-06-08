// client\lib\useModerator.tsx

import { useEffect, useCallback, useState } from 'react';
import type { classificationResults, moderatorWorkerResponse } from './moderator.worker';
import { toast } from 'sonner';

let moderationWorker: Worker | null = null;
let initializeWorkerPromise: Promise<void> | null = null;

export function useModerationWorker(threshold?: number) {
  const [isWorkerInitialized, setIsWorkerInitialized] = useState<boolean>(false);

  // initialize the moderator when the hook is called
  useEffect(() => {
    // Initialize the worker only once across the application lifecycle
    if (!moderationWorker) {
      moderationWorker = new Worker(
        new URL('./moderator.worker.ts', import.meta.url), {type: 'module'}
      );

      // Create a promise that resolves when the model is initialized in the worker
      initializeWorkerPromise = new Promise<void>((resolve, reject) => {
        const messageHandler = (
          event: MessageEvent<moderatorWorkerResponse>,
        ) => {
          if (event.data.type === 'MODEL_INITIALIZED') {
            console.log(
              '[useModerationWorker] Moderation model initialized in worker.',
            );
            setIsWorkerInitialized(true);
            moderationWorker?.removeEventListener('message', messageHandler);
            resolve();
          } else if (event.data.type === 'MODEL_INIT_ERROR') {
            console.error(
              '[useModerationWorker] Error initializing moderation model in worker:',
              event.data.error,
            );
            moderationWorker?.removeEventListener('message', messageHandler);
            reject(new Error());
          }
        };

        if (!moderationWorker) {
          // should not happen given the check above
          reject(new Error('Moderation worker failed to instantiate.'));
          return;
        }
        moderationWorker.addEventListener('message', messageHandler);
        moderationWorker.postMessage({
          type: 'INIT_MODEL',
          payload: { threshold },
        });
      });

      moderationWorker.onerror = (error) => {
        console.error('[useModerationWorker] Moderation worker error:', error);
        toast.error(
          'Moderation service encountered an error. Please try again later.',
          {
            closeButton: true,
            duration: Number.POSITIVE_INFINITY,
          },
        );
      };
    }

    // terminate the worker at the end of the hook's lifecycle
    // return () => {
    //   if (moderationWorker) {
    //     moderationWorker.terminate();
    //     moderationWorker = null;
    //     initializeWorkerPromise = null;
    //     isWorkerInitialized.current = false;
    //   }
    // };
  }, []);

  const classifyText = useCallback(
    async (text: string): Promise<classificationResults> => {
      // Ensure the model is initialized before attempting classification
      if (initializeWorkerPromise) {
        try {
          await initializeWorkerPromise;
        } catch (error) {
          toast.error(
            'Failed to load moderation service. Please try again later.',
            {
              closeButton: true,
              duration: Number.POSITIVE_INFINITY,
            },
          );
        }
      }

      if (!moderationWorker) {
        throw new Error('Moderation worker is not available.');
      }

      return new Promise((resolve, reject) => {
        if (!moderationWorker) {
          reject(new Error('Moderation worker became unavailable.'));
          return;
        }

        const messageHandler = (
          event: MessageEvent<moderatorWorkerResponse>,
        ) => {
          if (event.data.type === 'CLASSIFICATION_RESULTS') {
            moderationWorker?.removeEventListener('message', messageHandler);
            resolve(event.data.results);
          } else if (event.data.type === 'CLASSIFICATION_ERROR') {
            moderationWorker?.removeEventListener('message', messageHandler);
            reject(new Error(event.data.error));
          }
        };

        moderationWorker.addEventListener('message', messageHandler);
        moderationWorker.postMessage({
          type: 'CLASSIFY_TEXT',
          payload: { text },
        });
      });
    },
    [],
  );

  return { classifyText, isWorkerReady: isWorkerInitialized };
}
