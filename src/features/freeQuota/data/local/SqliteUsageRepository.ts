import type { DatabaseProvider } from '@/core/database/openDatabase';

import type { AiFeature, UsageRepository } from '../../domain/FreeQuota';

/** Compteur d'utilisations des fonctions d'IA, dans SQLite : une ligne par fonction et par jour. */
export class SqliteUsageRepository implements UsageRepository {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async count(feature: AiFeature, day: string): Promise<number> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<{ count: number }>('SELECT count FROM ai_usage WHERE feature = ? AND day = ?', feature, day);
    return row?.count ?? 0;
  }

  async increment(feature: AiFeature, day: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(
      `INSERT INTO ai_usage (feature, day, count) VALUES (?, ?, 1)
       ON CONFLICT (feature, day) DO UPDATE SET count = count + 1`,
      feature,
      day,
    );
  }
}
