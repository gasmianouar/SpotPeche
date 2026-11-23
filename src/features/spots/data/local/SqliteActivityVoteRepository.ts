import type { DatabaseProvider } from '@/core/database/openDatabase';

import { isFishActivity, type ActivityVote, type FishActivity } from '../../domain/entities/Spot';
import type { ActivityVoteRepository } from '../../domain/repositories/ActivityVoteRepository';

interface VoteRow {
  spot_id: string;
  user_id: string;
  activity: string;
}

/** Avis « ça mord ? », stockés dans SQLite : une ligne par personne et par spot. */
export class SqliteActivityVoteRepository implements ActivityVoteRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async listForSpot(spotId: string): Promise<ActivityVote[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<VoteRow>(
      'SELECT spot_id, user_id, activity FROM spot_activity_votes WHERE spot_id = ?',
      spotId,
    );
    return rows.flatMap((row) =>
      isFishActivity(row.activity) ? [{ spotId: row.spot_id, userId: row.user_id, activity: row.activity }] : [],
    );
  }

  async set(spotId: string, userId: string, activity: FishActivity | null): Promise<void> {
    const db = await this.getDatabase();
    if (activity === null) {
      await db.runAsync('DELETE FROM spot_activity_votes WHERE spot_id = ? AND user_id = ?', spotId, userId);
    } else {
      // Clé primaire (spot_id, user_id) : un seul avis par personne, remplacé s'il existe.
      await db.runAsync(
        'INSERT OR REPLACE INTO spot_activity_votes (spot_id, user_id, activity) VALUES (?, ?, ?)',
        spotId,
        userId,
        activity,
      );
    }
  }
}
