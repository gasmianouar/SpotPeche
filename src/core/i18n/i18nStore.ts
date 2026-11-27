import { create } from 'zustand';

import { deviceLanguage, type Language } from './languages';

interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
}

/** La langue affichée, partagée par tous les écrans (ils se redessinent quand elle change). */
export const useI18nStore = create<I18nState>((set) => ({
  // En attendant la langue enregistrée : celle du téléphone, pour éviter un changement visible.
  language: deviceLanguage(),
  setLanguage: (language) => set({ language }),
}));
