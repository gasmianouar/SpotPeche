import type Ionicons from '@expo/vector-icons/Ionicons';

import { dayName } from '@/core/i18n/dates';
import type { Language } from '@/core/i18n/languages';
import type { TranslationKey } from '@/core/i18n/translations';

import type { WeatherCondition } from '../domain/entities/Weather';
import type { FishingIndexLabel } from '../domain/services/fishingIndex';
import type { MoonPhaseName } from '../domain/services/moonPhase';

/**
 * Tout ce qui sert à AFFICHER la météo (textes, icônes, formats) vit dans la
 * couche présentation : le domaine, lui, ne manipule que des valeurs.
 */
type IconName = keyof typeof Ionicons.glyphMap;

const CONDITION_ICONS: Record<WeatherCondition, IconName> = {
  clear: 'sunny-outline',
  partlyCloudy: 'partly-sunny-outline',
  overcast: 'cloud-outline',
  fog: 'cloudy-outline',
  drizzle: 'rainy-outline',
  rain: 'rainy-outline',
  snow: 'snow-outline',
  storm: 'thunderstorm-outline',
};

/** Clé du texte d'une condition météo (« Ensoleillé », « Sunny », « مشمس »). */
export const conditionKey = (c: WeatherCondition): TranslationKey => `weather.condition.${c}`;
export const conditionIcon = (c: WeatherCondition) => CONDITION_ICONS[c];

export const formatTemperature = (t: number) => `${Math.round(t)}°`;

/** "2026-11-21T14:00" → "14h" (« 14 h » se lit dans les trois langues). */
export const formatHour = (localTime: string) => `${Number(localTime.slice(11, 13))}h`;

/** "2026-11-21T08:02" → "08:02" */
export const formatClock = (localTime: string) => localTime.slice(11, 16);

/** "2026-11-22" → "Sam." / "Sat" / "السبت" ; index 0 → null (l'écran affiche « Aujourd'hui »). */
export function formatDay(localDate: string, index: number, language: Language): string | null {
  if (index === 0) return null;
  const [y, m, d] = localDate.split('-').map(Number);
  return dayName(language, new Date(y, m - 1, d).getDay());
}

const WIND_DIRECTIONS: Record<Language, readonly string[]> = {
  fr: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
  en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  ar: ['ش', 'ش.ق', 'ق', 'ج.ق', 'ج', 'ج.غ', 'غ', 'ش.غ'],
};

/** 225° → "SO" / "SW" / "ج.غ" : direction d'où vient le vent. */
export function windDirectionLabel(degrees: number, language: Language): string {
  return WIND_DIRECTIONS[language][Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

const INDEX_LABELS: Record<FishingIndexLabel, TranslationKey> = {
  Faible: 'weather.label.weak',
  Moyen: 'weather.label.medium',
  Bon: 'weather.label.good',
  Excellent: 'weather.label.excellent',
};
export const indexLabelKey = (label: FishingIndexLabel): TranslationKey => INDEX_LABELS[label];

const MOON_PHASES: Record<MoonPhaseName, TranslationKey> = {
  'Nouvelle lune': 'weather.moon.new',
  'Premier croissant': 'weather.moon.waxingCrescent',
  'Premier quartier': 'weather.moon.firstQuarter',
  'Gibbeuse croissante': 'weather.moon.waxingGibbous',
  'Pleine lune': 'weather.moon.full',
  'Gibbeuse décroissante': 'weather.moon.waningGibbous',
  'Dernier quartier': 'weather.moon.lastQuarter',
  'Dernier croissant': 'weather.moon.waningCrescent',
};
export const moonPhaseKey = (name: MoonPhaseName): TranslationKey => MOON_PHASES[name];

/**
 * Les raisons calculées par le domaine (indice de pêche, estimation locale) sont des phrases
 * françaises fixes : on les traduit ici. Une raison inconnue (ex. écrite par l'agent IA) reste telle quelle.
 */
const REASONS: Record<string, TranslationKey> = {
  'Pression stable': 'weather.reason.pressureStable',
  'Pression en forte hausse': 'weather.reason.pressureStrongRise',
  'Pression en forte baisse': 'weather.reason.pressureStrongDrop',
  'Pression en légère hausse': 'weather.reason.pressureSlightRise',
  'Pression en légère baisse': 'weather.reason.pressureSlightDrop',
  'Vent faible': 'weather.reason.windLight',
  'Vent fort': 'weather.reason.windStrong',
  'Orage : pêche déconseillée': 'weather.reason.storm',
  'Approche du crépuscule': 'weather.reason.dusk',
  'Lever du jour': 'weather.reason.dawn',
};
export function translateReason(reason: string, t: (key: TranslationKey) => string): string {
  const key = REASONS[reason];
  return key ? t(key) : reason;
}
