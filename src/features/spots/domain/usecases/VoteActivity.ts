import { isFishActivity, type FishActivity } from '../entities/Spot';
import type { ActivityVoteRepository } from '../repositories/ActivityVoteRepository';

/**
 * CAS D'USAGE : « donner son avis sur l'activité d'un spot » (🤩 / 😐 / 😴).
 * Un seul avis par personne : en choisir un autre le remplace, retoucher le même le retire.
 * Renvoie mon avis après l'action.
 */
export class VoteActivity {
  constructor(private readonly voteRepository: ActivityVoteRepository) {}

  async execute(spotId: string, userId: string, activity: string): Promise<FishActivity | null> {
    if (!isFishActivity(activity)) throw new Error(`Activité inconnue : ${activity}`);

    const votes = await this.voteRepository.listForSpot(spotId);
    const mine = votes.find((v) => v.userId === userId)?.activity ?? null;
    const next = mine === activity ? null : activity;
    await this.voteRepository.set(spotId, userId, next);
    return next;
  }
}
