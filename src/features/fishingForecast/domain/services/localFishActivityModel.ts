import type { HourlyForecast } from '@/features/weather/domain/entities/Weather';

import {
  labelForIndex,
  levelForScore,
  type FishingForecast,
  type ForecastConfidence,
  type HourlyActivity,
} from '../entities/FishingForecast';
import type { ForecastContext } from '../entities/ForecastContext';

/**
 * ALGORITHME LOCAL d'activité des poissons (sans réseau, sans IA).
 *
 * Il additionne des règles reconnues par les pêcheurs et les biologistes :
 * - la LUMIÈRE : les poissons chassent surtout à l'aube et au crépuscule ;
 * - la PRESSION : une baisse lente (avant une perturbation) active les carnassiers,
 *   une hausse ou une chute brutale les rend méfiants ;
 * - le VENT : une brise ride l'eau et rassure, un vent fort gêne ;
 * - le CIEL : couvert en journée = mieux qu'un grand soleil ; orage = pêche déconseillée ;
 * - la LUNE : les jours de nouvelle et de pleine lune sont souvent plus actifs ;
 * - les AVIS « ça mord ? » des pêcheurs du spot ajustent légèrement le tout.
 *
 * Fonction PURE (mêmes entrées → même résultat) : facile à tester.
 * Elle sert de repli quand l'agent IA ne répond pas.
 */
export function computeLocalForecast(context: ForecastContext): FishingForecast {
  const { weather } = context;
  const hours = weather.hourly;
  const communityBonus = communityAdjustment(context);

  const hourly: HourlyActivity[] = hours.map((hour, i) => {
    const score = clamp(
      BASE_SCORE +
        lightScore(hour.localTime, sunTimesFor(context, hour.localTime)) +
        pressureScore(hours, i) +
        windScore(hour.windSpeed) +
        skyScore(hour, sunTimesFor(context, hour.localTime)) +
        temperatureScore(hours, i) +
        moonScore(context.moon.ageInDays) +
        communityBonus,
    );
    // Orage : danger (foudre), quelle que soit l'activité.
    const safeScore = hour.condition === 'storm' ? Math.min(score, 5) : score;
    return { localTime: hour.localTime, score: safeScore, level: levelForScore(safeScore) };
  });

  const index = indexFrom(hourly);
  const bestWindow = bestWindowOf(hourly);
  const reasons = reasonsFor(context, bestWindow);

  return {
    index: {
      score: index,
      label: labelForIndex(index),
      summary: bestWindow
        ? `Meilleur moment : ${clock(bestWindow.start)} – ${clock(bestWindow.end)}.`
        : 'Pas de créneau qui se détache aujourd’hui.',
      reasons,
    },
    hourly,
    bestWindow,
    confidence: confidenceFor(context),
    source: 'local',
    model: null,
  };
}

// ---------- Les règles ----------

/** Score de départ : une heure « ordinaire » est moyenne (😐). */
const BASE_SCORE = 45;

interface SunTimes {
  sunrise: number; // minutes depuis minuit
  sunset: number;
}

/** Lever et coucher du soleil du jour de cette heure (la prévision couvre parfois deux jours). */
function sunTimesFor(context: ForecastContext, localTime: string): SunTimes | null {
  const date = localTime.slice(0, 10);
  const day = context.weather.daily.find((d) => d.localDate === date) ?? context.weather.daily[0];
  if (!day) return null;
  return { sunrise: minutesOf(day.sunrise), sunset: minutesOf(day.sunset) };
}

function lightScore(localTime: string, sun: SunTimes | null): number {
  if (!sun) return 0;
  const t = minutesOf(localTime) + 30; // milieu de l'heure
  const fromTwilight = Math.min(Math.abs(t - sun.sunrise), Math.abs(t - sun.sunset));
  if (fromTwilight <= 45) return 30; // aube / crépuscule : pic de chasse
  if (fromTwilight <= 90) return 20;
  if (t < sun.sunrise || t > sun.sunset) return -10; // nuit noire
  return 0;
}

function pressureScore(hours: readonly HourlyForecast[], i: number): number {
  const later = hours[Math.min(i + 3, hours.length - 1)];
  const delta = later.pressure - hours[i].pressure; // hPa sur 3 h
  if (delta < -3) return -5; // chute brutale : orage probable
  if (delta <= -1) return 10; // baisse lente : carnassiers actifs
  if (Math.abs(delta) < 1) return 5; // stable
  if (delta > 3) return -10; // forte hausse : poissons méfiants
  return 0;
}

function windScore(windSpeed: number): number {
  if (windSpeed > 30) return -15;
  if (windSpeed >= 5 && windSpeed <= 20) return 5;
  if (windSpeed < 3) return -3; // eau trop lisse, poissons méfiants
  return 0;
}

