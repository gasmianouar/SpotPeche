import type { ActivityVote, FishActivity } from '../entities/Spot';

/** Contrat d'accès aux avis « ça mord ? » sur les spots. */
export interface ActivityVoteRepository {
  listForSpot(spotId: string): Promise<ActivityVote[]>;
  /** Pose (ou remplace) l'avis d'une personne ; `null` le retire. */
  set(spotId: string, userId: string, activity: FishActivity | null): Promise<void>;
}
