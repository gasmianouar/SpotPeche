import type { PhotoPixelsReader } from '@/core/media/PhotoPixelsReader';

import { NO_FISH_NOTE, OnDeviceImageRecognizer } from '../recognition/OnDeviceImageRecognizer';
import type { FishDetector } from '../../domain/recognition/FishDetector';
import { RecognitionUnavailableError } from '../../domain/recognition/ImageRecognizer';
import type { BoundingBox, RgbImage } from '../../domain/recognition/RgbImage';
import type { SpeciesEmbedder } from '../../domain/recognition/SpeciesEmbedder';
import { UNSURE_NOTE, type ScoreOptions, type SpeciesHead } from '../../domain/recognition/scoreSpecies';

const PHOTO: RgbImage = { data: new Uint8Array(100 * 80 * 3), width: 100, height: 80 };
// Couche de décision en dimension 3 : l'axe 1 = bar, l'axe 2 = daurade.
const HEAD: SpeciesHead = { classIds: ['bar', 'daurade'], weights: [[20, 0, 0], [0, 20, 0]], bias: [0, 0] };
const OPTIONS: ScoreOptions = { minConfidence: 0.9, maxCandidates: 3 };

const reader = (image = PHOTO): PhotoPixelsReader => ({ read: jest.fn().mockResolvedValue(image) });
const detector = (boxes: BoundingBox[]): FishDetector => ({ detect: jest.fn().mockResolvedValue(boxes) });
const embedder = (embedding = [1, 0, 0]): SpeciesEmbedder & { embed: jest.Mock } => ({
  embed: jest.fn().mockResolvedValue({ embedding }),
});

describe('OnDeviceImageRecognizer', () => {
  it('n’est pas une démonstration', () => {
    expect(new OnDeviceImageRecognizer(reader(), detector([]), embedder(), HEAD).isDemo).toBe(false);
  });

  it('recadre sur le poisson le plus sûr avant le classifieur', async () => {
    const classifier = embedder();
    const boxes = [
      { x0: 0, y0: 0, x1: 100, y1: 80, confidence: 0.4 }, // la plus grande
      { x0: 20, y0: 20, x1: 60, y1: 40, confidence: 0.9 }, // la plus sûre
    ];
    await new OnDeviceImageRecognizer(reader(), detector(boxes), classifier, HEAD, OPTIONS).recognize('file:///p.jpg');

    const cropped: RgbImage = classifier.embed.mock.calls[0][0];
    // Recadrage au ras de la boîte la plus sûre : 40 × 20 px.
    expect([cropped.width, cropped.height]).toEqual([40, 20]);
  });

  it('analyse toute la photo et le signale quand aucun poisson n’est détecté', async () => {
    const classifier = embedder();
    const outcome = await new OnDeviceImageRecognizer(reader(), detector([]), classifier, HEAD, OPTIONS).recognize('file:///p.jpg');

    expect(classifier.embed.mock.calls[0][0]).toBe(PHOTO);
    expect(outcome.note).toBe(NO_FISH_NOTE);
    expect(outcome.candidates[0].id).toBe('bar');
  });

  it('renvoie le résultat du score sur le catalogue', async () => {
    const box = { x0: 10, y0: 10, x1: 50, y1: 50, confidence: 0.8 };
    const outcome = await new OnDeviceImageRecognizer(reader(), detector([box]), embedder([0, 1, 0]), HEAD, OPTIONS).recognize('file:///p.jpg');
    expect(outcome.candidates[0].id).toBe('daurade');
    expect(outcome.note).toBeUndefined();
  });

  it('garde la note « je ne sais pas » même sans poisson détecté', async () => {
    const lost = embedder([0, 0, 1]); // ni bar ni daurade : 50 / 50, sous le seuil de 0,9
    const outcome = await new OnDeviceImageRecognizer(reader(), detector([]), lost, HEAD, OPTIONS).recognize('file:///p.jpg');
    expect(outcome).toEqual({ candidates: [], note: UNSURE_NOTE });
  });

  it.each([
    ['le lecteur de photo', { read: jest.fn().mockRejectedValue(new Error('fichier illisible')) }, detector([]), embedder()],
    ['le détecteur', reader(), { detect: jest.fn().mockRejectedValue(new Error('modèle absent')) }, embedder()],
    ['le classifieur', reader(), detector([]), { embed: jest.fn().mockRejectedValue(new Error('mémoire insuffisante')) }],
  ])('transforme un échec de %s en RecognitionUnavailableError', async (_label, photos, fish, species) => {
    const recognizer = new OnDeviceImageRecognizer(photos as PhotoPixelsReader, fish as FishDetector, species as SpeciesEmbedder, HEAD);
    await expect(recognizer.recognize('file:///p.jpg')).rejects.toBeInstanceOf(RecognitionUnavailableError);
  });

  it('charge la couche de décision au premier usage, et transforme son échec en RecognitionUnavailableError', async () => {
    const lazy = jest.fn(() => HEAD);
    const recognizer = new OnDeviceImageRecognizer(reader(), detector([]), embedder(), lazy, OPTIONS);
    expect(lazy).not.toHaveBeenCalled();
    await recognizer.recognize('file:///a.jpg');
    await recognizer.recognize('file:///b.jpg');
    expect(lazy).toHaveBeenCalledTimes(1);

    const broken = () => {
      throw new Error('Espèces sans classe : sole');
    };
    await expect(new OnDeviceImageRecognizer(reader(), detector([]), embedder(), broken).recognize('file:///p.jpg')).rejects.toBeInstanceOf(
      RecognitionUnavailableError,
    );
  });

  it('n’appelle jamais le réseau', async () => {
    const fetchSpy = jest.fn();
    const original = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      await new OnDeviceImageRecognizer(reader(), detector([]), embedder(), HEAD, OPTIONS).recognize('file:///p.jpg');
    } finally {
      globalThis.fetch = original;
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
