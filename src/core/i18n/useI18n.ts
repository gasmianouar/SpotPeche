import { useCallback } from 'react';

import { useI18nStore } from './i18nStore';
import { isRtl, LANGUAGES } from './languages';
import { translate, type TranslationKey, type TranslationParams } from './translations';

/**
 * Pour les écrans : la langue, le sens d'écriture et la fonction de traduction.
 * Aucune dépendance : tous les écrans peuvent l'utiliser (et leurs tests aussi).
 * Pour CHANGER de langue : useLanguageChooser (useLanguageChooser.ts).
 */
export function useI18n() {
  const language = useI18nStore((s) => s.language);
  const t = useCallback((key: TranslationKey, params?: TranslationParams) => translate(language, key, params), [language]);
  return { language, isRTL: isRtl(language), t, languages: LANGUAGES };
}
