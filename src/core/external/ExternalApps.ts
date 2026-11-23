import { Linking, Share } from 'react-native';

import {
  googleMapsAppUrl,
  googleMapsDirectionsUrl,
  wazeAppUrl,
  wazeNavigationUrl,
} from '@/features/spots/domain/services/spotLinks';
import type { Coordinates } from '@/shared/domain/Coordinates';

/** Les apps de navigation proposées. */
export type NavigationApp = 'google-maps' | 'waze';

/** Ouvrir l'itinéraire vers un point, depuis la position actuelle, avec l'app choisie. */
export interface DirectionsService {
  openDirections(destination: Coordinates, app: NavigationApp): Promise<void>;
}

/** Où partager : WhatsApp, Messenger, ou la feuille de partage du téléphone (« Autres »). */
export type ShareTarget = 'whatsapp' | 'messenger' | 'other';

/**
 * 'app' : l'app demandée s'est ouverte.
 * 'fallback' : elle n'est pas installée, on a ouvert une autre solution (site web, feuille de partage).
 */
export type ShareOutcome = 'app' | 'fallback';

export interface ShareService {
  /**
   * @param message Texte complet (position, liens).
   * @param link    Le lien principal, pour les apps qui ne partagent qu'un lien (Messenger).
   */
  shareTo(target: ShareTarget, message: string, link: string): Promise<ShareOutcome>;
}

/** Les fonctions du téléphone dont on a besoin, injectées pour pouvoir tester sans téléphone. */
export interface PhoneLinks {
  openURL(url: string): Promise<unknown>;
  shareSheet(message: string): Promise<unknown>;
}

const nativePhoneLinks: PhoneLinks = {
  openURL: (url) => Linking.openURL(url),
  shareSheet: (message) => Share.share({ message }),
};

/**
 * Implémentation avec les apps du téléphone.
 * On essaie d'abord le « schéma » de l'app (waze://, whatsapp://…) : s'il échoue,
 * c'est que l'app n'est pas installée, et on passe à la solution de repli.
 */
export class NativeExternalApps implements DirectionsService, ShareService {
  constructor(private readonly phone: PhoneLinks = nativePhoneLinks) {}

  async openDirections(destination: Coordinates, app: NavigationApp): Promise<void> {
    const [appUrl, webUrl] =
      app === 'waze'
        ? [wazeAppUrl(destination), wazeNavigationUrl(destination)]
        : [googleMapsAppUrl(destination), googleMapsDirectionsUrl(destination)];
    const opened = await this.tryOpen(appUrl);
    // Sinon le lien « https » : sur Android il ouvre l'app s'il la trouve ;
    // sans l'app, le site, qui propose de l'installer ou affiche le trajet.
    if (!opened) await this.phone.openURL(webUrl);
  }

  async shareTo(target: ShareTarget, message: string, link: string): Promise<ShareOutcome> {
    if (target === 'whatsapp') {
      if (await this.tryOpen(`whatsapp://send?text=${encodeURIComponent(message)}`)) return 'app';
      await this.phone.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
      return 'fallback';
    }
    if (target === 'messenger') {
      // Messenger n'accepte qu'un lien (pas de texte libre).
      if (await this.tryOpen(`fb-messenger://share?link=${encodeURIComponent(link)}`)) return 'app';
      await this.phone.shareSheet(message);
      return 'fallback';
    }
    await this.phone.shareSheet(message);
    return 'app';
  }

  private async tryOpen(url: string): Promise<boolean> {
    try {
      await this.phone.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
}
