import * as Location from 'expo-location';

import type { Coordinates } from '@/shared/domain/Coordinates';

/** Contrat : « donne-moi la position actuelle de l'utilisateur ». */
export interface LocationService {
  /** Renvoie null si l'utilisateur refuse la permission. */
  getCurrentPosition(): Promise<Coordinates | null>;
}

/** Implémentation avec expo-location (GPS du téléphone). */
export class ExpoLocationService implements LocationService {
  async getCurrentPosition(): Promise<Coordinates | null> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  }
}
