import type { AiFeature, UsageRepository } from '../domain/FreeQuota';

/** Compteur en mémoire (tests). */
export class InMemoryUsageRepository implements UsageRepository {
  private readonly counts = new Map<string, number>();

  async count(feature: AiFeature, day: string): Promise<number> {
    return this.counts.get(`${feature}|${day}`) ?? 0;
  }

  async increment(feature: AiFeature, day: string): Promise<void> {
    const key = `${feature}|${day}`;
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }
}
