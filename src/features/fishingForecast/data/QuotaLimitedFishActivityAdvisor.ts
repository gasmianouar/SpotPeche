import { freeLimitMessage, type FreeQuota } from '@/features/freeQuota/domain/FreeQuota';

import type { FishingForecast } from '../domain/entities/FishingForecast';
import type { ForecastContext } from '../domain/entities/ForecastContext';
import type { FishActivityAdvisor } from '../domain/ports/FishActivityAdvisor';

/**
 * DÉCORATEUR « limite gratuite » : l'agent IA est utilisé tant qu'il reste des analyses
 * gratuites aujourd'hui ; ensuite, l'algorithme local répond, avec le message de la limite.
 * Seule une vraie analyse IA réussie est décomptée (pas le repli, pas le cache).
 */
export class QuotaLimitedFishActivityAdvisor implements FishActivityAdvisor {
  constructor(
    private readonly ai: FishActivityAdvisor,
    private readonly local: FishActivityAdvisor,
    private readonly quota: FreeQuota,
  ) {}

  async advise(context: ForecastContext): Promise<FishingForecast> {
    if ((await this.quota.remaining('fish-activity')) === 0) {
      const local = await this.local.advise(context);
      return { ...local, freeLimitReached: true, fallbackReason: freeLimitMessage('fish-activity', this.quota.limit('fish-activity')) };
    }
    const forecast = await this.ai.advise(context);
    if (forecast.source === 'ai') await this.quota.record('fish-activity');
    return forecast;
  }
}
