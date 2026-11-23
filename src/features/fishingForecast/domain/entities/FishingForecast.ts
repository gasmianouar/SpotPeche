/** Niveau d'activité des poissons (mêmes valeurs que l'avis « ça mord ? » : 🤩 / 😐 / 😴). */
export type ActivityLevel = 'good' | 'medium' | 'none';

/** Activité estimée pour une heure. */
export interface HourlyActivity {
  /** Heure locale du spot : "2026-11-23T17:00". */
  readonly localTime: string;
  readonly level: ActivityLevel;
  /** Score de 0 à 100. */
  readonly score: number;
}

export type FishingIndexLabel = 'Faible' | 'Moyen' | 'Bon' | 'Excellent';
export type ForecastConfidence = 'low' | 'medium' | 'high';

/** Le résultat de l'analyse : indice du jour, activité heure par heure, meilleur créneau. */
export interface FishingForecast {
  readonly index: {
    /** Note de 1 à 5. */
    readonly score: number;
    readonly label: FishingIndexLabel;
    /** Une phrase, affichée sous l'indice. */
    readonly summary: string;
    /** 3 raisons courtes au maximum. */
    readonly reasons: readonly string[];
  };
  readonly hourly: readonly HourlyActivity[];
  /** Meilleur moment de la journée (heures locales), s'il se dégage. */
  readonly bestWindow: { readonly start: string; readonly end: string } | null;
  readonly confidence: ForecastConfidence;
  /** Qui a calculé : l'agent IA (serveur) ou l'algorithme local du téléphone. */
  readonly source: 'ai' | 'local';
  /** Modèle d'IA utilisé, si source = 'ai'. */
  readonly model: string | null;
  /** Pourquoi l'IA n'a pas servi (hors connexion, serveur absent…), si c'est le cas. */
  readonly fallbackReason?: string;
  /** true si la limite gratuite d'analyses IA du jour est atteinte (estimation locale à la place). */
  readonly freeLimitReached?: boolean;
}

/** Score 0–100 → niveau affiché. */
export function levelForScore(score: number): ActivityLevel {
  if (score >= 65) return 'good';
  if (score >= 40) return 'medium';
  return 'none';
}

/** Note 1–5 → libellé. */
export function labelForIndex(score: number): FishingIndexLabel {
  if (score >= 5) return 'Excellent';
  if (score === 4) return 'Bon';
  if (score === 3) return 'Moyen';
  return 'Faible';
}
