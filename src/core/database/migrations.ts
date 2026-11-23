import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Une MIGRATION fait évoluer la structure de la base d'une version à la suivante
 * (créer une table, ajouter une colonne…). On n'en modifie jamais une déjà livrée :
 * on en ajoute une nouvelle, avec un numéro plus grand.
 */
export interface Migration {
  readonly version: number;
  readonly description: string;
  up(db: SQLiteDatabase): Promise<void>;
}

/** Le strict nécessaire de la base pour migrer (facile à simuler dans un test). */
export type MigratableDatabase = Pick<SQLiteDatabase, 'getFirstAsync' | 'execAsync' | 'withTransactionAsync'>;

/**
 * Applique, dans l'ordre, les migrations pas encore jouées.
 * SQLite garde le numéro de version dans `PRAGMA user_version`.
 * Chaque migration tourne dans une transaction : tout ou rien.
 */
export async function runMigrations(db: MigratableDatabase, migrations: readonly Migration[]): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = [...migrations].filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db as SQLiteDatabase);
      // PRAGMA n'accepte pas de paramètre « ? » : la version est un nombre sûr.
      await db.execAsync(`PRAGMA user_version = ${Math.trunc(migration.version)}`);
    });
  }
}
