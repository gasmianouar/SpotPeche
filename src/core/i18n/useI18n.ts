import { useCallback, useEffect } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';

import { useI18nStore } from './i18nStore';
import { isRtl, LANGUAGES, type Language } from './languages';
import { translate, type TranslationKey } from './translations';

/** Pour les écrans : la langue, le sens d'écriture, la fonction de traduction et le choix de langue. */
export function useI18n() {
  const { languagePreference } = useDependencies();
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);

  const t = useCallback((key: TranslationKey) => translate(language, key), [language]);

  const choose = useCallback(
    (next: Language) => {
      setLanguage(next);
      languagePreference.choose(next).catch(() => undefined); // l'affichage change même si l'enregistrement échoue
    },
    [languagePreference, setLanguage],
  );

  return { language, isRTL: isRtl(language), t, languages: LANGUAGES, choose };
}

/** Composant invisible, placé une fois à la racine : reprend la langue enregistrée au démarrage. */
export function RestoreLanguage() {
  useRestoreLanguage();
  return null;
}

/** Reprend la langue enregistrée (une fois, au démarrage). */
export function useRestoreLanguage() {
  const { languagePreference } = useDependencies();
  const setLanguage = useI18nStore((s) => s.setLanguage);
  useEffect(() => {
    let active = true;
    languagePreference.current().then((language) => {
      if (active) setLanguage(language);
    });
    return () => {
      active = false;
    };
  }, [languagePreference, setLanguage]);
}
