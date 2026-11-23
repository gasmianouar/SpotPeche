import { isReliabilityValue, type ReliabilityValue } from '../entities/ReliabilityRating';
import type { ReliabilityRatingRepository } from '../repositories/ReliabilityRatingRepository';

/**
 * CAS D'USAGE : « dire si l'indice de pêche était fiable » (👍 / 😐 / 👎).
 * Un seul avis par personne : un autre le remplace, le même le retire.
 * Ces avis sont transmis à l'agent IA pour qu'il ajuste sa confiance.
 */
export class RateForecastReliability {
  constructor(private readonly ratingRepository: ReliabilityRatingRepository) {}

  async execute(spotId: string, userId: string, value: string): Promise<ReliabilityValue | null> {
    if (!isReliabilityValue(value)) throw new Error(`Avis inconnu : ${value}`);
    const ratings = await this.ratingRepository.listForSpot(spotId);
    const mine = ratings.find((r) => r.userId === userId)?.value ?? null;
    const next = mine === value ? null : value;
    await this.ratingRepository.set(spotId, userId, next);
    return next;
  }
}
