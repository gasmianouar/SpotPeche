import * as Location from 'expo-location';

import type { Coordinates } from '@/shared/domain/Coordinates';

/**
 * Position utilisée quand le GPS est refusé ou indisponible (lac de Créteil).
 * Elle sert à la carte ET à la météo : un seul endroit à changer.
 */
export const DEFAULT_POSITION: Coordinates = { latitude: 48.7778, longitude: 2.4455 };

/**
 * La position n'a pas pu être obtenue :
 * - `servicesDisabled` : la localisation du téléphone est désactivée (réglages) ;
 * - `noSignal` : localisation activée, mais aucun signal GPS exploitable.
 */
export class LocationUnavailableError extends Error {
  constructor(readonly reason: 'servicesDisabled' | 'noSignal') {
    super(reason === 'servicesDisabled' ? 'Localisation du téléphone désactivée' : 'Signal GPS introuvable');
    this.name = 'LocationUnavailableError';
  }
}

/** Contrat : « donne-moi la position actuelle de l'utilisateur » (précision moyenne, rapide). */
export interface LocationService {
  /** Renvoie null si l'utilisateur refuse la permission. */
  getCurrentPosition(): Promise<Coordinates | null>;
}

/** Une position GPS précise, avec sa marge d'erreur. */
export interface PrecisePosition {
  readonly coordinates: Coordinates;
  /** Rayon d'incertitude en mètres (null si le téléphone ne le donne pas). */
  readonly accuracyMeters: number | null;
}

/**
 * Contrat séparé : « donne-moi les coordonnées GPS EXACTES ».
 * Plus lent et plus gourmand en batterie : utilisé seulement pour placer un spot.
 */
export interface PreciseLocationService {
  /**
   * Renvoie null si l'utilisateur refuse la permission.
   * Lance une LocationUnavailableError si la localisation est coupée ou sans signal.
   */
  getPrecisePosition(): Promise<PrecisePosition | null>;
}

/**
 * Contrat séparé : « quel est le nom de la ville à ces coordonnées ? ».
 * Trois petites interfaces plutôt qu'une grosse : c'est le I de SOLID
 * (Interface Segregation). Chaque écran ne dépend que de ce qu'il utilise.
 */
export interface PlaceNameResolver {
  /** Renvoie null si aucun nom n'est trouvé. */
  getCityName(coordinates: Coordinates): Promise<string | null>;
}

/** Implémentation avec expo-location (GPS du téléphone). */
export class ExpoLocationService implements LocationService, PreciseLocationService, PlaceNameResolver {
  async getCurrentPosition(): Promise<Coordinates | null> {
    if (!(await this.hasPermission())) return null;
    const position = await this.readPosition(Location.Accuracy.Balanced);
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  }

  async getPrecisePosition(): Promise<PrecisePosition | null> {
    if (!(await this.hasPermission())) return null;
    // Précision maximale : le GPS cherche le meilleur signal (quelques secondes).
    const position = await this.readPosition(Location.Accuracy.BestForNavigation);
    return {
      coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
      accuracyMeters: position.coords.accuracy ?? null,
    };
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

  /** Traduit les erreurs techniques d'expo-location en erreur claire pour les écrans. */
  private async readPosition(accuracy: Location.Accuracy): Promise<Location.LocationObject> {
    try {
      // Si la localisation est coupée, Android propose lui-même de l'activer (fenêtre système).
      return await Location.getCurrentPositionAsync({ accuracy });
    } catch {
      // Échec : on demande à Android l'état de ses sources de localisation pour expliquer pourquoi.
      // (La localisation « précise » d'Android a besoin du réseau ET du GPS activés.)
      const status = await Location.getProviderStatusAsync().catch(() => null);
      const enabled = status ? status.locationServicesEnabled && status.networkAvailable !== false : true;
      throw new LocationUnavailableError(enabled ? 'noSignal' : 'servicesDisabled');
    }
  }

  private async hasPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }
}
