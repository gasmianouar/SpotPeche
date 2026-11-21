import type Ionicons from '@expo/vector-icons/Ionicons';

import type { WeatherCondition } from '../domain/entities/Weather';

/**
 * Tout ce qui sert à AFFICHER la météo (textes, icônes, formats) vit dans la
 * couche présentation : le domaine, lui, ne manipule que des valeurs.
 */
type IconName = keyof typeof Ionicons.glyphMap;

const CONDITIONS: Record<WeatherCondition, { label: string; icon: IconName }> = {
  clear: { label: 'Ensoleillé', icon: 'sunny-outline' },
  partlyCloudy: { label: 'Éclaircies', icon: 'partly-sunny-outline' },
  overcast: { label: 'Couvert', icon: 'cloud-outline' },
  fog: { label: 'Brouillard', icon: 'cloudy-outline' },
  drizzle: { label: 'Bruine', icon: 'rainy-outline' },
  rain: { label: 'Pluie', icon: 'rainy-outline' },
  snow: { label: 'Neige', icon: 'snow-outline' },
  storm: { label: 'Orage', icon: 'thunderstorm-outline' },
};

export const conditionLabel = (c: WeatherCondition) => CONDITIONS[c].label;
export const conditionIcon = (c: WeatherCondition) => CONDITIONS[c].icon;

export const formatTemperature = (t: number) => `${Math.round(t)}°`;

/** "2026-11-21T14:00" → "14h" */
export const formatHour = (localTime: string) => `${Number(localTime.slice(11, 13))}h`;

/** "2026-11-21T08:02" → "08:02" */
export const formatClock = (localTime: string) => localTime.slice(11, 16);

/** "2026-11-22" → "Sam." (index 0 = "Aujourd'hui") */
export function formatDay(localDate: string, index: number): string {
  if (index === 0) return "Aujourd'hui";
  const [y, m, d] = localDate.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'][day];
}

/** 225° → "SO" : direction d'où vient le vent. */
export function windDirectionLabel(degrees: number): string {
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return labels[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}
