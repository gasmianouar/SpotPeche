import type { ActivityVote, FishActivity } from '../domain/entities/Spot';
import type { ActivityVoteRepository } from '../domain/repositories/ActivityVoteRepository';

/** Avis « ça mord ? » en mémoire (tests). */
export class InMemoryActivityVoteRepository implements ActivityVoteRepository {
  constructor(private votes: ActivityVote[] = []) {}

  async listForSpot(spotId: string): Promise<ActivityVote[]> {
    return this.votes.filter((v) => v.spotId === spotId);
  }

  async set(spotId: string, userId: string, activity: FishActivity | null): Promise<void> {
    const others = this.votes.filter((v) => !(v.spotId === spotId && v.userId === userId));
    this.votes = activity ? [...others, { spotId, userId, activity }] : others;
  }
}
