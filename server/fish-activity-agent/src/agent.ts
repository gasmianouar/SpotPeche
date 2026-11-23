/**
 * Cœur de l'agent : validation de la requête, consigne donnée à Claude,
 * schéma JSON imposé à la réponse, et vérification de cette réponse.
 * Fonctions pures, testées sans réseau.
 */

export const DEFAULT_MODEL = 'claude-fable-5-2';
export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2026-10-21';
export const MAX_BODY_BYTES = 16_000;

const SKIES = ['clear', 'partlyCloudy', 'overcast', 'fog', 'drizzle', 'rain', 'snow', 'storm'] as const;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Ce que l'app envoie (aucune donnée personnelle). */
export interface ClientRequest {
  latitude: number;
  longitude: number;
  hours: { time: string; temperature: number; pressure: number; wind: number; sky: (typeof SKIES)[number] }[];
  sun: { date: string; sunrise: string; sunset: string }[];
  moon: { name: string; ageInDays: number };
  species: string[];
  community: {
    activityVotes: { good: number; medium: number; none: number };
    reliability: { reliable: number; soSo: number; wrong: number };
  };
}

export class BadRequestError extends Error {}

const num = (value: unknown, min: number, max: number, field: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new BadRequestError(`Champ invalide : ${field}`);
  }
  return value;
};
const str = (value: unknown, max: number, field: string): string => {
  if (typeof value !== 'string' || value.length > max) throw new BadRequestError(`Champ invalide : ${field}`);
  return value;
};
const time = (value: unknown, field: string): string => {
  const s = str(value, 16, field);
  if (!TIME.test(s)) throw new BadRequestError(`Heure invalide : ${field}`);
  return s;
};
const count = (value: unknown, field: string) => Math.round(num(value, 0, 1_000_000, field));

/** Vérifie tout ce qui arrive : le serveur est public, on ne fait confiance à personne. */
export function parseClientRequest(body: unknown): ClientRequest {
  if (typeof body !== 'object' || body === null) throw new BadRequestError('Corps JSON attendu');
  const b = body as Record<string, any>;
  if (!Array.isArray(b.hours) || b.hours.length < 1 || b.hours.length > 48) throw new BadRequestError('hours : 1 à 48 heures');
  if (!Array.isArray(b.sun) || b.sun.length > 3) throw new BadRequestError('sun invalide');
  if (!Array.isArray(b.species) || b.species.length > 20) throw new BadRequestError('species invalide');
  const votes = b.community?.activityVotes ?? {};
  const rel = b.community?.reliability ?? {};
  return {
    latitude: num(b.latitude, -90, 90, 'latitude'),
    longitude: num(b.longitude, -180, 180, 'longitude'),
    hours: b.hours.map((h: any, i: number) => {
      const sky = str(h?.sky, 20, `hours[${i}].sky`);
      if (!(SKIES as readonly string[]).includes(sky)) throw new BadRequestError(`hours[${i}].sky inconnu`);
      return {
        time: time(h?.time, `hours[${i}].time`),
        temperature: num(h?.temperature, -60, 60, `hours[${i}].temperature`),
        pressure: num(h?.pressure, 850, 1100, `hours[${i}].pressure`),
        wind: num(h?.wind, 0, 300, `hours[${i}].wind`),
        sky: sky as ClientRequest['hours'][number]['sky'],
      };
    }),
    sun: b.sun.map((d: any, i: number) => ({
      date: str(d?.date, 10, `sun[${i}].date`),
      sunrise: time(d?.sunrise, `sun[${i}].sunrise`),
      sunset: time(d?.sunset, `sun[${i}].sunset`),
    })),
    moon: { name: str(b.moon?.name, 40, 'moon.name'), ageInDays: num(b.moon?.ageInDays, 0, 30, 'moon.ageInDays') },
    species: b.species.map((s: unknown, i: number) => str(s, 40, `species[${i}]`)),
    community: {
      activityVotes: { good: count(votes.good, 'good'), medium: count(votes.medium, 'medium'), none: count(votes.none, 'none') },
      reliability: { reliable: count(rel.reliable, 'reliable'), soSo: count(rel.soSo, 'soSo'), wrong: count(rel.wrong, 'wrong') },
    },
  };
}

/** Schéma JSON imposé à la réponse de Claude (sortie structurée : il ne peut pas en sortir). */
export const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['index_score', 'summary', 'reasons', 'hourly', 'best_window_start', 'best_window_end', 'confidence'],
  properties: {
    index_score: { type: 'integer', description: 'Indice de pêche du jour, de 1 (faible) à 5 (excellent).' },
    summary: { type: 'string', description: 'Une phrase en français, 120 caractères au plus, qui dit quand et pourquoi pêcher.' },
    reasons: {
      type: 'array',
      items: { type: 'string' },
      description: '1 à 3 raisons très courtes en français (moins de 40 caractères chacune).',
    },
    hourly: {
      type: 'array',
      description: 'Exactement une entrée par heure reçue, avec la même chaîne time.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['time', 'score'],
        properties: {
          time: { type: 'string', description: 'Heure locale reçue, recopiée telle quelle.' },
          score: { type: 'integer', description: "Activité des poissons de 0 à 100 (65 et plus : ça mord bien ; 40 à 64 : moyen ; moins de 40 : faible)." },
        },
      },
    },
    best_window_start: { type: 'string', description: 'Début du meilleur créneau (format des heures reçues), ou chaîne vide.' },
    best_window_end: { type: 'string', description: 'Fin du meilleur créneau (heure suivant la dernière bonne heure), ou chaîne vide.' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Confiance dans cette estimation.' },
  },
} as const;

