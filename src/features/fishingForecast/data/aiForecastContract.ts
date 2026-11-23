import {
  labelForIndex,
  levelForScore,
  type FishingForecast,
  type ForecastConfidence,
} from '../domain/entities/FishingForecast';
import type { ForecastContext } from '../domain/entities/ForecastContext';

/**
 * CONTRAT entre l'app et le serveur de l'agent IA (le « DTO »).
 * Le serveur reçoit seulement ce dont l'analyse a besoin : coordonnées, météo
 * heure par heure, soleil, lune, espèces, avis des pêcheurs. Rien sur l'utilisateur.
 */
export interface AiForecastRequest {
  latitude: number;
  longitude: number;
  hours: { time: string; temperature: number; pressure: number; wind: number; sky: string }[];
  sun: { date: string; sunrise: string; sunset: string }[];
  moon: { name: string; ageInDays: number };
  species: string[];
  community: ForecastContext['community'];
}

/** Réponse attendue du serveur. Tout est revérifié à l'arrivée : on ne fait pas confiance aveuglément. */
export interface AiForecastResponse {
  model: string;
  index_score: number;
  summary: string;
  reasons: string[];
  hourly: { time: string; score: number }[];
  best_window_start: string;
  best_window_end: string;
  confidence: ForecastConfidence;
}

/** Contexte du domaine → requête (coordonnées arrondies à ~10 m : assez précis, moins de données). */
export function toAiRequest(context: ForecastContext): AiForecastRequest {
  return {
    latitude: Number(context.coordinates.latitude.toFixed(4)),
    longitude: Number(context.coordinates.longitude.toFixed(4)),
    hours: context.weather.hourly.map((h) => ({
      time: h.localTime,
      temperature: Math.round(h.temperature * 10) / 10,
      pressure: Math.round(h.pressure * 10) / 10,
      wind: Math.round(h.windSpeed),
      sky: h.condition,
    })),
    sun: context.weather.daily.slice(0, 2).map((d) => ({ date: d.localDate, sunrise: d.sunrise, sunset: d.sunset })),
    moon: context.moon,
    species: [...context.species],
    community: context.community,
  };
}

/** Une donnée reçue ne respecte pas le contrat : on préfère le calcul local à un résultat douteux. */
export class InvalidAiResponseError extends Error {
  constructor(reason: string) {
    super(`Réponse de l'agent IA invalide : ${reason}`);
    this.name = 'InvalidAiResponseError';
  }
}

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const CONFIDENCES: readonly ForecastConfidence[] = ['low', 'medium', 'high'];

/**
 * Valide la réponse et la traduit en entité du domaine.
 * - chaque heure demandée doit avoir son score ;
 * - les nombres sont bornés, les textes raccourcis ;
 * - les niveaux (🤩 / 😐 / 😴) et le libellé sont recalculés ici, pour rester cohérents avec l'app.
 */
export function fromAiResponse(raw: unknown, context: ForecastContext): FishingForecast {
  if (typeof raw !== 'object' || raw === null) throw new InvalidAiResponseError('pas un objet');
  const r = raw as Partial<AiForecastResponse>;

  if (!Array.isArray(r.hourly)) throw new InvalidAiResponseError('activité horaire absente');
  const scores = new Map<string, number>();
  for (const h of r.hourly) {
    if (h && typeof h.time === 'string' && typeof h.score === 'number' && Number.isFinite(h.score)) {
      scores.set(h.time, Math.min(100, Math.max(0, Math.round(h.score))));
    }
  }
  const hourly = context.weather.hourly.map((hour) => {
    const score = scores.get(hour.localTime);
    if (score === undefined) throw new InvalidAiResponseError(`heure manquante ${hour.localTime}`);
    return { localTime: hour.localTime, score, level: levelForScore(score) };
  });

  if (typeof r.index_score !== 'number' || !Number.isFinite(r.index_score)) {
    throw new InvalidAiResponseError('indice absent');
  }
  const index = Math.min(5, Math.max(1, Math.round(r.index_score)));
  const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const reasons = Array.isArray(r.reasons) ? r.reasons.map((x) => text(x, 60)).filter(Boolean).slice(0, 3) : [];
  const start = text(r.best_window_start, 16);
  const end = text(r.best_window_end, 16);

  return {
    index: { score: index, label: labelForIndex(index), summary: text(r.summary, 160), reasons },
    hourly,
    bestWindow: TIME.test(start) && TIME.test(end) ? { start, end } : null,
    confidence: CONFIDENCES.includes(r.confidence as ForecastConfidence) ? (r.confidence as ForecastConfidence) : 'medium',
    source: 'ai',
    model: text(r.model, 60) || null,
  };
}
