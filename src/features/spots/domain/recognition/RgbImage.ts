/**
 * Une image décodée en pixels, et le recadrage sur le poisson (logique pure, testée sans téléphone).
 * Mêmes règles que scripts/ml/detectors.py : boîte la plus SÛRE, marge de 10 %.
 */
export interface RgbImage {
  /** Pixels RGB, 3 octets par pixel, ligne par ligne. */
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
}

/** Boîte d'un poisson, en pixels de l'image analysée. */
export interface BoundingBox {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  /** Confiance du détecteur, de 0 à 1. */
  readonly confidence: number;
}

export const DETECTION_THRESHOLD = 0.3;
/** Recadrage au ras de la boîte : le plus précis avec RF-DETR (scripts/ml/README.md, 26/11). */
export const CROP_MARGIN = 0;

/** La boîte la plus sûre au-dessus du seuil (pas la plus grande, pas la première), ou null. */
export function bestBox(boxes: readonly BoundingBox[], threshold = DETECTION_THRESHOLD): BoundingBox | null {
  let best: BoundingBox | null = null;
  for (const b of boxes) {
    if (b.confidence >= threshold && (!best || b.confidence > best.confidence)) best = b;
  }
  return best;
}

/** Recadre sur la boîte, avec une marge éventuelle de chaque côté, sans sortir de l'image (au moins 1 pixel). */
export function cropToBox(image: RgbImage, box: BoundingBox, margin = CROP_MARGIN): RgbImage {
  const mx = margin * (box.x1 - box.x0);
  const my = margin * (box.y1 - box.y0);
  const left = clamp(Math.floor(box.x0 - mx), 0, image.width - 1);
  const top = clamp(Math.floor(box.y0 - my), 0, image.height - 1);
  const right = clamp(Math.ceil(box.x1 + mx), left + 1, image.width);
  const bottom = clamp(Math.ceil(box.y1 + my), top + 1, image.height);
  const width = right - left;
  const height = bottom - top;

  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    const from = ((top + y) * image.width + left) * 3;
    data.set(image.data.subarray(from, from + width * 3), y * width * 3);
  }
  return { data, width, height };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
