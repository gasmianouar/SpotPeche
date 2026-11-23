import * as ImagePicker from 'expo-image-picker';

/** Contrat : prendre ou choisir des photos. Les écrans ne savent pas quelle librairie est utilisée. */
export interface PhotoService {
  /** Ouvre l'appareil photo. Renvoie l'adresse de la photo, ou null si annulé / refusé. */
  takePhoto(): Promise<string | null>;
  /** Ouvre la galerie. Renvoie les adresses des photos choisies (liste vide si annulé). */
  pickFromLibrary(maxCount: number): Promise<string[]>;
}

/** Implémentation avec expo-image-picker. */
export class ExpoPhotoService implements PhotoService {
  async takePhoto(): Promise<string | null> {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return null;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
    return result.canceled ? null : (result.assets[0]?.uri ?? null);
  }

  async pickFromLibrary(maxCount: number): Promise<string[]> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: maxCount,
    });
    return result.canceled ? [] : result.assets.map((asset) => asset.uri);
  }
}
