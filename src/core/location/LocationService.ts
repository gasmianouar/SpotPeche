import * as Location from 'expo-location';

import type { Coordinates } from '@/shared/domain/Coordinates';

/**
 * Position utilisée quand le GPS est refusé ou indisponible (lac de Créteil).
 * Elle sert à la carte ET à la météo : un seul endroit à changer.
 */
export const DEFAULT_POSITION: Coordinates = { latitude: 48.7778, longitude: 2.4455 };

/** Contrat : « donne-moi la position actuelle de l'utilisateur ». */
export interface LocationService {
  /** Renvoie null si l'utilisateur refuse la permission. */
  getCurrentPosition(): Promise<Coordinates | null>;
}

/**
 * Contrat séparé : « quel est le nom de la ville à ces coordonnées ? ».
 * Deux petites interfaces plutôt qu'une grosse : c'est le I de SOLID
 * (Interface Segregation). La carte n'a pas besoin du nom de ville.
 */
export interface PlaceNameResolver {
  /** Renvoie null si aucun nom n'est trouvé. */
  getCityName(coordinates: Coordinates): Promise<string | null>;
}

/** Implémentation avec expo-location (GPS du téléphone). */
export class ExpoLocationService implements LocationService, PlaceNameResolver {
  async getCurrentPosition(): Promise<Coordinates | null> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  }

  /** Géocodage inverse : coordonnées → adresse, avec le service du téléphone (gratuit). */
  async getCityName(coordinates: Coordinates): Promise<string | null> {
    try {
      const [address] = await Location.reverseGeocodeAsync(coordinates);
      return address?.city ?? address?.subregion ?? address?.region ?? null;
    } catch {
      return null;
    }
  }
}
