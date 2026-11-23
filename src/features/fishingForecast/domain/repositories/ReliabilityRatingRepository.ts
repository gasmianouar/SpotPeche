import type { ReliabilityRating, ReliabilityValue } from '../entities/ReliabilityRating';

/** Contrat d'accès aux avis « Indice fiable ? ». */
export interface ReliabilityRatingRepository {
  listForSpot(spotId: string): Promise<ReliabilityRating[]>;
  /** Pose (ou remplace) l'avis d'une personne ; `null` le retire. */
  set(spotId: string, userId: string, value: ReliabilityValue | null): Promise<void>;
}
