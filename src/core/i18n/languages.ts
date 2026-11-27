/** Les langues de l'app, pour le moment. */
export type Language = 'ar' | 'fr' | 'en';

export interface LanguageOption {
  readonly code: Language;
  /** Le nom de la langue écrit dans cette langue (ce que l'utilisateur reconnaît). */
  readonly label: string;
  /** Écriture de droite à gauche (arabe). */
  readonly rtl: boolean;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'en', label: 'English', rtl: false },
];

export const DEFAULT_LANGUAGE: Language = 'fr';

export const isLanguage = (value: string | null | undefined): value is Language =>
  LANGUAGES.some((l) => l.code === value);

export const isRtl = (language: Language) => LANGUAGES.find((l) => l.code === language)?.rtl ?? false;

/** « ar-MA » → 'ar', « en-US » → 'en' ; une langue non prise en charge → le français. */
export function languageFromLocale(locale: string | null | undefined): Language {
  const code = (locale ?? '').toLowerCase().split(/[-_]/)[0];
  return isLanguage(code) ? code : DEFAULT_LANGUAGE;
}

/** La langue du téléphone, lue sans librairie native (Intl est intégré au moteur JavaScript). */
export function deviceLanguage(): Language {
  try {
    return languageFromLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
