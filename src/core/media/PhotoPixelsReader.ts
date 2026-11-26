import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';

import type { RgbImage } from '@/features/spots/domain/recognition/RgbImage';

/**
 * Plus grand côté de l'image décodée : assez pour recadrer le poisson (le test hors app atteint 78 %
 * avec des photos de 500 px), sans saturer la mémoire ni ralentir le décodage en JavaScript.
 */
export const MAX_PHOTO_SIDE = 640;
/** Décodage natif borné : une photo de 12 Mpx n'est jamais chargée en pleine taille. */
const NATIVE_DECODE_LIMIT = 2048;

/**
 * CONTRAT : décoder une photo (adresse locale) en pixels RGB, dans le bon sens
 * (orientation EXIF appliquée) et réduite à MAX_PHOTO_SIDE pixels de côté au plus.
 */
export interface PhotoPixelsReader {
  read(photoUri: string): Promise<RgbImage>;
}

/** Taille réduite qui garde les proportions et ne dépasse pas `max` (jamais agrandie). */
export function fitWithin(width: number, height: number, max = MAX_PHOTO_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Implémentation Expo : expo-image-manipulator réduit la photo en natif, puis jpeg-js (JavaScript pur)
 * décode la petite image en pixels. Aucune photo ne quitte le téléphone.
 */
export class ExpoPhotoPixelsReader implements PhotoPixelsReader {
  async read(photoUri: string): Promise<RgbImage> {
    const original = await ImageManipulator.manipulate(photoUri, { maxWidth: NATIVE_DECODE_LIMIT, maxHeight: NATIVE_DECODE_LIMIT }).renderAsync();
    const target = fitWithin(original.width, original.height);
    const context = ImageManipulator.manipulate(original);
    if (target.width !== original.width) context.resize({ width: target.width, height: target.height });
    const small = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.92, base64: true });
    if (!small.base64) throw new Error('Photo illisible');
    const { data, width, height } = decode(base64ToBytes(small.base64), { useTArray: true, formatAsRGBA: false });
    return { data, width, height };
  }
}
