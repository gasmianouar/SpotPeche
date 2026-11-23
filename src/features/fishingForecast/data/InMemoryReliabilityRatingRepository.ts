import type { ReliabilityRating, ReliabilityValue } from '../domain/entities/ReliabilityRating';
import type { ReliabilityRatingRepository } from '../domain/repositories/ReliabilityRatingRepository';

/** Avis « Indice fiable ? » en mémoire (tests). */
export class InMemoryReliabilityRatingRepository implements ReliabilityRatingRepository {
  constructor(private ratings: ReliabilityRating[] = []) {}

  async listForSpot(spotId: string): Promise<ReliabilityRating[]> {
    return this.ratings.filter((r) => r.spotId === spotId);
  }

  async set(spotId: string, userId: string, value: ReliabilityValue | null): Promise<void> {
    const others = this.ratings.filter((r) => !(r.spotId === spotId && r.userId === userId));
    this.ratings = value ? [...others, { spotId, userId, value }] : others;
  }
}
