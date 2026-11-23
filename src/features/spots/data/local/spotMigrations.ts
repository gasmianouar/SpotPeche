import type { Migration } from '@/core/database/migrations';

import { SAMPLE_SPOTS } from '../InMemorySpotRepository';

/** Évolutions de la table des spots, dans l'ordre. */
export const SPOT_MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Création de la table spots et des spots d’exemple',
    async up(db) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS spots (
          id         TEXT PRIMARY KEY NOT NULL,
          name       TEXT NOT NULL,
          latitude   REAL NOT NULL,
          longitude  REAL NOT NULL,
          owner_id   TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_spots_owner ON spots (owner_id);
      `);

      // Données de démonstration, en attendant la création de spots et un serveur.
      const now = Date.now();
      for (const spot of SAMPLE_SPOTS) {
        // Les « ? » sont remplis par SQLite : jamais de concaténation de texte
        // dans une requête (protège des injections SQL).
        await db.runAsync(
          'INSERT OR IGNORE INTO spots (id, name, latitude, longitude, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          spot.id,
          spot.name,
          spot.coordinates.latitude,
          spot.coordinates.longitude,
          spot.ownerId,
          now,
        );
      }
    },
  },
];
