import * as ImagePicker from 'expo-image-picker';

export interface PhotoOptions {
  /** Compression JPEG, de 0 (léger) à 1 (meilleure qualité). Par défaut 0,7. */
  quality?: number;
}

/** Contrat : prendre ou choisir des photos. Les écrans ne savent pas quelle librairie est utilisée. */
export interface PhotoService {
  /** Ouvre l'appareil photo. Renvoie l'adresse de la photo, ou null si annulé / refusé. */
  takePhoto(options?: PhotoOptions): Promise<string | null>;
  /** Ouvre la galerie. Renvoie les adresses des photos choisies (liste vide si annulé). */
  pickFromLibrary(maxCount: number, options?: PhotoOptions): Promise<string[]>;
}

const DEFAULT_QUALITY = 0.7;

/** Implémentation avec expo-image-picker. */
export class ExpoPhotoService implements PhotoService {
  async takePhoto(options: PhotoOptions = {}): Promise<string | null> {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return null;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: options.quality ?? DEFAULT_QUALITY });
    return result.canceled ? null : (result.assets[0]?.uri ?? null);
  }

  async pickFromLibrary(maxCount: number, options: PhotoOptions = {}): Promise<string[]> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: options.quality ?? DEFAULT_QUALITY,
      allowsMultipleSelection: true,
      selectionLimit: maxCount,
    });
    return result.canceled ? [] : result.assets.map((asset) => asset.uri);
  }
}
