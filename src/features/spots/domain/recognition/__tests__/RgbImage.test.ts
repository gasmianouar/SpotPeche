import { bestBox, cropToBox, type BoundingBox, type RgbImage } from '../RgbImage';

/** Image 10×10 dont chaque pixel encode sa position : R = x, G = y, B = 0. */
function gridImage(width = 10, height = 10): RgbImage {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[(y * width + x) * 3] = x;
      data[(y * width + x) * 3 + 1] = y;
    }
  }
  return { data, width, height };
}

const box = (x0: number, y0: number, x1: number, y1: number, confidence: number): BoundingBox => ({ x0, y0, x1, y1, confidence });

describe('bestBox', () => {
  it('choisit la boîte la plus sûre, ni la plus grande ni la première', () => {
    const big = box(0, 0, 9, 9, 0.5);
    const sure = box(2, 2, 4, 4, 0.9);
    expect(bestBox([big, sure, box(1, 1, 3, 3, 0.4)])).toBe(sure);
  });

  it('ne renvoie rien si toutes les boîtes sont sous le seuil de 0,3', () => {
    expect(bestBox([box(0, 0, 5, 5, 0.29), box(1, 1, 2, 2, 0.1)])).toBeNull();
    expect(bestBox([])).toBeNull();
  });
});

describe('cropToBox', () => {
  it('recadre au ras de la boîte par défaut', () => {
    const crop = cropToBox(gridImage(), box(2, 2, 8, 8, 0.9));
    expect([crop.width, crop.height]).toEqual([6, 6]);
    expect([crop.data[0], crop.data[1]]).toEqual([2, 2]);
  });

  it('ajoute la marge demandée de chaque côté', () => {
    // Boîte de 2 à 8 (6 px), marge 10 % : 0,6 px → 1,4 à 8,6 → pixels 1 à 8 inclus.
    const crop = cropToBox(gridImage(), box(2, 2, 8, 8, 0.9), 0.1);
    expect([crop.width, crop.height]).toEqual([8, 8]);
    expect([crop.data[0], crop.data[1]]).toEqual([1, 1]); // premier pixel = (1, 1) de l'image
  });

  it('reste dans l’image pour une boîte collée au bord', () => {
    const crop = cropToBox(gridImage(), box(0, 5, 10, 10, 0.9), 0.1);
    expect([crop.width, crop.height]).toEqual([10, 6]);
    expect(crop.data.length).toBe(10 * 6 * 3);
    expect(crop.data[1]).toBe(4); // la marge haute commence à y = 4,5 → ligne 4
  });

  it('renvoie au moins un pixel pour une boîte minuscule', () => {
    const crop = cropToBox(gridImage(), box(3, 3, 3, 3, 0.9));
    expect(crop.width).toBeGreaterThanOrEqual(1);
    expect(crop.height).toBeGreaterThanOrEqual(1);
  });
});
