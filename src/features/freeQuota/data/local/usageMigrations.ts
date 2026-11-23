import type { Migration } from '@/core/database/migrations';

/** Base : compteur de la limite gratuite des fonctions d'IA (version 6, après les spots et la prévision). */
export const USAGE_MIGRATIONS: Migration[] = [
  {
    version: 6,
    description: 'Compteur de la limite gratuite des fonctions d’IA',
    async up(db) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_usage (
          feature TEXT NOT NULL,
          day     TEXT NOT NULL,
          count   INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (feature, day)
        );
      `);
    },
  },
];
