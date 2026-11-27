import { DevSettings, I18nManager } from 'react-native';

import { isRtl, type Language } from './languages';

/**
 * Sens de lecture de TOUTE l'app (arabe : de droite à gauche).
 * Android et iOS retournent alors la mise en page (lignes, marges, flèches) tout seuls.
 * Le changement ne s'applique qu'au redémarrage : on relance l'app aussitôt.
 * @returns true si l'app va redémarrer.
 */
export function applyLayoutDirection(language: Language): boolean {
  const rtl = isRtl(language);
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  DevSettings.reload('Changement du sens de lecture');
  return true;
}
