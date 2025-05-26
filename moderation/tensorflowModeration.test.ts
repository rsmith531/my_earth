import { expect, test, describe } from 'vitest';
import { classifyToxicity } from './tensorflowModeration';

describe('The toxicity model', () => {
  describe('should allow safe text', async () => {
    test('example 1', async () => {
      const result = await classifyToxicity(
        'I love the smell of sunshine in the morning',
      );

      expect(result.length).toBe(0);
    });
    test('example 2', async () => {
      const result = await classifyToxicity(
        'The birds and the bees make spring my favorite season',
      );

      expect(result.length).toBe(0);
    });
  });

  describe('should detect', () => {
    test('threats', async () => {
      const result = await classifyToxicity("I'm going to kill your mom");

      expect(result.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.some(
        (item) => item.label === 'threat' && item.results.some((r) => r.match),
      );
      expect(hasCorrectClassification).toBe(true);
    });

    // failing
    test('identity attacks', async () => {
      const result = await classifyToxicity('Get your gay self out of here.');

      expect(result.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.some(
        (item) =>
          item.label === 'identity_attack' && item.results.some((r) => r.match),
      );
      expect(hasCorrectClassification).toBe(true);
    });

    test('insults', async () => {
      const result = await classifyToxicity(
        'Your mama so fat she wanted to eat the earth for breakfast.',
      );

      expect(result.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.some(
        (item) => item.label === 'insult' && item.results.some((r) => r.match),
      );
      expect(hasCorrectClassification).toBe(true);
    });

    test('obscene', async () => {
      const result = await classifyToxicity('No fucking way');

      expect(result.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.some(
        (item) => item.label === 'obscene' && item.results.some((r) => r.match),
      );
      expect(hasCorrectClassification).toBe(true);
    });

    // what is severe toxicity?
    test.skip('severe toxicity', async () => {
      const result = await classifyToxicity("I'm going to kill your mom");

      expect(result.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.some(
        (item) =>
          item.label === 'severe_toxicity' && item.results.some((r) => r.match),
      );
      expect(hasCorrectClassification).toBe(true);
    });

    // failing
    test('sexual harassment', async () => {
      const result = await classifyToxicity(
        'Wanna go back to my place so you can give me a blowjob?',
      );

      expect(result.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.some(
        (item) =>
          item.label === 'sexual_explicit' && item.results.some((r) => r.match),
      );
      expect(hasCorrectClassification).toBe(true);
    });

    test('general toxicity', async () => {
      const result = await classifyToxicity('I hate everybody here');

      expect(result.length).toBeGreaterThanOrEqual(1);

      const hasCorrectClassification = result.some(
        (item) =>
          item.label === 'toxicity' && item.results.some((r) => r.match),
      );
      expect(hasCorrectClassification).toBe(true);
    });
  });
});
