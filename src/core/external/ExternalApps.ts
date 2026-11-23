import { Linking, Platform, Share } from 'react-native';

import type { Coordinates } from '@/shared/domain/Coordinates';

/** Ouvrir l'itinéraire vers un point dans l'application de navigation du téléphone. */
export interface DirectionsService {
  openDirections(destination: Coordinates, label: string): Promise<void>;
}

/** Ouvrir la feuille de partage du téléphone (SMS, WhatsApp, Messenger…). */
export interface ShareService {
  share(message: string): Promise<void>;
}

/**
 * Implémentation avec les applis du téléphone, sans Google obligatoire :
 * - iOS : Plans d'Apple ;
 * - Android : un lien « geo: », qui propose toutes les applis de navigation installées
 *   (Google Maps, Waze, OsmAnd, Organic Maps…).
 */
export class NativeExternalApps implements DirectionsService, ShareService {
  async openDirections({ latitude, longitude }: Coordinates, label: string): Promise<void> {
    const point = `${latitude},${longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${point}&q=${encodeURIComponent(label)}`
        : `geo:${point}?q=${point}(${encodeURIComponent(label)})`;
    await Linking.openURL(url);
  }

  async share(message: string): Promise<void> {
    await Share.share({ message });
  }
}