function skyScore(hour: HourlyForecast, sun: SunTimes | null): number {
  if (hour.condition === 'snow') return -10;
  if (hour.condition === 'drizzle' || hour.condition === 'rain') return 5;
  if (!sun) return 0;
  const t = minutesOf(hour.localTime) + 30;
  const middayStart = sun.sunrise + 180;
  const middayEnd = sun.sunset - 180;
  const isMidday = t > middayStart && t < middayEnd;
  if (!isMidday) return 0;
  if (hour.condition === 'clear') return -10; // grand soleil : poissons au fond
  if (hour.condition === 'overcast' || hour.condition === 'fog') return 5;
  return 0;
}

function temperatureScore(hours: readonly HourlyForecast[], i: number): number {
  if (i === 0) return 0;
  return hours[i].temperature - hours[i - 1].temperature <= -3 ? -5 : 0; // coup de froid
}

const SYNODIC_MONTH = 29.53;

function moonScore(ageInDays: number): number {
  const fromNew = Math.min(ageInDays, SYNODIC_MONTH - ageInDays);
  const fromFull = Math.abs(ageInDays - SYNODIC_MONTH / 2);
  return fromNew <= 2 || fromFull <= 2 ? 5 : 0;
}

/** Les avis « ça mord ? » (au moins 3) décalent légèrement tous les scores, de −5 à +5. */
function communityAdjustment({ community }: ForecastContext): number {
  const { good, medium, none } = community.activityVotes;
  const total = good + medium + none;
  if (total < 3) return 0;
  return Math.round(((good - none) / total) * 5);
}

// ---------- Synthèse ----------

/** Indice 1–5 : moyenne des 3 meilleures heures de la journée. */
function indexFrom(hourly: readonly HourlyActivity[]): number {
  if (hourly.length === 0) return 1;
  const top = [...hourly].sort((a, b) => b.score - a.score).slice(0, 3);
  const mean = top.reduce((sum, h) => sum + h.score, 0) / top.length;
  return Math.min(5, Math.max(1, Math.round(mean / 20)));
}

/** Le pic d'activité et les heures voisines presque aussi bonnes (à 10 points près). */
export function bestWindowOf(hourly: readonly HourlyActivity[]): { start: string; end: string } | null {
  if (hourly.length === 0) return null;
  let peak = 0;
  hourly.forEach((h, i) => {
    if (h.score > hourly[peak].score) peak = i;
  });
  if (hourly[peak].score < 50) return null;
  let first = peak;
  let last = peak;
  while (first > 0 && hourly[first - 1].score >= hourly[peak].score - 10) first--;
  while (last < hourly.length - 1 && hourly[last + 1].score >= hourly[peak].score - 10) last++;
  return { start: hourly[first].localTime, end: addOneHour(hourly[last].localTime) };
}

function reasonsFor(context: ForecastContext, bestWindow: { start: string } | null): string[] {
  const reasons: string[] = [];
  const hours = context.weather.hourly;
  if (hours.length >= 4) {
    const delta = hours[3].pressure - hours[0].pressure;
    if (delta <= -1 && delta >= -3) reasons.push('Pression en légère baisse');
    else if (delta < -3) reasons.push('Pression en forte baisse');
    else if (delta > 3) reasons.push('Pression en forte hausse');
    else if (Math.abs(delta) < 1) reasons.push('Pression stable');
  }
  const wind = context.weather.current.windSpeed;
  if (wind > 30) reasons.push('Vent fort');
  else if (wind <= 20) reasons.push('Vent faible');
  const sun = sunTimesFor(context, bestWindow?.start ?? hours[0]?.localTime ?? '');
  if (bestWindow && sun) {
    const t = minutesOf(bestWindow.start);
    reasons.push(Math.abs(t - sun.sunset) < Math.abs(t - sun.sunrise) ? 'Approche du crépuscule' : 'Lever du jour');
  }
  if (hours.some((h) => h.condition === 'storm')) reasons.unshift('Orage : pêche déconseillée');
  return reasons.slice(0, 3);
}

/** Moins sûr si les pêcheurs ont jugé les prévisions peu fiables. */
function confidenceFor({ community }: ForecastContext): ForecastConfidence {
  const { reliable, wrong } = community.reliability;
  if (wrong > reliable) return 'low';
  return 'medium';
}

// ---------- Petits utilitaires ----------

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/** "2026-11-23T17:05" → minutes depuis minuit (1025). */
function minutesOf(localDateTime: string): number {
  const [h, m] = localDateTime.slice(11, 16).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** "2026-11-23T17:00" → "17h" */
export function clock(localDateTime: string): string {
  return `${Number(localDateTime.slice(11, 13))}h`;
}

function addOneHour(localDateTime: string): string {
  const hour = Number(localDateTime.slice(11, 13)) + 1;
  return `${localDateTime.slice(0, 11)}${String(hour % 24).padStart(2, '0')}:00`;
}
