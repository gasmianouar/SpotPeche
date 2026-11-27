import { useCallback, useEffect } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';

import { useI18nStore } from './i18nStore';
import type { Language } from './languages';
import { applyLayoutDirection } from './rtl';

/** Changer de langue : affichage immédiat, enregistrement, puis sens de lecture (redémarrage si besoin). */
export function useLanguageChooser() {
  const { languagePreference } = useDependencies();
  const setLanguage = useI18nStore((s) => s.setLanguage);
  return useCallback(
    async (next: Language) => {
      setLanguage(next);
      // On enregistre AVANT un éventuel redémarrage (passage à l'arabe ou retour).
      await languagePreference.choose(next).catch(() => undefined);
      applyLayoutDirection(next);
    },
    [languagePreference, setLanguage],
  );
}

/** Composant invisible, placé une fois à la racine : reprend la langue enregistrée au démarrage. */
export function RestoreLanguage() {
  const { languagePreference } = useDependencies();
  const setLanguage = useI18nStore((s) => s.setLanguage);
  useEffect(() => {
    let active = true;
    languagePreference.current().then((language) => {
      if (!active) return;
      setLanguage(language);
      applyLayoutDirection(language);
    });
    return () => {
      active = false;
    };
  }, [languagePreference, setLanguage]);
  return null;
}
