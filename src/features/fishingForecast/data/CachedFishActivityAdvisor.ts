import type { FishingForecast } from '../domain/entities/FishingForecast';
import type { ForecastContext } from '../domain/entities/ForecastContext';
import type { FishActivityAdvisor } from '../domain/ports/FishActivityAdvisor';

/**
 * DÉCORATEUR « cache » : une analyse IA coûte de l'argent et quelques secondes.
 * Tant que le spot, l'heure de départ et les avis n'ont pas changé, on réutilise
 * la dernière réponse de l'IA (30 min par défaut). Les estimations locales, gratuites,
 * ne sont pas gardées : on retentera l'IA à la prochaine ouverture.
 */
export class CachedFishActivityAdvisor implements FishActivityAdvisor {
  private readonly cache = new Map<string, { forecast: FishingForecast; at: number }>();

  constructor(
    private readonly inner: FishActivityAdvisor,
    private readonly ttlMs = 30 * 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  async advise(context: ForecastContext): Promise<FishingForecast> {
    const key = cacheKey(context);
    const hit = this.cache.get(key);
    if (hit && this.now() - hit.at < this.ttlMs) return hit.forecast;

    const forecast = await this.inner.advise(context);
    if (forecast.source === 'ai') this.cache.set(key, { forecast, at: this.now() });
    return forecast;
  }
}

export function cacheKey(context: ForecastContext): string {
  return JSON.stringify([
    context.spotId,
    context.weather.hourly[0]?.localTime ?? '',
    context.species,
    context.community,
  ]);
}
