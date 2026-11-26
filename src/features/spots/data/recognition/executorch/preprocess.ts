import { DETECTION_THRESHOLD, type BoundingBox, type RgbImage } from '../../../domain/recognition/RgbImage';

/**
 * Préparation des images pour les modèles, IDENTIQUE à scripts/ml (Pillow) : c'est avec ce calcul
 * que la précision a été mesurée. Contrat des modèles : scripts/ml/README.md.
 */
export const EMBEDDER_SIZE = 224;
/** Côté du carré d'entrée du détecteur RF-DETR Nano (scripts/ml/README.md). */
export const DETECTOR_SIZE = 384;

/**
 * Redimensionnement bilinéaire avec anticrénelage, comme `Image.resize(..., BILINEAR)` de Pillow :
 * filtre triangle élargi en réduction, passe horizontale puis verticale, arrondi à l'octet entre les deux.
 */
export function resizeRgb(src: RgbImage, width: number, height: number): RgbImage {
  let img = src;
  if (width !== img.width) img = resamplePass(img, width, true);
  if (height !== img.height) img = resamplePass(img, height, false);
  return img === src ? { ...src, data: src.data.slice() } : img;
}

function resamplePass(src: RgbImage, outSize: number, horizontal: boolean): RgbImage {
  const inSize = horizontal ? src.width : src.height;
  const scale = inSize / outSize;
  const filterScale = Math.max(scale, 1);
  const support = filterScale; // support du filtre bilinéaire (1) × échelle
  const outW = horizontal ? outSize : src.width;
  const outH = horizontal ? src.height : outSize;
  const out = new Uint8Array(outW * outH * 3);

  for (let o = 0; o < outSize; o++) {
    const center = (o + 0.5) * scale;
    const min = Math.max(Math.trunc(center - support + 0.5), 0);
    const max = Math.min(Math.trunc(center + support + 0.5), inSize);
    const weights: number[] = [];
    let total = 0;
    for (let i = min; i < max; i++) {
      const w = Math.max(0, 1 - Math.abs((i - center + 0.5) / filterScale));
      weights.push(w);
      total += w;
    }
    const lines = horizontal ? src.height : src.width;
    for (let line = 0; line < lines; line++) {
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let k = 0; k < weights.length; k++) {
          const i = min + k;
          const idx = horizontal ? (line * src.width + i) * 3 + c : (i * src.width + line) * 3 + c;
          acc += src.data[idx] * weights[k];
        }
        const value = total > 0 ? acc / total : 0;
        const target = horizontal ? (line * outW + o) * 3 + c : (o * outW + line) * 3 + c;
        out[target] = Math.min(255, Math.max(0, Math.round(value)));
      }
    }
  }
  return { data: out, width: outW, height: outH };
}

/** Pixels RGB (HWC, 0..255) → float32 CHW 0..1, l'entrée des modèles. */
export function toChwFloat(img: RgbImage): Float32Array {
  const plane = img.width * img.height;
  const out = new Float32Array(3 * plane);
  for (let p = 0; p < plane; p++) {
    out[p] = img.data[p * 3] / 255;
    out[plane + p] = img.data[p * 3 + 1] / 255;
    out[2 * plane + p] = img.data[p * 3 + 2] / 255;
  }
  return out;
}

/** Entrée du classifieur : image recadrée, étirée en 224 × 224. */
export function embedderInput(img: RgbImage): Float32Array {
  return toChwFloat(resizeRgb(img, EMBEDDER_SIZE, EMBEDDER_SIZE));
}

/** Entrée du détecteur : toute la photo étirée en carré (sans marges), comme à l'entraînement de RF-DETR. */
export function detectorInput(img: RgbImage, size = DETECTOR_SIZE): Float32Array {
  return toChwFloat(resizeRgb(img, size, size));
}

/** Une boîte est candidate au « poisson principal » si son score atteint 60 % du meilleur (scripts/ml/README.md). */
export const MAIN_FISH_RATIO = 0.6;

/**
 * Sortie du détecteur [1, n, 5] (cx, cy, w, h en fractions de la photo, score) → le poisson principal, en pixels
 * de la photo : parmi les boîtes dont le score atteint 60 % du meilleur (et le seuil), la plus grande. Sur une photo
 * de prise, c'est le poisson montré ; le score maximal seul tombait souvent sur un petit poisson du fond.
 * IDENTIQUE à decode_best_box de scripts/ml/pte_runtime.py.
 */
export function decodeBestBox(raw: Float32Array, width: number, height: number, threshold = DETECTION_THRESHOLD): BoundingBox | null {
  const n = raw.length / 5;
  if (!Number.isInteger(n) || n === 0) return null;
  let top = 0;
  for (let i = 0; i < n; i++) top = Math.max(top, raw[i * 5 + 4]);
  if (top < threshold) return null;
  const floor = Math.max(threshold, MAIN_FISH_RATIO * top);
  let best = -1;
  for (let i = 0; i < n; i++) {
    if (raw[i * 5 + 4] < floor) continue;
    if (best < 0 || raw[i * 5 + 2] * raw[i * 5 + 3] > raw[best * 5 + 2] * raw[best * 5 + 3]) best = i;
  }
  const [cx, cy, w, h, confidence] = raw.subarray(best * 5, best * 5 + 5);
  return {
    x0: (cx - w / 2) * width,
    y0: (cy - h / 2) * height,
    x1: (cx + w / 2) * width,
    y1: (cy + h / 2) * height,
    confidence,
  };
}
