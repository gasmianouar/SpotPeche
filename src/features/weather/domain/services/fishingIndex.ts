import type { Forecast } from '../entities/Weather';

export type FishingIndexLabel = 'Faible' | 'Moyen' | 'Bon' | 'Excellent';

export interface FishingIndex {
  /** Note de 1 à 5. */
  readonly score: number;
  readonly label: FishingIndexLabel;
  /** Explications courtes affichées à l'utilisateur. */
  readonly reasons: string[];
}

/**
 * INDICE DE PÊCHE (indicatif).
 *
 * Il reprend deux règles empiriques très répandues chez les pêcheurs, pas un modèle
 * scientifique : une pression stable est favorable, des variations rapides ou un
 * vent fort sont défavorables. Fonction PURE : mêmes entrées → même résultat,
 * facile à tester et à faire évoluer.
 */
export function computeFishingIndex(forecast: Forecast): FishingIndex {
  let score = 3;
  const reasons: string[] = [];

  // Évolution de la pression sur les 3 prochaines heures.
  const now = forecast.hourly[0]?.pressure ?? forecast.current.pressure;
  const in3h = forecast.hourly[3]?.pressure ?? now;
  const delta = in3h - now;
  if (Math.abs(delta) < 1) {
    score += 1;
    reasons.push('Pression stable');
  } else if (Math.abs(delta) > 3) {
    score -= 1;
    reasons.push(delta > 0 ? 'Pression en forte hausse' : 'Pression en forte baisse');
  } else {
    reasons.push(delta > 0 ? 'Pression en légère hausse' : 'Pression en légère baisse');
  }

  // Vent.
  const wind = forecast.current.windSpeed;
  if (wind <= 15) {
    score += 1;
    reasons.push('Vent faible');
  } else if (wind > 30) {
    score -= 1;
    reasons.push('Vent fort');
  }

  // Orage : déconseillé, quelle que soit la note.
  if (forecast.current.condition === 'storm') {
    score = 1;
    reasons.push('Orage : pêche déconseillée');
  }

  score = Math.min(5, Math.max(1, score));
  return { score, label: labelFor(score), reasons };
}

function labelFor(score: number): FishingIndexLabel {
  if (score >= 5) return 'Excellent';
  if (score === 4) return 'Bon';
  if (score === 3) return 'Moyen';
  return 'Faible';
}
