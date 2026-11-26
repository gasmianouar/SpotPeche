import { decodeBestBox, detectorInput, embedderInput, resizeRgb, toChwFloat } from '../recognition/executorch/preprocess';
import type { RgbImage } from '../../domain/recognition/RgbImage';

import pillow from './fixtures/pillow-resize.json';

const SOURCE: RgbImage = { data: Uint8Array.from(pillow.data), width: pillow.width, height: pillow.height };

describe('resizeRgb', () => {
  it.each(pillow.cases.map((c) => [`${c.width}×${c.height}`, c] as const))(
    'donne le même résultat que Pillow (BILINEAR) en %s, à 1 niveau près',
    (_label, expected) => {
      const out = resizeRgb(SOURCE, expected.width, expected.height);
      expect([out.width, out.height]).toEqual([expected.width, expected.height]);
      const worst = out.data.reduce((max, v, i) => Math.max(max, Math.abs(v - expected.data[i])), 0);
      expect(worst).toBeLessThanOrEqual(1);
    },
  );
});

describe('toChwFloat', () => {
  it('passe de RGB entrelacé (0..255) à trois plans 0..1', () => {
    const img: RgbImage = { data: Uint8Array.from([255, 0, 51, 0, 255, 102]), width: 2, height: 1 };
    Array.from(toChwFloat(img)).forEach((v, i) => expect(v).toBeCloseTo([1, 0, 0, 1, 0.2, 0.4][i], 6));
  });
});

describe('embedderInput', () => {
  it('produit un tenseur 3 × 224 × 224', () => {
    expect(embedderInput(SOURCE).length).toBe(3 * 224 * 224);
  });
});

describe('detectorInput', () => {
  it('étire toute la photo en carré, sans marges', () => {
    const wide: RgbImage = { data: new Uint8Array(200 * 100 * 3).fill(255), width: 200, height: 100 };
    const input = detectorInput(wide, 64);
    expect(input).toHaveLength(3 * 64 * 64);
    expect(input[0]).toBeCloseTo(1); // coin haut gauche : la photo, pas de bande grise
    expect(input[3 * 64 * 64 - 1]).toBeCloseTo(1);
  });
});

describe('decodeBestBox', () => {
  it('ramène la boîte en pixels de la photo', () => {
    // 3 requêtes, une ligne chacune : cx, cy, w, h (fractions de la photo), score. Seule la 2e passe le seuil.
    const raw = Float32Array.from([0.1, 0.1, 0.1, 0.1, 0.2, 0.5, 0.25, 0.5, 0.1, 0.9, 0.7, 0.7, 0.2, 0.2, 0.1]);
    const box = decodeBestBox(raw, 200, 100);
    expect(box).toEqual({ x0: expect.closeTo(50), y0: expect.closeTo(20), x1: expect.closeTo(150), y1: expect.closeTo(30), confidence: expect.closeTo(0.9) });
  });

  it('prend le plus grand poisson parmi les boîtes sûres (score ≥ 60 % du meilleur)', () => {
    const raw = Float32Array.from([
      0.8, 0.8, 0.1, 0.1, 0.9, // petit poisson du fond, le plus sûr
      0.4, 0.5, 0.6, 0.4, 0.7, // poisson montré : grand, 0,7 ≥ 0,6 × 0,9
      0.5, 0.5, 1.0, 1.0, 0.4, // très grande boîte, mais trop peu sûre (0,4 < 0,54)
    ]);
    expect(decodeBestBox(raw, 100, 100)?.confidence).toBeCloseTo(0.7);
  });

  it('ne renvoie rien sous le seuil, ou pour une sortie vide ou mal formée', () => {
    expect(decodeBestBox(Float32Array.from([0.5, 0.5, 0.2, 0.2, 0.29]), 1, 1)).toBeNull();
    expect(decodeBestBox(new Float32Array(0), 1, 1)).toBeNull();
    expect(decodeBestBox(new Float32Array(7), 1, 1)).toBeNull();
  });
});
