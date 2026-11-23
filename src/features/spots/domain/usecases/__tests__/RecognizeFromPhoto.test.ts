import type { ImageRecognizer } from '../../recognition/ImageRecognizer';
import { MAX_RESULTS, RecognizeFromPhoto } from '../RecognizeFromPhoto';

const recognizerReturning = (candidates: { id: string; confidence: number }[]): ImageRecognizer => ({
  recognize: jest.fn().mockResolvedValue(candidates),
});

describe('RecognizeFromPhoto', () => {
  it('trie les propositions de la plus probable à la moins probable', async () => {
    const useCase = new RecognizeFromPhoto(
      recognizerReturning([
        { id: 'sandre', confidence: 0.1 },
        { id: 'brochet', confidence: 0.85 },
      ]),
    );

    const results = await useCase.execute('species', 'file:///prise.jpg');

    expect(results.map((r) => [r.item.id, r.confidence])).toEqual([
      ['brochet', 0.85],
      ['sandre', 0.1],
    ]);
  });

  it('ignore ce qui n’est pas dans le catalogue et borne la confiance entre 0 et 1', async () => {
    const useCase = new RecognizeFromPhoto(
      recognizerReturning([
        { id: 'requin', confidence: 0.99 },
        { id: 'shad', confidence: 1.4 },
      ]),
    );

    const results = await useCase.execute('bait', 'file:///leurre.jpg');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ item: { id: 'shad' }, confidence: 1 });
  });

  it(`garde au plus ${MAX_RESULTS} propositions`, async () => {
    const useCase = new RecognizeFromPhoto(
      recognizerReturning(['brochet', 'sandre', 'perche', 'carpe', 'truite'].map((id, i) => ({ id, confidence: 0.5 - i / 10 }))),
    );

    expect(await useCase.execute('species', 'file:///p.jpg')).toHaveLength(MAX_RESULTS);
  });
});
