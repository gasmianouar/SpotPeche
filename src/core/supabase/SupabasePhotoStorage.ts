import type { SupabaseClient } from '@supabase/supabase-js';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { requireUserId, throwIfError } from './supabaseClient';

export const PHOTO_BUCKET = 'spot-photos';
const MAX_SIDE = 1600;
const SIGNED_URL_SECONDS = 60 * 60;

/** Une photo déjà sur le serveur : son chemin dans le stockage (« <uid>/<fichier>.jpg »). */
const isStoragePath = (value: string) => /^[0-9a-f-]{36}\/[^/]+$/i.test(value);

/** Adresse signée (https://…/object/sign/spot-photos/<chemin>?token=…) → chemin dans le stockage. */
export function pathFromSignedUrl(url: string): string | null {
  const match = url.match(new RegExp(`/object/sign/${PHOTO_BUCKET}/([^?]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Photos des spots et des messages dans le stockage privé Supabase.
 * - À l'envoi : la photo est réenregistrée en JPEG (≤ 1600 px), ce qui retire ses métadonnées,
 *   dont la position GPS de l'appareil photo.
 * - À la lecture : des adresses signées valables 1 h (le stockage n'est pas public).
 */
export class SupabasePhotoStorage {
  constructor(private readonly supabase: SupabaseClient) {}

  /** Adresses de l'app (fichiers locaux ou adresses signées) → chemins dans le stockage, en envoyant les nouvelles. */
  async toStoragePaths(uris: readonly string[]): Promise<string[]> {
    const userId = uris.some((uri) => !isStoragePath(uri) && !pathFromSignedUrl(uri))
      ? await requireUserId(this.supabase)
      : '';
    const paths: string[] = [];
    for (const uri of uris) {
      if (isStoragePath(uri)) paths.push(uri);
      else paths.push(pathFromSignedUrl(uri) ?? (await this.upload(uri, userId)));
    }
    return paths;
  }

  /** Chemins dans le stockage → adresses affichables (une seule requête pour toute la liste). */
  async toDisplayUrls(paths: readonly string[]): Promise<Map<string, string>> {
    const unique = [...new Set(paths.filter(Boolean))];
    const urls = new Map<string, string>();
    if (unique.length === 0) return urls;
    const { data } = await this.supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, SIGNED_URL_SECONDS);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
    return urls;
  }

  private async upload(localUri: string, userId: string): Promise<string> {
    // Réencodage : retire les métadonnées EXIF (position GPS) et allège la photo.
    const image = await ImageManipulator.manipulate(localUri, { maxWidth: MAX_SIDE, maxHeight: MAX_SIDE }).renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    const body = await (await fetch(saved.uri)).arrayBuffer();
    const path = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
    throwIfError(await this.supabase.storage.from(PHOTO_BUCKET).upload(path, body, { contentType: 'image/jpeg' }));
    return path;
  }
}
