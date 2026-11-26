jest.mock('expo-asset', () => ({ Asset: { loadAsync: jest.fn() } }));
jest.mock('react-native-executorch', () => ({ loadModel: jest.fn(), tensor: jest.fn(), wrapAsync: (fn: unknown) => fn }));

import type { Model, Tensor } from 'react-native-executorch';

import { SPECIES_CATALOG } from '../../domain/entities/Catalog';
import type { RgbImage } from '../../domain/recognition/RgbImage';
import { DETECTOR_QUERIES, ExecutorchFishDetector } from '../recognition/executorch/ExecutorchFishDetector';
import { DETECTOR_SIZE } from '../recognition/executorch/preprocess';
import { ExecutorchSpeciesEmbedder } from '../recognition/executorch/ExecutorchSpeciesEmbedder';
import { ExecutorchPteRunner, type ExecutorchApi, type PteRunner } from '../recognition/executorch/PteRunner';
import { loadSpeciesHead } from '../recognition/executorch/speciesHead';

const IMAGE: RgbImage = { data: new Uint8Array(64 * 48 * 3), width: 64, height: 48 };

function fakeApi(overrides: Partial<ExecutorchApi> = {}) {
  const disposed: Tensor[] = [];
  const api: ExecutorchApi & { disposed: Tensor[] } = {
    disposed,
    resolvePath: jest.fn().mockResolvedValue('/data/model.pte'),
    load: jest.fn().mockResolvedValue({} as Model),
    execute: jest.fn().mockResolvedValue([]),
    tensor: jest.fn((shape: number[]) => {
      const numel = shape.reduce((a, b) => a * b, 1);
      const t = {
        numel,
        getData: (dst: Float32Array) => dst.fill(0.5),
        dispose: () => disposed.push(t as unknown as Tensor),
      };
      return t as unknown as Tensor;
    }),
    ...overrides,
  };
  return api;
}

describe('ExecutorchPteRunner', () => {
  it('charge le modèle une seule fois pour plusieurs reconnaissances', async () => {
    const api = fakeApi();
    const runner = new ExecutorchPteRunner(1, api);
    for (let i = 0; i < 3; i++) await runner.run(new Float32Array(4), [1, 4], [[1, 2]]);
    expect(api.load).toHaveBeenCalledTimes(1);
    expect(api.execute).toHaveBeenCalledTimes(3);
  });

  it('réessaie au prochain appel si le chargement a raté', async () => {
    const load = jest.fn().mockRejectedValueOnce(new Error('mémoire insuffisante')).mockResolvedValue({} as Model);
    const runner = new ExecutorchPteRunner(1, fakeApi({ load }));
    await expect(runner.run(new Float32Array(4), [1, 4], [[1, 2]])).rejects.toThrow('mémoire insuffisante');
    await expect(runner.run(new Float32Array(4), [1, 4], [[1, 2]])).resolves.toHaveLength(1);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('libère les tenseurs, même si le calcul échoue', async () => {
    const api = fakeApi({ execute: jest.fn().mockRejectedValue(new Error('échec')) });
    await expect(new ExecutorchPteRunner(1, api).run(new Float32Array(4), [1, 4], [[1, 2], [1, 3]])).rejects.toThrow();
    expect(api.disposed).toHaveLength(3); // entrée + 2 sorties
  });

  it('renvoie les sorties avec la taille demandée', async () => {
    const [a, b] = await new ExecutorchPteRunner(1, fakeApi()).run(new Float32Array(4), [1, 4], [[1, 256], [1, 639]]);
    expect([a.length, b.length]).toEqual([256, 639]);
  });
});

describe('ExecutorchSpeciesEmbedder', () => {
  it('envoie une image 3 × 224 × 224, réserve 256 + 639 valeurs et renvoie l’empreinte', async () => {
    const runner: PteRunner = { run: jest.fn().mockResolvedValue([new Float32Array(256).fill(0.0625), new Float32Array(639)]) };
    const out = await new ExecutorchSpeciesEmbedder(runner).embed(IMAGE);
    const [input, shape, outputs] = (runner.run as jest.Mock).mock.calls[0];
    expect(input).toHaveLength(3 * 224 * 224);
    expect(shape).toEqual([1, 3, 224, 224]);
    expect(outputs).toEqual([[1, 256], [1, 639]]);
    expect(out.embedding).toHaveLength(256);
  });
});

describe('ExecutorchFishDetector', () => {
  it('envoie la photo étirée et renvoie la meilleure boîte, en pixels de la photo', async () => {
    const raw = new Float32Array(5 * DETECTOR_QUERIES);
    raw.set([0.5, 0.5, 0.25, 0.5, 0.9], 5 * 42); // requête 42 : boîte centrée, score 0,9
    const run = jest.fn().mockResolvedValue([raw]);
    const [box] = await new ExecutorchFishDetector({ run }).detect(IMAGE);
    const [, shape, outputs] = run.mock.calls[0];
    expect(shape).toEqual([1, 3, DETECTOR_SIZE, DETECTOR_SIZE]);
    expect(outputs).toEqual([[1, DETECTOR_QUERIES, 5]]);
    // Photo 64 × 48 : x0 = (0,5 − 0,125) × 64, y0 = (0,5 − 0,25) × 48.
    expect(box.x0).toBeCloseTo(24);
    expect(box.y0).toBeCloseTo(12);
    expect(box.x1).toBeCloseTo(40);
    expect(box.y1).toBeCloseTo(36);
    expect(box.confidence).toBeCloseTo(0.9);
  });
});

describe('loadSpeciesHead', () => {
  const row = () => new Array(256).fill(0.01);
  const file = (classIds: string[], dim = 256) => ({ version: 1, dim, classIds, weights: classIds.map(row), bias: classIds.map(() => 0) });
  const all = SPECIES_CATALOG.map((s) => s.id);

  it('accepte une couche qui couvre tout le catalogue, groupes compris', () => {
    const head = loadSpeciesHead(file([...all, 'mulet']), SPECIES_CATALOG); // deux classes pour le groupe mulet
    expect(head.classIds).toHaveLength(all.length + 1);
  });

  it('refuse une espèce sans classe, une classe hors catalogue ou une mauvaise dimension', () => {
    expect(() => loadSpeciesHead(file(all.slice(1)), SPECIES_CATALOG)).toThrow('Espèces sans classe');
    expect(() => loadSpeciesHead(file([...all, 'requin']), SPECIES_CATALOG)).toThrow('Classes hors catalogue');
    expect(() => loadSpeciesHead(file(all, 128), SPECIES_CATALOG)).toThrow('dimension');
    expect(() => loadSpeciesHead({ ...file(all), bias: [] }, SPECIES_CATALOG)).toThrow('incomplète');
  });
});
