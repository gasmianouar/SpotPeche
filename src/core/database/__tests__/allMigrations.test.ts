import { FORECAST_MIGRATIONS } from '@/features/fishingForecast/data/local/forecastMigrations';
import { USAGE_MIGRATIONS } from '@/features/freeQuota/data/local/usageMigrations';
import { MODERATION_MIGRATIONS } from '@/features/moderation/data/local/moderationMigrations';
import { SPOT_MIGRATIONS } from '@/features/spots/data/local/spotMigrations';

jest.mock('expo-sqlite', () => ({}));

describe('Migrations de spot.db', () => {
  it('ont toutes un numéro différent (la base n’a qu’un seul compteur de version)', () => {
    const versions = [...SPOT_MIGRATIONS, ...FORECAST_MIGRATIONS, ...USAGE_MIGRATIONS, ...MODERATION_MIGRATIONS]
      .map((m) => m.version)
      .sort((a, b) => a - b);

    expect(versions).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
