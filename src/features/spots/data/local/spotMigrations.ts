import type { Migration } from '@/core/database/migrations';

import { creatorPostId } from '../../domain/entities/SpotMessage';
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
  {
    version: 2,
    description: 'Détails du spot : espèces, appâts, activité, description, photos',
    async up(db) {
      // Les listes sont stockées en texte JSON ; les spots existants reçoivent des valeurs vides.
      await db.execAsync(`
        ALTER TABLE spots ADD COLUMN species TEXT NOT NULL DEFAULT '[]';
        ALTER TABLE spots ADD COLUMN baits TEXT NOT NULL DEFAULT '[]';
        ALTER TABLE spots ADD COLUMN activity TEXT;
        ALTER TABLE spots ADD COLUMN description TEXT NOT NULL DEFAULT '';
        ALTER TABLE spots ADD COLUMN photos TEXT NOT NULL DEFAULT '[]';
      `);
    },
  },
  {
    version: 3,
    description: 'Fiche spot : créateur, discussion et réactions emoji',
    async up(db) {
      await db.execAsync(`
        ALTER TABLE spots ADD COLUMN owner_name TEXT NOT NULL DEFAULT '';
        ALTER TABLE spots ADD COLUMN owner_photo TEXT;

        CREATE TABLE IF NOT EXISTS spot_messages (
          id            TEXT PRIMARY KEY NOT NULL,
          spot_id       TEXT NOT NULL,
          author_id     TEXT NOT NULL,
          author_name   TEXT NOT NULL,
          author_photo  TEXT,
          text          TEXT NOT NULL DEFAULT '',
          photos        TEXT NOT NULL DEFAULT '[]',
          reply_to_id   TEXT,
          reply_author  TEXT,
          reply_excerpt TEXT,
          created_at    INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_messages_spot ON spot_messages (spot_id, created_at);

        CREATE TABLE IF NOT EXISTS message_reactions (
          message_id TEXT NOT NULL,
          user_id    TEXT NOT NULL,
          emoji      TEXT NOT NULL,
          PRIMARY KEY (message_id, user_id)
        );
      `);

      // Les spots d'exemple reçoivent leur créateur et leurs détails (seulement s'ils sont restés vides).
      for (const spot of SAMPLE_SPOTS) {
        await db.runAsync(
          `UPDATE spots SET owner_name = ?, species = ?, baits = ?, activity = ?, description = ?, created_at = ?
           WHERE id = ? AND species = '[]' AND baits = '[]'`,
          spot.ownerName,
          JSON.stringify(spot.speciesIds),
          JSON.stringify(spot.baitIds),
          spot.activity,
          spot.description,
          spot.createdAt,
          spot.id,
        );
      }
      // Spots déjà créés par l'utilisateur de démo au sprint 4 : on leur donne son nom.
      await db.runAsync("UPDATE spots SET owner_name = ? WHERE owner_id = 'me' AND owner_name = ''", 'Pêcheur démo');

      // Un petit échange d'exemple sur le spot « Ponton nord », pour montrer la discussion.
      await db.runAsync(
        `INSERT OR IGNORE INTO spot_messages
           (id, spot_id, author_id, author_name, author_photo, text, photos, reply_to_id, reply_author, reply_excerpt, created_at)
         VALUES (?, ?, ?, ?, NULL, ?, '[]', ?, ?, ?, ?)`,
        'seed-s1-1',
        's1',
        'u17',
        'Léa M.',
        'Merci ! Deux sandres ce matin au poisson nageur.',
        creatorPostId('s1'),
        'Karim B.',
        'Ponton en bois accessible à pied. Bonne profondeur en bout de ponton, herbiers…',
        Date.UTC(2026, 10, 18, 10, 15),
      );
      for (const [userId, emoji] of [
        ['u17', '❤️'],
        ['u08', '❤️'],
        ['u23', '👍'],
      ]) {
        await db.runAsync(
          'INSERT OR IGNORE INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
          creatorPostId('s1'),
          userId,
          emoji,
        );
      }
    },
  },
  {
    version: 4,
    description: 'Avis « ça mord ? » sur les spots',
    async up(db) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS spot_activity_votes (
          spot_id  TEXT NOT NULL,
          user_id  TEXT NOT NULL,
          activity TEXT NOT NULL,
          PRIMARY KEY (spot_id, user_id)
        );
      `);
      // L'activité choisie à la création devient l'avis du créateur.
      await db.execAsync(`
        INSERT OR IGNORE INTO spot_activity_votes (spot_id, user_id, activity)
        SELECT id, owner_id, activity FROM spots WHERE activity IS NOT NULL;
      `);
      // Quelques avis de démo sur « Ponton nord ».
      for (const [userId, activity] of [
        ['u17', 'good'],
        ['u08', 'good'],
        ['u23', 'medium'],
      ]) {
        await db.runAsync(
          'INSERT OR IGNORE INTO spot_activity_votes (spot_id, user_id, activity) VALUES (?, ?, ?)',
          's1',
          userId,
          activity,
        );
      }
    },
  },
];
