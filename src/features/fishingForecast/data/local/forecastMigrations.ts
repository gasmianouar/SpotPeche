import type { Migration } from '@/core/database/migrations';

/**
 * Évolutions de la base pour la prévision de pêche.
 * Les numéros suivent ceux des spots (1 à 4) : la base n'a qu'un seul compteur de version.
 */
export const FORECAST_MIGRATIONS: Migration[] = [
  {
    version: 5,
    description: 'Avis « Indice fiable ? »',
    async up(db) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS forecast_reliability (
          spot_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          value   TEXT NOT NULL,
          PRIMARY KEY (spot_id, user_id)
        );
      `);
    },
  },
];