/** La consigne : ce que l'agent sait faire et comment il doit raisonner. */
export const SYSTEM_PROMPT = `Tu es l'agent d'analyse de Spot, une application de pêche de loisir en eau douce.
Tu es à la fois halieute (biologiste des poissons) et guide de pêche expérimenté.

Mission : estimer, heure par heure, l'activité alimentaire des poissons sur un spot précis, puis un indice de pêche du jour de 1 à 5.

Raisonne avec les données reçues :
- Position GPS et date : déduis la saison, le climat local, la durée du jour et le type de milieu probable (lac, étang, rivière, littoral).
- Lumière : l'aube et le crépuscule sont les pics de chasse ; le grand soleil de midi est en général défavorable, un ciel couvert l'est moins.
- Pression : une baisse lente avant une perturbation active les carnassiers ; une forte hausse ou une chute brutale les rend méfiants.
- Vent : une brise qui ride l'eau est favorable ; un vent fort gêne et trouble l'eau.
- Température de l'air et ses variations (approximation de l'eau) : un coup de froid ralentit les poissons, surtout les cyprinidés.
- Lune : la nouvelle et la pleine lune sont souvent plus actives (théorie solunaire, effet modéré).
- Espèces du spot : adapte-toi à leur comportement (sandre : faible luminosité ; brochet : actif en eau fraîche et en automne ; perche : chasse en bancs de jour ; carpe : eau tiède, aube et nuit ; silure : nocturne ; truite : eau fraîche et oxygénée ; black-bass : eau chaude, structures ; gardon : actif en journée).
- Avis de la communauté : « activityVotes » vient de pêcheurs sur place, c'est une observation de terrain récente. « reliability » dit si les prévisions passées étaient jugées fiables : beaucoup d'avis « wrong » signifie qu'il faut être plus prudent et baisser la confiance.

Règles :
- Sécurité d'abord : en cas d'orage (sky = storm), score de 5 au plus pour l'heure concernée et mentionne-le dans les raisons.
- Sois calibré : n'exagère pas, utilise toute l'échelle. Une journée ordinaire tourne autour de 45 à 60.
- Une entrée par heure reçue, en recopiant exactement la chaîne time.
- Le texte est en français, simple et concret, pour un pêcheur amateur.`;

/** Corps de la requête envoyée à l'API Claude. */
export function buildAnthropicBody(request: ClientRequest, model: string) {
  return {
    model,
    max_tokens: 16_000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Données du spot (JSON) :\n${JSON.stringify(request)}\n\nRéponds avec l'analyse au format demandé.`,
      },
    ],
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
  };
}

export interface AgentForecast {
  model: string;
  index_score: number;
  summary: string;
  reasons: string[];
  hourly: { time: string; score: number }[];
  best_window_start: string;
  best_window_end: string;
  confidence: 'low' | 'medium' | 'high';
}

export class BadModelOutputError extends Error {}

/** Lit la réponse de l'API : le bloc texte contient le JSON (les blocs de réflexion sont ignorés). */
export function extractForecast(apiResponse: unknown, request: ClientRequest): AgentForecast {
  const r = apiResponse as { model?: string; stop_reason?: string; content?: { type: string; text?: string }[] };
  if (r?.stop_reason && r.stop_reason !== 'end_turn') throw new BadModelOutputError(`Arrêt : ${r.stop_reason}`);
  const text = r?.content?.find((block) => block.type === 'text')?.text;
  if (!text) throw new BadModelOutputError('Pas de texte dans la réponse');

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BadModelOutputError('JSON illisible');
  }
  const scores = new Map<string, number>();
  for (const h of Array.isArray(parsed.hourly) ? parsed.hourly : []) {
    if (typeof h?.time === 'string' && typeof h?.score === 'number') scores.set(h.time, h.score);
  }
  const hourly = request.hours.map((h) => {
    const score = scores.get(h.time);
    if (score === undefined) throw new BadModelOutputError(`Heure manquante : ${h.time}`);
    return { time: h.time, score: Math.min(100, Math.max(0, Math.round(score))) };
  });
  return {
    model: r.model ?? 'inconnu',
    index_score: Math.min(5, Math.max(1, Math.round(Number(parsed.index_score) || 1))),
    summary: String(parsed.summary ?? '').slice(0, 160),
    reasons: (Array.isArray(parsed.reasons) ? parsed.reasons : []).map(String).slice(0, 3),
    hourly,
    best_window_start: typeof parsed.best_window_start === 'string' ? parsed.best_window_start : '',
    best_window_end: typeof parsed.best_window_end === 'string' ? parsed.best_window_end : '',
    confidence: ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'medium',
  };
}

/**
 * Clé de cache : deux pêcheurs sur le même spot à la même heure reçoivent la même analyse
 * (coordonnées arrondies à ~100 m). Une seule facture au lieu de deux.
 */
export function cacheKeyFor(request: ClientRequest, model: string): string {
  return JSON.stringify([
    model,
    request.latitude.toFixed(3),
    request.longitude.toFixed(3),
    request.hours.map((h) => [h.time, h.sky, Math.round(h.pressure), Math.round(h.wind)]),
    [...request.species].sort(),
    request.community,
  ]);
}
