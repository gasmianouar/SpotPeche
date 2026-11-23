/** Une photo prête à être envoyée : son contenu en base64 et son format. */
export interface EncodedPhoto {
  /** Contenu encodé en base64, sans le préfixe « data:… ». */
  readonly data: string;
  /** Ex. « image/jpeg ». */
  readonly mediaType: string;
}

/** Contrat : lire une photo du téléphone pour l'envoyer à un serveur. */
export interface PhotoReader {
  read(uri: string): Promise<EncodedPhoto>;
}

/**
 * Implémentation sans librairie supplémentaire : `fetch` sait lire un fichier local
 * (file://…) et FileReader le transforme en « data URL » (data:image/jpeg;base64,…).
 */
export class FetchPhotoReader implements PhotoReader {
  async read(uri: string): Promise<EncodedPhoto> {
    const blob = await (await fetch(uri)).blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Photo illisible'));
      reader.readAsDataURL(blob);
    });
    return parseDataUrl(dataUrl, blob.type);
  }
}

/** « data:image/png;base64,AAAA » → { mediaType: 'image/png', data: 'AAAA' }. */
export function parseDataUrl(dataUrl: string, fallbackType = ''): EncodedPhoto {
  const match = /^data:([^;,]*)(?:;[^,]*)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error('Photo illisible');
  const declared = match[1] || fallbackType;
  // Certains téléphones ne donnent pas de type : les photos de l'appareil sont en JPEG.
  const mediaType = declared.startsWith('image/') ? declared : 'image/jpeg';
  return { mediaType, data: match[2] };
}
