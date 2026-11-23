import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrations, type Migration } from './migrations';

/** Fonction qui donne accès à la base (ouverte et à jour). */
export type DatabaseProvider = () => Promise<SQLiteDatabase>;

/**
 * Crée l'accès à une base SQLite stockée SUR le téléphone : elle fonctionne
 * sans réseau. La base est ouverte au premier appel seulement, puis réutilisée.
 */
export function createDatabaseProvider(name: string, migrations: readonly Migration[]): DatabaseProvider {
  let database: Promise<SQLiteDatabase> | null = null;

  return () => {
    if (!database) {
      database = (async () => {
        const db = await openDatabaseAsync(name);
        // WAL : lectures et écritures plus rapides, recommandé par SQLite.
        await db.execAsync('PRAGMA journal_mode = WAL');
        await runMigrations(db, migrations);
        return db;
      })().catch((error) => {
        database = null; // on pourra réessayer au prochain appel
        throw error;
      });
    }
    return database;
  };
}
