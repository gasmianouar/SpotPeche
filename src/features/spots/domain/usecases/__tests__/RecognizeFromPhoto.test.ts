import type { ImageRecognizer } from '../../recognition/ImageRecognizer';
import { MAX_RESULTS, RecognizeFromPhoto } from '../RecognizeFromPhoto';

const recognizerReturning = (candidates: { id: string; confidence: number }[], note?: string): ImageRecognizer => ({
  isDemo: false,
  recognize: jest.fn().mockResolvedValue({ candidates, note }),
});

describe('RecognizeFromPhoto', () => {
  it('trie les propositions de la plus probable à la moins probable', async () => {
    const useCase = new RecognizeFromPhoto(
      recognizerReturning([
        { id: 'sandre', confidence: 0.1 },
        { id: 'brochet', confidence: 0.85 },
      ]),
    );

    const { results } = await useCase.execute('file:///prise.jpg');

    expect(results.map((r) => [r.item.id, r.confidence])).toEqual([
      ['brochet', 0.85],
      ['sandre', 0.1],
    ]);
  });

  it('ignore ce qui n’est pas dans le catalogue des espèces et borne la confiance entre 0 et 1', async () => {
    const useCase = new RecognizeFromPhoto(
      recognizerReturning([
        { id: 'requin', confidence: 0.99 },
        { id: 'perche', confidence: 1.4 },
      ]),
    );

    const { results } = await useCase.execute('file:///leurre.jpg');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ item: { id: 'perche' }, confidence: 1 });
  });

  it(`garde au plus ${MAX_RESULTS} propositions`, async () => {
    const useCase = new RecognizeFromPhoto(
      recognizerReturning(['brochet', 'sandre', 'perche', 'carpe', 'truite'].map((id, i) => ({ id, confidence: 0.5 - i / 10 }))),
    );

    expect((await useCase.execute('file:///p.jpg')).results).toHaveLength(MAX_RESULTS);
  });

  it('transmet la note de l’agent et indique si c’est une démonstration', async () => {
    const report = await new RecognizeFromPhoto(recognizerReturning([], '  Photo trop floue.  ')).execute('file:///p.jpg');
    expect(report).toEqual({ results: [], note: 'Photo trop floue.', isDemo: false });

    const demo: ImageRecognizer = { isDemo: true, recognize: jest.fn().mockResolvedValue({ candidates: [] }) };
    expect(await new RecognizeFromPhoto(demo).execute('file:///p.jpg')).toEqual({ results: [], note: null, isDemo: true });
  });
});
