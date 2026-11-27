import { accountTexts } from '@/features/account/presentation/texts';
import { authTexts } from '@/features/auth/presentation/texts';
import { catchesTexts } from '@/features/catches/presentation/texts';
import { forecastTexts } from '@/features/fishingForecast/presentation/texts';
import { menuTexts } from '@/features/menu/presentation/texts';
import { moderationTexts } from '@/features/moderation/presentation/texts';
import { catalogTexts } from '@/features/spots/presentation/catalog/catalogTexts';
import { spotsTexts } from '@/features/spots/presentation/texts';
import { visibilityTexts } from '@/features/spots/presentation/visibilityTexts';
import { weatherTexts } from '@/features/weather/presentation/texts';

import { commonTexts } from './commonTexts';
import type { Texts } from './defineTexts';
import type { Language } from './languages';

/** Toutes les sources de textes. Ajouter une feature = l'ajouter ici. */
const SOURCES = {
  common: commonTexts,
  auth: authTexts,
  menu: menuTexts,
  weather: weatherTexts,
  forecast: forecastTexts,
  spots: spotsTexts,
  catalog: catalogTexts,
  catches: catchesTexts,
  visibility: visibilityTexts,
  moderation: moderationTexts,
  account: accountTexts,
};

type KeysOf<T> = T extends Texts<infer K> ? K : never;
export type TranslationKey = { [S in keyof typeof SOURCES]: KeysOf<(typeof SOURCES)[S]> }[keyof typeof SOURCES];

const merge = (language: Language) =>
  Object.assign({}, ...Object.values(SOURCES).map((source) => source[language])) as Record<TranslationKey, string>;

export const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = { fr: merge('fr'), en: merge('en'), ar: merge('ar') };

export type TranslationParams = Record<string, string | number>;

/** Le texte dans la langue voulue ; « {nom} » est remplacé par params.nom. */
export function translate(language: Language, key: TranslationKey, params?: TranslationParams): string {
  const text = TRANSLATIONS[language][key] ?? TRANSLATIONS.fr[key] ?? key;
  return params ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match)) : text;
}

/** Traduction optionnelle d'une clé construite à l'exécution (ex. un identifiant du catalogue). */
export function hasTranslation(key: string): key is TranslationKey {
  return key in TRANSLATIONS.fr;
}
