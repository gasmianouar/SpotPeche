import type { DatabaseProvider } from '@/core/database/openDatabase';

import { isReliabilityValue, type ReliabilityRating, type ReliabilityValue } from '../../domain/entities/ReliabilityRating';
import type { ReliabilityRatingRepository } from '../../domain/repositories/ReliabilityRatingRepository';

interface RatingRow {
  spot_id: string;
  user_id: string;
  value: string;
}

/** Avis « Indice fiable ? », stockés dans SQLite : une ligne par personne et par spot. */
export class SqliteReliabilityRatingRepository implements ReliabilityRatingRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async listForSpot(spotId: string): Promise<ReliabilityRating[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<RatingRow>(
      'SELECT spot_id, user_id, value FROM forecast_reliability WHERE spot_id = ?',
      spotId,
    );
    return rows.flatMap((row) =>
      isReliabilityValue(row.value) ? [{ spotId: row.spot_id, userId: row.user_id, value: row.value }] : [],
    );
  }

  async set(spotId: string, userId: string, value: ReliabilityValue | null): Promise<void> {
    const db = await this.getDatabase();
    if (value === null) {
      await db.runAsync('DELETE FROM forecast_reliability WHERE spot_id = ? AND user_id = ?', spotId, userId);
    } else {
      await db.runAsync(
        'INSERT OR REPLACE INTO forecast_reliability (spot_id, user_id, value) VALUES (?, ?, ?)',
        spotId,
        userId,
        value,
      );
    }
  }
}
