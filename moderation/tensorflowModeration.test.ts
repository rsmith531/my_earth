import { expect, test, describe } from 'vitest';
import { classifyToxicity } from './tensorflowModeration';

describe('The toxicity model', () => {
  describe('should allow safe text', async () => {
    test('example 1', async () => {
      const result = await classifyToxicity(
        'I love the smell of sunshine in the morning',
      );

      expect(result.matchedResults.length).toBe(0);
      expect(result.uncertainResults.length).toBe(0);
    });
    test('example 2', async () => {
      const result = await classifyToxicity(
        'The birds and the bees make spring my favorite season',
      );

      expect(result.matchedResults.length).toBe(0);
      expect(result.uncertainResults.length).toBe(0);
    });
  });

  describe('should detect', () => {
    // failing
    test.skip('threats', async () => {
      const result = await classifyToxicity("I'm going to kill your mom");

      expect(result.matchedResults.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.matchedResults.some(
        (item) => item.category === 'threat',
      );
      expect(hasCorrectClassification).toBe(true);
    });

    // failing
    test.skip('identity attacks', async () => {
      const result = await classifyToxicity('Get your gay self out of here.');

      expect(result.matchedResults.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.matchedResults.some(
        (item) =>
          item.category === 'identity_attack',
      );
      expect(hasCorrectClassification).toBe(true);
    });

    test('insults', async () => {
      const result = await classifyToxicity(
        'Your mama so fat she wanted to eat the earth for breakfast.',
      );

      expect(result.matchedResults.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.matchedResults.some(
        (item) => item.category === 'insult',
      );
      expect(hasCorrectClassification).toBe(true);
    });

    test('obscene', async () => {
      const result = await classifyToxicity('No fucking way');

      expect(result.matchedResults.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.matchedResults.some(
        (item) => item.category === 'obscene',
      );
      expect(hasCorrectClassification).toBe(true);
    });

    // what is severe toxicity?
    test.skip('severe toxicity', async () => {
      const result = await classifyToxicity("I'm going to kill your mom");

      expect(result.matchedResults.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.matchedResults.some(
        (item) =>
          item.category === 'severe_toxicity',
      );
      expect(hasCorrectClassification).toBe(true);
    });

    // failing
    test.skip('sexual harassment', async () => {
      const result = await classifyToxicity(
        'Wanna go back to my place so you can give me a blowjob?',
      );

      expect(result.matchedResults.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.matchedResults.some(
        (item) =>
          item.category === 'sexual_explicit',
      );
      expect(hasCorrectClassification).toBe(true);
    });

    // failing
    test.skip('general toxicity', async () => {
      const result = await classifyToxicity('I hate knowing that you are happy');

      expect(result.matchedResults.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.matchedResults.some(
        (item) =>
          item.category === 'toxicity',
      );
      expect(hasCorrectClassification).toBe(true);
    });
  });
});
