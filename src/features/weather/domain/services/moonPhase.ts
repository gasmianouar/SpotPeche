/** Durée moyenne d'un cycle lunaire (lunaison), en jours. */
const SYNODIC_MONTH = 29.530588853;
/** Une nouvelle lune connue : 6 janvier 2000 à 18 h 14 UTC. */
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

export type MoonPhaseName =
  | 'Nouvelle lune'
  | 'Premier croissant'
  | 'Premier quartier'
  | 'Gibbeuse croissante'
  | 'Pleine lune'
  | 'Gibbeuse décroissante'
  | 'Dernier quartier'
  | 'Dernier croissant';

/**
 * Phase de la lune à une date, calculée localement (aucune API).
 * Précision d'environ un jour : suffisant pour un affichage.
 */
export function moonPhase(date: Date): { name: MoonPhaseName; ageInDays: number } {
  const days = (date.getTime() - KNOWN_NEW_MOON_MS) / 86_400_000;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const phases: MoonPhaseName[] = [
    'Nouvelle lune',
    'Premier croissant',
    'Premier quartier',
    'Gibbeuse croissante',
    'Pleine lune',
    'Gibbeuse décroissante',
    'Dernier quartier',
    'Dernier croissant',
  ];
  // On découpe le cycle en 8 parts égales, centrées sur chaque phase.
  const index = Math.floor((age / SYNODIC_MONTH) * 8 + 0.5) % 8;
  return { name: phases[index], ageInDays: age };
}
