import type { Migration } from '@/core/database/migrations';

/**
 * Base : signalements et blocages (version 8).
 * La base n'a qu'un seul compteur : 1-4 et 7 pour les spots, 5 pour la prévision, 6 pour le quota gratuit.
 */
export const MODERATION_MIGRATIONS: Migration[] = [
  {
    version: 8,
    description: 'Signalements et utilisateurs bloqués',
    async up(db) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reports (
          id          TEXT PRIMARY KEY NOT NULL,
          reporter_id TEXT NOT NULL,
          target_kind TEXT NOT NULL,
          spot_id     TEXT NOT NULL,
          message_id  TEXT,
          reason      TEXT NOT NULL,
          details     TEXT NOT NULL DEFAULT '',
          created_at  INTEGER NOT NULL,
          sent_at     INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports (reporter_id);

        CREATE TABLE IF NOT EXISTS user_blocks (
          blocker_id   TEXT NOT NULL,
          blocked_id   TEXT NOT NULL,
          blocked_name TEXT NOT NULL DEFAULT '',
          created_at   INTEGER NOT NULL,
          PRIMARY KEY (blocker_id, blocked_id)
        );
      `);
    },
  },
];
