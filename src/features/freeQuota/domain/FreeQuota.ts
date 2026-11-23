/**
 * LIMITE GRATUITE des fonctions d'IA.
 *
 * L'application est gratuite. Les analyses par l'agent IA coûtent de l'argent (API Claude) :
 * elles sont donc limitées chaque jour, par téléphone. Au-delà, un message annonce
 * que l'usage illimité fera partie d'une future version payante.
 */
export type AiFeature = 'fish-activity' | 'species-recognition';

/** Nombre d'utilisations gratuites par jour et par téléphone. */
export const FREE_DAILY_LIMITS: Record<AiFeature, number> = {
  'fish-activity': 5,
  'species-recognition': 5,
};

/** Message montré quand la limite est atteinte. */
export function freeLimitMessage(feature: AiFeature, limit = FREE_DAILY_LIMITS[feature]): string {
  return feature === 'fish-activity'
    ? `Limite gratuite atteinte : ${limit} analyses IA par jour. L’analyse IA illimitée fera partie de la version payante (bientôt disponible). En attendant, voici l’estimation locale, gratuite.`
    : `Limite gratuite atteinte : ${limit} reconnaissances par jour. La reconnaissance illimitée fera partie de la version payante (bientôt disponible). Choisissez l’espèce dans la liste, ou revenez demain.`;
}

export class FreeLimitReachedError extends Error {
  constructor(
    readonly feature: AiFeature,
    readonly limit: number,
  ) {
    super(freeLimitMessage(feature, limit));
    this.name = 'FreeLimitReachedError';
  }
}

/** Où l'on compte les utilisations (SQLite dans l'app, mémoire dans les tests). */
export interface UsageRepository {
  count(feature: AiFeature, day: string): Promise<number>;
  increment(feature: AiFeature, day: string): Promise<void>;
}

/** Le compteur du jour : combien il en reste, et noter une utilisation. */
export class FreeQuota {
  constructor(
    private readonly usage: UsageRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly limits: Record<AiFeature, number> = FREE_DAILY_LIMITS,
  ) {}

  limit(feature: AiFeature): number {
    return this.limits[feature];
  }

  async remaining(feature: AiFeature): Promise<number> {
    const used = await this.usage.count(feature, this.today());
    return Math.max(0, this.limits[feature] - used);
  }

  async record(feature: AiFeature): Promise<void> {
    await this.usage.increment(feature, this.today());
  }

  /** Jour local du téléphone, ex. « 2026-11-23 » : le compteur repart à zéro à minuit. */
  private today(): string {
    const d = this.now();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
